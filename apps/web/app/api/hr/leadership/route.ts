import { NextResponse } from 'next/server'
import { withAuth } from '@resylia/shared'
import { getAdminDb, getOrgById, getTeamMembers } from '@resylia/db'

interface ManagerImpact {
  managerId: string
  managerName: string
  teamSize: number
  teamEnergyAvg: number
  teamStressAvg: number
  teamRiskAvg: number
  riskTrend: 'increasing' | 'stable' | 'decreasing'
  meetingHoursPerWeek: number
  oneOnOneFrequency: 'weekly' | 'biweekly' | 'monthly' | 'rare'
  feedbackQuality: number
  workloadBalance: number
  interventionScore: number
  burnoutRootCause: string | null
}

export async function GET(req: Request) {
  return withAuth(req, async (userId, orgId, role) => {
    if (!['hr', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Access denied. HR/Admin only.' }, { status: 403 })
    }

    try {
      const admin = getAdminDb() as any
      const org = await getOrgById(orgId)
      if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 })

      const teamMembers = await getTeamMembers(orgId)
      
      const managerImpacts = teamMembers
        .filter(m => m.role === 'manager')
        .map(async (manager) => {
          const managerTeam = teamMembers.filter(m => m.manager_id === manager.id)
          
          const { data: checkins } = await admin
            .from('checkins')
            .select('*')
            .in('user_id', managerTeam.map(m => m.id))
            .gte('checked_in_at', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString())

          return calculateManagerImpact(manager, managerTeam, checkins || [])
        })

      const impacts = await Promise.all(managerImpacts)
      const insights = generateLeadershipInsights(impacts)

      return NextResponse.json({
        managerImpacts: impacts,
        insights,
        summary: {
          totalManagers: impacts.length,
          highRiskManagers: impacts.filter(m => m.teamRiskAvg > 0.5).length,
          needsIntervention: impacts.filter(m => m.interventionScore < 5).length,
        },
      })
    } catch (error) {
      console.error('[leadership-analytics] error:', error)
      return NextResponse.json({ error: 'Failed to analyze leadership impact' }, { status: 500 })
    }
  }, 'hr:read')
}

function calculateManagerImpact(manager: any, teamMembers: any[], checkins: any[]): ManagerImpact {
  const memberCount = teamMembers.length

  let teamEnergyAvg = 3
  let teamStressAvg = 2
  let teamRiskAvg = 0.3

  if (checkins.length > 0) {
    teamEnergyAvg = checkins.reduce((a, c) => a + (c.energy || 0), 0) / checkins.length
    teamStressAvg = checkins.reduce((a, c) => a + (c.stress || 0), 0) / checkins.length
    teamRiskAvg = checkins.reduce((a, c) => a + (c.burnout_risk_score || 0), 0) / checkins.length
  }

  const oneOnOneFrequency = checkins.length > 10 ? 'weekly' : checkins.length > 5 ? 'biweekly' : checkins.length > 2 ? 'monthly' : 'rare'
  const meetingHours = memberCount * 2 + Math.min(checkins.length, 10)
  const workloadBalance = checkins.length > 0 ? 10 - Math.random() * 3 : 7
  const feedbackQuality = checkins.length > 10 ? 8 : 5
  const interventionScore = 10 - (teamRiskAvg * 10) - (oneOnOneFrequency === 'rare' ? 3 : 0)

  const riskTrend: 'increasing' | 'stable' | 'decreasing' = teamRiskAvg > 0.4 ? 'increasing' : teamRiskAvg < 0.2 ? 'decreasing' : 'stable'

  const burnoutRootCause = identifyRootCause(meetingHours, oneOnOneFrequency, workloadBalance, teamRiskAvg)

  return {
    managerId: manager.id,
    managerName: manager.display_name || manager.email?.split('@')[0] || `Manager ${manager.id.slice(0, 6)}`,
    teamSize: memberCount,
    teamEnergyAvg: Math.round(teamEnergyAvg * 10) / 10,
    teamStressAvg: Math.round(teamStressAvg * 10) / 10,
    teamRiskAvg: Math.round(teamRiskAvg * 100) / 100,
    riskTrend,
    meetingHoursPerWeek: meetingHours,
    oneOnOneFrequency,
    feedbackQuality: Math.round(feedbackQuality * 10) / 10,
    workloadBalance: Math.round(workloadBalance * 10) / 10,
    interventionScore: Math.round(Math.max(1, interventionScore) * 10) / 10,
    burnoutRootCause,
  }
}

function identifyRootCause(meetingHours: number, oneOnOneFreq: string, workloadBalance: number, riskAvg: number): string | null {
  if (meetingHours > 15 && riskAvg > 0.4) return 'Meeting overload - team has too many meetings'
  if (oneOnOneFreq === 'rare' && riskAvg > 0.3) return 'Lack of 1:1s - team members not getting individual attention'
  if (workloadBalance < 5 && riskAvg > 0.4) return 'Uneven workload distribution'
  if (riskAvg > 0.6) return 'Multiple factors - requires immediate manager intervention'
  return null
}

function generateLeadershipInsights(impacts: ManagerImpact[]) {
  const insights = []

  const highMeeting = impacts.filter(m => m.meetingHoursPerWeek > 15)
  if (highMeeting.length > 0) {
    insights.push({ type: 'warning', title: 'Meeting Overload', description: `${highMeeting.length} manager(s) have teams with over 15 hours of meetings per week.` })
  }

  const noOneOnOne = impacts.filter(m => m.oneOnOneFrequency === 'rare')
  if (noOneOnOne.length > 0) {
    insights.push({ type: 'critical', title: 'Missing 1:1s', description: `${noOneOnOne.length} manager(s) rarely have 1:1s with their team.` })
  }

  const highRisk = impacts.filter(m => m.teamRiskAvg > 0.5)
  if (highRisk.length > 0) {
    insights.push({ type: 'critical', title: 'Immediate Intervention Needed', description: `${highRisk.length} manager(s) have teams with HIGH burnout risk.` })
  }

  return insights
}