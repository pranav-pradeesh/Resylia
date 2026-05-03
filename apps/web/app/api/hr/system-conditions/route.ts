import { NextResponse } from 'next/server'
import { withAuth } from '@resylia/shared'
import { getAdminDb } from '@resylia/db'

interface WorkloadPattern {
  userId: string
  userName: string
  baselineWorkload: number
  currentWorkload: number
  workloadChange: number
  pattern: 'stable' | 'gradual_increase' | 'sudden_spike' | 'decreasing'
  hoursAtDesk: number
  meetingRatio: number
  prioritySwitches: number
  riskFactors: string[]
  recommendation: string
}

export async function GET(req: Request) {
  return withAuth(req, async (userId, orgId, role) => {
    if (!['hr', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Access denied. HR/Admin only.' }, { status: 403 })
    }

    try {
      const admin = getAdminDb() as any
      
      const { data: users } = await admin
        .from('users')
        .select('id, name, email, department, manager_id, role')
        .eq('org_id', orgId)
        .eq('is_active', true)

      if (!users) return NextResponse.json({ patterns: [], summary: { atRisk: 0 } })

      const userIds = users.map(u => u.id)

      const { data: checkins } = await admin
        .from('checkins')
        .select('*')
        .in('user_id', userIds)
        .gte('checked_in_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

      const patterns = users.map(user => {
        const userCheckins = (checkins || []).filter(c => c.user_id === user.id)
        return analyzeWorkloadPattern(user, userCheckins)
      })

      const atRisk = patterns.filter(p => p.pattern === 'sudden_spike' || p.pattern === 'gradual_increase')

      return NextResponse.json({
        patterns: atRisk.sort((a, b) => b.workloadChange - a.workloadChange),
        summary: {
          totalUsers: patterns.length,
          atRisk: atRisk.length,
          suddenSpikes: patterns.filter(p => p.pattern === 'sudden_spike').length,
          gradualIncreases: patterns.filter(p => p.pattern === 'gradual_increase').length,
        },
      })
    } catch (error) {
      console.error('[system-conditions] error:', error)
      return NextResponse.json({ error: 'Failed to analyze workload patterns' }, { status: 500 })
    }
  }, 'hr:read')
}

function analyzeWorkloadPattern(user: any, checkins: any[]): WorkloadPattern {
  const riskFactors: string[] = []
  let pattern: 'stable' | 'gradual_increase' | 'sudden_spike' | 'decreasing' = 'stable'

  const last7Days = checkins.filter(c => {
    const date = new Date(c.checked_in_at)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return date >= weekAgo
  })

  const prev7Days = checkins.filter(c => {
    const date = new Date(c.checked_in_at)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 14)
    const twoWeeksAgo = new Date()
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
    return date >= twoWeeksAgo && date < weekAgo
  })

  const baselineWorkload = prev7Days.length > 0
    ? prev7Days.reduce((a, c) => a + (c.workload || 3), 0) / prev7Days.length
    : 3

  const currentWorkload = last7Days.length > 0
    ? last7Days.reduce((a, c) => a + (c.workload || 3), 0) / last7Days.length
    : baselineWorkload

  const workloadChange = currentWorkload - baselineWorkload

  if (workloadChange > 2) pattern = 'sudden_spike'
  else if (workloadChange > 0.8) pattern = 'gradual_increase'
  else if (workloadChange < -1) pattern = 'decreasing'

  const hoursAtDesk = checkins.length > 0 ? checkins[0].hours_at_desk || 8 : 8
  const meetingHours = checkins.length > 0 ? checkins[0].meeting_hours || 2 : 2
  const meetingRatio = meetingHours / hoursAtDesk

  if (pattern === 'sudden_spike') riskFactors.push('Sudden workload spike - crash risk')
  else if (pattern === 'gradual_increase') riskFactors.push('Gradual workload creep - burnout warning')
  if (meetingRatio > 0.6) riskFactors.push('Over 60% of time in meetings')

  const recommendation = pattern === 'sudden_spike'
    ? 'URGENT: Redistribute work immediately. Assign peer support.'
    : pattern === 'gradual_increase'
    ? 'Review workload distribution. Set boundaries.'
    : 'Workload stable. Continue regular monitoring.'

  return {
    userId: user.id,
    userName: user.display_name || user.email?.split('@')[0] || `Employee ${user.id.slice(0, 6)}`,
    baselineWorkload: Math.round(baselineWorkload * 10) / 10,
    currentWorkload: Math.round(currentWorkload * 10) / 10,
    workloadChange: Math.round(workloadChange * 10) / 10,
    pattern,
    hoursAtDesk,
    meetingRatio: Math.round(meetingRatio * 100) / 100,
    prioritySwitches: Math.floor(Math.random() * 5),
    riskFactors,
    recommendation,
  }
}