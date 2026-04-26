const SENSITIVE_FIELDS = new Set([
  'energy', 'stress', 'workload',
  'sentiment_score', 'burnout_risk_score',
  'free_text', 'contributing_factors', 'predicted_burnout_date',
])

export function redactForLog(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, SENSITIVE_FIELDS.has(k) ? '[REDACTED]' : v])
  )
}

export interface Checkin {
  user_id: string
  energy: number
  stress: number
  workload: number
  burnout_risk_score: number
  checked_in_at: string
}

export interface AggregatedTeamData {
  insufficient_data?: boolean
  member_count?: number
  avg_stress?: number
  avg_energy?: number
  avg_workload?: number
  high_risk_count?: number
  participation_rate?: number
}

/** MINIMUM_COHORT_SIZE enforced here AND at RLS — individual data never reaches managers */
export const MINIMUM_COHORT_SIZE = 5

export function aggregateForManager(checkins: Checkin[], totalSeats: number): AggregatedTeamData {
  const uniqueUsers = new Set(checkins.map((c) => c.user_id))

  if (uniqueUsers.size < MINIMUM_COHORT_SIZE) {
    return { insufficient_data: true }
  }

  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length

  return {
    member_count: uniqueUsers.size,
    avg_stress:   +avg(checkins.map((c) => c.stress)).toFixed(2),
    avg_energy:   +avg(checkins.map((c) => c.energy)).toFixed(2),
    avg_workload: +avg(checkins.map((c) => c.workload)).toFixed(2),
    high_risk_count: checkins.filter((c) => c.burnout_risk_score > 0.7).length,
    participation_rate: +(uniqueUsers.size / totalSeats).toFixed(2),
  }
}
