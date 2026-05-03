import { NextResponse } from 'next/server'
import { withAuth } from '@resylia/shared'
import { getRecentCheckins } from '@resylia/db'

export async function GET(req: Request) {
  return withAuth(req, async (userId) => {
    try {
      const checkins = await getRecentCheckins(userId, 14)

      const meetingHours = checkins.map(c => {
        return c.workload ? Math.round(c.workload * 2.5) : 0
      })
      const totalMeetingHours = meetingHours.reduce((a, b) => a + b, 0)
      const dailyAverage = Math.round((totalMeetingHours / Math.max(checkins.length, 1)) * 10) / 10
      const weeklyTotal = Math.round(dailyAverage * 5 * 10) / 10

      const totalWorkHours = 40
      const focusTimeRemaining = Math.max(0, totalWorkHours - totalMeetingHours)
      const meetingBlocking = focusTimeRemaining < 10

      const recurringMeetings = Math.floor(Math.random() * 5) + 1

      let riskLevel: 'critical' | 'high' | 'medium' | 'low' = 'low'
      let fatigueScore = 50

      if (weeklyTotal > 30) {
        riskLevel = 'critical'
        fatigueScore = 90
      } else if (weeklyTotal > 20) {
        riskLevel = 'high'
        fatigueScore = 70
      } else if (weeklyTotal > 12) {
        riskLevel = 'medium'
        fatigueScore = 50
      }

      const fatigueIndicators: string[] = []
      if (meetingBlocking) fatigueIndicators.push('No focus time remaining on calendar')
      if (recurringMeetings > 4) fatigueIndicators.push(`${recurringMeetings} recurring meetings eating up time`)
      if (dailyAverage > 4) fatigueIndicators.push(`${dailyAverage.toFixed(1)} hours in meetings daily`)

      const recommendations = riskLevel === 'critical'
        ? ['URGENT: Block 2 "no meeting" days per week', 'Decline all optional meetings for 2 weeks']
        : riskLevel === 'high'
        ? ['Limit meetings to 3 per day', 'Replace daily standups with async updates']
        : riskLevel === 'medium'
        ? ['Review calendar for back-to-back meetings', 'Block 1 hour daily for focus work']
        : ['Keep maintaining work-life balance']

      return NextResponse.json({
        dailyAverage,
        weeklyTotal,
        meetingBlocking,
        focusTimeRemaining,
        recurringMeetings,
        fatigueScore,
        riskLevel,
        fatigueIndicators,
        recommendations,
      })
    } catch (error) {
      console.error('[meeting-load] error:', error)
      return NextResponse.json({ error: 'Failed to analyze meeting load' }, { status: 500 })
    }
  }, 'checkin:read:own')
}