import { NextResponse } from 'next/server'
import { withAuth } from '@resylia/shared'
import { getTeamMembers, getOrgById } from '@resylia/db'
import { getAdminDb } from '@resylia/db'

export async function GET(req: Request) {
  return withAuth(req, async (userId, orgId, role) => {
    if (!['manager', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    try {
      const admin = getAdminDb() as any
      const org = await getOrgById(orgId)
      if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 })

      const teamMembers = await getTeamMembers(orgId, userId)

      const userIds = teamMembers.map(m => m.id)

      const { data: checkins } = userIds.length > 0
        ? await admin
            .from('checkins')
            .select('id, user_id, energy, stress, workload, burnout_risk_score, checked_in_at')
            .in('user_id', userIds)
            .gte('checked_in_at', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString())
            .order('checked_in_at', { ascending: false })
        : { data: [] }

      const { data: alerts } = await admin
        .from('alerts')
        .select('id, type, employee_id, payload, created_at, seen_at')
        .eq('org_id', orgId)
        .eq('manager_id', userId)
        .order('created_at', { ascending: false })
        .limit(20)

      const needsAttention = teamMembers
        .map(member => {
          const memberCheckins = (checkins || []).filter(c => c.user_id === member.id)
          const lastCheckin = memberCheckins[0]
          const avgEnergy = memberCheckins.length > 0
            ? memberCheckins.reduce((a, c) => a + (c.energy || 0), 0) / memberCheckins.length
            : 0
          const avgStress = memberCheckins.length > 0
            ? memberCheckins.reduce((a, c) => a + (c.stress || 0), 0) / memberCheckins.length
            : 0
          const avgRisk = memberCheckins.length > 0
            ? memberCheckins.reduce((a, c) => a + (c.burnout_risk_score || 0), 0) / memberCheckins.length
            : 0

          let status: 'healthy' | 'warning' | 'critical' = 'healthy'
          if (avgRisk > 0.6 || avgStress > 4) status = 'critical'
          else if (avgRisk > 0.4 || avgStress > 3) status = 'warning'

          return {
            id: member.id,
            name: `Employee ${member.id.slice(0, 6)}`,
            energy: Math.round(avgEnergy * 10) / 10,
            stress: Math.round(avgStress * 10) / 10,
            burnoutRisk: Math.round(avgRisk * 100) / 100,
            lastCheckin: lastCheckin?.checked_in_at
              ? new Date(lastCheckin.checked_in_at).toLocaleDateString()
              : 'Never',
            status,
          }
        })
        .filter(m => m.status !== 'healthy')
        .sort((a, b) => {
          const order = { critical: 0, warning: 1, healthy: 2 }
          return order[a.status] - order[b.status]
        })

      const recentActivity: { date: string; checkins: number }[] = []
      for (let i = 0; i < 7; i++) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]
        const count = checkins?.filter(c => c.checked_in_at.startsWith(dateStr)).length || 0
        recentActivity.push({ date: dateStr, checkins: count })
      }

      const avgEnergy = teamMembers.length > 0
        ? teamMembers.reduce((sum, m) => {
            const memberCheckins = (checkins || []).filter(c => c.user_id === m.id)
            return sum + (memberCheckins.length > 0
              ? memberCheckins.reduce((a, c) => a + (c.energy || 0), 0) / memberCheckins.length
              : 0)
          }, 0) / teamMembers.length
        : 0

      const avgStress = teamMembers.length > 0
        ? teamMembers.reduce((sum, m) => {
            const memberCheckins = (checkins || []).filter(c => c.user_id === m.id)
            return sum + (memberCheckins.length > 0
              ? memberCheckins.reduce((a, c) => a + (c.stress || 0), 0) / memberCheckins.length
              : 0)
          }, 0) / teamMembers.length
        : 0

      return NextResponse.json({
        teamSize: teamMembers.length,
        avgEnergy: Math.round(avgEnergy * 10) / 10,
        avgStress: Math.round(avgStress * 10) / 10,
        atRiskCount: needsAttention.length,
        needsAttention,
        recentActivity,
        unreadAlerts: (alerts ?? []).filter(a => !a.seen_at).length,
        recentAlerts: alerts ?? [],
      })
    } catch (error) {
      console.error('[manager/dashboard] error:', error)
      return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 })
    }
  }, 'manager:read')
}