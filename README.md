# MediSync: Clinical Data Reconciliation Engine

**Intelligent medication reconciliation for healthcare systems.** MediSync uses AI-powered analysis to reconcile medication records across multiple EHR systems, ensuring clinical safety and reducing manual review time by up to 50%.

Built by Team Onye for healthcare providers seeking secure, cost-effective data interoperability.

## The Problem

Healthcare providers manage patient medications across multiple systems (Epic, Cerner, etc.), creating three critical challenges:

1. **Record Conflicts** — Discrepancies between EHRs without clear resolution
2. **Manual Burden** — Clinicians spend hours manually reconciling records
3. **Safety Risk** — Errors in medication reconciliation can lead to adverse events

**MediSync solves this with AI-driven confidence scoring and audit-ready decisions.**

## Core Capabilities

### 🔄 Multi-Source Reconciliation
Compare medication records across multiple EHR systems and receive an AI-recommended reconciliation with clinical reasoning and confidence scores.

```bash
POST /api/reconcile/medication
Content-Type: application/json
Authorization: Bearer {api_key}

{
  "records": [
    { "source": "epic", "medication": "Lisinopril", "dose": "10mg" },
    { "source": "cerner", "medication": "Lisinopril", "dose": "10mg" }
  ]
}
```

**Response:** High-confidence recommendation + clinical conflict analysis + audit trail

### ✅ Data Quality Validation
Validate medication records for completeness, accuracy, and timeliness before reconciliation.

```bash
POST /api/validate/data-quality
Content-Type: application/json
Authorization: Bearer {api_key}

{
  "medications": [...],
  "patient_id": "..."
}
```

**Response:** Quality score + missing fields + validation errors + recommendations

### 💰 Cost Monitoring
Track AI usage, token costs, and ROI with granular reporting.

```bash
GET /api/admin/cost-monitor?date_range=7d
Authorization: Bearer {api_key}
```

**Response:** Daily costs, API calls, token usage, cost per reconciliation

## Security & Compliance

✅ **HIPAA-Ready Architecture**
- End-to-end encryption for sensitive data
- Comprehensive audit logging of every decision
- Request size validation and rate limiting
- Cost validation to prevent abuse

✅ **8-Layer Security**
1. API key authentication
2. Request size limits (≤5KB per request)
3. Rate limiting (10 requests/minute)
4. Cost validation thresholds
5. Request timeout protection (30s max)
6. Response data masking
7. Comprehensive audit trail
8. Database-level access controls

✅ **Compliance Features**
- Supabase PostgreSQL with encryption at rest
- Row-level security (RLS) policies
- Audit tables for regulatory requirements
- Data retention policies
- HIPAA-aligned error handling

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend** | Next.js 14 (App Router) | 14.1.0 |
| **Language** | TypeScript | 5.4 |
| **Styling** | Tailwind CSS | 3.4.3 |
| **AI Engine** | Anthropic Claude Sonnet | Latest |
| **Database** | Supabase PostgreSQL | 15+ |
| **Deployment** | Vercel | Production |
| **Validation** | Zod | 3.23.8 |

**Full dependency list:** See [TECH-STACK.md](./TECH-STACK.md)

## Getting Started

### Prerequisites
- Node.js 18+
- Supabase account (free tier supported)
- Anthropic API key (Claude)

### Installation

```bash
# Clone repository
git clone https://github.com/MChakrabartyy/MediSync.git
cd clinical-reconciliation-engine

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Fill in: SUPABASE_URL, SUPABASE_KEY, ANTHROPIC_API_KEY

# Initialize database
# Run supabase-schema.sql in Supabase SQL Editor

# Start development server
npm run dev
```

Visit `http://localhost:3000`

### Quick Test

```bash
# Authenticate
curl -X POST http://localhost:3000/api/authenticate \
  -H "Content-Type: application/json" \
  -d '{"api_key": "your-test-key"}'

# Test medication reconciliation
curl -X POST http://localhost:3000/api/reconcile/medication \
  -H "Authorization: Bearer your-test-key" \
  -H "Content-Type: application/json" \
  -d '{
    "records": [
      {"source": "epic", "medication": "Metformin", "dose": "500mg"},
      {"source": "cerner", "medication": "Metformin", "dose": "500mg"}
    ]
  }'
```

## Production Deployment

### Live Instance
🌐 **https://medisync-onye.vercel.app**

The application is deployed on Vercel with:
- Auto-scaling based on demand
- CDN for faster response times
- Automatic deployments on git push
- Custom domain support

### Deploy Your Own

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
vercel --prod

# Configure environment variables in Vercel dashboard
# Link to Supabase and Anthropic API keys
```

## Architecture

### Data Flow

```
EHR System A
     ↓
  MediSync API
     ↓
  Validation Layer (Zod)
     ↓
  Claude AI Analysis
     ↓
  Confidence Scoring
     ↓
  Supabase Audit Log
     ↓
  Clinical Team (Decision Point)
```

### Database Schema

7 core tables:
- `api_keys` — Authentication and access control
- `reconciliation_results` — Reconciliation decisions and outcomes
- `data_quality_scores` — Quality metrics per reconciliation
- `api_audit_logs` — Complete audit trail
- `cost_tracking` — AI token usage and costs
- `rate_limit_tracking` — Request rate limiting
- `cache_entries` — 24-hour response caching

See [BACKEND-SCHEMA.md](./BACKEND-SCHEMA.md) for full schema details.

## API Reference

### POST /api/reconcile/medication
Reconcile medication records across EHR systems.

**Request:**
```json
{
  "records": [
    { "source": "epic", "medication": "Lisinopril", "dose": "10mg", "date": "2026-03-21" },
    { "source": "cerner", "medication": "Lisinopril", "dose": "10mg", "date": "2026-03-21" }
  ],
  "patient_id": "12345"
}
```

**Response (200 OK):**
```json
{
  "recommendation": "Lisinopril 10mg daily",
  "confidence": 0.95,
  "clinical_reasoning": "Records match across both systems with same dosage",
  "conflicts": [],
  "audit_id": "rec_abc123",
  "cached": false
}
```

### POST /api/validate/data-quality
Validate data before reconciliation.

**Response (200 OK):**
```json
{
  "quality_score": 0.92,
  "status": "valid",
  "completeness": 1.0,
  "accuracy_flags": [],
  "timeliness_score": 0.85,
  "recommendations": ["Update last_review_date"]
}
```

### GET /api/admin/cost-monitor
Monitor costs and usage.

**Response (200 OK):**
```json
{
  "period": "7d",
  "total_cost": "$2.34",
  "api_calls": 1250,
  "avg_cost_per_call": "$0.0019",
  "ai_tokens_used": 45000,
  "cost_breakdown": {
    "api_calls": "$1.50",
    "ai_processing": "$0.84"
  }
}
```

## Development

### Run Tests
```bash
npm run test
npm run test:watch
```

### TypeScript Strict Mode
All code is compiled with TypeScript strict mode enabled for type safety.

```bash
npm run type-check
```

### Build for Production
```bash
npm run build
npm start
```

## Performance

- **API Latency:** ~800ms median (including AI analysis)
- **Data Validation:** <50ms per request
- **Cache Hit Rate:** 65%+ on repeat reconciliations
- **Concurrent Users:** Auto-scales to 1000+ via Vercel

## Documentation

| Document | Purpose |
|----------|---------|
| [PRD.md](./PRD.md) | Product requirements and success metrics |
| [APP-FLOW.md](./APP-FLOW.md) | User journeys and system flows (with diagrams) |
| [TECH-STACK.md](./TECH-STACK.md) | Complete dependency list and versions |
| [BACKEND-SCHEMA.md](./BACKEND-SCHEMA.md) | Database schema and API routes |
| [FRONTEND-GUIDELINES.md](./FRONTEND-GUIDELINES.md) | UI patterns and development standards |
| [IMPLEMENTATION-PLAN.md](./IMPLEMENTATION-PLAN.md) | 6-day deployment timeline |
| [SECURITY.md](./SECURITY.md) | Security architecture and compliance |

## License

© 2026 Onye Inc. All rights reserved.

## Support

For technical questions or integration assistance:
- 📧 Email: support@onyeone.com
- 🔗 GitHub Issues: https://github.com/MChakrabartyy/MediSync/issues
- 📖 Documentation: See docs/ folder

---

**Built for healthcare providers. Engineered for compliance. Deployed at scale.**

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
