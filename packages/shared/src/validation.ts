import { z } from 'zod'

export const CheckinSchema = z.object({
  energy:    z.number().int().min(1).max(5),
  stress:    z.number().int().min(1).max(5),
  workload:  z.number().int().min(1).max(5),
  free_text: z.string()
    .max(500, 'Response too long')
    .optional()
    .transform((v) => v?.trim())
    .transform((v) => v?.replace(/<[^>]*>/g, '')),
  source: z.enum(['web', 'slack', 'teams']),
})

export const OrgSchema = z.object({
  name:       z.string().min(2).max(100).regex(/^[a-zA-Z0-9\s\-\.]+$/, 'Invalid characters'),
  slug:       z.string().min(2).max(50).regex(/^[a-z0-9\-]+$/, 'Lowercase alphanumeric + hyphens only'),
  seat_count: z.number().int().min(1).max(100000),
  plan:       z.enum(['starter', 'growth', 'enterprise']).default('starter'),
})

export const InviteSchema = z.object({
  email:      z.string().email().max(254),
  role:       z.enum(['employee', 'manager', 'hr']),  // 'admin' not assignable via invite
  department: z.string().max(100).optional(),
})

// Risk event schema for prediction service input
export const RiskEventSchema = z.object({
  user_id: z.string().uuid(),
  org_id: z.string().uuid(),
  risk_level: z.enum(['low', 'medium', 'high', 'critical']),
  predicted_burnout_date: z.string().date().optional(),
  contributing_factors: z.record(z.unknown()).optional(),
  acknowledged_by: z.string().uuid().optional(),
})

export type CheckinInput   = z.infer<typeof CheckinSchema>
export type OrgInput       = z.infer<typeof OrgSchema>
export type InviteInput    = z.infer<typeof InviteSchema>
export type RiskEventInput = z.infer<typeof RiskEventSchema>
