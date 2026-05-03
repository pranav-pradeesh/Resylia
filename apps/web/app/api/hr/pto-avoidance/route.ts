import { NextResponse } from 'next/server'
import { withAuth } from '@resylia/shared'
import { getAdminDb } from '@resylia/db'

interface PTOAvoidance {
  userId: string
  userName: string
  riskLevel: 'critical' | 'high' | 'medium' | 'low'
  daysSinceLastPTO: number
  weekendWork: number
  afterHoursActivity: number
  warningSigns: string[]
  recommendation: string
}

export async function GET(req: Request) {
  return withAuth(req, async (userId, orgId, role) => {
    if (!['hr', 'admin', 'manager'].includes(role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    try {
      const admin = getAdminDb() as any
      
      const { data: users } = await admin
        .from('users')
        .select('id, name, email, department, manager_id, role')
        .eq('org_id', orgId)
        .eq('is_active', true)

      if (!users) return NextResponse.json({ avoidanceRisks: [], summary: { totalAtRisk: 0 } })

      const userIds = users.map(u => u.id)

      const { data: checkins } = await admin
        .from('checkins')
        .select('user_id, checked_in_at, energy, stress, workload')
        .in('user_id', userIds)
        .gte('checked_in_at', new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString())
        .order('checked_in_at', { ascending: false })

      const avoidanceRisks = users.map(user => {
        const userCheckins = (checkins || []).filter(c => c.user_id === user.id)
        return analyzePTOAvoidance(user, userCheckins)
      })

      const atRisk = avoidanceRisks.filter(r => r.riskLevel !== 'low')

      return NextResponse.json({
        avoidanceRisks: atRisk.sort((a, b) => {
          const riskOrder = { critical: 0, high: 1, medium: 2, low: 3 }
          return riskOrder[a.riskLevel] - riskOrder[b.riskLevel]
        }),
        summary: {
          totalAtRisk: atRisk.length,
          critical: atRisk.filter(r => r.riskLevel === 'critical').length,
          high: atRisk.filter(r => r.riskLevel === 'high').length,
          medium: atRisk.filter(r => r.riskLevel === 'medium').length,
        },
      })
    } catch (error) {
      console.error('[pto-avoidance] error:', error)
      return NextResponse.json({ error: 'Failed to analyze PTO patterns' }, { status: 500 })
    }
  }, 'hr:read')
}

function analyzePTOAvoidance(user: any, checkins: any[]): PTOAvoidance {
  const warningSigns: string[] = []
  let riskScore = 0

  const daysSinceLastPTO = 45
  
  if (daysSinceLastPTO > 45) {
    riskScore += 3
    warningSigns.push('No PTO taken in 45+ days')
  } else if (daysSinceLastPTO > 30) {
    riskScore += 2
    warningSigns.push('No PTO taken in 30+ days')
  }

  const last30Days = new Date()
  last30Days.setDate(last30Days.getDate() - 30)
  const recentCheckins = checkins.filter(c => new Date(c.checked_in_at) >= last30Days)

  const checkinDays = new Set(recentCheckins.map(c => new Date(c.checked_in_at).toDateString()))
  const weekendWork = Array.from(checkinDays).filter(day => {
    const date = new Date(day)
    return date.getDay() === 0 || date.getDay() === 6
  }).length

  if (weekendWork > 4) {
    riskScore += 2
    warningSigns.push(`${weekendWork} weekend check-ins in last 30 days`)
  }

  const afterHoursWork = recentCheckins.filter(c => {
    const hour = new Date(c.checked_in_at).getHours()
    return hour >= 20 || hour <= 6
  }).length

  if (afterHoursWork > 10) {
    riskScore += 2
    warningSigns.push(`${afterHoursWork} after-hours check-ins`)
  }

  const avgStress = recentCheckins.length > 0
    ? recentCheckins.reduce((a, c) => a + (c.stress || 0), 0) / recentCheckins.length
    : 0

  if (avgStress > 4) {
    riskScore += 2
    warningSigns.push('High average stress level')
  }

  let riskLevel: 'critical' | 'high' | 'medium' | 'low' = 'low'
  if (riskScore >= 7) riskLevel = 'critical'
  else if (riskScore >= 5) riskLevel = 'high'
  else if (riskScore >= 3) riskLevel = 'medium'

  const recommendation = riskLevel === 'critical' 
    ? 'URGENT: Schedule mandatory PTO. Manager must have conversation today.'
    : riskLevel === 'high'
    ? 'Schedule PTO conversation this week. Discuss workload distribution.'
    : riskLevel === 'medium'
    ? 'Encourage taking PTO soon. Monitor for next 2 weeks.'
    : 'Employee appears to have healthy work-life balance.'

  return {
    userId: user.id,
    userName: user.display_name || user.email?.split('@')[0] || `Employee ${user.id.slice(0, 6)}`,
    riskLevel,
    daysSinceLastPTO,
    weekendWork,
    afterHoursActivity: afterHoursWork,
    warningSigns,
    recommendation,
  }
}