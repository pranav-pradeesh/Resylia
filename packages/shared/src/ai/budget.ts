import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()

const DAILY_LIMITS: Record<string, number> = {
  starter: 100,
  growth: 500,
  enterprise: 2000,
}

/**
 * Per-org daily Claude API call budget cap.
 * Uses Upstash Redis atomic INCR — safe for concurrent serverless invocations.
 * Throws TooManyRequestsError when the org has exhausted their daily limit.
 */
export async function checkAIBudget(orgId: string, plan: string): Promise<void> {
  const today = new Date().toISOString().split('T')[0]
  const key = `ai_budget:${orgId}:${today}`

  // Atomic increment — returns new count
  const count = await redis.incr(key)

  // Set TTL on first call so the key expires after 24h
  if (count === 1) {
    await redis.expire(key, 86400)
  }

  const limit = DAILY_LIMITS[plan] ?? 100

  if (count > limit) {
    throw new TooManyRequestsError(
      `Daily AI usage limit reached for your plan (${limit} calls/day). Resets at midnight UTC.`
    )
  }
}

/**
 * Decrement the budget counter (use on API errors to avoid charging failed calls).
 */
export async function refundAIBudget(orgId: string): Promise<void> {
  const today = new Date().toISOString().split('T')[0]
  const key = `ai_budget:${orgId}:${today}`
  await redis.decr(key)
}

export class TooManyRequestsError extends Error {
  readonly statusCode = 429
  constructor(message: string) {
    super(message)
    this.name = 'TooManyRequestsError'
  }
}
