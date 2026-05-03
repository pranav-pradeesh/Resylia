import { NextRequest, NextResponse } from 'next/server'

// Slack OAuth for initial login (minimal scopes only)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const clientId = process.env.SLACK_CLIENT_ID
  const redirectUri = process.env.SLACK_REDIRECT_URI
  
  if (!clientId || !redirectUri) {
    return NextResponse.json({ error: 'Slack OAuth not configured' }, { status: 500 })
  }

  // Minimal scopes for initial login only
  const scopes = [
    'identity.basic',
    'identity.email', 
    'openid'
  ].join(',')

  const authUrl = `https://slack.com/oauth/v2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scopes}&state=${generateState()}`

  return NextResponse.redirect(authUrl)
}

function generateState(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}