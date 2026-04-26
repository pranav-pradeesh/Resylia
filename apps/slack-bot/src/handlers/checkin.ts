import type { SlackActionMiddlewareArgs, BlockAction, BlockElementAction, App } from '@slack/bolt'
import { adminDb } from '@resylia/db'
import { sanitizeUserInput } from '@resylia/shared/src/ai/sanitize'
import { checkAIBudget } from '@resylia/shared/src/ai/budget'
import { analyzeSentiment } from '@resylia/ai'
import { getDailySuggestion } from '@resylia/ai'
import { insertCheckin, getRecentCheckins, getUserStreak } from '@resylia/db'
import { getOrgById } from '@resylia/db'

interface PendingCheckin {
  energy?: number
  stress?: number
  workload?: number
  free_text?: string
  step: 'energy' | 'stress' | 'workload' | 'freetext'
  started_at: string
  org_id: string
}

const pendingCheckins = new Map<string, PendingCheckin>()

export function setPendingCheckin(
  userId: string,
  step: 'energy' | 'stress' | 'workload' | 'freetext',
  orgId: string
) {
  pendingCheckins.set(userId, {
    step,
    org_id: orgId,
    started_at: new Date().toISOString(),
  })
}

export function setPendingValue(userId: string, key: 'energy' | 'stress' | 'workload', value: number) {
  const p = pendingCheckins.get(userId)
  if (p) {
    p[key] = value
  }
}

export function setPendingFreeText(userId: string, freeText: string) {
  const p = pendingCheckins.get(userId)
  if (p) {
    p.free_text = freeText
  }
}

export async function handleCheckinAction({
  body,
  ack,
  client,
  context,
}: SlackActionMiddlewareArgs<BlockElementAction> & { context: any; client: any }) {
  await ack()

  const userId = context.userId as string
  const action = body.actions?.[0] as any

  if (!userId || !action) return

  const selected = action.selected_option?.value?.split('-')
  if (!selected) return

  const [metric, value] = selected as [string, string]
  const num = parseInt(value, 10)

  const pending = pendingCheckins.get(userId)
  if (!pending) return

  if (pending.step === metric) {
    ;(pending as any)[metric] = num
    pending.step = metric === 'workload' ? 'freetext' : (metric as any)
  }

  if (pending.step === 'freetext') {
    const org = await getOrgById(pending.org_id)
    if (!org) return

    const sentimentData = pending.free_text
      ? await analyzeSentiment(pending.free_text, { userId })
      : { score: 0, themes: [], urgency: 'low' as const }

    const recentCheckins = await getRecentCheckins(userId, 14)
    const burnout =
      recentCheckins.length >= 3
        ? recentCheckins.slice(0, 3).reduce((a, c) => a + (c.burnout_risk_score ?? 0), 0) / 3
        : 0

    await insertCheckin(userId, pending.org_id, {
      energy: pending.energy!,
      stress: pending.stress!,
      workload: pending.workload!,
      free_text: pending.free_text,
      source: 'slack',
    }, sentimentData.score, burnout)

    pendingCheckins.delete(userId)

    const suggestion = await getDailySuggestion([], { orgId: pending.org_id })

    await client.chat.postMessage({
      channel: userId,
      text: 'Check-in complete!',
      blocks: [
        { type: 'section', text: { type: 'mrkdwn', text: '*Check-in complete! *' } },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Energy:* ${pending.energy}/5\n*Stress:* ${pending.stress}/5\n*Workload:* ${pending.workload}/5`,
          },
        },
        { type: 'section', text: { type: 'mrkdwn', text: `*Coach suggestion:* ${suggestion.suggestion}` } },
      ],
    })
  }
}

export function buildCheckinBlocks(metric: string): any[] {
  const questions: Record<string, any> = {
    energy: { text: 'How is your *energy* today?', low: 'Exhausted', high: 'Energised' },
    stress: { text: 'How *stressed* are you?', low: 'Calm', high: 'Overwhelmed' },
    workload: { text: 'How is your *workload*?', low: 'Light', high: 'Crushing' },
  }

  const q = questions[metric]
  if (!q) return []

  return [
    { type: 'section', text: { type: 'mrkdwn', text: `*Resylia daily check-in* \n${q.text}` } },
    {
      type: 'actions',
      block_id: `${metric}_select`,
      action_id: 'checkin_value',
      elements: [
        {
          type: 'radio_buttons',
          action_id: `checkin_${metric}`,
          options: [
            { value: `${metric}-1`, text: { type: 'plain_text', text: '1 - Very Low' } },
            { value: `${metric}-2`, text: { type: 'plain_text', text: '2 - Low' } },
            { value: `${metric}-3`, text: { type: 'plain_text', text: '3 - Moderate' } },
            { value: `${metric}-4`, text: { type: 'plain_text', text: '4 - High' } },
            { value: `${metric}-5`, text: { type: 'plain_text', text: '5 - Very High' } },
          ],
        },
      ],
    },
  ]
}