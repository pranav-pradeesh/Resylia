import { z } from 'zod'
import { logSecurityEvent } from '../audit'

// ── Schemas ───────────────────────────────────────────────────────────────────

const CoachResponseSchema = z.object({
  suggestion: z.string().min(1).max(500),
  category: z.string().regex(/^[a-z_]+$/, 'alphanumeric_underscore_only'),
  duration_minutes: z.number().int().min(1).max(60),
})

const SentimentResponseSchema = z.object({
  score: z.number().min(-1).max(1),
  themes: z.array(z.string().max(50)).max(10),
  urgency: z.enum(['low', 'medium', 'high']),
})

// ── Types ─────────────────────────────────────────────────────────────────────

export type CoachResponse = z.infer<typeof CoachResponseSchema>
export type SentimentResponse = z.infer<typeof SentimentResponseSchema>

// ── Sanitizer ─────────────────────────────────────────────────────────────────

/**
 * Sanitize and validate the raw string returned by the Claude API.
 *
 * 1. Parse as JSON (reject anything non-JSON — guards against AI going off-schema)
 * 2. Validate against expected schema
 * 3. Strip any HTML that snuck into string fields
 *
 * Throws on any failure — callers must catch and return a safe fallback.
 */
export function sanitizeCoachOutput(raw: string): CoachResponse {
  return parseAndSanitize(raw, CoachResponseSchema, 'coach') as CoachResponse
}

export function sanitizeSentimentOutput(raw: string): SentimentResponse {
  return parseAndSanitize(raw, SentimentResponseSchema, 'sentiment') as SentimentResponse
}

function parseAndSanitize<T extends z.ZodType>(
  raw: string,
  schema: T,
  context: string
): z.infer<T> {
  // 1. JSON parse
  let parsed: unknown
  try {
    // Claude sometimes wraps JSON in ```json ``` — strip it
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
    parsed = JSON.parse(cleaned)
  } catch {
    logSecurityEvent('ai_malformed_output', { context, raw: raw.slice(0, 200) }).catch(() => {})
    throw new Error(`AI returned non-JSON response (context: ${context})`)
  }

  // 2. Schema validation
  const result = schema.safeParse(parsed)
  if (!result.success) {
    logSecurityEvent('ai_malformed_output', {
      context,
      errors: result.error.format(),
      raw: raw.slice(0, 200),
    }).catch(() => {})
    throw new Error(`AI response failed schema validation (context: ${context})`)
  }

  // 3. Strip HTML from string fields
  const data = result.data as Record<string, unknown>
  for (const [key, val] of Object.entries(data)) {
    if (typeof val === 'string') {
      data[key] = val.replace(/<[^>]*>/g, '').trim()
    }
  }

  return data as z.infer<T>
}
