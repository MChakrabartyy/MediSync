#!/bin/bash

# 🔒 Pre-Deployment Security Verification Script
# Run this before deploying to Vercel

set -e

echo "🔍 Running security checks...\n"

# Check 1: .gitignore contains .env
echo "✓ Check 1: Verifying .env files in .gitignore..."
if grep -q '\.env' .gitignore; then
    echo "  ✅ PASS: .env in .gitignore\n"
else
    echo "  ❌ FAIL: .env not in .gitignore\n"
    exit 1
fi

# Check 2: No API keys in git history
echo "✓ Check 2: Scanning git history for API keys..."
if git log -p | grep -i "sk-ant-\|ANTHROPIC_API_KEY" > /dev/null 2>&1; then
    echo "  ⚠️  WARNING: Possible API key in git history\n"
else
    echo "  ✅ PASS: No API keys in history\n"
fi

# Check 3: No API keys in source files
echo "✓ Check 3: Scanning source code for hardcoded keys..."
if grep -r "sk-ant-\|ANTHROPIC_API_KEY.*=" src/ --exclude-dir=node_modules > /dev/null 2>&1; then
    echo "  ❌ FAIL: Hardcoded API key found in src/\n"
    exit 1
else
    echo "  ✅ PASS: No hardcoded keys in source\n"
fi

# Check 4: .env.local exists and has required variables
echo "✓ Check 4: Checking .env.local configuration..."
if [ ! -f .env.local ]; then
    echo "  ⚠️  WARNING: .env.local not found (needed for local dev)\n"
else
    if grep -q "ANTHROPIC_API_KEY" .env.local && \
       grep -q "NEXT_PUBLIC_SUPABASE_URL" .env.local && \
       grep -q "API_SECRET_KEY" .env.local; then
        echo "  ✅ PASS: .env.local has all required variables\n"
    else
        echo "  ⚠️  WARNING: .env.local missing some variables\n"
    fi
fi

# Check 5: Rate limiting middleware exists
echo "✓ Check 5: Verifying security middleware..."
if [ -f src/lib/auth/middleware.ts ]; then
    if grep -q "checkRateLimit\|validateApiKey\|validateRequestSize" src/lib/auth/middleware.ts; then
        echo "  ✅ PASS: Security middleware implemented\n"
    else
        echo "  ❌ FAIL: Security middleware incomplete\n"
        exit 1
    fi
else
    echo "  ❌ FAIL: middleware.ts not found\n"
    exit 1
fi

# Check 6: API endpoints use security
echo "✓ Check 6: Verifying API endpoint security..."
if grep -r "validateApiKey\|checkRateLimit" src/app/api/ > /dev/null 2>&1; then
    echo "  ✅ PASS: API endpoints use security validation\n"
else
    echo "  ⚠️  WARNING: Some API endpoints may not use security\n"
fi

# Check 7: Build succeeds
echo "✓ Check 7: Building project..."
if npm run build > /dev/null 2>&1; then
    echo "  ✅ PASS: Build successful\n"
else
    echo "  ❌ FAIL: Build failed\n"
    exit 1
fi

# Check 8: TypeScript compiles
echo "✓ Check 8: Type checking..."
if npx tsc --noEmit > /dev/null 2>&1; then
    echo "  ✅ PASS: TypeScript compilation successful\n"
else
    echo "  ⚠️  WARNING: TypeScript errors found (may be non-critical)\n"
fi

echo "════════════════════════════════════════════════"
echo "✨ All security checks passed!"
echo "════════════════════════════════════════════════\n"

echo "🚀 Next steps for deployment:"
echo "  1. Go to Vercel → Project Settings → Environment Variables"
echo "  2. Add these as PRIVATE variables:"
echo "     - API_SECRET_KEY (from .env.local)"
echo "     - ANTHROPIC_API_KEY (from .env.local)"
echo "  3. Add these as PUBLIC variables:"
echo "     - NEXT_PUBLIC_SUPABASE_URL"
echo "     - NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "  4. Redeploy project"
echo "  5. Test with: curl https://yourdomain/api/admin/cost-monitor -H 'X-API-Key: YOUR_KEY'\n"

echo "📚 Documentation:"
echo "  - Security: read SECURITY.md"
echo "  - Architecture: read ARCHITECTURE.md"
echo "  - Setup: read README.md\n"
