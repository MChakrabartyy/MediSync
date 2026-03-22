# Backend Architecture & Schema

## System Architecture Overview

MediSync follows a modern full-stack architecture with Next.js API routes serving as the backend layer. The system is designed for scalability, security, and maintainability.

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client Apps   │    │  Next.js API    │    │  External APIs  │
│   (Web, Mobile) │◄──►│   Routes        │◄──►│  (Claude AI)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   Supabase DB   │
                       │  PostgreSQL     │
                       └─────────────────┘
```

## API Architecture

### Route Structure

```
api/
├── reconcile/
│   ├── medication/
│   │   └── route.ts          # POST /api/reconcile/medication
│   └── lab/                  # Future: lab result reconciliation
├── validate/
│   ├── data-quality/
│   │   └── route.ts          # POST /api/validate/data-quality
│   └── clinical-rules/       # Future: clinical validation rules
└── admin/
    ├── cost-monitor/
    │   └── route.ts          # GET /api/admin/cost-monitor
    ├── audit-logs/
    │   └── route.ts          # GET /api/admin/audit-logs
    └── metrics/
        └── route.ts          # GET /api/admin/metrics
```

### Request/Response Patterns

#### Standard API Response Format

```typescript
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    timestamp: string;
    requestId: string;
    processingTimeMs: number;
  };
}
```

#### Error Response Format

```typescript
interface ApiError {
  success: false;
  error: {
    code: 'VALIDATION_ERROR' | 'AUTHENTICATION_ERROR' | 'RATE_LIMIT_ERROR' | 'INTERNAL_ERROR';
    message: string;
    details?: ValidationError[] | any;
  };
  metadata: {
    timestamp: string;
    requestId: string;
  };
}
```

## Database Schema

### Core Tables

#### api_keys
Authentication and authorization for API access.

```sql
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key_hash TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_by TEXT,
  is_active BOOLEAN DEFAULT true,
  rate_limit_requests_per_minute INTEGER DEFAULT 10,
  rate_limit_requests_per_hour INTEGER DEFAULT 60,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### reconciliation_results
Stores AI-powered reconciliation results.

```sql
CREATE TABLE reconciliation_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id TEXT UNIQUE NOT NULL,
  reconciliation_type TEXT NOT NULL CHECK (reconciliation_type IN ('medication', 'lab', 'vital_signs')),
  input_records JSONB NOT NULL,
  identified_discrepancies JSONB,
  ai_analysis JSONB,
  confidence_score FLOAT CHECK (confidence_score >= 0 AND confidence_score <= 1),
  recommendations TEXT,
  clinician_decision TEXT,
  processing_time_ms INTEGER,
  ai_model_used TEXT,
  token_count INTEGER,
  cost_estimate DECIMAL(10, 6),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### data_quality_scores
Quality assessment results for patient records.

```sql
CREATE TABLE data_quality_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id TEXT UNIQUE NOT NULL,
  record_type TEXT NOT NULL,
  completeness_score FLOAT CHECK (completeness_score >= 0 AND completeness_score <= 1),
  accuracy_score FLOAT CHECK (accuracy_score >= 0 AND accuracy_score <= 1),
  timeliness_score FLOAT CHECK (timeliness_score >= 0 AND timeliness_score <= 1),
  clinical_plausibility_score FLOAT CHECK (clinical_plausibility_score >= 0 AND clinical_plausibility_score <= 1),
  overall_score FLOAT GENERATED ALWAYS AS (
    (completeness_score + accuracy_score + timeliness_score + clinical_plausibility_score) / 4
  ) STORED,
  issues_detected JSONB,
  recommendations JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### api_audit_logs
Comprehensive audit trail for compliance and debugging.

```sql
CREATE TABLE api_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id TEXT NOT NULL,
  api_key_hash TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  user_agent TEXT,
  ip_address INET,
  request_size_bytes INTEGER,
  response_size_bytes INTEGER,
  status_code INTEGER,
  processing_time_ms INTEGER,
  error_message TEXT,
  cache_hit BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### cost_tracking
API usage and cost monitoring.

```sql
CREATE TABLE cost_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  service TEXT NOT NULL CHECK (service IN ('anthropic', 'supabase', 'vercel')),
  request_count INTEGER DEFAULT 0,
  token_count INTEGER DEFAULT 0,
  data_transfer_bytes INTEGER DEFAULT 0,
  estimated_cost DECIMAL(10, 6),
  actual_cost DECIMAL(10, 6),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(date, service)
);
```

#### rate_limit_tracking
Rate limiting enforcement and monitoring.

```sql
CREATE TABLE rate_limit_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  api_key_hash TEXT NOT NULL,
  ip_address INET NOT NULL,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_type TEXT NOT NULL CHECK (window_type IN ('minute', 'hour', 'day')),
  blocked BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(api_key_hash, ip_address, window_start, window_type)
);
```

#### cache_entries
Response caching for performance optimization.

```sql
CREATE TABLE cache_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cache_key TEXT UNIQUE NOT NULL,
  data JSONB NOT NULL,
  ttl_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  access_count INTEGER DEFAULT 0,
  size_bytes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Indexes and Performance

#### Primary Performance Indexes
```sql
-- Audit logs - most queried by time range
CREATE INDEX idx_api_audit_logs_created_at ON api_audit_logs(created_at DESC);
CREATE INDEX idx_api_audit_logs_api_key ON api_audit_logs(api_key_hash);
CREATE INDEX idx_api_audit_logs_endpoint ON api_audit_logs(endpoint);

-- Reconciliation results - queried by type and time
CREATE INDEX idx_reconciliation_results_type_created ON reconciliation_results(reconciliation_type, created_at DESC);
CREATE INDEX idx_reconciliation_results_request_id ON reconciliation_results(request_id);

-- Cost tracking - aggregated by date and service
CREATE INDEX idx_cost_tracking_date_service ON cost_tracking(date DESC, service);

-- Rate limiting - fast lookups for enforcement
CREATE INDEX idx_rate_limit_tracking_key_ip_window ON rate_limit_tracking(api_key_hash, ip_address, window_start DESC);

-- Cache - fast key lookups and expiration
CREATE INDEX idx_cache_entries_key ON cache_entries(cache_key);
CREATE INDEX idx_cache_entries_expires ON cache_entries(ttl_expires_at) WHERE ttl_expires_at > CURRENT_TIMESTAMP;
```

#### Composite Indexes for Complex Queries
```sql
-- Audit analysis queries
CREATE INDEX idx_audit_logs_analysis ON api_audit_logs(endpoint, status_code, created_at DESC);

-- Cost analysis queries
CREATE INDEX idx_cost_analysis ON cost_tracking(date, service, estimated_cost);

-- Reconciliation performance queries
CREATE INDEX idx_reconciliation_performance ON reconciliation_results(reconciliation_type, confidence_score, processing_time_ms);
```

## API Route Implementations

### Authentication Middleware

```typescript
// lib/auth/middleware.ts
export async function authenticateRequest(request: NextRequest): Promise<{
  apiKey: string;
  isValid: boolean;
  rateLimit: RateLimitStatus;
}> {
  // Extract and validate API key
  // Check rate limits
  // Return authentication status
}
```

### Reconciliation Endpoint

```typescript
// app/api/reconcile/medication/route.ts
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate request
    const auth = await authenticateRequest(request);
    if (!auth.isValid) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }

    // 2. Validate request size
    if (request.headers.get('content-length') > MAX_REQUEST_SIZE) {
      return NextResponse.json({ error: 'Request too large' }, { status: 413 });
    }

    // 3. Parse and validate input
    const body = await request.json();
    const validation = medicationReconciliationSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validation.error.issues
      }, { status: 400 });
    }

    // 4. Check cache
    const cacheKey = generateCacheKey(body);
    const cached = await getFromCache(cacheKey);
    if (cached) {
      await logAuditEvent({ ...auth, cacheHit: true });
      return NextResponse.json(cached);
    }

    // 5. Process reconciliation
    const result = await processReconciliation(validation.data);

    // 6. Cache result
    await setCache(cacheKey, result, CACHE_TTL);

    // 7. Log audit event
    await logAuditEvent({
      ...auth,
      endpoint: '/api/reconcile/medication',
      processingTime: Date.now() - startTime
    });

    return NextResponse.json(result);

  } catch (error) {
    // Log error and return safe response
    await logError(error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}
```

### Data Quality Validation Endpoint

```typescript
// app/api/validate/data-quality/route.ts
export async function POST(request: NextRequest) {
  // Similar structure to reconciliation endpoint
  // But uses rule-based validation instead of AI
}
```

### Cost Monitoring Endpoint

```typescript
// app/api/admin/cost-monitor/route.ts
export async function GET(request: NextRequest) {
  // Admin-only endpoint for cost monitoring
  // Requires elevated API key permissions
}
```

## Business Logic Services

### AI Integration Service

```typescript
// lib/ai/claude.ts
export class ClaudeService {
  async reconcileMedications(input: MedicationReconciliationInput): Promise<ReconciliationResult> {
    // Prepare prompt for Claude
    // Call Claude API with retry logic
    // Parse and validate response
    // Return structured result
  }

  async validateClinicalData(input: ClinicalDataInput): Promise<ValidationResult> {
    // Similar pattern for validation tasks
  }
}
```

### Caching Service

```typescript
// lib/cache/cache.ts
export class CacheService {
  async get(key: string): Promise<any | null> {
    // Check memory cache first
    // Then check database cache
    // Return parsed data or null
  }

  async set(key: string, data: any, ttl: number): Promise<void> {
    // Store in memory cache
    // Store in database cache
    // Set expiration
  }

  async invalidate(pattern: string): Promise<void> {
    // Remove matching cache entries
  }
}
```

### Audit Logging Service

```typescript
// lib/audit/audit.ts
export class AuditService {
  async logEvent(event: AuditEvent): Promise<void> {
    // Insert into audit_logs table
    // Handle failures gracefully
  }

  async queryEvents(filters: AuditFilters): Promise<AuditEvent[]> {
    // Query audit logs with filters
    // Return paginated results
  }
}
```

## Data Validation Schemas

### Medication Reconciliation Schema

```typescript
// lib/validations/medication.ts
export const medicationReconciliationSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  patientContext: z.object({
    age: z.number().min(0).max(150),
    conditions: z.array(z.string()),
    allergies: z.array(z.string()),
  }).optional(),
  sources: z.array(z.object({
    system: z.string().min(1),
    medication: z.string().min(1),
    dosage: z.string().min(1),
    frequency: z.string().min(1),
    lastUpdated: z.string().datetime(),
    reliability: z.enum(['high', 'medium', 'low']).default('medium'),
  })).min(1, 'At least one medication source required').max(10, 'Maximum 10 sources allowed'),
});
```

### Data Quality Validation Schema

```typescript
// lib/validations/data-quality.ts
export const dataQualityValidationSchema = z.object({
  records: z.array(z.object({
    field: z.string().min(1),
    value: z.any(),
    required: z.boolean().default(false),
    dataType: z.enum(['string', 'number', 'date', 'boolean']).optional(),
  })).min(1, 'At least one record required').max(100, 'Maximum 100 records allowed'),
});
```

## Error Handling Patterns

### Structured Error Responses

```typescript
// lib/errors/error-types.ts
export class ValidationError extends Error {
  constructor(public field: string, public message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string = 'Invalid API key') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class RateLimitError extends Error {
  constructor(public resetTime: Date) {
    super('Rate limit exceeded');
    this.name = 'RateLimitError';
  }
}
```

### Error Boundary for API Routes

```typescript
// lib/errors/error-boundary.ts
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    await logError(error, context);

    if (error instanceof ValidationError) {
      throw new ApiError(400, 'VALIDATION_ERROR', error.message);
    }

    if (error instanceof AuthenticationError) {
      throw new ApiError(401, 'AUTHENTICATION_ERROR', error.message);
    }

    throw new ApiError(500, 'INTERNAL_ERROR', 'An unexpected error occurred');
  }
}
```

## Performance Optimizations

### Connection Pooling

```typescript
// lib/database/connection.ts
export const db = createClient({
  // Supabase handles connection pooling automatically
  // Configure timeouts and retry logic
});
```

### Query Optimization

```typescript
// lib/database/queries.ts
export const getReconciliationHistory = async (patientId: string, limit: number = 10) => {
  return await db
    .from('reconciliation_results')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })
    .limit(limit);
};
```

### Response Compression

```typescript
// next.config.js
module.exports = {
  compress: true, // Enable gzip compression
  experimental: {
    optimizePackageImports: ['@supabase/supabase-js', '@anthropic-ai/sdk'],
  },
};
```

## Security Implementation

### API Key Management

```typescript
// lib/auth/api-keys.ts
export class ApiKeyManager {
  async validateKey(key: string): Promise<ApiKey | null> {
    const hash = await hashKey(key);
    return await db.from('api_keys').select('*').eq('key_hash', hash).single();
  }

  async createKey(name: string, permissions: string[]): Promise<string> {
    const key = generateSecureKey();
    const hash = await hashKey(key);

    await db.from('api_keys').insert({
      key_hash: hash,
      name,
      permissions,
    });

    return key;
  }
}
```

### Rate Limiting

```typescript
// lib/auth/rate-limiting.ts
export class RateLimiter {
  async checkLimit(apiKey: string, ip: string): Promise<RateLimitResult> {
    const window = getCurrentWindow();
    const existing = await db
      .from('rate_limit_tracking')
      .select('*')
      .eq('api_key_hash', hashKey(apiKey))
      .eq('ip_address', ip)
      .eq('window_start', window.start)
      .single();

    if (existing && existing.request_count >= window.limit) {
      return { allowed: false, resetTime: window.end };
    }

    await db.from('rate_limit_tracking').upsert({
      api_key_hash: hashKey(apiKey),
      ip_address: ip,
      window_start: window.start,
      request_count: (existing?.request_count || 0) + 1,
    });

    return { allowed: true };
  }
}
```

## Monitoring and Observability

### Health Check Endpoint

```typescript
// app/api/health/route.ts
export async function GET() {
  const dbHealth = await checkDatabaseHealth();
  const aiHealth = await checkAIHealth();

  return NextResponse.json({
    status: dbHealth && aiHealth ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    services: {
      database: dbHealth,
      ai: aiHealth,
    },
  });
}
```

### Metrics Collection

```typescript
// lib/monitoring/metrics.ts
export class MetricsCollector {
  async recordApiCall(endpoint: string, duration: number, status: number) {
    await db.from('api_metrics').insert({
      endpoint,
      duration_ms: duration,
      status_code: status,
      timestamp: new Date(),
    });
  }

  async getMetrics(timeRange: string) {
    // Aggregate metrics for dashboard
  }
}
```

## Deployment Configuration

### Environment Variables

```bash
# .env.local
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
API_SECRET_KEY=...
RATE_LIMIT_REQUESTS_PER_MINUTE=10
RATE_LIMIT_REQUESTS_PER_HOUR=60
```

### Vercel Configuration

```javascript
// vercel.json
{
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "regions": ["iad1"],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" }
      ]
    }
  ]
}
```

This backend architecture provides a solid foundation for the MediSync clinical data reconciliation platform, with proper separation of concerns, security measures, and performance optimizations.