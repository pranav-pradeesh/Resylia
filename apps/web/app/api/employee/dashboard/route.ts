import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { hasPermission, requirePermission } from '../../../auth'
import { getUserById, getOrgById, getRecentCheckins, getUserStreak, hasCheckedInToday, getAdminDb } from '@resylia/db'
import { ROLES, PERMISSIONS } from '@resylia/shared'

function calculateWeeklyMeetings(checkins: any[]): number {
  // Simplified calculation - in real app would integrate with calendar
  // Higher stress and lower energy might indicate more meetings
  const avgStress = checkins.reduce((sum, c) => sum + c.stress, 0) / checkins.length || 0
  const avgEnergy = checkins.reduce((sum, c) => sum + c.energy, 0) / checkins.length || 0
  
  // Base meetings + stress factor
  return Math.max(8, Math.round(12 + (avgStress - 5) + (5 - avgEnergy)))
}

function calculateDaysWithoutBreak(checkins: any[]): number {
  if (checkins.length === 0) return 0
  
  const latestCheckin = new Date(checkins[0].checked_in_at)
  const today = new Date()
  const diffTime = Math.abs(today.getTime() - latestCheckin.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return Math.max(0, diffDays - 1)
}

function calculateFocusTime(weeklyMeetings: number): number {
  // Simplified calculation - assume 8 hour work day
  const meetingHours = weeklyMeetings * 0.5 // Assume 30 min meetings
  const availableHours = 8 - meetingHours
  return Math.max(0, Math.round(availableHours * 10) / 10)
}

// Employees can view their own dashboard
export async function GET(request: NextRequest) {
  // Check authentication
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll() {
          // No-op for middleware
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user role from database
  const adminDb = getAdminDb()
  const { data: userData, error } = await adminDb
    .from('users')
    .select('role, org_id')
    .eq('id', user.id)
    .single<{ role: string; org_id: string }>()

  if (error || !userData) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  if (!hasPermission(userData.role, PERMISSIONS['checkin:read:own'])) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Add user info to request headers
  const requestWithUser = new Request(request)
  requestWithUser.headers.set('user-role', userData.role)
  requestWithUser.headers.set('user-id', user.id)
  requestWithUser.headers.set('org-id', userData.org_id)

  try {
    // Get user from auth context
    const userId = request.headers.get('user-id') as string
    const orgId = request.headers.get('org-id') as string

    if (!userId || !orgId) {
      return NextResponse.json({ error: 'User and organization context required' }, { status: 400 })
    }

    // Validate user exists and is active
    const user = await getUserById(userId)
    if (!user || !user.is_active) {
      return NextResponse.json({ error: 'User not found or inactive' }, { status: 404 })
    }

    // Validate organization exists
    const org = await getOrgById(orgId)
    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // Fetch user's recent checkins
    const checkins = await getRecentCheckins(userId, 14)
    const hasCheckedInTodayStatus = await hasCheckedInToday(userId)
    const streak = await getUserStreak(userId)

    // Calculate current metrics from latest checkin
    const latestCheckin = checkins[0]
    const currentEnergy = latestCheckin?.energy || 0
    const currentStress = latestCheckin?.stress || 0

    // Calculate meeting load from checkins (simplified - would need calendar integration in real app)
    const weeklyMeetings = calculateWeeklyMeetings(checkins)

    // Calculate days without break (no checkin in last 2 days)
    const daysWithoutBreak = calculateDaysWithoutBreak(checkins)

    // Mock data for PTO and peer matching (would need additional database tables)
    const ptoPlanned = false // Would query from PTO table
    const nextPtoDate = null // Would query from PTO table
    const peerMatchAvailable = true // Would query from peer matching system

    // Calculate focus time (simplified - would need calendar integration)
    const focusTimeToday = calculateFocusTime(weeklyMeetings)

    const dashboard = {
      lastCheckin: latestCheckin?.checked_in_at || null,
      currentEnergy,
      currentStress,
      moodStreak: streak,
      ptoPlanned,
      nextPtoDate,
      daysWithoutBreak,
      weeklyMeetings,
      focusTimeToday,
      peerMatchAvailable,
      hasCheckedInToday: hasCheckedInTodayStatus,
      recentCheckins: checkins.slice(0, 5).map(c => ({
        energy: c.energy,
        stress: c.stress,
        checked_in_at: c.checked_in_at,
        sentiment_score: c.sentiment_score,
        burnout_risk_score: c.burnout_risk_score,
      })),
    }

    // Log security event
    console.log(`[SECURITY] User ${userId} accessed dashboard for org ${orgId}`)

    return NextResponse.json({
      success: true,
      dashboard,
    })
  } catch (error) {
    console.error('Dashboard fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard' },
      { status: 500 }
    )
  }
}
