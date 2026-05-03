import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getCurrentUser, requireRoles } from './auth'
import { initiateRazorpayPayment, processRazorpayAutopay } from './razorpay'
import { ROLES } from '@resylia/shared'

// Only admins can create payment sessions
export async function POST(request: NextRequest) {
  // Check role authorization
  const authResult = await requireRoles([ROLES.ADMIN])(request)
  if (authResult) return authResult

  // Get current user
  const user = await getCurrentUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { amount, currency = 'INR', paymentType = 'card', isAutopay = false } = body

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      )
    }

    if (isAutopay) {
      const result = await processRazorpayAutopay(request, amount, currency)
      return NextResponse.json(result)
    } else {
      const result = await initiateRazorpayPayment(request, amount, currency, paymentType)
      return NextResponse.json(result)
    }
  } catch (error) {
    console.error('Payment initiation error:', error)
    return NextResponse.json(
      { error: 'Failed to initiate payment' },
      { status: 500 }
    )
  }
}