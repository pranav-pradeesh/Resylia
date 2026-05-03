import { NextRequest, NextResponse } from 'next/server'
import Razorpay from 'razorpay'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getAdminDb } from '@resylia/db'
import { PLANS } from '@resylia/shared'

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

export async function POST(request: NextRequest) {
  try {
    const { plan, seats, billing } = await request.json()

    if (!plan || !seats || !billing) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    if (!['starter', 'growth', 'pro'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

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

    // ✅ FIXED
    const { data: userDataRaw } = await getAdminDb()
      .from('users')
      .select('org_id, role')
      .eq('id', user.id)
      .single<{ [key: string]: any }>()

    const userData = userDataRaw as any

    if (!userData || userData.role !== 'admin') {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const { data: organizationRaw } = await getAdminDb()
      .from('organizations')
      .select('display_name')
      .eq('id', userData.org_id)
      .single<{ [key: string]: any }>()

    const organization = organizationRaw as any

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    const planConfig = PLANS[plan as keyof typeof PLANS]
    const perSeatPrice =
      billing === 'annual'
        ? planConfig.annual_per_seat
        : planConfig.monthly_per_seat

    const totalPrice = seats * perSeatPrice

    // ✅ FIXED (removed expire_at)
    const subscriptionRaw = await razorpay.subscriptions.create({
      plan_id: await createRazorpayPlan(plan, billing, perSeatPrice),
      total_count: billing === 'annual' ? 12 : 1,
      quantity: seats,
      customer_notify: 1,
      start_at: Math.floor(Date.now() / 1000) + 14 * 86400,
      notes: {
        organization_id: userData.org_id,
        plan,
        billing_cycle: billing,
        seats,
        user_id: user.id,
      },
    })

    const subscription = subscriptionRaw as any

    // ✅ FIXED (cast insert)
    const { error: subError } = await getAdminDb()
      .from('subscriptions')
      .insert({
        org_id: userData.org_id,
        razorpay_subscription_id: subscription.id,
        razorpay_customer_id: subscription.customer_id,
        plan,
        billing_cycle: billing,
        seat_count: seats,
        status: 'trial',
        trial_ends_at: new Date(Date.now() + 14 * 86400000).toISOString(),
        next_billing_at: new Date(Date.now() + 14 * 86400000).toISOString(),
        amount: totalPrice * 100,
        currency: 'INR',
      } as any)

    if (subError) {
      return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      subscription_id: subscription.id,
      short_url: subscription.short_url,
      notes: subscription.notes,
    })

  } catch (err: any) {
    console.error('Trial creation error:', err)
    return NextResponse.json({
      error: 'Failed to create trial',
      message: err?.message || 'Unknown error',
    }, { status: 500 })
  }
}

async function createRazorpayPlan(
  plan: string,
  billing: string,
  perSeatPrice: number
): Promise<string> {

  try {
    // ✅ FIXED (from must be number)
    const existingPlans = await razorpay.plans.all({
      from: 0,
      count: 1,
    }) as any

    if (existingPlans.items.length > 0) {
      return existingPlans.items[0].id
    }
  } catch {}

  const newPlan = await razorpay.plans.create({
    period: billing === 'annual' ? 'yearly' : 'monthly',
    interval: 1,
    item: {
      name: `Resylia ${plan} (${billing})`,
      amount: perSeatPrice * 100,
      currency: 'INR',
    },
  })

  return newPlan.id
}
