import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '../../../auth'
import { getAdminDb } from '@resylia/db'
import { ROLES, PERMISSIONS } from '@resylia/shared'
import { sendEscalationAlert } from '../../../lib/slack/notify'
import { encryptSensitiveData, generateSecureToken } from '../../../lib/encryption'

interface EscalationRequest {
  department: string
  concern_type: 'safety' | 'harassment' | 'burnout' | 'toxic' | 'other'
  severity: 'low' | 'medium' | 'high' | 'critical'
  issue_description: string
  affected_people: number
  timeframe: 'ongoing' | 'past_week' | 'past_month' | 'long_term'
  previous_reports: boolean
  preferred_contact: 'anonymous' | 'email' | 'phone'
  contact_info?: string
}

interface EscalationResponse {
  id: string
  anonymous_token: string
  submitted_at: string
  status: 'submitted' | 'under_review' | 'addressed' | 'resolved'
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as EscalationRequest
    
    // Validate required fields
    if (!body.department || !body.concern_type || !body.severity || !body.issue_description) {
      return NextResponse.json(
        { error: 'Missing required fields: department, concern_type, severity, issue_description' },
        { status: 400 }
      )
    }

    // Generate anonymous escalation record
    const escalationId = `esc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const anonymousToken = generateSecureToken()

    // Encrypt sensitive contact information
    let encryptedContact = null
    if (body.preferred_contact !== 'anonymous' && body.contact_info) {
      encryptedContact = encryptSensitiveData({
        contact_info: body.contact_info,
        preferred_contact: body.preferred_contact,
      })
    }

    // Store in database with anonymization
    const admin = getAdminDb()
    const { data: escalation, error } = await admin
      .from('anonymous_escalations')
      .insert({
        id: escalationId,
        anonymous_token: anonymousToken,
        org_id: 'all', // Cross-org escalation system
        department: body.department,
        concern_type: body.concern_type,
        severity: body.severity,
        issue_description: body.issue_description,
        affected_people: body.affected_people || 1,
        preferred_contact_method: body.preferred_contact_method || 'email',
        submission_ip: getClientIP(request),
        user_agent: request.headers.get('user-agent') || 'Unknown',
        submitted_at: new Date().toISOString(),
        status: 'pending_review',
        assigned_to: null,
        resolution_summary: null,
        resolved_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single<{ [key: string]: any }>()

    if (error) {
      console.error('Escalation database error:', error)
      return NextResponse.json(
        { error: 'Failed to submit escalation' },
        { status: 500 }
      )
    }

    // Send immediate alert to HR team
    const escalationAlert = {
      id: escalationId,
      department: body.department,
      concern_type: body.concern_type,
      severity: body.severity,
      issue: body.issue_description.substring(0, 200) + (body.issue_description.length > 200 ? '...' : ''),
      affected_people: body.affected_people || 1,
      timeframe: body.timeframe,
      timestamp: new Date().toISOString(),
    }

    try {
      await sendEscalationAlert('hr-team', escalationAlert)
    } catch (error) {
      console.error('Failed to send escalation alert:', error)
      // Don't fail the submission if alert fails
    }

    // Return response with anonymous tracking token
    const response: EscalationResponse = {
      id: escalationId,
      anonymous_token: anonymousToken,
      submitted_at: escalation.submitted_at,
      status: escalation.status,
    }

    // Log for security audit (without sensitive data)
    console.log(`[ESCALATION] Anonymous escalation ${escalationId} submitted for ${body.department} department`)

    return NextResponse.json({
      success: true,
      escalation: response,
      message: 'Your anonymous report has been submitted. You will be notified when action is taken.',
      next_steps: [
        'HR team will review your report within 24 hours',
        'If this involves immediate safety concerns, please contact your local authorities',
        'You can check status using your anonymous token',
        'Your identity will not be revealed to management',
      ],
    })

  } catch (error) {
    console.error('Escalation submission error:', error)
    return NextResponse.json(
      { error: 'Failed to submit anonymous escalation' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Anonymous token is required' },
        { status: 400 }
      )
    }

    // Look up escalation by anonymous token
    const admin = getAdminDb()
    const { data: escalation, error } = await admin
      .from('anonymous_escalations')
      .select('id, status, submitted_at, updated_at, resolution_summary')
      .eq('anonymous_token', token)
      .single<{ [key: string]: any }>()

    if (error || !escalation) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      escalation: {
        id: escalation.id,
        status: escalation.status,
        submitted_at: escalation.submitted_at,
        updated_at: escalation.updated_at,
        resolution_summary: escalation.resolution_summary,
      },
      message: 'Your report status has been updated.',
    })

  } catch (error) {
    console.error('Escalation status check error:', error)
    return NextResponse.json(
      { error: 'Failed to check escalation status' },
      { status: 500 }
    )
  }
}



