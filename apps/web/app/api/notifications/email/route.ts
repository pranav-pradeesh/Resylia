import { Resend } from 'resend'
import { NextResponse } from 'next/server'
import { withAuth } from '@resylia/shared/src/auth/middleware'
import { adminDb } from '@resylia/db/src/client'

function getResend() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is required')
  }
  return new Resend(process.env.RESEND_API_KEY)
}

export async function POST(req: Request) {
  return withAuth(req, async (userId, orgId, role) => {
    const body = await req.json().catch(() => null)
    if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

    const { type, data } = body

    if (!['daily_digest', 'high_risk_alert', 'weekly_summary', 'invitation'].includes(type)) {
      return NextResponse.json({ error: 'Invalid email type' }, { status: 400 })
    }

    const { data: userData } = await (adminDb.from('users') as any)
      .select('email, full_name')
      .eq('id', userId)
      .single()

    if (!userData?.email) {
      return NextResponse.json({ error: 'User email not found' }, { status: 404 })
    }

    try {
      let emailPayload: any = {
        from: 'noreply@resylia.com',
        to: userData.email,
      }

      switch (type) {
        case 'daily_digest':
          emailPayload = {
            ...emailPayload,
            subject: '📊 Your daily check-in digest',
            html: renderDailyDigestEmail(userData.full_name, data),
          }
          break

        case 'high_risk_alert':
          emailPayload = {
            ...emailPayload,
            subject: '🚨 Team member at risk of burnout',
            html: renderHighRiskAlertEmail(userData.full_name, data),
          }
          break

        case 'weekly_summary':
          emailPayload = {
            ...emailPayload,
            subject: '📈 Weekly team health report',
            html: renderWeeklySummaryEmail(userData.full_name, data),
          }
          break

        case 'invitation':
          emailPayload = {
            ...emailPayload,
            subject: '👋 You are invited to Resylia',
            html: renderInvitationEmail(data.inviterName, data.orgName),
          }
          break
      }

      const result = await getResend().emails.send(emailPayload)

      if (result.error) {
        console.error('[email] send failed:', result.error)
        return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
      }

      return NextResponse.json({ success: true, id: result.data?.id })
    } catch (error: any) {
      console.error('[email] error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }, 'billing:manage' as any)
}

function renderDailyDigestEmail(name: string, data: any) {
  return `
    <div style="font-family: 'DM Mono', monospace; background: #0a0a0f; color: #f1f0eb; padding: 20px;">
      <h2>Hi ${name},</h2>
      <p>Here's your daily check-in summary:</p>
      <div style="background: #111118; border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 16px; margin: 20px 0;">
        <div>Stress Level: <strong>${data.stress}/5</strong></div>
        <div>Energy Level: <strong>${data.energy}/5</strong></div>
        <div>Workload: <strong>${data.workload}/5</strong></div>
      </div>
      <p>${data.coach_suggestion || 'Keep up the great work!'}</p>
      <a href="https://resylia.com" style="color: #f59e0b; text-decoration: none;">View Dashboard →</a>
    </div>
  `
}

function renderHighRiskAlertEmail(name: string, data: any) {
  return `
    <div style="font-family: 'DM Mono', monospace; background: #0a0a0f; color: #f1f0eb; padding: 20px;">
      <h2>⚠️ Team Alert</h2>
      <p>Hi ${name},</p>
      <p>A team member is showing signs of burnout:</p>
      <div style="background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); border-radius: 8px; padding: 16px; margin: 20px 0;">
        <div>Risk Score: <strong>${(data.burnout_risk_score * 100).toFixed(0)}%</strong></div>
        <div>Recommended Action: ${data.recommendation}</div>
      </div>
      <a href="https://resylia.com/manager/dashboard" style="color: #f59e0b; text-decoration: none;">View Team Dashboard →</a>
    </div>
  `
}

function renderWeeklySummaryEmail(name: string, data: any) {
  return `
    <div style="font-family: 'DM Mono', monospace; background: #0a0a0f; color: #f1f0eb; padding: 20px;">
      <h2>📊 Weekly Team Report</h2>
      <p>Hi ${name},</p>
      <div style="background: #111118; border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 16px; margin: 20px 0;">
        <div>Avg Stress: <strong>${data.avg_stress.toFixed(1)}/5</strong></div>
        <div>Avg Energy: <strong>${data.avg_energy.toFixed(1)}/5</strong></div>
        <div>Team Participation: <strong>${(data.participation_rate * 100).toFixed(0)}%</strong></div>
        <div>At Risk: <strong>${data.high_risk_count} members</strong></div>
      </div>
      <a href="https://resylia.com/manager/dashboard" style="color: #f59e0b; text-decoration: none;">View Full Report →</a>
    </div>
  `
}

function renderInvitationEmail(inviterName: string, orgName: string) {
  return `
    <div style="font-family: 'DM Mono', monospace; background: #0a0a0f; color: #f1f0eb; padding: 20px;">
      <h2>👋 You're invited!</h2>
      <p>${inviterName} has invited you to join <strong>${orgName}</strong> on Resylia.</p>
      <p>Resylia helps teams prevent burnout through daily check-ins and AI-powered insights.</p>
      <a href="https://resylia.com/signup" style="display: inline-block; background: #f59e0b; color: #0a0a0f; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 20px 0;">
        Accept Invitation
      </a>
    </div>
  `
}