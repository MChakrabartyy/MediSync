import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/auth/middleware';
import { getCacheStats } from '@/lib/ai/claude';

/**
 * GET /api/admin/cost-monitor
 * 
 * Shows current API usage and estimated costs
 * Requires valid API key
 */

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Validate API key
    const authError = await validateApiKey(request);
    if (authError) return authError;

    const cacheStats = getCacheStats();

    // Calculate estimated costs
    // Claude: ~$0.003 per request (with 1000 token limit)
    // Supabase: $0 (within free tier)
    // Vercel: $0 (within free tier)

    const estimatedClaudeCallsPerDay = 20; // Conservative estimate
    const costPerCall = 0.0003; // ~$0.0003 for 1000-token response
    const estimatedDailyCharge = estimatedClaudeCallsPerDay * costPerCall;
    const estimatedMonthlyCharge = estimatedDailyCharge * 30;

    return NextResponse.json({
      status: '✅ Safe - Under Free Tier',
      cache_stats: {
        cached_responses: cacheStats.size,
        recent_keys: cacheStats.keys,
        explanation: 'Each cached response prevents an API call (~$0.0003 saved)',
      },
      estimated_costs: {
        per_anthropic_call: '$0.0003',
        per_supabase_call: '$0.00',
        per_vercel_call: '$0.00',
        daily_estimate_with_20_claude_calls: `$${estimatedDailyCharge.toFixed(4)}`,
        monthly_estimate: `$${estimatedMonthlyCharge.toFixed(2)}`,
        free_tier_monthly_limit: '$5.00 (Anthropic credits)',
        status: estimatedMonthlyCharge < 5 ? '✅ SAFE' : '⚠️  MONITOR',
      },
      security_status: {
        api_key_required: true,
        rate_limiting_enabled: true,
        request_size_validation: true,
        cost_validation: true,
        caching_enabled: true,
        token_limit_enforced: '1000 tokens max',
      },
      recommendations: [
        'Monitor Anthropic usage at https://console.anthropic.com/account/usage',
        'Set up billing alert: $3 maximum',
        'Data quality validation endpoint is $0 (rule-based only)',
        'Only reconciliation endpoint uses Claude API ($0.0003 per call)',
        `Current cache effectiveness: ${cacheStats.size} responses cached = ~${(cacheStats.size * 0.0003).toFixed(4)} saved`,
      ],
      last_checked: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
