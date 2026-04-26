import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { logSecurityEvent } from '@resylia/shared/src/audit'
import { adminDb } from '@resylia/db/src/client'

function verifySlackSignature(
  body: string,
  timestamp: string,
  signature: string
): boolean {
  const secret = process.env.SLACK_SIGNING_SECRET
  if (!secret) return false

  const age = Math.abs(Date.now() / 1000 - parseInt(timestamp))
  if (age > 300) return false // reject if older than 5 minutes (replay protection)

  const baseString = `v0:${timestamp}:${body}`
  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(baseString)
  const expected = `v0=${hmac.digest('hex')}`

  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
}

export async function POST(req: Request) {
  const ip        = req.headers.get('x-forwarded-for') ?? 'unknown'
  const body      = await req.text()
  const timestamp = req.headers.get('x-slack-request-timestamp') ?? ''
  const signature = req.headers.get('x-slack-signature') ?? ''

  if (!verifySlackSignature(body, timestamp, signature)) {
    await logSecurityEvent('invalid_slack_webhook', { reason: 'bad_signature' }, { ip })
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const payload = JSON.parse(body)

  // URL verification challenge (initial Slack setup)
  if (payload.type === 'url_verification') {
    return NextResponse.json({ challenge: payload.challenge })
  }

  // Process interactive actions from block kit (check-in responses)
  if (payload.type === 'block_actions') {
    const action = payload.actions?.[0]
    const userId = payload.user?.id

    if (action && userId) {
      // Look up the Resylia user by Slack user ID
      const { data: user } = await adminDb
        .from('users')
        .select('id, org_id')
        .eq('slack_user_id', userId)
        .single()

      if (user) {
        // Queue the check-in update (actual processing in Slack bot via Bolt)
        const q = (adminDb as any).from('slack_action_queue')
        await q.insert({
          slack_user_id: userId,
          resylia_user_id: user.id,
          org_id: user.org_id,
          action_id: action.action_id,
          value: action.value,
          created_at: new Date().toISOString(),
        })
      }
    }
  }

  return NextResponse.json({ ok: true })
}
