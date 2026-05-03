import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { hasPermission, requirePermission } from '../../../auth'
import { encryptSensitiveData, decryptSensitiveData } from '../../../lib/encryption'
import { getAdminDb } from '@resylia/db'
import { ROLES, PERMISSIONS } from '@resylia/shared'

// Only managers and admins can view subscriptions
export async function GET(request: NextRequest) {
  // Check authentication
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
          // No-op for middleware
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user role from database
  const adminDb = getAdminDb()
  const { data: userData, error } = await adminDb
    .from('users')
    .select('role, org_id')
    .eq('id', user.id)
    .single<{ [key: string]: any }>()

  if (error || !userData) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  if (!hasPermission(userData.role, PERMISSIONS['billing:manage'])) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Add user info to request headers
  const requestWithUser = new Request(request)
  requestWithUser.headers.set('user-role', userData.role)
  requestWithUser.headers.set('user-id', user.id)
  requestWithUser.headers.set('org-id', userData.org_id)

  try {
    // Get user role from request headers
    const userRole = request.headers.get('user-role') as string
    const userId = request.headers.get('user-id') as string

    // In a real implementation, you would fetch from database
    // For now, return mock data
    const subscriptions = [
      {
        id: 'sub_1',
        user_id: userId,
        plan: 'premium',
        status: 'active',
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        amount: 2999,
        currency: 'INR',
        payment_method: 'card',
        encrypted_data: encryptSensitiveData({
          payment_method_token: 'pm_test_token',
          autopay_enabled: true,
          last_four: '4242',
          expiry: '12/25',
        }),
        created_at: new Date().toISOString(),
      },
    ]

    // Decrypt sensitive data for response
    const decryptedSubscriptions = subscriptions.map(sub => ({
      ...sub,
      encrypted_data: decryptSensitiveData(sub.encrypted_data)
    }))

    return NextResponse.json({
      success: true,
      subscriptions: decryptedSubscriptions,
    })
  } catch (error) {
    console.error('Subscription fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions' },
      { status: 500 }
    )
  }
}

// Only admins can create subscriptions
export async function POST(request: NextRequest) {
  // Check authentication
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
          // No-op for middleware
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user role from database
  const adminDb = getAdminDb()
  const { data: userData, error } = await adminDb
    .from('users')
    .select('role, org_id')
    .eq('id', user.id)
    .single<{ [key: string]: any }>()

  if (error || !userData) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  if (!hasPermission(userData.role, PERMISSIONS['billing:manage'])) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Add user info to request headers
  const requestWithUser = new Request(request)
  requestWithUser.headers.set('user-role', userData.role)
  requestWithUser.headers.set('user-id', user.id)
  requestWithUser.headers.set('org-id', userData.org_id)

  try {
    const body = await request.json()
    const { user_id, plan, amount, currency = 'INR', payment_method = 'card', autopay_enabled = false } = body

    if (!user_id || !plan || !amount) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Encrypt sensitive payment data
    const sensitiveData = {
      payment_method_token: body.payment_method_token,
      autopay_enabled,
      last_four: body.last_four,
      expiry: body.expiry,
    }
    const encryptedData = encryptSensitiveData(sensitiveData)

    // In a real implementation, you would:
    // 1. Create Razorpay subscription
    // 2. Store in database
    // 3. Update user role to premium
    const subscription = {
      id: `sub_${Date.now()}`,
      user_id,
      plan,
      status: 'active',
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      amount,
      currency,
      payment_method,
      encrypted_data: encryptedData,
      created_at: new Date().toISOString(),
    }

    // Store subscription in database
    // const { error } = await supabase.from('subscriptions').insert([subscription})// if (error) throw error

    // Update user role
    // const { error: userError } = await supabase
    //   .from('users')
    //   .update({ role: 'premium' })
    //   .eq('id', user_id)
    // if (userError) throw userError

    return NextResponse.json({
      success: true,
      subscription,
      message: 'Subscription created successfully',
    })
  } catch (error) {
    console.error('Subscription creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    )
  }
}



