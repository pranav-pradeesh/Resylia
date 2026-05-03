import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { hasPermission } from '../../../auth'
import { getUserById, getOrgById, getTeamMembers, getAdminDb } from '@resylia/db'
import { z } from 'zod'

const analyticsSchema = z.object({
  days: z.string().optional(),
})

// Only HR and admins can view analytics
export async function GET(request: NextRequest) {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll() {},
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const adminDb = getAdminDb()

  // ✅ FIXED
  const { data, error } = await adminDb
    .from('users')
    .select('role, org_id')
    .eq('id', user.id)
    .single<{ [key: string]: any }>()

  const userData = data as { role: string; org_id: string }

  if (error || !userData) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // ✅ FIXED permission
  if (!hasPermission(userData.role as string, 'analytics:read')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const validatedParams = analyticsSchema.parse(Object.fromEntries(searchParams))
    const days = parseInt(validatedParams.days || '30')

    const userId = user.id
    const orgId = userData.org_id

    if (!userId || !orgId) {
      return NextResponse.json({ error: 'User and organization context required' }, { status: 400 })
    }

    const userInfo = await getUserById(userId)
    if (!userInfo || !userInfo.is_active || (userInfo.role !== 'hr' && userInfo.role !== 'admin')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const org = await getOrgById(orgId)
    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    const teamMembers = await getTeamMembers(orgId)
    const totalEmployees = teamMembers.length

    const since = new Date(Date.now() - days * 86400000).toISOString()

    const { data: checkins } = await adminDb
      .from('checkins')
      .select('id, user_id, energy, stress, sentiment_score, burnout_risk_score, checked_in_at')
      .eq('org_id', orgId)
      .gte('checked_in_at', since)

    const analytics = await calculateAnalytics(teamMembers, checkins || [], days)

    console.log(`[SECURITY] HR user ${userId} accessed analytics for org ${orgId}`)

    return NextResponse.json({
      success: true,
      analytics,
      metadata: {
        total_employees: totalEmployees,
        period_days: days,
        generated_at: new Date().toISOString(),
      },
    })

  } catch (error) {
    console.error('Analytics fetch error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}

// ---------- ANALYTICS ----------

async function calculateAnalytics(teamMembers: any[], checkins: any[], days: number) {
  const totalEmployees = teamMembers.length

  const dailyParticipants = new Set<string>()
  checkins.forEach(checkin => {
    const date = checkin.checked_in_at.split('T')[0]
    dailyParticipants.add(date)
  })

  const dailyCount = dailyParticipants.size

  const expectedCheckins = teamMembers.length * days
  const participationRate =
    expectedCheckins > 0
      ? Math.round((checkins.length / expectedCheckins) * 100)
      : 0

  const avgBurnoutRisk =
    checkins.length > 0
      ? checkins.reduce((sum, c) => sum + (c.burnout_risk_score || 0), 0) / checkins.length
      : 0

  const highRiskTrend = []
  const today = new Date()

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]

    const dayCheckins = checkins.filter(c => c.checked_in_at.split('T')[0] === dateStr)
    const highRiskCount = dayCheckins.filter(c => (c.burnout_risk_score || 0) > 0.7).length

    highRiskTrend.push({ date: dateStr, count: highRiskCount })
  }

  const healthyCount = teamMembers.filter(member => {
    const memberCheckins = checkins.filter(c => c.user_id === member.id)
    if (memberCheckins.length === 0) return false

    const avgEnergy = memberCheckins.reduce((sum, c) => sum + c.energy, 0) / memberCheckins.length
    const avgStress = memberCheckins.reduce((sum, c) => sum + c.stress, 0) / memberCheckins.length
    const avgBurnout = memberCheckins.reduce((sum, c) => sum + (c.burnout_risk_score || 0), 0) / memberCheckins.length

    return avgEnergy > 6 && avgStress < 5 && avgBurnout < 0.5
  }).length

  const atRiskCount = teamMembers.filter(member => {
    const memberCheckins = checkins.filter(c => c.user_id === member.id)
    if (memberCheckins.length === 0) return false

    const avgEnergy = memberCheckins.reduce((sum, c) => sum + c.energy, 0) / memberCheckins.length
    const avgStress = memberCheckins.reduce((sum, c) => sum + c.stress, 0) / memberCheckins.length
    const avgBurnout = memberCheckins.reduce((sum, c) => sum + (c.burnout_risk_score || 0), 0) / memberCheckins.length

    return (avgEnergy <= 6 && avgStress >= 5) || avgBurnout >= 0.5
  }).length

  const criticalCount = totalEmployees - healthyCount - atRiskCount

  return {
    total_employees: totalEmployees,
    daily_participants: dailyCount,
    participation_rate: participationRate,
    avg_burnout_risk: Math.round(avgBurnoutRisk * 100) / 100,
    highRiskTrend,
    team_health_distribution: [
      { level: 'Healthy', count: healthyCount },
      { level: 'At Risk', count: atRiskCount },
      { level: 'Critical', count: criticalCount },
    ],
  }
}
