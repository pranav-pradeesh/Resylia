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
      .select(
        'plan, billing_cycle, seat_count, seat_limit, slack_bot_connected, onboarding_completed'
      )
      .eq('id', userData.org_id)
      .single<{ [key: string]: any }>()

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      organization: {
        ...organization,
        user_role: userData.role,
      },
    })
  } catch (error) {
    console.error('Organization fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch organization data' }, { status: 500 })
  }
}

