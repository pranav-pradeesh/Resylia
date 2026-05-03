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

      const { data: interventions } = await admin
        .from('interventions')
        .select('id, employee_id, type, status, created_at, completed_at, notes')
        .in('employee_id', userIds)
        .order('created_at', { ascending: false })
        .limit(20)

      const team = teamMembers.map(member => {
        const memberCheckins = (checkins || []).filter(c => c.user_id === member.id)
        const lastCheckin = memberCheckins[0]
        const avgRisk = memberCheckins.length > 0
          ? memberCheckins.reduce((a, c) => a + (c.burnout_risk_score || 0), 0) / memberCheckins.length
          : 0

        let status: 'healthy' | 'warning' | 'critical' = 'healthy'
        if (avgRisk > 0.6) status = 'critical'
        else if (avgRisk > 0.4) status = 'warning'

        return {
          id: member.id,
          name: member.display_name || member.email?.split('@')[0] || `Employee ${member.id.slice(0, 6)}`,
          status,
          lastCheckin: lastCheckin?.checked_in_at
            ? new Date(lastCheckin.checked_in_at).toLocaleDateString()
            : 'Never',
          riskScore: Math.round(avgRisk * 100) / 100,
          canCreateIntervention: status !== 'healthy',
        }
      })

      const memberInterventions = (interventions || []).map(interv => {
        const member = teamMembers.find(m => m.id === interv.employee_id)
        return {
          id: interv.id,
          employeeId: interv.employee_id,
          employeeName: member?.display_name || member?.email?.split('@')[0] || `Employee ${interv.employee_id?.slice(0, 6)}`,
          type: interv.type,
          status: interv.status,
          createdAt: interv.created_at,
          completedAt: interv.completed_at,
          notes: interv.notes,
        }
      })

      return NextResponse.json({
        team,
        interventions: memberInterventions,
      })
    } catch (error) {
      console.error('[manager/team] error:', error)
      return NextResponse.json({ error: 'Failed to load team' }, { status: 500 })
    }
  }, 'manager:read')
}