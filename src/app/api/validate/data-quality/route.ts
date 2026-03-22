import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  validateApiKey,
  checkRateLimit,
  validateRequestSize,
  validateRequestCost,
} from '@/lib/auth/middleware';
import crypto from 'crypto';

/**
 * POST /api/validate/data-quality
 * 
 * SECURITY LAYERS:
 * 1. ✅ API Key validation
 * 2. ✅ Rate limiting (max 10 requests/minute)
 * 3. ✅ Request size validation
 * 4. ✅ Cost validation
 * 5. ✅ Input validation with Zod
 * 6. ✅ Rule-based validation (NO AI call needed = $0 cost)
 * 7. ✅ Error handling
 */

const ValidateRequestSchema = z.object({
  demographics: z.object({
    name: z.string().max(100).optional(),
    dob: z.string().datetime().optional(),
    gender: z.enum(['M', 'F', 'Other']).optional(),
  }).optional(),
  medications: z.array(z.string().max(200)).max(50).optional(),
  allergies: z.array(z.string().max(200)).max(50).optional(),
  conditions: z.array(z.string().max(200)).max(50).optional(),
  vital_signs: z.record(z.string(), z.union([z.string(), z.number()])).optional(),
  last_updated: z.string().datetime().optional(),
});

type ValidateRequest = z.infer<typeof ValidateRequestSchema>;

interface ValidationIssue {
  field: string;
  issue: string;
  severity: 'high' | 'medium' | 'low';
  suggestion?: string;
}

/**
 * Calculate completeness score (0-100)
 * Rule-based, NO API cost
 */
function calculateCompletenessScore(data: ValidateRequest): {
  score: number;
  issues: ValidationIssue[];
} {
  let fieldsPresent = 0;
  let expectedFields = 0;
  const issues: ValidationIssue[] = [];

  // Check demographics (expected: 3 fields)
  if (data.demographics) {
    expectedFields += 3;
    if (data.demographics.name) fieldsPresent++;
    if (data.demographics.dob) fieldsPresent++;
    if (data.demographics.gender) fieldsPresent++;
  }

  // Check medications (expected: at least 1)
  expectedFields += 1;
  if (data.medications && data.medications.length > 0) {
    fieldsPresent++;
  } else {
    issues.push({
      field: 'medications',
      issue: 'No medications documented',
      severity: 'medium',
      suggestion: 'Add current medications or mark as none prescribed',
    });
  }

  // Check allergies (expected: documented)
  expectedFields += 1;
  if (data.allergies && data.allergies.length > 0) {
    fieldsPresent++;
  } else {
    issues.push({
      field: 'allergies',
      issue: 'No allergies documented - may be incomplete',
      severity: 'medium',
      suggestion: 'Explicitly list allergies or mark as NKA (No Known Allergies)',
    });
  }

  // Check conditions (expected: relevant conditions)
  expectedFields += 1;
  if (data.conditions && data.conditions.length > 0) {
    fieldsPresent++;
  }

  const score = expectedFields > 0 ? Math.round((fieldsPresent / expectedFields) * 100) : 0;

  return { score: Math.min(100, score), issues };
}

/**
 * Calculate accuracy score (0-100)
 * Rule-based validation of formats, NO API cost
 */
function calculateAccuracyScore(data: ValidateRequest): {
  score: number;
  issues: ValidationIssue[];
} {
  let accuracy = 100;
  const issues: ValidationIssue[] = [];

  // Validate DOB format and age
  if (data.demographics?.dob) {
    try {
      const dob = new Date(data.demographics.dob);
      const age = (new Date().getTime() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365.25);

      if (age < 0 || age > 150) {
        accuracy -= 20;
        issues.push({
          field: 'demographics.dob',
          issue: `Implausible age calculated: ${age.toFixed(1)} years`,
          severity: 'high',
        });
      }
    } catch {
      accuracy -= 15;
      issues.push({
        field: 'demographics.dob',
        issue: 'Invalid date format',
        severity: 'medium',
      });
    }
  }

  // Validate vital signs ranges
  if (data.vital_signs) {
    const vs = data.vital_signs;

    // Blood pressure
    if (vs.bp) {
      const bpStr = String(vs.bp);
      const bpMatch = bpStr.match(/(\d+)\/(\d+)/);
      if (bpMatch) {
        const sys = parseInt(bpMatch[1]);
        const dia = parseInt(bpMatch[2]);

        // Physiologically impossible ranges
        if (sys > 300 || dia > 200 || sys < 40 || dia < 20) {
          accuracy -= 20;
          issues.push({
            field: 'vital_signs.bp',
            issue: `Physiologically impossible BP: ${vs.bp}`,
            severity: 'high',
            suggestion: 'Verify BP reading - values outside normal physiology',
          });
        } else if (sys > 180 || dia > 110) {
          accuracy -= 10;
          issues.push({
            field: 'vital_signs.bp',
            issue: `Critically elevated BP: ${vs.bp}`,
            severity: 'medium',
            suggestion: 'Verify reading - may require clinical review',
          });
        }
      }
    }

    // Heart rate
    if (vs.heart_rate) {
      const hr = typeof vs.heart_rate === 'string' ? parseInt(vs.heart_rate) : vs.heart_rate;
      if (hr > 200 || hr < 20) {
        accuracy -= 15;
        issues.push({
          field: 'vital_signs.heart_rate',
          issue: `Physiologically impossible heart rate: ${hr} bpm`,
          severity: 'high',
        });
      }
    }

    // Temperature
    if (vs.temperature) {
      const temp = typeof vs.temperature === 'string' ? parseFloat(vs.temperature) : vs.temperature;
      if (temp > 107 || temp < 90) {
        accuracy -= 15;
        issues.push({
          field: 'vital_signs.temperature',
          issue: `Dangerously extreme temperature: ${temp}°F`,
          severity: 'high',
        });
      }
    }
  }

  return { score: Math.max(0, accuracy), issues };
}

/**
 * Calculate timeliness score (0-100) based on data freshness
 * Rule-based, NO API cost
 */
function calculateTimelinessScore(data: ValidateRequest): {
  score: number;
  issues: ValidationIssue[];
} {
  const issues: ValidationIssue[] = [];

  if (!data.last_updated) {
    return {
      score: 0,
      issues: [
        {
          field: 'last_updated',
          issue: 'No last_updated timestamp',
          severity: 'high',
          suggestion: 'Provide ISO datetime when record was last updated',
        },
      ],
    };
  }

  try {
    const lastUpdated = new Date(data.last_updated);
    const now = new Date();
    const ageMs = now.getTime() - lastUpdated.getTime();
    const ageDays = ageMs / (1000 * 60 * 60 * 24);

    let score = 100;

    if (ageDays < 7) {
      score = 100; // Fresh
    } else if (ageDays < 30) {
      score = 85;
    } else if (ageDays < 90) {
      score = 65;
      issues.push({
        field: 'last_updated',
        issue: `Data is ${Math.round(ageDays)} days old`,
        severity: 'medium',
        suggestion: 'Consider updating patient record',
      });
    } else if (ageDays < 180) {
      score = 40;
      issues.push({
        field: 'last_updated',
        issue: `Data is ${Math.round(ageDays)} days old - stale`,
        severity: 'high',
        suggestion: 'Record should be updated with current information',
      });
    } else {
      score = 20;
      issues.push({
        field: 'last_updated',
        issue: `Data is ${Math.round(ageDays)} days old - very stale`,
        severity: 'high',
        suggestion: 'Record is outdated and may be unreliable',
      });
    }

    return { score, issues };
  } catch {
    return {
      score: 0,
      issues: [
        {
          field: 'last_updated',
          issue: 'Invalid datetime format',
          severity: 'high',
        },
      ],
    };
  }
}

/**
 * Calculate clinical plausibility score (0-100)
 * Rule-based checks, NO API cost
 */
function calculatePlausibilityScore(data: ValidateRequest): {
  score: number;
  issues: ValidationIssue[];
} {
  let score = 100;
  const issues: ValidationIssue[] = [];

  // Check for common drug-disease conflicts (simple rules)
  const medications = data.medications?.map((m) => m.toLowerCase()) || [];
  const conditions = data.conditions?.map((c) => c.toLowerCase()) || [];
  const allergies = data.allergies?.map((a) => a.toLowerCase()) || [];

  // Example: ACE inhibitor in kidney disease
  const hasAce = medications.some((m) => m.includes('lisinopril') || m.includes('enalapril'));
  const hasCKD = conditions.some((c) => c.includes('kidney') || c.includes('ckd'));
  if (hasAce && hasCKD) {
    // Could be appropriate with monitoring, but flag for review
    issues.push({
      field: 'medications.conditions',
      issue: 'ACE inhibitor with kidney disease - requires monitoring',
      severity: 'medium',
      suggestion: 'Ensure renal function monitored regularly',
    });
  }

  // Example: Beta blocker in asthma
  const hasBeta = medications.some((m) => m.includes('metoprolol') || m.includes('propranolol'));
  const hasAsthma = conditions.some((c) => c.includes('asthma'));
  if (hasBeta && hasAsthma) {
    score -= 25;
    issues.push({
      field: 'medications.conditions',
      issue: 'Beta blocker contraindicated in asthma',
      severity: 'high',
      suggestion: 'Consider alternative antihypertensive',
    });
  }

  // Check for medication in allergy list (duplicate data error)
  for (const med of medications) {
    if (allergies.some((a) => med.includes(a) || a.includes(med.split(' ')[0]))) {
      score -= 30;
      issues.push({
        field: 'medications.allergies',
        issue: `Medication listed that patient is allergic to: "${med}"`,
        severity: 'high',
        suggestion: 'Remove medication or clear allergy record',
      });
    }
  }

  return { score: Math.max(0, score), issues };
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  const clientIp = request.headers.get('x-forwarded-for') || 'unknown';

  try {
    // LAYER 1: Validate API Key
    const authError = await validateApiKey(request);
    if (authError) return authError;

    // LAYER 2: Rate Limiting
    if (!checkRateLimit(clientIp)) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded: max 10 requests per minute',
        },
        { status: 429 }
      );
    }

    // LAYER 3: Parse request
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON' },
        { status: 400 }
      );
    }

    // LAYER 4: Request size validation
    const sizeCheck = validateRequestSize(body);
    if (!sizeCheck.valid) {
      return NextResponse.json(
        { error: sizeCheck.error },
        { status: 400 }
      );
    }

    // LAYER 5: Cost validation
    const costCheck = validateRequestCost(body);
    if (!costCheck.valid) {
      return NextResponse.json(
        { error: costCheck.error },
        { status: 400 }
      );
    }

    // LAYER 6: Schema validation
    const parseResult = ValidateRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request schema',
          details: parseResult.error.issues,
        },
        { status: 400 }
      );
    }

    const validateRequest: ValidateRequest = parseResult.data;

    // Calculate all scores (RULE-BASED, $0 COST)
    const completeness = calculateCompletenessScore(validateRequest);
    const accuracy = calculateAccuracyScore(validateRequest);
    const timeliness = calculateTimelinessScore(validateRequest);
    const plausibility = calculatePlausibilityScore(validateRequest);

    // Combine all issues
    const allIssues = [
      ...completeness.issues,
      ...accuracy.issues,
      ...timeliness.issues,
      ...plausibility.issues,
    ];

    // Overall score (weighted average)
    const overallScore = Math.round(
      completeness.score * 0.25 +
      accuracy.score * 0.3 +
      timeliness.score * 0.2 +
      plausibility.score * 0.25
    );

    return NextResponse.json({
      overall_score: overallScore,
      breakdown: {
        completeness: completeness.score,
        accuracy: accuracy.score,
        timeliness: timeliness.score,
        clinical_plausibility: plausibility.score,
      },
      issues_detected: allIssues,
      metadata: {
        processing_time_ms: Date.now() - startTime,
        api_cost: '$0.00 (rule-based validation only)',
      },
    });
  } catch (error: any) {
    console.error('❌ API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
