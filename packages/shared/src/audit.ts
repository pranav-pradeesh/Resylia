import { createClient, type SupabaseClient } from '@supabase/supabase-js'

type Database = {
  public: {
    Tables: {
      audit_log: {
        Row: { id: string; event: string; context: Record<string, unknown>; ip: string | null; user_id: string | null; created_at: string }
      }
    }
  }
}

const SENSITIVE_FIELDS = new Set([
  'energy', 'stress', 'workload',
  'sentiment_score', 'burnout_risk_score',
  'free_text', 'contributing_factors', 'predicted_burnout_date',
])

function redactForLog(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, SENSITIVE_FIELDS.has(k) ? '[REDACTED]' : v])
  )
}

function getAdminDb(): SupabaseClient<Database> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing Supabase environment variables (admin client)')
  }
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

export type AuditEvent =
  | 'prompt_injection_attempt'
  | 'unauthorized_access_attempt'
  | 'invalid_stripe_webhook'
  | 'invalid_slack_webhook'
  | 'rate_limit_exceeded'
  | 'ai_malformed_output'
  | 'ai_budget_exceeded'
  | 'login_failed'
  | 'role_escalation_attempt'
  | 'data_export'
  | 'user_deactivated'
  | 'billing_change'

const CRITICAL_EVENTS: AuditEvent[] = [
  'prompt_injection_attempt',
  'unauthorized_access_attempt',
  'role_escalation_attempt',
]

export async function logSecurityEvent(
  event: AuditEvent,
  context: Record<string, unknown>,
  options?: { ip?: string; userId?: string }
): Promise<void> {
  const sanitized = redactForLog(context)
  const adminDb = getAdminDb()

  try {
    await (adminDb.from('audit_log') as any).insert({
      event,
      context: sanitized,
      ip: options?.ip ?? null,
      user_id: options?.userId ?? null,
      created_at: new Date().toISOString(),
    })
  } catch (err) {
    console.error('[audit] Failed to write audit log:', err)
  }

  if (CRITICAL_EVENTS.includes(event)) {
    try {
      const Sentry = await import('@sentry/nextjs')
      Sentry.captureMessage(`Security event: ${event}`, {
        level: 'warning',
        extra: sanitized,
      })
    } catch {
      // Sentry optional in dev
    }
  }
}