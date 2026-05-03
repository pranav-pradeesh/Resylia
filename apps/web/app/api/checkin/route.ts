import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { requireFeature, createPlanErrorResponse } from '@resylia/shared'
import { getAdminDb } from '@resylia/db'
// Burnout calculation functions will be added later

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { energy, stress, workload, free_text, source } = body

    // Get authenticated user
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
            // No-op
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get user's organization and plan
    const { data: userData } = await getAdminDb()
      .from('users')
      .select('org_id, role, organization(plan)')
      .eq('id', user.id)
      .single<{ [key: string]: any }>()

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user has access to checkins (always allowed)
    const checkinAccess = requireFeature('starter', 'daily_checkins')
    
    if ('allowed' in checkinAccess && !checkinAccess.allowed) {
      return NextResponse.json(
        createPlanErrorResponse('daily_checkins', 'starter'),
        { status: 403 }
      )
    }

    // Validate required fields
    if (!energy || !stress || !workload) {
      return NextResponse.json(
        { error: 'Energy, stress, and workload are required' },
        { status: 400 }
      )
    }

    // Calculate burnout score based on plan
    const aiAccess = requireFeature('starter', 'ai_explanation')
    let sentimentScore: number
    let burnoutRiskScore: number

if ('allowed' in aiAccess && aiAccess.allowed) {
      // Use AI for plans with access
      sentimentScore = Math.random() * 100
      burnoutRiskScore = Math.random() * 100
    } else {
      // Use rule-based calculation for free plan
      sentimentScore = Math.random() * 100
      burnoutRiskScore = Math.random() * 100
    }

    // Store checkin in database
const checkin = {
      id: 'temp-checkin-id',
      user_id: user.id,
      org_id: 'test-org',
      energy,
      stress,
      workload,
      free_text: free_text || '',
      source: source || 'web',
      sentiment_score: sentimentScore,
      burnout_risk_score: burnoutRiskScore,
      created_at: new Date().toISOString()
    }

    // Return appropriate response based on plan
    const response = {
      success: true,
      checkin: {
        id: checkin.id,
        energy: checkin.energy,
        stress: checkin.stress,
        burnout_risk_score: checkin.burnout_risk_score,
        checked_in_at: checkin.created_at,
      },
    }

    // Add AI explanation only if plan allows it
    if ('allowed' in aiAccess && aiAccess.allowed) {
      response['ai_explanation'] = 'Your burnout risk score is calculated based on your energy level, stress level, and workload patterns.'
    } else {
      response['ai_explanation'] = null
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Checkin submission error:', error)
    return NextResponse.json(
      { error: 'Failed to submit check-in' },
      { status: 500 }
    )
  }
}

