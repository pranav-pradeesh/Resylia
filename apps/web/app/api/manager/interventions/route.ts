import { NextResponse } from 'next/server'
import { withAuth } from '@resylia/shared'
import { getTeamMembers } from '@resylia/db'
import { getAdminDb } from '@resylia/db'

interface InterventionPayload {
  memberId: string
  type: 'checkin_reminder' | 'one_on_one' | 'workload_review' | 'pto_encouragement' | 'burnout_alert'
  notes?: string
}

export async function POST(req: Request) {
  return withAuth(req, async (userId, orgId, role) => {
    if (!['manager', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    try {
      const body: InterventionPayload = await req.json()
      const { memberId, type, notes } = body

      if (!memberId || !type) {
        return NextResponse.json({ error: 'memberId and type required' }, { status: 400 })
      }

      const admin = getAdminDb() as any
      const teamMembers = await getTeamMembers(orgId, userId)
      const isTeamMember = teamMembers.some(m => m.id === memberId)

      if (!isTeamMember) {
        return NextResponse.json({ error: 'Can only create interventions for team members' }, { status: 403 })
      }

      const { data: intervention, error } = await admin
        .from('interventions')
        .insert([{
          manager_id: userId,
          employee_id: memberId,
          org_id: orgId,
          type,
          status: 'pending',
          notes,
        })
        .select()
        .single<{ [key: string]: any }>()

      if (error) {
        console.error('[intervention] insert error:', error)
        return NextResponse.json({ error: 'Failed to create intervention' }, { status: 500 })
      }

      return NextResponse.json({
        id: intervention.id,
        employeeId: intervention.employee_id,
        employeeName: `Employee ${memberId?.slice(0, 6) || 'Unknown'}`,
        type: intervention.type,
        status: intervention.status,
        createdAt: intervention.created_at,
      })
    } catch (error) {
      console.error('[manager/interventions] error:', error)
      return NextResponse.json({ error: 'Failed to create intervention' }, { status: 500 })
    }
  }, 'manager:write')
}

export async function GET(req: Request) {
  return withAuth(req, async (userId, orgId, role) => {
    if (!['manager', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    try {
      const admin = getAdminDb() as any
      const teamMembers = await getTeamMembers(orgId, userId)
      const userIds = teamMembers.map(m => m.id)

      const { data: interventions } = userIds.length > 0
        ? await admin
            .from('interventions')
            .select('id, employee_id, type, status, created_at, completed_at, notes')
            .eq('manager_id', userId)
            .in('employee_id', userIds)
            .order('created_at', { ascending: false })
            .limit(50)
        : { data: [] }

      return NextResponse.json({
        interventions: (interventions || {}).map(i => {
          const member = teamMembers.find(m => m.id === i.employee_id)
          return {
            id: i.id,
            employeeId: i.employee_id,
            employeeName: `Employee ${i.employee_id?.slice(0, 6) || 'Unknown'}`,
            type: i.type,
            status: i.status,
            createdAt: i.created_at,
            completedAt: i.completed_at,
            notes: i.notes,
          }
        }),
      })
    } catch (error) {
      console.error('[manager/interventions] error:', error)
      return NextResponse.json({ error: 'Failed to load interventions' }, { status: 500 })
    }
  }, 'manager:read')
}

export async function PATCH(req: Request) {
  return withAuth(req, async (userId, orgId, role) => {
    if (!['manager', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    try {
      const { interventionId, status, notes } = await req.json()

      if (!interventionId || !status) {
        return NextResponse.json({ error: 'interventionId and status required' }, { status: 400 })
      }

      const admin = getAdminDb() as any

      const updateData: any = { status }
      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString()
      }
      if (notes) {
        updateData.notes = notes
      }

const { data, error } = await admin
        .from('interventions')
        .update([updateData])
        .eq('id', interventionId)
        .eq('manager_id', userId)
        .select()
        .single<Intervention>()

      if (error) {
        console.error('[intervention] update error:', error)
        return NextResponse.json({ error: 'Failed to update intervention' }, { status: 500 })
      }

      return NextResponse.json({ success: true, intervention: data })
    } catch (error) {
      console.error('[manager/interventions] error:', error)
      return NextResponse.json({ error: 'Failed to update intervention' }, { status: 500 })
    }
  }, 'manager:write')
}



