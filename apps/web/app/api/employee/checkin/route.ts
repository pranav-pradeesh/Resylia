import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { hasPermission, requirePermission } from '../../../auth'
import { insertCheckin, getUserById, getOrgById, getAdminDb } from '@resylia/db'
import { ROLES, PERMISSIONS } from '@resylia/shared'
import { z } from 'zod'

const checkinSchema = z.object({
  energy: z.number().min(1).max(10),
  stress: z.number().min(1).max(10),
  mood: z.enum(['happy', 'good', 'neutral', 'down', 'sad']),
  notes: z.string().optional(),
})

// Employees can submit their own checkins
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
    .single<{ role: string; org_id: string }>()

  if (error || !userData) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  if (!hasPermission(userData.role as string, 'checkin:write')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Add user info to request headers
  const requestWithUser = new Request(request)
  requestWithUser.headers.set('user-role', userData.role)
  requestWithUser.headers.set('user-id', user.id)
  requestWithUser.headers.set('org-id', userData.org_id)

  try {
    const body = await request.json()
    const validatedData = checkinSchema.parse(body)

    // Get user from auth context
    const userId = request.headers.get('user-id') as string
    const orgId = request.headers.get('org-id') as string

    if (!userId || !orgId) {
      return NextResponse.json({ error: 'User and organization context required' }, { status: 400 })
    }

    // Validate user exists and is active
    const user = await getUserById(userId)
    if (!user || !user.is_active) {
      return NextResponse.json({ error: 'User not found or inactive' }, { status: 404 })
    }

    // Validate organization exists
    const org = await getOrgById(orgId)
    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // Calculate sentiment and burnout risk scores (simplified for demo)
    const sentimentScore = calculateSentimentScore(validatedData.energy, validatedData.stress, validatedData.mood)
    const burnoutRiskScore = calculateBurnoutRiskScore(validatedData.energy, validatedData.stress)

    // Insert checkin into database
    const checkin = await insertCheckin(
      userId,
      orgId,
      {
        energy: validatedData.energy,
        stress: validatedData.stress,
        workload: 5, // Default workload, could be collected separately
        free_text: validatedData.notes || '',
        source: 'web',
      },
      sentimentScore,
      burnoutRiskScore
    )

    // Log security event
    console.log(`[SECURITY] User ${userId} submitted check-in for org ${orgId}`)

    return NextResponse.json({
      success: true,
      checkin: {
        id: checkin.id,
        energy: checkin.energy,
        stress: checkin.stress,
        sentiment_score: checkin.sentiment_score,
        burnout_risk_score: checkin.burnout_risk_score,
        checked_in_at: checkin.checked_in_at,
      },
      message: 'Check-in submitted successfully',
    })
  } catch (error) {
    console.error('Checkin submission error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to submit check-in' },
      { status: 500 }
    )
  }
}

function calculateSentimentScore(energy: number, stress: number, mood: string): number {
  const energyScore = energy / 10
  const stressScore = (10 - stress) / 10
  const moodScore = {
    'happy': 1,
    'good': 0.8,
    'neutral': 0.6,
    'down': 0.4,
    'sad': 0.2,
  }[mood]
  
  return Math.round((energyScore + stressScore + moodScore) / 3 * 100) / 100
}

function calculateBurnoutRiskScore(energy: number, stress: number): number {
  // Higher stress and lower energy = higher burnout risk
  const energyFactor = (10 - energy) / 10
  const stressFactor = stress / 10
  return Math.round((energyFactor + stressFactor) / 2 * 100) / 100
}

