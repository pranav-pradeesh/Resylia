import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '../../../auth'
import { getAdminDb, insertCheckin } from '@resylia/db'
import { sendSlackMessage } from '../../../../lib/slack/notify'
import { ROLES, PERMISSIONS } from '@resylia/shared'

interface SlackCheckinPayload {
  user_id: string
  channel_id: string
  responses: {
    energy: number
    stress: number
    workload: number
    mood: string
  }
  timestamp: string
}

// Handle Slack interactive check-in submissions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, channel_id, responses, timestamp } = body as SlackCheckinPayload

    // Extract org from Slack webhook (in real implementation)
    const orgId = request.headers.get('x-slack-org-id') || 'default-org'

    // Get user profile from Slack user ID
    const { data: user } = await getAdminDb()
      .from('users')
      .select('*')
      .eq('slack_user_id', user_id)
      .eq('org_id', orgId)
      .single<{ [key: string]: any }>()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Calculate AI scores
    const sentimentScore = calculateSentimentScore(responses.energy, responses.stress, responses.mood)
    const burnoutRiskScore = calculateBurnoutRiskScore(responses.energy, responses.stress)

    // Store check-in
    const checkin = await insertCheckin(
      user.id,
      orgId,
      {
        energy: responses.energy,
        stress: responses.stress,
        workload: responses.workload,
        free_text: '',
        source: 'slack',
      },
      sentimentScore,
      burnoutRiskScore
    )

    // Send confirmation and next step
    await sendSlackMessage({
      channel: channel_id,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `✅ *Check-in recorded! Your wellness score is ${Math.round(sentimentScore * 100)}%*\n\nThanks for checking in! Based on your responses, here's what we recommend:`,
          },
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: { type: 'plain_text', text: 'View Full Dashboard' },
              url: `${process.env.NEXT_PUBLIC_BASE_URL}/employee/dashboard`,
              style: 'primary',
            },
            {
              type: 'button',
              text: { type: 'plain_text', text: 'Schedule Break' },
              url: `${process.env.NEXT_PUBLIC_BASE_URL}/employee/focus`,
              style: 'danger',
            },
          ],
        },
      ],
    })

    return NextResponse.json({ success: true, checkin_id: checkin.id })
  } catch (error) {
    console.error('Slack check-in error:', error)
    return NextResponse.json({ error: 'Failed to process check-in' }, { status: 500 })
  }
}

