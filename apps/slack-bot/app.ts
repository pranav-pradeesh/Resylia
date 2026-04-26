/**
 * Resylia Slack Bot
 * Built with @slack/bolt
 * Deployed on Railway (always-on Node.js)
 *
 * Flow:
 *   09:00 AM user-local-time → DM check-in prompt (3 block-kit buttons per metric)
 *   User taps buttons → bot records check-in via Resylia API
 *   Bot replies with AI coach suggestion
 *   Weekly → manager receives team summary DM
 */

import { App, LogLevel } from '@slack/bolt'
import cron from 'node-cron'
import { verifyOrgByTeamId, getUserBySlackId, upsertSlackUser } from './src/middleware/org-auth.ts'
import { handleCheckinAction } from './src/handlers/checkin.ts'
import { sendDailyPrompts } from './src/handlers/scheduler.ts'

const app = new App({
  token: process.env.SLACK_BOT_TOKEN!,
  signingSecret: process.env.SLACK_SIGNING_SECRET!,
  // Socket mode for development; use HTTP in production (Railway)
  ...(process.env.SLACK_APP_TOKEN
    ? { socketMode: true, appToken: process.env.SLACK_APP_TOKEN }
    : {}),
  logLevel: process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.ERROR,
})

// ── Org verification middleware ───────────────────────────────────────────────
// Every incoming event: verify this Slack workspace is a registered Resylia org
app.use(verifyOrgByTeamId)

// ── Check-in action handlers ──────────────────────────────────────────────────
// Block-kit button actions from the daily check-in DM
app.action(/^checkin_(energy|stress|workload)_\d$/, handleCheckinAction)

// "Tell me more" free-text submission
app.action('checkin_freetext_submit', async ({ body, ack, client }) => {
  await ack()
  const userId = body.user.id
  const value = (body as any).actions?.[0]?.value ?? ''
  if (value.length > 500) return // silently drop oversized input

  // Store pending free text — will be included on final submission
  const { setPendingFreeText } = await import('./src/handlers/checkin')
  await setPendingFreeText(userId, value)
})

// App home tab — show streak + last 7 days summary
app.event('app_home_opened', async ({ event, client }) => {
  const user = await getUserBySlackId(event.user)
  if (!user) {
    await client.views.publish({
      user_id: event.user,
      view: {
        type: 'home',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '*Welcome to Resylia!* 👋\nYour workspace admin needs to connect your account first.\nVisit <https://app.resylia.com|app.resylia.com> to get started.',
            },
          },
        ],
      },
    })
    return
  }

  await client.views.publish({
    user_id: event.user,
    view: {
      type: 'home',
      blocks: [
        {
          type: 'header',
          text: { type: 'plain_text', text: 'Resylia — Burnout Intelligence', emoji: true },
        },
        {
          type: 'section',
          text: { type: 'mrkdwn', text: `*Streak:* 🔥 ${user.streak ?? 0} days\n\nYour daily check-in keeps your burnout intelligence up to date.` },
        },
        { type: 'divider' },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: { type: 'plain_text', text: 'Open Dashboard', emoji: true },
              url: 'https://app.resylia.com/dashboard',
              action_id: 'open_dashboard',
            },
          ],
        },
      ],
    },
  })
})

// ── Daily check-in scheduler ──────────────────────────────────────────────────
// Runs every hour and sends prompts to users whose local time is ~09:00
// (Actual per-user timezone scheduling handled inside sendDailyPrompts)
cron.schedule('0 * * * *', () => {
  sendDailyPrompts(app.client).catch((err) =>
    console.error('[scheduler] daily prompt error:', err)
  )
})

// ── Start ─────────────────────────────────────────────────────────────────────
;(async () => {
  const port = parseInt(process.env.PORT ?? '3001')
  await app.start(port)
  console.log(`⚡ Resylia Slack bot running on port ${port}`)
})()
