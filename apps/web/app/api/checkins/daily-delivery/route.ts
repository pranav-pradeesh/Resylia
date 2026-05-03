import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getAdminDb } from '@resylia/db'
import { Resend } from 'resend'
import { requireFeature } from '@resylia/shared'

const resend = new Resend('re_123456789')

type Employee = {
  email: string
  display_name?: string
  last_checkin_at?: string
}

type UserData = {
  org_id: string
  organization?: {
    plan?: string
    slack_bot_connected?: boolean
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: () => {},
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // ✅ FIXED (removed generic)
    const { data: userDataRaw } = await getAdminDb()
      .from('users')
      .select('org_id, organization(plan, slack_bot_connected)')
      .eq('id', user.id)
      .single<{ [key: string]: any }>()

    const userData = userDataRaw as UserData

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // ✅ FIXED TYPE
    const { data: employeesRaw } = await getAdminDb()
      .from('users')
      .select('email, display_name, last_checkin_at')
      .eq('org_id', userData.org_id)
      .eq('is_active', true)

    const employees = employeesRaw as Employee[] | null

    if (!employees || employees.length === 0) {
      return NextResponse.json({
        success: true,
        employees_notified: 0,
        message: 'No employees to notify'
      })
    }

    const results: any[] = []
    const today = new Date().toISOString().split('T')[0]

    for (const employee of employees) {
      try {
        if (
          employee.last_checkin_at &&
          employee.last_checkin_at.split('T')[0] === today
        ) {
          results.push({
            employee: employee.email,
            status: 'already_completed',
            skipped: true
          })
          continue
        }

        let deliveryMethod = 'email'

        if (userData.organization?.slack_bot_connected) {
          const slackAccess = requireFeature(userData.organization.plan as any, 'slack_bot')
          if ('allowed' in slackAccess && slackAccess.allowed) {
            deliveryMethod = 'slack'
          }
        }

        // ✅ FIXED (removed wrong condition)
        const { data: userSlackDataRaw } = await getAdminDb()
          .from('users')
          .select('slack_user_id')
          .eq('id', user.id)
          .single<{ [key: string]: any }>()

        const userSlackData = userSlackDataRaw as { slack_user_id?: string }

        if (deliveryMethod === 'slack' && userSlackData?.slack_user_id) {
          const slackResult = await sendSlackCheckin(userData.org_id, userSlackData.slack_user_id)

          results.push({
            employee: employee.email,
            method: 'slack',
            status: slackResult.success ? 'sent' : 'failed',
            error: slackResult.error || null
          })
        } else {
          const emailResult = await sendEmailCheckin(employee.email, employee.display_name || '')

          results.push({
            employee: employee.email,
            method: 'email',
            status: emailResult.success ? 'sent' : 'failed',
            error: emailResult.error || null
          })
        }

      } catch (err: any) {
        console.error(`Failed to notify ${employee.email}:`, err)

        results.push({
          employee: employee.email,
          status: 'failed',
          error: err?.message || 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      success: true,
      employees_notified: results.filter(r => r.status === 'sent' && !r.skipped).length,
      total_employees: employees.length,
      already_completed: results.filter(r => r.skipped).length,
      failed: results.filter(r => r.status === 'failed').length,
      results
    })

  } catch (err: any) {
    console.error('Daily checkin delivery error:', err)

    return NextResponse.json({
      error: 'Failed to deliver daily check-ins',
      message: err?.message || 'Unknown error'
    }, { status: 500 })
  }
}

// ---------- HELPERS ----------

async function sendSlackCheckin(orgId: string, slackUserId: string) {
  try {
    const { data: orgRaw } = await getAdminDb()
      .from('organizations')
      .select('slack_bot_token')
      .eq('id', orgId)
      .single<{ [key: string]: any }>()

    const org = orgRaw as { slack_bot_token?: string }

    if (!org?.slack_bot_token) {
      return { success: false, error: 'Slack bot not configured' }
    }

    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${org.slack_bot_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channel: slackUserId,
        text: '🌱 Daily Wellness Check-in',
      }),
    })

    const data = await response.json()
    return { success: data.ok, error: data.error || null }

  } catch (err: any) {
    return { success: false, error: err?.message }
  }
}

async function sendEmailCheckin(email: string, displayName: string) {
  try {
    const { error } = await resend.emails.send({
      from: 'checkins@resylia.ai',
      to: [email],
      subject: '🌱 Daily Wellness Check-in',
      html: `<p>Hello ${displayName || 'there'}, complete your check-in.</p>`
    })

    if (error) throw error

    return { success: true }

  } catch (err: any) {
    return { success: false, error: err?.message }
  }
}
