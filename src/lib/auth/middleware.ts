import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * SECURITY: API Key Validation Middleware
 * 
 * Prevents unauthorized access to your endpoints.
 * Every API call MUST include a valid X-API-Key header.
 * 
 * Without this: Anyone could call your endpoints and cost you money.
 */

const API_SECRET_KEY = process.env.API_SECRET_KEY;

if (!API_SECRET_KEY) {
  console.error('❌ CRITICAL: API_SECRET_KEY not set in .env.local');
  console.error('   Set API_SECRET_KEY with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
}

/**
 * Validates API key from request header
 * Returns error response if invalid, null if valid
 */
export async function validateApiKey(request: NextRequest): Promise<NextResponse | null> {
  const apiKey = request.headers.get('x-api-key');

  // Missing API key = reject immediately
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Missing X-API-Key header. Set it in your request.' },
      { status: 401 }
    );
  }

  // For demo/local: Accept the API_SECRET_KEY directly
  // In production, you'd hash this and check against database
  if (apiKey === API_SECRET_KEY) {
    // Valid
    return null;
  }

  // Invalid key = reject (no info about why)
  return NextResponse.json(
    { error: 'Invalid API key' },
    { status: 401 }
  );
}

/**
 * Rate limiting - prevents brute force/abuse
 * Uses in-memory cache for simplicity
 * In production, use Redis
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(clientId: string): boolean {
  const now = Date.now();
  const limit = rateLimitMap.get(clientId);

  if (!limit) {
    // First request from this client
    rateLimitMap.set(clientId, { count: 1, resetTime: now + 60000 });
    return true;
  }

  if (now > limit.resetTime) {
    // Reset window
    rateLimitMap.set(clientId, { count: 1, resetTime: now + 60000 });
    return true;
  }

  // Same window
  const requestsPerMinute = parseInt(process.env.RATE_LIMIT_REQUESTS_PER_MINUTE || '10');
  if (limit.count >= requestsPerMinute) {
    return false; // Rate limited
  }

  limit.count++;
  return true;
}

/**
 * SECURITY: Request size validation
 * Prevents large payloads from consuming resources
 */
export function validateRequestSize(body: any): { valid: boolean; error?: string } {
  const maxSize = parseInt(process.env.MAX_JSON_PAYLOAD_SIZE || '5000');
  const bodyString = JSON.stringify(body);

  if (bodyString.length > maxSize) {
    return {
      valid: false,
      error: `Request body too large: ${bodyString.length} bytes (max: ${maxSize})`,
    };
  }

  return { valid: true };
}

/**
 * SECURITY: Cost prevention
 * Validates that requests won't cause excessive API costs
 */
export interface CostValidationOptions {
  maxSourcesCount?: number;
  maxFieldsCount?: number;
  maxStringLength?: number;
}

export function validateRequestCost(
  body: any,
  options: CostValidationOptions = {}
): { valid: boolean; error?: string } {
  const {
    maxSourcesCount = 10, // Don't allow reconciling more than 10 sources at once
    maxFieldsCount = 50,  // Don't allow more than 50 fields
    maxStringLength = 1000, // Don't allow huge strings
  } = options;

  // Check sources count
  if (body.sources && Array.isArray(body.sources)) {
    if (body.sources.length > maxSourcesCount) {
      return {
        valid: false,
        error: `Too many sources: ${body.sources.length} (max: ${maxSourcesCount})`,
      };
    }
  }

  // Check field count
  const fieldCount = Object.keys(body).length;
  if (fieldCount > maxFieldsCount) {
    return {
      valid: false,
      error: `Too many fields: ${fieldCount} (max: ${maxFieldsCount})`,
    };
  }

  // Check string lengths
  const checkStrings = (obj: any, depth = 0): boolean => {
    if (depth > 5) return true; // Prevent deep recursion check
    for (const [_, value] of Object.entries(obj)) {
      if (typeof value === 'string' && value.length > maxStringLength) {
        return false;
      }
      if (typeof value === 'object' && value !== null) {
        if (!checkStrings(value, depth + 1)) return false;
      }
    }
    return true;
  };

  if (!checkStrings(body)) {
    return {
      valid: false,
      error: `Field value too long (max: ${maxStringLength} chars)`,
    };
  }

  return { valid: true };
}
