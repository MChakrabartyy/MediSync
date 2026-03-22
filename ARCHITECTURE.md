# 🏗️ Architecture & Design Decisions

This document outlines key architectural decisions and their rationale.

---

## 1. API Key Authentication (Instead of OAuth)

### Decision
Use simple header-based API key authentication rather than OAuth2 or JWT.

### Rationale
- **Simple for intern assessment:** Single header validation vs complex OAuth flow
- **Sufficient for use case:** Demo app doesn't need user accounts
- **Easy to test:** Can test with curl/Postman immediately
- **Still secure:** Keys are hashed, validated server-side, can be rotated

### Implementation
```typescript
// Validate header: X-API-Key
const apiKey = request.headers.get('x-api-key');
if (apiKey === process.env.API_SECRET_KEY) { }
```

### Pros
- ✅ Works immediately without auth infrastructure
- ✅ Easy to test manually
- ✅ Can be upgraded to OAuth later without breaking API

### Cons
- ❌ No user accounts/multi-tenancy
- ❌ Single shared key for all access (limited audit trail)

---

## 2. In-Memory Response Caching (vs Redis/Database)

### Decision
Cache responses in Node.js memory (map) rather than Redis or Supabase.

### Rationale
- **Instant availability:** No Redis setup needed
- **Cost:** $0 vs $5-15/month for Redis
- **Good enough:** Non-critical caching (24 hour TTL acceptable)
- **Suitable for demo:** Limited concurrent requests

### Implementation
```typescript
const cache = new Map<string, { response: any; expiresAt: number }>();
const key = hash(input);
cache.get(key); // Check before API call
cache.set(key, response, ttl); // Store after API call
```

### Pros
- ✅ $0 cost
- ✅ Instant availability
- ✅ Simple to implement
- ✅ Sufficient for demo/test requests

### Cons
- ❌ Cache lost on server restart
- ❌ Not shared across multiple servers
- ❌ Would need Redis for production multi-server deployment

### Future Migration
When scaling to production, replace with Redis:
```typescript
// Future: Redis caching
const redis = new Redis(process.env.REDIS_URL);
const cached = await redis.get(key);
await redis.set(key, response, 'EX', 86400); // 24h
```

---

## 3. Rule-Based Data Quality (No AI for Validation)

### Decision
Use pure rule-based validation for `/api/validate/data-quality` endpoint (no Claude calls).

### Rationale
- **Cost:** $0 vs $0.0003 per call
- **Speed:** <10ms execution (no HTTP roundtrip)
- **Deterministic:** Rules are predictable and explainable
- **Scalability:** Can handle 1000s of requests/second

### Implementation
Rules for:
- Completeness: Check if fields are populated
- Accuracy: Validate date formats, value ranges (BP < 300)
- Timeliness: Calculate days since last update
- Plausibility: Check for drug-disease conflicts (simple rules)

### Rules Examples
```typescript
// Accuracy - BP validation (rule-based, $0)
if (sys > 300 || dia > 200) {
  issue = "Physiologically impossible BP";
}

// Timeliness - data freshness (rule-based, $0)
const ageDays = (now - lastUpdated) / (1000 * 60 * 60 * 24);
if (ageDays > 180) {
  score = 20; // Very stale
}

// Plausibility - contraindications (rule-based, $0)
if (hasBetaBlocKer && hasAsthma) {
  issue = "Beta blocker contraindicated in asthma";
}
```

### Cost Impact
- Without this decision: 10 validation calls/day = $0.003/day = $0.09/month
- With this decision: $0/month
- **Savings: 100%**

### Limitation
Complex clinical reasoning (e.g., "is this dosage appropriate for this patient's kidney function?") uses simple rules only. True AI-powered clinical validation would require:
- More sophisticated medical knowledge base
- Integration with reference databases
- Probably Claude API calls

This is acceptable for a demo; production would add AI for complex cases.

---

## 4. Single Next.js Repo (vs Separate Frontend/Backend)

### Decision
Use single Next.js monorepo with API routes + SSR instead of separate frontend (React) + backend (Node/Python).

### Rationale
- **Shared TypeScript:** One language, shared types between frontend & API
- **Less boilerplate:** No separate build/deploy pipelines
- **Faster development:** Collocated code, single `npm run dev`
- **Easier testing:** Frontend can import utils directly
- **Single deployment:** One Vercel project instead of two

### Filesystem
```
clinical-reconciliation-engine/
├── src/app/
│   ├── page.tsx              # Frontend (SSR)
│   ├── reconcile/page.tsx    # Frontend (SSR)
│   └── api/                  # Backend (API routes)
├── src/lib/                  # Shared utilities
└── src/components/           # Shared UI components
```

### When to Separate
If the project needed:
- Different deployment schedules
- Different scaling needs (frontend CDN vs backend compute)
- Different teams working independently
- Separate tech stacks (e.g., Next.js frontend + Flask backend)

For a 6-day assessment: single repo is optimal.

---

## 5. Supabase PostgreSQL (vs MongoDB/Firebase)

### Decision
Use Supabase PostgreSQL for database instead of MongoDB or Firebase.

### Rationale
- **Familiar SQL:** Most developers know SQL
- **Free tier:** Generous limits (500MB storage, unlimited API requests)
- **Real built-in:** Full relational database, not NoSQL document store
- **RLS:** Row-level security for multi-tenant scenarios
- **Easy integration:** Supabase client is simple
- **Reliability:** Hosted by Postgres, battle-tested

### Data Model
```sql
-- Reconciliation results (audit trail)
CREATE TABLE reconciliation_results (
  id UUID PRIMARY KEY,
  input_hash TEXT,            -- Cache key for deduplication
  patient_context JSONB,      -- Full context stored
  sources JSONB,              -- All source records
  result JSONB,               -- AI response
  clinician_decision TEXT,    -- User approval/rejection
  created_at TIMESTAMPTZ
);

-- Data quality reports (analytics)
CREATE TABLE data_quality_reports (
  id UUID PRIMARY KEY,
  input_hash TEXT,
  patient_record JSONB,
  result JSONB,               -- Scores breakdown
  created_at TIMESTAMPTZ
);

-- Response cache (performance)
CREATE TABLE response_cache (
  cache_key TEXT PRIMARY KEY, -- Hash of request
  response JSONB,             -- Cached response
  expires_at TIMESTAMPTZ      -- 24h TTL
);

-- Audit log (compliance)
CREATE TABLE audit_log (
  id UUID PRIMARY KEY,
  action TEXT,                -- 'reconcile', 'validate'
  endpoint TEXT,              -- '/api/reconcile/medication'
  request_hash TEXT,          -- Anonymized request
  api_key_id UUID,            -- Which key made request
  created_at TIMESTAMPTZ      -- When
);

-- API keys (security)
CREATE TABLE api_keys (
  id UUID PRIMARY KEY,
  key_hash TEXT UNIQUE,       -- Hashed (not stored plain)
  name TEXT,                  -- 'production', 'testing'
  is_active BOOLEAN,          -- Can disable without deleting
  created_at TIMESTAMPTZ
);
```

### Advantages
- ✅ ACID transactions (consistency)
- ✅ Flexible JSONB for semi-structured data
- ✅ Excellent for audit trails
- ✅ Familiar SQL syntax

### When to Use MongoDB Instead
If you needed:
- Schemaless flexibility
- Document-oriented queries
- Built-in sharding for massive scale

Not needed here.

---

## 6. Claude Sonnet for AI (vs GPT-4/Gemini)

### Decision
Use Anthropic Claude Sonnet instead of OpenAI GPT-4 or Google Gemini.

### Rationale
- **Best for Clinical Reasoning:** Claude excels at step-by-step analysis (good for medical decisions)
- **Cheaper:** ~$0.003 per call vs $0.03 for GPT-4
- **Structured Output:** Consistently returns valid JSON
- **Conservative:** More careful with medical information (important!)
- **Explainability:** Better "thinking" in responses

### Cost Comparison (per 1000 calls)
| Model | Cost |
|-------|------|
| Claude 3.5 Sonnet | ~$3 |
| GPT-4o | ~$15 |
| Gemini 2.0 Pro | ~$5 |

### Prompt Strategy
```typescript
systemPrompt: `You are a clinical data reconciliation assistant.
  IMPORTANT: You are NOT providing medical advice.`
```

This helps Claude be more conservative and careful with medical information.

---

## 7. Rate Limiting (10 req/min)

### Decision
Rate limit to 10 requests per minute per IP address.

### Rationale
- **Prevents abuse:** Someone can't hammer API and cost you money
- **Protects free tier:** Anthropic gives 5 requests/minute free; we stay well under
- **Reasonable for demo:** 10 req/min = 600 requests/hour = 14,400/day (enough for testing)
- **Simple implementation:** In-memory map with timestamp

### Code
```typescript
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

if (limit.count >= 10) {
  return response(429, 'Rate limited'); // Too Many Requests
}
```

### When to Adjust
- More generous: Turn up to 100 req/min for load testing
- More restrictive: Down to 5 req/min for production public API

---

## 8. Request Size Limit (5KB Max)

### Decision
Limit request body to 5KB and individual fields to 1000 chars.

### Rationale
- **Prevents memory exhaustion:** Someone can't send 100MB request
- **Reasonable for medical data:** Most medication records << 5KB
- **Edge case protection:** Prevents someone sending 1000 condition names

### Size Breakdown
- Typical reconciliation request: ~500 bytes
- Large request with full history: ~2KB
- Limit: 5KB (10x typical, 2.5x large case)

### When to Adjust
- Need longer medication descriptions? Increase field limit to 2000 chars
- Need more sources? Keep max sources at 10, but increase total body to 10KB

---

## 9. Token Limit (1000 Tokens Max)

### Decision
Cap Claude output to 1000 tokens (~750 words).

### Rationale
- **Cost:** 1000 tokens = ~$0.0003 vs 4000 tokens = $0.0012 (4x cost)
- **Speed:** Shorter responses = faster API calls
- **Sufficient for use case:** Reconciliation explanation is 2-3 sentences
- **Prevents runaway costs:** Can't accidentally generate 10,000 token responses

### Cost Impact
- Without limit (hypothetically 4000 tokens): $0.0012 per call
- With limit (1000 tokens): $0.0003 per call
- **Savings: 75%**

### Tradeoff
- ❌ Can't get detailed multi-paragraph explanations
- ✅ Sufficient for clinical decision support

---

## 10. Response Caching Strategy

### Decision
Cache entire responses with 24-hour TTL, keyed by input hash.

### Rationale
- **Drastically reduces costs:** 30-50% fewer API calls
- **Realistic for EHRs:** Same medication conflicts happen repeatedly
- **Cache key is deterministic:** Same input always → same hash → same cache

### Example Scenario
Day 1: Reconcile Lisinopril conflict from Epic + Cerner
- Call 1: Claude called → $0.0003 + response cached
- Call 2 (same conflict): Cache hit → $0.00 saved ✅

Day 2: Same Lisinopril conflict submitted again
- Call 3: Cache hit (still valid) → $0.00 saved ✅

Day 8: Cache expires (24h TTL)
- Call 4: Claude called → $0.0003

### Cache Key Strategy
```typescript
const cacheKey = hash(JSON.stringify({
  patient_context,
  sources, // Order matters!
}));
```

**Important:** Must hash exactly same format, or clinically identical requests miss cache.

---

## 11. Error Handling Strategy

### Decision
Catch all errors and return generic message, not sensitive details.

### Rationale
- **Security:** Don't leak API keys, database structure, internal paths
- **Privacy:** Don't expose patient data in error messages
- **User experience:** Clear messages ("Something went wrong") vs confusing errors

### Example
```typescript
// ❌ WRONG - Leaks info
catch (error) {
  return { error: `Database connection failed: ${error.message}` };
}

// ✅ RIGHT - Generic message
catch (error) {
  console.error('DB error:', error); // Log internally
  return { error: 'Internal server error' }; // Return generic
}
```

---

## 12. No Database for Authentication

### Decision
Don't store user sessions/JWT tokens. Use simple API key validation.

### Rationale
- **Simpler:** One-line check vs JWT parsing + blacklist management
- **Sufficient:** For a demo with one API key
- **Future-proof:** Can upgrade to proper auth without breaking API

### When to Add Proper Auth
As the system grows:
- Multiple users with different permissions?
- Need to audit which user made which decision?
- Need session management?

→ Add JWT tokens + user table.

For now: Simple API key is appropriate.

---

## Summary: Design Principles

| Principle | Implementation |
|-----------|-----------------|
| **Security First** | Auth on all endpoints, rate limiting, size limits, error masking |
| **Cost Conscious** | Caching, rule-based validation, token limits, in-memory cache |
| **Simple > Complex** | Single repo, in-memory cache, API keys not OAuth |
| **Testable** | Zod validation, pure functions, minimal dependencies |
| **Documented** | README, SECURITY.md, inline comments, this file |
| **Scalable** | Can move to Redis, add JWT, scale to multiple servers later |

---

**These decisions prioritize correctness and cost for a 6-day assessment, with clear upgrade paths for production.** 🚀