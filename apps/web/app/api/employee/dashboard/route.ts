import { NextResponse } from 'next/server'
import { withAuth } from '@resylia/shared/src/auth/middleware'
import { getRecentCheckins, getUserStreak, hasCheckedInToday } from '@resylia/db/src/checkins'

export async function GET(req: Request) {
  return withAuth(req, async (userId) => {
    const [checkins, streak, checkedInToday] = await Promise.all([
      getRecentCheckins(userId, 14),
      getUserStreak(userId),
      hasCheckedInToday(userId),
    ])

    return NextResponse.json({
      streak,
      checked_in_today: checkedInToday,
      last_checkin: checkins[0]?.checked_in_at ?? null,
      // Strip sensitive ML scores — only return the 3 user-owned metrics
      checkins: checkins.map((c) => ({
        date: c.checked_in_at.split('T')[0],
        energy: c.energy,
        stress: c.stress,
        workload: c.workload,
      })),
    })
  }, 'checkin:read:own')
}
