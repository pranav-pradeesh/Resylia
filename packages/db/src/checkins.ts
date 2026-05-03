import { adminDb } from './client'
import type { CheckinInput } from '../../shared/src/validation'
import { getUserBurnoutScoreRuleBased, getUserBurnoutScoreWithAI } from './burnout-calculations'

export interface CheckinRow {
  id: string
  user_id: string
  org_id: string
  energy: number
  stress: number
  workload: number
  sentiment_score: number | null
  burnout_risk_score: number | null
  source: string
  checked_in_at: string
}

export async function insertCheckin(
  userId: string,
  orgId: string,
  data: CheckinInput,
  sentimentScore: number,
  burnoutRiskScore: number
): Promise<CheckinRow> {
  const { data: row, error } = await adminDb
    .from('checkins')
    .insert({
      user_id: userId,
      org_id: orgId,
      energy: data.energy,
      stress: data.stress,
      workload: data.workload,
      free_text: data.free_text ?? null,
      sentiment_score: sentimentScore,
      burnout_risk_score: burnoutRiskScore,
      source: data.source,
      checked_in_at: new Date().toISOString(),
    })
    .select()
    .single<{ [key: string]: any }>()

  if (error) throw new Error(`Failed to insert check-in: ${error.message}`)
  return row as CheckinRow
}

/** Last N check-ins for a user, ordered newest first */
export async function getRecentCheckins(
  userId: string,
  days = 14
): Promise<CheckinRow[]> {
  const since = new Date(Date.now() - days * 86_400_000).toISOString()

  const { data, error } = await adminDb
    .from('checkins')
    .select('*')
    .eq('user_id', userId)
    .gte('checked_in_at', since)
    .order('checked_in_at', { ascending: false })

  if (error) throw new Error(`Failed to fetch check-ins: ${error.message}`)
  return (data ?? []) as CheckinRow[]
}

/** Team check-ins for manager heatmap (no free_text, no individual identification) */
export async function getTeamCheckins(
  orgId: string,
  managerId: string,
  days = 7
): Promise<Omit<CheckinRow, 'free_text'>[]> {
  const since = new Date(Date.now() - days * 86_400_000).toISOString()

  const { data: managerUsers } = await adminDb
    .from('users')
    .select('id')
    .eq('manager_id', managerId)
    .eq('org_id', orgId)

  const userIds = managerUsers?.map((u: { id: string }) => u.id) ?? []
  if (userIds.length === 0) return []

  const { data, error } = await adminDb
    .from('checkins')
    .select('id, user_id, org_id, energy, stress, workload, sentiment_score, burnout_risk_score, source, checked_in_at')
    .in('user_id', userIds)
    .gte('checked_in_at', since)
    .order('checked_in_at', { ascending: true })

  if (error) throw new Error(`Failed to fetch team check-ins: ${error.message}`)
  return (data ?? []) as Omit<CheckinRow, 'free_text'>[]
}

/** Streak: consecutive days with a check-in */
export async function getUserStreak(userId: string): Promise<number> {
  const { data } = await adminDb
    .from('checkins')
    .select('checked_in_at')
    .eq('user_id', userId)
    .order('checked_in_at', { ascending: false })
    .limit(60)

  if (!data?.length) return 0

  const days = new Set(
    data.map((r: { checked_in_at: string }) => r.checked_in_at.split('T')[0])
  )

  let streak = 0
  const today = new Date()
  for (let i = 0; i < 60; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split('T')[0]
    if (days.has(key)) {
      streak++
    } else if (i > 0) {
      break
    }
  }
  return streak
}

/** Whether user already checked in today */
export async function hasCheckedInToday(userId: string): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0]
  const { count } = await adminDb
    .from('checkins')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('checked_in_at', `${today}T00:00:00Z`)
    .lt('checked_in_at', `${today}T23:59:59Z`)

  return (count ?? 0) > 0
}


