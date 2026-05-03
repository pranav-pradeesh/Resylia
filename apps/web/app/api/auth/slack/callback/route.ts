import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getAdminDb } from '@resylia/db'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  
  if (!code) {
    return NextResponse.json({ error: 'Authorization code required' }, { status: 400 })
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.SLACK_CLIENT_ID!,
        client_secret: process.env.SLACK_CLIENT_SECRET!,
        code,
        redirect_uri: process.env.SLACK_REDIRECT_URI!,
      }),
    })

    const tokenData = await tokenResponse.json()
    
    if (!tokenData.ok) {
      return NextResponse.json({ error: 'Slack OAuth failed' }, { status: 400 })
    }

    // Get user info
    const userResponse = await fetch('https://slack.com/api/users.info', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })

    const userData = await userResponse.json()
    
    if (!userData.ok) {
      return NextResponse.json({ error: 'Failed to get user info' }, { status: 400 })
    }

    const user = userData.user
    
    // Get or create user in Supabase
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('slack_user_id', user.id)
      .single<{ [key: string]: any }>()

    if (!existingUser) {
      // Create new user and organization
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: `${user.real_name.split(' ')[0]}'s Team`,
          plan: 'starter',
          onboarding_completed: false,
        })
        .select()
        .single<{ [key: string]: any }>()

      if (orgError) throw orgError

      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          org_id: org.id,
          slack_user_id: user.id,
          display_name: user.real_name,
          email: user.profile.email,
          role: 'admin',
        })
        .select()
        .single<{ [key: string]: any }>()

      if (userError) throw userError

      // Create subscription record
      const { error: subError } = await getAdminDb()
        .from('subscriptions')
        .insert({
          org_id: org.id,
          razorpay_subscription_id: `trial_${org.id}`,
          razorpay_customer_id: `trial_${org.id}`,
          plan: 'starter',
          billing_cycle: 'monthly',
          seat_count: 1,
          status: 'trial',
          trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          next_billing_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          amount: 0,
          currency: 'INR',
        } as any)

      if (subError) throw subError
    }

    // Set up Supabase session
    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: 'slack',
      options: {
        redirectTo: '/onboarding'
      }
    })

    if (signInError) {
      // Fallback: redirect to onboarding without auth
      console.error('Supabase auth error:', signInError)
      return NextResponse.redirect('/onboarding')
    }

    return NextResponse.redirect('/onboarding')
  } catch (error) {
    console.error('Slack callback error:', error)
    return NextResponse.redirect('/auth/error?error=callback_failed')
  }
}



