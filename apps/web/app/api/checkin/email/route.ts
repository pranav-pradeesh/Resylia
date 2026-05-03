import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getAdminDb } from '@resylia/db'
import { Resend } from 'resend'

const resend = new Resend('re_123456789') // Use actual API key

export async function POST(request: NextRequest) {
  try {
    const { email, checkin_data } = await request.json()
    
    // Get organization and user info
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll() {
            // No-op
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Store checkin first
    const checkin = await insertCheckin(user.id, checkin_data)
    
    if (!checkin) {
      return NextResponse.json({ error: 'Failed to store checkin' }, { status: 500 })
    }
    
    // Send email checkin reminder
    await sendEmailCheckinRequest(user.email!, {
      energy: checkin_data.energy,
      stress: checkin_data.stress,
    })

    return NextResponse.json({
      success: true,
      delivered_via: 'email',
      checkin_id: (checkin as any).id
    })
  } catch (error) {
    console.error('Email checkin error:', error)
    return NextResponse.json({ error: 'Failed to send email checkin' }, { status: 500 })
  }
}

async function sendEmailCheckinRequest(email: string, checkinData: any) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'checkins@resylia.ai',
      to: [email],
      subject: 'Daily Wellness Check-in - Resylia',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px;">
            <h2 style="color: #1f2937; margin-bottom: 10px;">🌱 Daily Wellness Check-in</h2>
            <p style="color: #4b5563; line-height: 1.6;">
              How are you feeling today? Take 30 seconds to complete your wellness check-in.
            </p>
            
            <div style="background: white; padding: 15px; border-radius: 6px; margin: 15px 0;">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <div>
                  <div style="color: #059669; font-weight: 600;">⚡ Energy Level</div>
                  <div style="color: #6b7280;">1-10 scale (10 = highest)</div>
                  <input type="range" min="1" max="10" value="5" style="width: 100%;">
                </div>
                <div>
                  <div style="color: #dc2626; font-weight: 600;">😰 Stress Level</div>
                  <div style="color: #6b7280;">1-10 scale (10 = highest)</div>
                  <input type="range" min="1" max="10" value="5" style="width: 100%;">
                </div>
              </div>
              <div style="margin-top: 10px;">
                <div style="color: #7c3aed; font-weight: 600;">💼 Workload</div>
                <div style="color: #6b7280;">1-10 scale (10 = highest)</div>
                <input type="range" min="1" max="10" value="5" style="width: 100%;">
              </div>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px;">
            <a href="${process.env.NEXT_PUBLIC_BASE_URL}/employee/checkin" 
               style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Complete Check-in
            </a>
          </div>
          
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px; text-align: center;">
              Need Slack integration? <a href="${process.env.NEXT_PUBLIC_BASE_URL}/onboarding" style="color: #3b82f6;">Connect your workspace</a>
            </p>
          </div>
        </div>
      `
    })

    if (error) {
      console.error('Failed to send email:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Email service error:', error)
    throw error
  }
}

// Helper function for inserting checkin
async function insertCheckin(userId: string, data: any) {
  const { data: checkin } = await getAdminDb()
    .from('checkins')
    .insert({
      user_id: userId,
      org_id: 'test-org',
      energy: data.energy,
      stress: data.stress,
      workload: data.workload,
      free_text: data.free_text || '',
      source: 'email',
      checked_in_at: new Date().toISOString(),
    } as any)
    .select()
    .single<{ [key: string]: any }>()

  return checkin
}



