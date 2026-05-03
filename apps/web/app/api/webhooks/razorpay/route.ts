import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@resylia/db'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-razorpay-signature')
    
    if (!signature) {
      console.error('No Razorpay signature found')
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    // Verify webhook signature
    const razorpaySecret = process.env.RAZORPAY_WEBHOOK_SECRET!
    const expectedSignature = crypto
      .createHmac('sha256', razorpaySecret)
      .update(body)
      .digest('hex')

    if (signature !== expectedSignature) {
      console.error('Invalid Razorpay signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const event = JSON.parse(body)
    console.log('Razorpay webhook event:', event.event, event.payload.payment?.entity?.id)

    // Handle different event types
    switch (event.event) {
      case 'subscription.activated':
        await handleSubscriptionActivated(event.payload.subscription.entity)
        break
      case 'subscription.cancelled':
        await handleSubscriptionCancelled(event.payload.subscription.entity)
        break
      case 'payment.failed':
        await handlePaymentFailed(event.payload.payment.entity)
        break
      case 'payment.captured':
        await handlePaymentCaptured(event.payload.payment.entity)
        break
      case 'subscription.charged':
        await handleSubscriptionCharged(event.payload.subscription.entity)
        break
      default:
        console.log('Unhandled event type:', event.event)
    }

    return NextResponse.json({ status: 'ok' })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

async function handleSubscriptionActivated(subscription: any) {
  console.log('Subscription activated:', subscription.id)
  
  // Find subscription in database
  const { data: dbSub } = await getAdminDb()
    .from('subscriptions')
    .select('*')
    .eq('razorpay_subscription_id', subscription.id)
    .single<{
      id: string;
      org_id: string;
      plan: string;
      billing_cycle: string;
      seat_count: number;
      status: string;
    }>()

  if (!dbSub) {
    console.error('Subscription not found in database:', subscription.id)
    return
  }

  // Update organization plan if this is the first activation
  if (dbSub.status === 'trial') {
    await getAdminDb()
      .from('organizations')
      .update({
        plan: dbSub.plan,
        billing_cycle: dbSub.billing_cycle,
        seat_limit: dbSub.seat_count,
      })
      .eq('id', dbSub.org_id)
  }

  // Update subscription status
  await getAdminDb()
    .from('subscriptions')
    .update({
      status: 'active',
      next_billing_at: new Date(subscription.current_end * 1000).toISOString(),
    })
    .eq('razorpay_subscription_id', subscription.id)
}

async function handleSubscriptionCancelled(subscription: any) {
  console.log('Subscription cancelled:', subscription.id)
  
  const { data: dbSub } = await getAdminDb()
    .from('subscriptions')
    .select('*')
    .eq('razorpay_subscription_id', subscription.id)
    .single<{ [key: string]: any }>()

  if (!dbSub) {
    console.error('Subscription not found in database:', subscription.id)
    return
  }

  // Update subscription status
  await getAdminDb()
    .from('subscriptions')
    .update({
      status: 'canceled',
    })
    .eq('razorpay_subscription_id', subscription.id)

  // Downgrade organization to starter at next billing
  if (dbSub.plan !== 'starter') {
    const nextBillingDate = new Date(subscription.current_end * 1000)
    await getAdminDb()
      .from('organizations')
      .update({
        plan: 'starter',
        next_downgrade_at: nextBillingDate.toISOString(),
      })
      .eq('id', dbSub.org_id)
  }
}

async function handlePaymentFailed(payment: any) {
  console.log('Payment failed:', payment.id)
  
  // Find subscription
  const { data: dbSub } = await getAdminDb()
    .from('subscriptions')
    .select('*')
    .eq('razorpay_subscription_id', payment.entity.subscription_id)
    .single<{ [key: string]: any }>()

  if (!dbSub) {
    return
  }

  // Update subscription with failed payment
  await getAdminDb()
    .from('subscriptions')
    .update({
      status: 'past_due',
      last_payment_failed_at: new Date().toISOString(),
    })
    .eq('razorpay_subscription_id', payment.entity.subscription_id)

  // Schedule downgrade if payment fails for 7 days
  const downgradeDate = new Date()
  downgradeDate.setDate(downgradeDate.getDate() + 7)
  
  await getAdminDb()
    .from('organizations')
    .update({
      auto_downgrade_at: downgradeDate.toISOString(),
    })
    .eq('id', dbSub.org_id)
}

async function handlePaymentCaptured(payment: any) {
  console.log('Payment captured:', payment.id)
  
  // Find subscription
  const { data: dbSub } = await getAdminDb()
    .from('subscriptions')
    .select('*')
    .eq('razorpay_subscription_id', payment.entity.subscription_id)
    .single<{ [key: string]: any }>()

  if (!dbSub) {
    return
  }

  // Update subscription status to active (it might have been past_due)
  await getAdminDb()
    .from('subscriptions')
    .update({
      status: 'active',
      next_billing_at: new Date(payment.entity.created_at).toISOString(),
    })
    .eq('razorpay_subscription_id', payment.entity.subscription_id)

  // Cancel any scheduled auto-downgrade
  await getAdminDb()
    .from('organizations')
    .update({
      auto_downgrade_at: null,
    })
    .eq('id', dbSub.org_id)
}

async function handleSubscriptionCharged(subscription: any) {
  console.log('Subscription charged:', subscription.id)
  
  // Find subscription
  const { data: dbSub } = await getAdminDb()
    .from('subscriptions')
    .select('*')
    .eq('razorpay_subscription_id', subscription.id)
    .single<{ [key: string]: any }>()

  if (!dbSub) {
    return
  }

  // Update next billing date
  await getAdminDb()
    .from('subscriptions')
    .update({
      status: 'active',
      next_billing_at: new Date(subscription.current_end * 1000).toISOString(),
    })
    .eq('razorpay_subscription_id', subscription.id)
}



