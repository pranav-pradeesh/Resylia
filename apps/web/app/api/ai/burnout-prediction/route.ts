import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { hasPermission, requirePermission } from '../../auth'
import { getAdminDb, UserRow } from '@resylia/db'
import { burnoutPredictor } from '../../../lib/ai/burnout-prediction'
import { ROLES, PERMISSIONS } from '@resylia/shared'
import { createPlanErrorResponse } from '@resylia/shared'

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

  const userRecord = userData as UserRow
  if (!hasPermission(userRecord ? userRecord.role : 'employee', 'analytics:read' as any)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Add user info to request headers
  const requestWithUser = new Request(request)
  requestWithUser.headers.set('user-role', userRecord.role)
  requestWithUser.headers.set('user-id', user.id)
  requestWithUser.headers.set('org-id', userRecord.org_id)

  try {
    const orgId = request.headers.get('org-id') as string
    const body = await request.json()
    const { user_ids, timeframe = '30' } = body

    if (!user_ids || !Array.isArray(user_ids)) {
      return NextResponse.json(
        { error: 'user_ids array is required' },
        { status: 400 }
      )
    }

    const predictions = []
    const admin = getAdminDb()

    for (const userId of user_ids) {
      // Verify user belongs to the organization
      const { data: user } = await admin
        .from('users')
        .select('id, display_name, department')
        .eq('id', userId)
        .eq('org_id', orgId)
        .single<{ [key: string]: any }>()

      if (!user) {
        continue // Skip if user not found in org
      }

      const prediction = await burnoutPredictor(userId, orgId)
      predictions.push({
        ...prediction,
        user_name: (user as any).display_name || 'Unknown',
        department: (user as any).department || 'Unknown',
      })
    }

    // Store predictions for tracking and model improvement
    // Note: Skipping database insert for now to avoid type issues
    // TODO: Fix database schema and types for burnout_predictions table

    return NextResponse.json({
      success: true,
      predictions,
      summary: {
        total_users: predictions.length,
        high_risk_7days: predictions.filter(p => p.prediction_7_days >= 0.7).length,
        high_risk_14days: predictions.filter(p => p.prediction_14_days >= 0.7).length,
        high_risk_30days: predictions.filter(p => p.prediction_30_days >= 0.7).length,
        imminent_burnout: predictions.filter(p => p.estimated_burnout_date).length,
        avg_confidence: predictions.reduce((sum, p) => sum + p.confidence_score, 0) / predictions.length,
      },
    })
  } catch (error) {
    console.error('Burnout prediction error:', error)
    return NextResponse.json(
      { error: 'Failed to generate burnout predictions' },
      { status: 500 }
    )
  }
}

