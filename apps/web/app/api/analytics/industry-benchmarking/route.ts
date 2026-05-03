import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '../../../auth'
import { requireFeature, createPlanErrorResponse } from '@resylia/shared'
import { getAdminDb } from '@resylia/db'
import { IndustryBenchmark } from '@resylia/shared'

export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('org-id') as string

    // Check if organization has access to benchmarking
    const planAccess = requireFeature('pro', 'benchmarking')
    
    if ('allowed' in planAccess && !planAccess.allowed) {
      return NextResponse.json(
        createPlanErrorResponse('benchmarking', 'pro'),
        { status: 403 }
      )
    }

    console.log('Benchmarking API called for org:', orgId)
    
    return NextResponse.json({
      success: true,
      message: 'Industry benchmarking feature is now available'
    })
    
  } catch (error) {
    console.error('Industry benchmarking error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch benchmarking data' },
      { status: 500 }
    )
  }
}