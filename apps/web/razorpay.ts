import Razorpay from 'razorpay'
import { NextRequest, NextResponse } from 'next/server'

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

export async function createRazorpayOrder(amount: number, currency: string = 'INR') {
  try {
    const order = await razorpay.orders.create({
      amount: amount * 100, // Razorpay expects amount in paise
      currency,
      receipt: `receipt_${Date.now()}`,
      payment_capture: true, // Auto-capture payment
    })

    return order
  } catch (error) {
    throw new Error(`Failed to create Razorpay order: ${error}`)
  }
}

export async function verifyRazorpayPayment(paymentId: string, orderId: string, signature: string) {
  try {
    const crypto = require('crypto')
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(`${orderId}|${paymentId}`)
      .digest('hex')

    if (generatedSignature !== signature) {
      throw new Error('Invalid signature')
    }

    return true
  } catch (error) {
    throw new Error(`Payment verification failed: ${error}`)
  }
}

export async function initiateRazorpayPayment(
  request: NextRequest,
  amount: number,
  currency: string = 'INR',
  paymentType: 'card' | 'upi' | 'wallet' = 'card'
) {
  try {
    const order = await createRazorpayOrder(amount, currency)
    
    const options = {
      key: process.env.RAZORPAY_KEY_ID!,
      amount: order.amount,
      currency: order.currency,
      name: 'Resylia',
      description: 'Premium Subscription',
      image: '/logo.png',
      order_id: order.id,
      callback_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payment/verify`,
      prefill: {
        name: '',
        email: '',
        contact: '',
      },
      theme: {
        color: '#3B82F6',
      },
      method: paymentType,
    }

    return NextResponse.json({
      success: true,
      order_id: order.id,
      options,
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Payment initiation failed',
    }, { status: 400 })
  }
}

export async function processRazorpayAutopay(
  request: NextRequest,
  amount: number,
  currency: string = 'INR'
) {
  try {
    // For autopay, we need to create a subscription
    const subscription = await razorpay.subscriptions.create({
      plan_id: process.env.RAZORPAY_PLAN_ID!,
      customer_notify: 1,
      total_count: 12, // 12 months subscription
      quantity: 1,
      // Add autopay-specific parameters
      // Note: You'll need to set up a plan in Razorpay dashboard first
    })

    return NextResponse.json({
      success: true,
      subscription_id: subscription.id,
      amount,
      currency,
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Autopay setup failed',
    }, { status: 400 })
  }
}