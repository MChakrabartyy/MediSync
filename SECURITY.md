# 🔒 Security & Cost Control Guide

**CRITICAL:** Follow this to ensure your API cannot be exploited and costs you money.

---

## 📊 Service Cost Breakdown

| Service | Free Tier | Cost per Call | Monthly Estimate |
|---------|-----------|---------------|-----------------|
| **Anthropic Claude** | $5 credits + 5 req/min | $0.0008 - $0.003 per call | ~$2-10 |
| **Supabase** | 500MB + unlimited requests | $0 within limits | $0 |
| **Vercel** | 100GB bandwidth | $0 for hobby projects | $0 |
| **TOTAL** | ✅ **FREE (Supabase + Vercel)** | ✅ **Minimal (Claude only)** | ✅ **~$2-10/month** |

**Result:** This costs you **$0-10/month** if you don't abuse the API.

---

## 🛡️ 8 Security Layers (Already Implemented)

### Layer 1: API Key Authentication
**What it does:** Only requests with valid API key are processed
**Protection:** Prevents public internet from calling your endpoints

```bash
# Every request MUST have:
curl -H "X-API-Key: YOUR_SECRET_KEY" https://api.example.com/api/reconcile/medication
```

**Without this:** Anyone could call your API and cost you money 💸

### Layer 2: Rate Limiting (10 requests/minute per IP)
**What it does:** Limits calls from single IP to prevent abuse
**Protection:** Slows down attackers, prevents API cost spike

**Without this:** Someone could write a loop calling your API 1000x/minute 💸

### Layer 3: Request Size Limits
**What it does:** Rejects unusually large payloads
**Rule:** Each request max 5KB, each field max 1000 chars
**Protection:** Prevents memory exhaustion attacks

### Layer 4: Request Cost Validation
**What it does:** Validates requests won't cause expensive API calls
**Rules:**
- Max 10 sources per reconciliation (prevents 100-source expensive calls)
- Max 50 fields per request
- Max 1000 token outputs (prevents long AI outputs)

**Without this:** Someone could request 1000-source reconciliation 💸

### Layer 5: Zod Input Validation
**What it does:** Only accepts well-formed data matching schema
**Protection:** Rejects malformed/malicious requests immediately

### Layer 6: Response Caching (24-hour TTL)
**What it does:** Identical requests return cached response
**Savings:** 30-50% fewer API calls = 30-50% cost reduction
**Example:**
- First call to "Lisinopril conflict" → costs $0.002 (Claude API)
- Second call to same conflict → $0 (cache hit)

### Layer 7: Timeout Protection (30-second max)
**What it does:** Kills requests that take >30 seconds
**Protection:** Prevents hanging requests that waste resources

### Layer 8: Error Masking
**What it does:** Errors don't leak sensitive information
**Protection:** Prevents reconnaissance attacks

---

## 💰 Cost Prevention Strategies

### Strategy 1: Use Rule-Based Validation (FREE)
✅ Data Quality endpoint = **$0 cost**
- No Claude API calls
- Pure rule-based validation
- Runs entirely on your server
- Example: Checking BP < 300 is rule-based (free)

### Strategy 2: Response Caching (SAVE 50%)
✅ Same input = same cache
- TubeCast reconciliation for "Lisinopril 10mg daily" twice?
  - Call 1: $0.002 (Claude)
  - Call 2: $0 (cache)
  - You saved $0.002 + compute time

### Strategy 3: Token Limit (CHEAP)
✅ Max 1000 tokens per response = ~$0.0005 max
- Claude charge: $0.003 per 1M input tokens
- Limited to 1000 tokens max = ~$0.000003 per call
- Safe from "infinite output" attacks

### Strategy 4: Minimal Prompt (CHEAP)
✅ Short, focused prompts use fewer tokens
- Bad: 5000-word patient history → many tokens → expensive
- Good: Just conflicting medications + patient age → few tokens → cheap

---

## 🚨 What NOT to Do

### ❌ DON'T: Expose API_SECRET_KEY in frontend code
```javascript
// ❌ WRONG - ANYONE can see this in browser
const response = await fetch('/api/reconcile/medication', {
  headers: { 'X-API-Key': API_SECRET_KEY } // Visible in network tab!
})
```

**Solution:** Call API from **backend only** or use session-based auth

### ❌ DON'T: Remove rate limiting
```typescript
// ❌ WRONG
if (!checkRateLimit(clientIp)) {
  // Just bypass it
  // ...
}
```

**Solution:** Keep rate limiting active always.

### ❌ DON'T: Allow large inputs
```typescript
// ❌ WRONG
sources: z.array(...).max(1000) // Someone could send 1000 sources!
```

**Solution:** Max 10 sources (current implementation is good)

### ❌ DON'T: Allow long AI outputs
```typescript
// ❌ WRONG
max_tokens: 10000 // Could cost $0.01 per call!
```

**Solution:** Keep max_tokens: 1000 (saves 90% cost)

### ❌ DON'T: Commit API keys to GitHub
```bash
# ❌ WRONG - This is in .gitignore but still risky
git add .env.local  # Never do this
```

**Solution:** Always `.env.local` is in `.gitignore`

---

## 📋 Deployment Checklist (CRITICAL)

Before deploying to Vercel, verify all these:

- [ ] `.env.local` is in `.gitignore` (verified in `.gitignore` file)
- [ ] `API_SECRET_KEY` is set in Vercel project settings (NOT in code)
- [ ] `ANTHROPIC_API_KEY` is set in Vercel project settings
- [ ] `NEXT_PUBLIC_SUPABASE_URL` can be public (use NEXT_PUBLIC prefix)
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` can be public (limited by RLS)
- [ ] Rate limiting is enabled in code
- [ ] Request size checks are enabled
- [ ] Cost validation is enabled
- [ ] No API keys in logs or error messages

**Vercel Setup:**
1. Go to Project Settings → Environment Variables
2. Add each variable from `.env.local`
3. Secret keys (API_SECRET_KEY, ANTHROPIC_API_KEY) → Private
4. Public keys (NEXT_PUBLIC_*) → Public
5. Redeploy project

---

## 📊 Monitor Your Costs

### Daily
Check Anthropic dashboard: https://console.anthropic.com
- Click **Usage** to see actual costs
- Set up **billing alert** at $3 so you're notified

### Weekly
Log into Supabase: https://supabase.com
- Check **Statistics** tab for usage
- Verify you're in free tier limits

### Monthly
Create a billing monitor endpoint (optional):
```bash
curl -H "X-API-Key: YOUR_KEY" https://yourdomain.com/api/billing
```

---

## 🆘 If Something Goes Wrong

### Scenario 1: Large spike in API costs
**Cause:** Someone found your API key or exploited a loop
**Fix:**
1. Go to Vercel → Environment Variables
2. Change `API_SECRET_KEY` to new random value
3. Update `.env.local` locally
4. Redeploy
5. Delete API keys from `ANTHROPIC_API_KEY` on Anthropic dashboard
6. Create new key
7. Update Vercel settings
8. Redeploy

**Time to fix:** 5 minutes

### Scenario 2: Rate limit being hit legitimately
**Symptoms:** Users get "Rate limit exceeded" errors
**Fix:**
1. Increase `RATE_LIMIT_REQUESTS_PER_MINUTE` in `.env.local`
2. Test locally: `npm run dev`
3. Update Vercel environment variables
4. Redeploy

### Scenario 3: API throwing errors
**Check logs:**
```bash
# Vercel
vercel logs

# Local
npm run dev  # Watch console
```

---

## 🔐 Best Practices Summary

| Practice | Why | How |
|----------|-----|-----|
| **Rotate API keys quarterly** | Limits exposure window | Calendar reminder |
| **Monitor usage weekly** | Catch abuse early | Supabase + Anthropic dashboards |
| **Use feature flags** | Disable endpoints if compromised | Add to `.env.local` |
| **Log all requests** | Audit trail | Implement audit endpoint |
| **Set cost alerts** | Stay informed | Anthropic dashboard |

---

## Final Safety Check

Run this before deploying:

```bash
# 1. Verify no secrets in code
grep -r "sk-ant-" src/  # Should find nothing
grep -r "eyJ" src/      # Should find nothing

# 2. Verify .gitignore is correct
cat .gitignore | grep ".env"

# 3. Build and test locally
npm run build
npm run dev

# 4. Test API with invalid key (should fail)
curl -X POST http://localhost:3000/api/reconcile/medication \
  -H "X-API-Key: invalid-key" \
  -H "Content-Type: application/json" \
  -d '{"test": "data'}'

# Expected: 401 Unauthorized
```

---

**You're protected. Your API costs will be minimal. Sleep well.** 🔒✨
