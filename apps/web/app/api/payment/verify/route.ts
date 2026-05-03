import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { hasPermission, getCurrentUser, requireRoles } from './auth'
import { verifyRazorpayPayment } from './razorpay'
import { getAdminDb } from '@resylia/db'
import { ROLES, PERMISSIONS } from '@resylia/shared'

// Only admins can verify payments
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
    const { paymentId, orderId, signature } = body

    if (!paymentId || !orderId || !signature) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    const isValid = await verifyRazorpayPayment(paymentId, orderId, signature)

    if (!isValid) {
      return NextResponse.json(
        { error: 'Payment verification failed' },
        { status: 400 }
      )
    }

    // Here you would update your database with payment status
    // For example, mark the subscription as paid, update user role, etc.

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      paymentId,
      orderId,
    })
  } catch (error) {
    console.error('Payment verification error:', error)
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    )
  }
}