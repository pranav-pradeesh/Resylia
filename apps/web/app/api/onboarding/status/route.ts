import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getAdminDb } from '@resylia/db'

export async function GET(request: NextRequest) {
  try {
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
            // No-op for get endpoint
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get user's organization
    const { data: userData } = await getAdminDb()
      .from('users')
      .select('org_id, role')
      .eq('id', user.id)
      .single<{ org_id: string; role: string }>()

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get organization details
    const { data: organization } = await getAdminDb()
      .from('organizations')
      .select('plan, onboarding_completed, slack_bot_connected')
      .eq('id', userData.org_id)
      .single<{ plan: string; onboarding_completed: boolean; slack_bot_connected: boolean }>()

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      organization,
      user_role: userData.role,
    })
  } catch (error) {
    console.error('Onboarding status error:', error)
    return NextResponse.json({ error: 'Failed to get onboarding status' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { skip_slack = false } = await request.json()

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
            // No-op for onboarding completion
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get user's organization
    const { data: userData } = await getAdminDb()
      .from('users')
      .select('org_id')
      .eq('id', user.id)
      .single<{ [key: string]: any }>()

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Update organization - mark onboarding as complete
    const { error: updateError } = await getAdminDb()
      .from('organizations')
      .update([{
        onboarding_completed: true,
      }])
      .eq('id', userData.org_id)

    if (updateError) {
      console.error('Failed to complete onboarding:', updateError)
      return NextResponse.json({ error: 'Failed to complete onboarding' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Onboarding completed successfully',
    })
  } catch (error) {
    console.error('Onboarding completion error:', error)
    return NextResponse.json({ error: 'Failed to complete onboarding' }, { status: 500 })
  }
}



