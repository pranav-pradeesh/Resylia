import { NextResponse } from 'next/server'
import { withAuth } from '@resylia/shared/src/auth/middleware'
import { getTeamCheckins } from '@resylia/db/src/checkins'
import { aggregateForManager, MINIMUM_COHORT_SIZE } from '@resylia/db/src/sensitive'
import { getOrgById } from '@resylia/db/src/users'
import { adminDb } from '@resylia/db/src/client'

export async function GET(req: Request) {
  return withAuth(req, async (userId, orgId) => {
    const url = new URL(req.url)
    const days = Math.min(parseInt(url.searchParams.get('days') ?? '7'), 30)

    const [org, checkins] = await Promise.all([
      getOrgById(orgId),
      getTeamCheckins(orgId, userId, days),
    ])

    if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 })

    const aggregated = aggregateForManager(checkins, org.seat_count)

    if (aggregated.insufficient_data) {
      return NextResponse.json({
        insufficient_data: true,
        minimum_required: MINIMUM_COHORT_SIZE,
        message: `At least ${MINIMUM_COHORT_SIZE} team members must check in before aggregate data is shown.`,
      })
    }

    // Daily breakdown for trend chart
    const dailyMap: Record<string, { stresses: number[]; energies: number[]; workloads: number[] }> = {}
    for (const c of checkins) {
      const day = c.checked_in_at.split('T')[0]
      if (!dailyMap[day]) dailyMap[day] = { stresses: [], energies: [], workloads: [] }
      dailyMap[day].stresses.push(c.stress)
      dailyMap[day].energies.push(c.energy)
      dailyMap[day].workloads.push(c.workload)
    }

    const avg = (arr: number[]) =>
      arr.length ? +(arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2) : null

    const daily_trends = Object.entries(dailyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, vals]) => ({
        date,
        stress:   avg(vals.stresses),
        energy:   avg(vals.energies),
        workload: avg(vals.workloads),
      }))

    // Fetch unread alerts for this manager
    const { data: alerts } = await adminDb
      .from('alerts')
      .select('id, type, payload, created_at')
      .eq('org_id', orgId)
      .eq('manager_id', userId)
      .is('seen_at', null)
      .order('created_at', { ascending: false })
      .limit(10)

    return NextResponse.json({
      period: `last_${days}_days`,
      ...aggregated,
      daily_trends,
      unread_alerts: alerts ?? [],
    })
  }, 'checkin:read:team')
}
