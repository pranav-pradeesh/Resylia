import type { WebClient } from '@slack/web-api'
import { adminDb, hasCheckedInToday, aggregateForManager, MINIMUM_COHORT_SIZE } from '@resylia/db'
import { buildCheckinBlocks } from './checkin'

/**
 * Called every hour by the cron job.
 * Sends check-in DMs to users whose local time is currently 09:00–09:59.
 */
export async function sendDailyPrompts(client: WebClient): Promise<void> {
  const now = new Date()
  const currentHour = now.getUTCHours()

  // Fetch all active Slack-connected users with their timezone offset
  const { data: users } = await adminDb
    .from('users')
    .select('id, slack_user_id, slack_tz_offset, org_id')
    .eq('is_active', true)
    .not('slack_user_id', 'is', null)

  if (!users?.length) return

  const results = await Promise.allSettled(
    users.map(async (user: { id: string; slack_user_id: string; slack_tz_offset: number | null; org_id: string }) => {
      // Convert UTC hour to user's local hour
      const tzOffset = user.slack_tz_offset ?? 0  // offset in seconds
      const localHour = ((currentHour + Math.round(tzOffset / 3600)) + 24) % 24

      if (localHour !== 9) return // not their 9 AM

      // Skip if already checked in
      if (await hasCheckedInToday(user.id)) return

      // Send the first check-in question (energy)
      await client.chat.postMessage({
        channel: user.slack_user_id,
        text: 'Good morning! Time for your daily check-in.',
        blocks: buildCheckinBlocks('energy'),
      })
    })
  )

  const errors = results.filter((r) => r.status === 'rejected')
  if (errors.length) {
    console.error(`[scheduler] ${errors.length} prompt send failures`)
  }
}

/**
 * Sends weekly team summary to managers (Monday 09:00 their local time).
 */
export async function sendWeeklyManagerDigest(client: WebClient): Promise<void> {
  const now = new Date()
  if (now.getDay() !== 1) return // only Mondays

  const { data: managers } = await adminDb
    .from('users')
    .select('id, slack_user_id, org_id, slack_tz_offset')
    .in('role', ['manager', 'hr', 'admin'])
    .eq('is_active', true)
    .not('slack_user_id', 'is', null)

  if (!managers?.length) return

  for (const manager of managers) {
    try {
      const tzOffset = manager.slack_tz_offset ?? 0
      const localHour = ((now.getUTCHours() + Math.round(tzOffset / 3600)) + 24) % 24
      if (localHour !== 9) continue

      // Get team check-ins from the past 7 days
      const since = new Date(Date.now() - 7 * 86_400_000).toISOString()
      const { data: checkins } = await adminDb
        .from('checkins')
        .select('user_id, stress, energy, workload, burnout_risk_score, checked_in_at')
        .eq('org_id', manager.org_id)
        .in('user_id',
          adminDb.from('users').select('id').eq('manager_id', manager.id)
        )
        .gte('checked_in_at', since)

      if (!checkins?.length) continue

      const agg = aggregateForManager(checkins, 999)
      if (agg.insufficient_data) continue

      await client.chat.postMessage({
        channel: manager.slack_user_id,
        text: 'Your weekly team burnout summary',
        blocks: [
          {
            type: 'header',
            text: { type: 'plain_text', text: '📊 Weekly Team Summary', emoji: true },
          },
          {
            type: 'section',
            fields: [
              { type: 'mrkdwn', text: `*Avg Stress:*\n${agg.avg_stress}/5` },
              { type: 'mrkdwn', text: `*Avg Energy:*\n${agg.avg_energy}/5` },
              { type: 'mrkdwn', text: `*Avg Workload:*\n${agg.avg_workload}/5` },
              { type: 'mrkdwn', text: `*High Risk Members:*\n${agg.high_risk_count}` },
            ],
          },
          {
            type: 'actions',
            elements: [{
              type: 'button',
              text: { type: 'plain_text', text: 'View full dashboard →' },
              url: 'https://app.resylia.com/manager/dashboard',
              action_id: 'open_manager_dashboard',
            }],
          },
        ],
      })
    } catch (err) {
      console.error(`[weekly-digest] error for manager ${manager.id}:`, err)
    }
  }
}
