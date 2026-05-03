import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@resylia/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    
    if (!code) {
      return NextResponse.json({ error: 'Authorization code required' }, { status: 400 })
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.SLACK_CLIENT_ID!,
        client_secret: process.env.SLACK_CLIENT_SECRET!,
        code,
        redirect_uri: process.env.SLACK_BOT_REDIRECT_URI!,
      }),
    })

    const tokenData = await tokenResponse.json()
    
    if (!tokenData.ok) {
      return NextResponse.json({ error: 'Slack OAuth failed' }, { status: 400 })
    }

    // Get current user's organization
    const { data: user } = await getAdminDb()
      .from('users')
      .select('org_id, slack_user_id')
      .eq('id', tokenData.authed_user?.id)
      .single<{ [key: string]: any }>()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Update organization with Slack bot info
    const { error: updateError } = await getAdminDb()
      .from('organizations')
      .update({
        slack_bot_token: tokenData.bot_token,
        slack_workspace_id: tokenData.team.id,
        slack_bot_connected: true,
      })
      .eq('id', user.org_id)

    if (updateError) {
      console.error('Failed to update organization:', updateError)
      return NextResponse.json({ error: 'Failed to save Slack connection' }, { status: 500 })
    }

    // Send test message to the user
    try {
      await sendTestMessage(tokenData.bot_token!, tokenData.authed_user!.id)
    } catch (error) {
      console.error('Failed to send test message:', error)
      // Don't fail the whole process if test message fails
    }

    // Redirect to onboarding with success
    return NextResponse.redirect('/onboarding?slack_connected=true')
    
  } catch (error) {
    console.error('Slack bot callback error:', error)
    return NextResponse.redirect('/onboarding?slack_error=true')
  }
}

async function sendTestMessage(botToken: string, userId: string): Promise<void> {
  const message = {
    channel: userId,
    text: "👋 Resylia is connected! Your team will receive their first check-in tomorrow morning."
  }

  const response = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${botToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  })

  if (!response.ok) {
    throw new Error(`Failed to send test message: ${response.statusText}`)
  }
}



