import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '../../auth'

import { createPlanErrorResponse, requireFeature } from '@resylia/shared'
import { getAdminDb } from '@resylia/db'

export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('org-id') as string

    const managerAccess = requireFeature('growth', 'manager_nudges')

    if ('allowed' in managerAccess && !managerAccess.allowed) {
      return NextResponse.json(
        createPlanErrorResponse('manager_nudges', 'growth'),
        { status: 403 }
      )
    }

    const { data: teamMembers } = await getAdminDb()
      .from('users')
      .select('id, display_name, last_checkin_at, created_at')
      .eq('org_id', orgId)
      .eq('is_active', true)

    if (!teamMembers || teamMembers.length === 0) {
      return NextResponse.json({
        success: true,
        nudges: [],
        message: 'No team members to analyze',
      })
    }

    const nudges = await generateManagerNudges(orgId, teamMembers)

    return NextResponse.json({
      success: true,
      nudges,
      summary: {
        total_alerts: nudges.length,
        high_priority: nudges.filter(n => n.priority === 'high').length,
        medium_priority: nudges.filter(n => n.priority === 'medium').length,
        low_priority: nudges.filter(n => n.priority === 'low').length,
      },
    })
  } catch (error) {
    console.error('Manager nudges error:', error)
    return NextResponse.json(
      { error: 'Failed to generate nudges' },
      { status: 500 }
    )
  }
}

interface ManagerNudge {
  employee_name: string
  id: string
  user_id: string
  issue_type: string
  issue_description: string
  days_since_break: number
  current_burnout_risk: number
  last_checkin: string
  action: string
  priority: 'high' | 'medium' | 'low'
}

type Checkin = {
  stress: number
  energy: number
  workload: number
  burnout_risk_score?: number
  checked_in_at: string
}

type TeamMember = {
  id: string
  display_name?: string
}

async function generateManagerNudges(
  orgId: string,
  teamMembers: TeamMember[]
): Promise<ManagerNudge[]> {
  const nudges: ManagerNudge[] = []

  for (const member of teamMembers) {
    const { data: memberCheckins } = await getAdminDb()
      .from('checkins')
      .select('*')
      .eq('user_id', member.id)
      .eq('org_id', orgId)
      .gte('checked_in_at', new Date(Date.now() - 14 * 86400000).toISOString())
      .order('checked_in_at', { ascending: true })

    const checkins = memberCheckins as Checkin[] | null
    if (!checkins || checkins.length === 0) continue

    const latest = checkins[checkins.length - 1]

    const interventions = analyzeCheckinPatterns(member.id, checkins)

    for (const intervention of interventions) {
      nudges.push({
        employee_name: member.display_name || 'Team Member',
        id: member.id,
        user_id: member.id,
        issue_type: intervention.condition,
        issue_description: intervention.condition,
        days_since_break: calculateDaysWithoutBreak(checkins),
        current_burnout_risk: latest?.burnout_risk_score || 0,
        last_checkin: latest?.checked_in_at || '',
        action: intervention.specific_action,
        priority: intervention.priority,
      })
    }

    if (calculateDaysSinceLastCheckin(checkins) > 3) {
      nudges.push({
        employee_name: member.display_name || 'Team Member',
        id: member.id,
        user_id: member.id,
        issue_type: 'missed_checkins',
        issue_description: 'No checkins in the last few days',
        days_since_break: calculateDaysWithoutBreak(checkins),
        current_burnout_risk: latest?.burnout_risk_score || 0,
        last_checkin: latest?.checked_in_at || '',
        action: 'Check in with team member personally',
        priority: 'high',
      })
    }

    if (shouldTriggerAlert(checkins)) {
      nudges.push({
        employee_name: member.display_name || 'Team Member',
        id: member.id,
        user_id: member.id,
        issue_type: 'high_burnout_risk',
        issue_description: 'Burnout risk trending upward',
        days_since_break: calculateDaysWithoutBreak(checkins),
        current_burnout_risk: latest?.burnout_risk_score || 0,
        last_checkin: latest?.checked_in_at || '',
        action: 'Encourage time off or flexible work',
        priority: 'medium',
      })
    }

    if (shouldTriggerMeetingAlert(checkins)) {
      nudges.push({
        employee_name: member.display_name || 'Team Member',
        id: member.id,
        user_id: member.id,
        issue_type: 'stress_spike',
        issue_description: 'Recent stress spike detected',
        days_since_break: calculateDaysWithoutBreak(checkins),
        current_burnout_risk: latest?.burnout_risk_score || 0,
        last_checkin: latest?.checked_in_at || '',
        action: 'Schedule urgent 1:1 meeting',
        priority: 'high',
      })
    }
  }

  return nudges.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    return priorityOrder[b.priority] - priorityOrder[a.priority]
  })
}

function analyzeCheckinPatterns(userId: string, checkins: Checkin[]) {
  const interventions: {
    condition: string
    specific_action: string
    priority: 'high' | 'medium' | 'low'
  }[] = []

  if (checkins.length < 3) return interventions

  const stressTrend = analyzeTrend(checkins.map(c => c.stress))
  if (stressTrend > 0.3) {
    interventions.push({
      condition: 'Stress levels consistently increasing',
      specific_action: 'Schedule a 1:1 to discuss workload',
      priority: 'high',
    })
  }

  const energyTrend = analyzeTrend(checkins.map(c => c.energy))
  if (energyTrend < -0.3) {
    interventions.push({
      condition: 'Energy declining',
      specific_action: 'Adjust deadlines or workload',
      priority: 'medium',
    })
  }

  return interventions
}

function analyzeTrend(values: number[]): number {
  if (values.length < 2) return 0
  return values[values.length - 1] - values[0]
}

function calculateDaysWithoutBreak(checkins: Checkin[]): number {
  if (checkins.length === 0) return 0
  const latest = new Date(checkins[0].checked_in_at)
  return Math.ceil((Date.now() - latest.getTime()) / 86400000)
}

function calculateDaysSinceLastCheckin(checkins: Checkin[]): number {
  if (checkins.length === 0) return 0
  const latest = new Date(checkins[checkins.length - 1].checked_in_at)
  return Math.ceil((Date.now() - latest.getTime()) / 86400000)
}

function shouldTriggerAlert(checkins: Checkin[]): boolean {
  if (checkins.length < 3) return false
  const risks = checkins.map(c => c.burnout_risk_score || 0)
  return risks[risks.length - 1] > 0.5
}

function shouldTriggerMeetingAlert(checkins: Checkin[]): boolean {
  if (checkins.length < 6) return false
  return true
}