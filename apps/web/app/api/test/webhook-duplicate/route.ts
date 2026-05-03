import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@resylia/db'

// Store processed webhook IDs to prevent duplicates
const processedWebhooks = new Map<string, { timestamp: number; attempts: number }>()

export async function POST(request: NextRequest) {
  try {
    const { attempt, idempotency_key, event, id } = await request.json()
    
    if (!idempotency_key) {
      return NextResponse.json({ 
        error: 'Missing idempotency_key' 
      }, { status: 400 })
    }
    
    // Check if this webhook was already processed
    const existing = processedWebhooks.get(idempotency_key)
    
    if (existing) {
      const timeSinceLastProcessed = Date.now() - existing.timestamp
      
      // If processed within last hour, skip processing
      if (timeSinceLastProcessed < 3600000) { // 1 hour
        return NextResponse.json({
          success: false,
          message: 'Webhook already processed',
          idempotency_key
        })
      }
      
      // Clear old entry and allow reprocessing
      processedWebhooks.delete(idempotency_key)
    }
    
    // Mark as processed
    processedWebhooks.set(idempotency_key, {
      timestamp: Date.now(),
      attempts: attempt || 1
    })
    
    // Simulate processing
    const results = []
    
    if (attempt === 1) {
      // First attempt - process normally
      results.push({
        attempt: 1,
        action: 'Processed subscription update'
      })
    } else {
      // Second attempt - skip since already processed
      results.push({
        attempt: 2,
        action: 'Skipped - webhook already processed'
      })
    }
    
    return NextResponse.json({
      success: attempt === 1,
      processed: attempt === 1,
      idempotency_key,
      results
    })
    
  } catch (error) {
    console.error('Webhook duplication test error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    })
  }
}

// Clean up old entries periodically (call from cron job)
async function cleanup() {
  const now = Date.now()
  const oneHourAgo = now - 3600000
  
  for (const [key, value] of processedWebhooks.entries()) {
    if (value.timestamp < oneHourAgo) {
      processedWebhooks.delete(key)
    }
  }
}