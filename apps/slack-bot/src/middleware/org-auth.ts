import type { Middleware, SlackEventMiddlewareArgs, AnyMiddlewareArgs } from '@slack/bolt'
import { adminDb } from '@resylia/db'

/**
 * Middleware: verify the Slack workspace belongs to a registered Resylia org.
 * Silently drops events from unrecognized workspaces.
 */
export const verifyOrgByTeamId: Middleware<AnyMiddlewareArgs> = async ({ context, next }) => {
  const teamId = context.teamId
  if (!teamId) return // no team context — skip

  const { data: org } = await adminDb
    .from('organizations')
    .select('id, plan, seat_count')
    .eq('slack_team_id', teamId)
    .single()

  if (!org) {
    console.warn(`[slack] Dropping event from unregistered team: ${teamId}`)
    return // do not call next() — silently ignore
  }

  context.orgId = org.id
  context.orgPlan = org.plan
  await next()
}

export interface ResyliaSlackUser {
  id: string
  org_id: string
  streak: number
}

export async function getUserBySlackId(slackUserId: string): Promise<ResyliaSlackUser | null> {
  const { data } = await adminDb
    .from('users')
    .select('id, org_id')
    .eq('slack_user_id', slackUserId)
    .eq('is_active', true)
    .single()
  if (!data) return null

  // Get streak
  const { getUserStreak } = await import('@resylia/db')
  const streak = await getUserStreak(data.id)
  return { ...data, streak }
}

export async function upsertSlackUser(opts: {
  slackUserId: string
  orgId: string
  email?: string
}): Promise<void> {
  // Find or create the Resylia user record for this Slack user
  const { data: existing } = await adminDb
    .from('users')
    .select('id')
    .eq('slack_user_id', opts.slackUserId)
    .single()

  if (!existing) {
    await adminDb.from('users').insert({
      org_id: opts.orgId,
      role: 'employee',
      slack_user_id: opts.slackUserId,
      is_active: true,
    })
  }
}
