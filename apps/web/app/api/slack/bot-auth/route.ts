import { NextRequest, NextResponse } from 'next/server'

// Slack OAuth for bot access (separate from login)
export async function GET(request: NextRequest) {
  const clientId = process.env.SLACK_CLIENT_ID
  const redirectUri = process.env.SLACK_BOT_REDIRECT_URI
  
  if (!clientId || !redirectUri) {
    return NextResponse.json({ error: 'Slack OAuth not configured' }, { status: 500 })
  }

  // Bot scopes for full functionality
  const botScopes = [
    'chat:write',
    'im:write',
    'im:read',
    'users:read',
    'users:read.email',
    'channels:read',
    'commands'
  ].join(',')

  const authUrl = `https://slack.com/oauth/v2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${botScopes}&state=${generateState()}`

  return NextResponse.json({ auth_url: authUrl })
}

function generateState(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}