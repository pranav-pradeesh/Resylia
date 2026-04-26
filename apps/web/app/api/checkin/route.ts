import { NextResponse } from 'next/server'
import { withAuth } from '@resylia/shared/src/auth/middleware'
import { rateLimiters } from '@resylia/shared/src/rate-limit'
import { CheckinSchema } from '@resylia/shared/src/validation'
import { sanitizeUserInput } from '@resylia/shared/src/ai/sanitize'
import { checkAIBudget } from '@resylia/shared/src/ai/budget'
import { insertCheckin, hasCheckedInToday, getUserStreak } from '@resylia/db/src/checkins'
import { getOrgById } from '@resylia/db/src/users'
import { analyzeSentiment } from '@resylia/ai/src/sentiment'

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') ?? '127.0.0.1'
  const { success: rlOk } = await rateLimiters.checkin.limit(ip)
  if (!rlOk) {
    return NextResponse.json({ error: 'Too many check-ins today' }, { status: 429 })
  }

  return withAuth(req, async (userId, orgId) => {
    // Already checked in today?
    if (await hasCheckedInToday(userId)) {
      return NextResponse.json(
        { error: 'Already checked in today. Come back tomorrow!' },
        { status: 409 }
      )
    }

    const body = await req.json().catch(() => null)
    if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

    const result = CheckinSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: result.error.format() }, { status: 400 })
    }

    const { energy, stress, workload, free_text, source } = result.data

    // Sentiment analysis on free text (if provided)
    let sentimentScore = 0
    if (free_text) {
      const { safe, sanitized } = sanitizeUserInput(free_text, { userId, ip })
      if (safe && sanitized) {
        try {
          const org = await getOrgById(orgId)
          await checkAIBudget(orgId, org?.plan ?? 'starter')
          const sentiment = await analyzeSentiment(sanitized, { orgId, userId })
          sentimentScore = sentiment.score
        } catch {
          // Budget exceeded or API error — proceed without sentiment
          sentimentScore = 0
        }
      }
    }

    // Rule-based burnout risk score (Phase 1)
    // Higher stress + higher workload + lower energy = higher risk
    const riskScore = Math.min(
      1,
      Math.max(
        0,
        ((stress - 1) / 4) * 0.4 +
          ((workload - 1) / 4) * 0.3 +
          ((5 - energy - 1) / 4) * 0.3 +
          (sentimentScore < -0.5 ? 0.1 : 0)
      )
    )

    // Call prediction microservice if available
    let finalRiskScore = riskScore
    const predictionUrl = process.env.PREDICTION_SERVICE_URL
    if (predictionUrl) {
      try {
        const pred = await fetch(`${predictionUrl}/predict`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Internal-Secret': process.env.PREDICTION_SERVICE_SECRET ?? '',
          },
          body: JSON.stringify({ user_id: userId, energy, stress, workload, sentiment_score: sentimentScore }),
        })
        if (pred.ok) {
          const { risk_score } = await pred.json()
          finalRiskScore = risk_score
        }
      } catch {
        // Prediction service down — use rule-based score
      }
    }

    const checkin = await insertCheckin(userId, orgId, result.data, sentimentScore, finalRiskScore)
    const streak = await getUserStreak(userId)

    // Strip sensitive fields from response
    return NextResponse.json({
      id: checkin.id,
      streak,
      risk_level: finalRiskScore > 0.7 ? 'high' : finalRiskScore > 0.4 ? 'medium' : 'low',
      checked_in_at: checkin.checked_in_at,
    })
  }, 'checkin:write')
}
