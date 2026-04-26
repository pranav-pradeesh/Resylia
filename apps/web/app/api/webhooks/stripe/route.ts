import { NextResponse } from 'next/server'
import { logSecurityEvent } from '@resylia/shared/src/audit'
import { rateLimiters } from '@resylia/shared/src/rate-limit'
import { getOrgByStripeCustomerId, updateSubscription } from '@resylia/db/src/users'

async function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    return null
  }
  const { default: Stripe } = await import('stripe')
  return new Stripe(process.env.STRIPE_SECRET_KEY)
}

const HANDLED_EVENTS = new Set([
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
])

export async function POST(req: Request) {
  // Skip if no Stripe key - return early
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 501 })
  }

  const ip = req.headers.get('x-forwarded-for') ?? '127.0.0.1'
  const { success } = await rateLimiters.webhook.limit(ip)
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const body = await req.text()
  const sig  = req.headers.get('stripe-signature')

  if (!sig) {
    await logSecurityEvent('invalid_stripe_webhook', { reason: 'missing_signature' }, { ip })
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: any
  try {
    const stripe = await getStripe()
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 501 })
    }
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    await logSecurityEvent('invalid_stripe_webhook', { reason: err.message }, { ip })
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (!HANDLED_EVENTS.has(event.type)) {
    return NextResponse.json({ received: true })
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as any
        const org = await getOrgByStripeCustomerId(sub.customer as string)
        if (!org) break

        const plan = (sub.metadata?.plan ?? 'starter') as string
        const seatCount = parseInt(sub.metadata?.seat_count ?? '0')

        await updateSubscription(org.id, {
          stripe_subscription_id: sub.id,
          status: sub.status,
          plan,
          seat_count: seatCount,
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        })
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as any
        const org = await getOrgByStripeCustomerId(sub.customer as string)
        if (!org) break

        await updateSubscription(org.id, {
          status: 'canceled',
        })
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any
        const org = await getOrgByStripeCustomerId(invoice.customer as string)
        if (!org) break

        await updateSubscription(org.id, {
          status: 'active',
        })
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any
        const org = await getOrgByStripeCustomerId(invoice.customer as string)
        if (!org) break

        await updateSubscription(org.id, {
          status: 'past_due',
        })
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error('[stripe] webhook error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}