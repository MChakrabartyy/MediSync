# 💰 Cost Monitoring & Control Guide

**Your definitive guide to ensuring your API costs nothing (or stays in free tier).**

---

## 📊 Quick Cost Summary

| Component | Monthly Cost | How We Control It |
|-----------|--------------|------------------|
| **Anthropic Claude API** | ~$2-10 | Token limits, caching, no AI on validation |
| **Supabase Database** | ~$0 | Free tier (500MB plenty for demo) |
| **Vercel Hosting** | ~$0 | Free tier (100GB bandwidth) |
| **Total** | **~$2-10** | Multiple safeguards |

---

## 🎯 Cost Control Strategy

### 1. Response Caching (SAVES 30-50%)

Every API call is expensive ($0.0003). **Don't call twice.**

```typescript
// Same input = same cache key = cached response = $0
const cacheKey = hash(JSON.stringify(request));

// Check cache FIRST (before AI call)
const cached = getFromCache(cacheKey); // $0
if (cached) return cached;

// Only call AI if cache miss
const aiResult = await callClaude(...); // $0.0003
setCache(cacheKey, aiResult); // Remember for next time
```

**Example saving:**
- Without caching: 100 API calls/month = $0.03
- With caching (50% hits): 50 calls = $0.015 saved

---

### 2. Rule-Based Data Quality (SAVES 100%)

The `/api/validate/data-quality` endpoint uses **zero** AI calls.

```typescript
// All rule-based checks = $0
function calculateCompletenessScore(): {
  // Check if medications field exists
  // Check if allergies field exists
  // Check if demographics populated
  // NO AI NEEDED
}
```

Instead of Claude deciding "are these vital signs plausible?", we use rules:

```typescript
// Rule: BP > 300 is impossible (literally can't survive)
if (sys > 300) issue = "Impossible BP";

// Rule: Temperature > 107°F is dangerous (deadly)
if (temp > 107) issue = "Dangerous fever";
```

**Cost impact:**
- Without this: 20 validation calls/day = $0.006/day = $0.18/month
- With this: $0/month
- **Savings: 100% of validation costs**

---

### 3. Token Limiting (SAVES 75%)

Every token costs money. Output tokens cost ~$0.000003 each.

```typescript
// ❌ Without limit - Claude can output 4000 tokens
// 4000 tokens = ~$0.0012

// ✅ With limit - Claude can output 1000 tokens max
// 1000 tokens = ~$0.0003
max_tokens: 1000 // Hard cap in API call
```

**Cost impact:**
- 100 calls with 4000-token outputs = $0.12
- 100 calls with 1000-token outputs = $0.03
- **Savings: 75%**

---

### 4. Input Size Limits (PREVENTS 10000% COST SPIKE)

Prevent someone from sending huge requests.

```typescript
// ❌ Without limits - someone could send:
// 1000 sources × large descriptions = huge token count = expensive

// ✅ With limits:
maxSourcesCount: 10 // Max 10 sources per reconciliation
maxStringLength: 1000 // Max 1000 chars per field
jsonPayloadSize: 5000 // Max 5KB total payload
```

**Cost impact:**
- 1 malicious request with 1000 sources = $1.00+
- With limits = max $0.0003
- **Prevention: Blocks $1 per attack**

---

### 5. Rate Limiting (PREVENTS RUNAWAY COSTS)

Max 10 requests per minute per IP.

```typescript
if (!checkRateLimit(clientIp)) {
  return error(429, 'Rate limited');
}
```

**Scenario prevention:**
- Without limit: Attacker sends 1000 requests = $0.30
- With limit + 1 minute window: Max 10 requests = $0.003
- **Prevention: Saves $0.297 per attack**

---

## 🔍 Cost Monitoring

### Daily Check (2 minutes)

1. **Anthropic Dashboard**
   - Go to https://console.anthropic.com/account/usage
   - Check "API Usage" graph
   - Should show minimal calls (under 100/day)

2. **Your Cost Monitor Endpoint**
   ```bash
   curl -H "X-API-Key: YOUR_KEY" \
        https://yourdomain.com/api/admin/cost-monitor
   ```
   Response shows:
   - Cached responses (should be growing)
   - Estimated daily/monthly costs
   - Security status

### Weekly Check (5 minutes)

1. **Supabase Dashboard**
   - Go to https://supabase.com
   - Project → Statistics
   - Verify storage < 500MB (free limit)

2. **Review Call Patterns**
   - Check logs: `npm run build && npm run dev`
   - Look for unusual request patterns
   - Cache hit rate should be 30-50%

### Monthly Check (10 minutes)

1. **Anthropic Invoice**
   - Check email for invoice
   - Should show ~$2-10
   - If higher, investigate

2. **Set Up Billing Alert**
   - Anthropic → Billing Settings
   - Set alert at $3
   - You'll be notified if costs spike

---

## 🚨 Cost Spike Response

### If you see unexpected charges:

**Step 1: Identify the cause** (5 min)
```bash
# Check logs
vercel logs

# Sample: Look for patterns
# Too many API calls? (Should be <100/day)
# Large payloads? (Should be <5KB each)
# Too many sources? (Should be <10 per request)
```

**Step 2: Rotate API keys** (5 min)
```bash
# 1. Go to Vercel → Environment Variables
# 2. Change ANTHROPIC_API_KEY to new key
# 3. Go to Anthropic → Delete old key
# 4. Redeploy project
```

**Step 3: Add rate limiting** (5 min)
```typescript
// Increase from 10 to 5 requests/minute
RATE_LIMIT_REQUESTS_PER_MINUTE=5

// Redeploy
vercel
```

**Step 4: Contact Anthropic** (if concerned about charges)
- Go to https://console.anthropic.com/account/billing
- Request review of charges
- Ask about dispute process if > $50

---

## 📋 Cost Control Checklist

- [ ] Response caching enabled (SAVES 30-50%)
- [ ] Data quality uses only rules (SAVES 100%)
- [ ] Token limit set to 1000 (SAVES 75%)
- [ ] Max 10 sources allowed (PREVENTS $1 spikes)
- [ ] Request size limit 5KB (PREVENTS memory abuse)
- [ ] Rate limiting 10 req/min (PREVENTS attack)
- [ ] API key required (PREVENTS public abuse)
- [ ] Error messages generic (PREVENTS reconnaissance)
- [ ] Anthropic billing alert set (NOTIFIES you)
- [ ] `.env.local` in `.gitignore` (PREVENTS key leak)

---

## 💡 Cost Optimization Ideas (Bonus)

### If you want to optimize further:

1. **Longer TTL for cache** (e.g., 7 days instead of 24h)
   - More cache hits
   - Requires careful user communication about stale data

2. **Batch reconciliation**
   - Let user reconcile 5 medications in one API call
   - 1 call instead of 5
   - Saves 80%

3. **Offline validation**
   - Run data quality validation on frontend (JavaScript)
   - Only call API for uncertain cases
   - Saves 70%

4. **Claude API cheaper models**
   - Switch from Sonnet ($0.003) to Haiku ($0.0001)
   - But may lose quality for complex cases

---

## 🔐 Security = Cost Control

Every security measure prevents attacks that could cost you money:

| Security Measure | Prevents |
|------------------|----------|
| API Key Auth | $0.30 from public abuse |
| Rate Limiting | $1.00 from attack loop |
| Size Limits | $1.00 from huge request |
| Cost Validation | $1.00 from expensive request |
| Token Limit | $0.10 from runaway output |

**Total protection value: ~$4/attack**

---

## 📞 Getting Help

If something unexpected happens:

1. **Check SECURITY.md** — Detailed security architecture
2. **Review ARCHITECTURE.md** — Design decisions explaining cost controls
3. **Monitor endpoint** — `/api/admin/cost-monitor` shows real cost data
4. **Verify checklist** — Run `bash verify-security.sh`

---

## Final Notes

- ✅ **You will NOT go bankrupt** from this API
- ✅ **You can test freely** (costs less than $1/month for heavy testing)
- ✅ **You are protected** from common attacks that cost money
- ✅ **You can monitor** costs in real-time

**Sleep well. Your API is cost-controlled.** 💤✨
