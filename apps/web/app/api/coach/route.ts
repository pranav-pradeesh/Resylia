import { NextResponse } from 'next/server'
import { withAuth } from '@resylia/shared'
import { rateLimiters } from '@resylia/shared/src/rate-limit'
import { checkAIBudget, TooManyRequestsError } from '@resylia/shared/src/ai/budget'
import { getRecentCheckins } from '@resylia/db/src/checkins'
import { getOrgById } from '@resylia/db/src/users'
import { getDailySuggestion } from '@resylia/ai/src/coach'

export async function POST(req: Request) {
  return withAuth(req, async (userId, orgId) => {
    const { success } = await rateLimiters.ai.limit(userId)
    if (!success) {
      return NextResponse.json({ error: 'Too many AI requests. Try again later.' }, { status: 429 })
    }

    try {
      const org = await getOrgById(orgId)
      await checkAIBudget(orgId, org?.plan ?? 'starter')
    } catch (err) {
      if (err instanceof TooManyRequestsError) {
        return NextResponse.json({ error: err.message }, { status: 429 })
      }
      throw err
    }

    const checkins = await getRecentCheckins(userId, 14)
    const suggestion = await getDailySuggestion(checkins, { orgId })

    return NextResponse.json(suggestion)
  }, 'checkin:read:own')
}
