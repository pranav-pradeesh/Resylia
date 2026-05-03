import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getAdminDb } from '@resylia/db'

export async function POST(request: NextRequest) {
  try {
    const { org_id, plan, billing_cycle, seat_count } = await request.json()

    if (!org_id || !plan || !billing_cycle || !seat_count) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify user has permission to upgrade organization
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

    // Get user role
    const { data: userData } = await getAdminDb()
      .from('users')
      .select('role, org_id')
      .eq('id', user.id)
      .single<{ role: string; org_id: string }>()

    if (!userData || userData.org_id !== org_id || userData.role !== 'admin') {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    // Update organization plan
    const { error: updateError } = await getAdminDb()
.from('organizations')
      .update([{
        plan,
        billing_cycle,
        seat_limit: seat_count,
      }])
      .eq('id', org_id)

    if (updateError) {
      console.error('Failed to update organization:', updateError)
      return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Plan updated successfully',
    })
  } catch (error) {
    console.error('Plan upgrade error:', error)
    return NextResponse.json({ error: 'Failed to upgrade plan' }, { status: 500 })
  }
}

