import { NextResponse } from 'next/server'
import { withAuth } from '@resylia/shared'
import { getAdminDb } from '@resylia/db'

export async function GET(req: Request) {
  return withAuth(req, async (userId, orgId) => {
    const admin = getAdminDb() as any
    try {
      const { data: checkins } = await admin
        .from('checkins')
        .select('*')
        .eq('user_id', userId)
        .gte('checked_in_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('checked_in_at', { ascending: false })
        .limit(30)

      const lastCheckin = checkins?.[0]?.checked_in_at || null
      const currentEnergy = checkins?.[0]?.energy || 3
      const currentStress = checkins?.[0]?.stress || 2

      let moodStreak = 0
      if (lastCheckin) {
        const lastCheckinDate = new Date(lastCheckin)
        const now = new Date()
        moodStreak = Math.floor((now.getTime() - lastCheckinDate.getTime()) / (1000 * 60 * 60 * 24))
      }

      const { data: ptoRequests } = await admin
        .from('pto_requests')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'approved')
        .gte('start_date', new Date().toISOString())
        .order('start_date', { ascending: true })
        .limit(1)

      const ptoPlanned = ptoRequests && ptoRequests.length > 0
      const nextPtoDate = ptoRequests?.[0]?.start_date || null

      const { data: ptoHistory } = await admin
        .from('pto_requests')
        .select('end_date')
        .eq('user_id', userId)
        .eq('status', 'approved')
        .not('end_date', 'is', null)
        .order('end_date', { ascending: false })
        .limit(1)

      let daysWithoutBreak = 90
      if (ptoHistory && ptoHistory.length > 0) {
        const lastPTO = new Date(ptoHistory[0].end_date)
        const now = new Date()
        daysWithoutBreak = Math.floor((now.getTime() - lastPTO.getTime()) / (1000 * 60 * 60 * 24))
      }

      const { data: checkins7Days } = await admin
        .from('checkins')
        .select('meeting_hours')
        .eq('user_id', userId)
        .gte('checked_in_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

      const weeklyMeetings = checkins7Days 
        ? Math.round(checkins7Days.reduce((sum, c) => sum + (c.meeting_hours || 2), 0) / Math.max(checkins7Days.length, 1) * 5)
        : 10

      const focusTimeToday = Math.max(0, 8 - (checkins7Days?.[0]?.meeting_hours || 2))

      return NextResponse.json({
        lastCheckin,
        currentEnergy,
        currentStress,
        moodStreak,
        ptoPlanned,
        nextPtoDate,
        daysWithoutBreak,
        weeklyMeetings,
        focusTimeToday,
        peerMatchAvailable: false,
      })
    } catch (error) {
      console.error('[employee-stats] error:', error)
      return NextResponse.json({
        lastCheckin: null,
        currentEnergy: 3,
        currentStress: 2,
        moodStreak: 0,
        ptoPlanned: false,
        nextPtoDate: null,
        daysWithoutBreak: 0,
        weeklyMeetings: 0,
        focusTimeToday: 8,
        peerMatchAvailable: false,
      })
    }
  }, 'user:read')
}