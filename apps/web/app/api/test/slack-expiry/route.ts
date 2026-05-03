import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@resylia/db'

export async function POST(request: NextRequest) {
  try {
    const { expired_token, workspace_id } = await request.json()
    
    // Test Slack API call with expired token
    const testResponse = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${expired_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channel: 'test-channel',
        text: 'Test message with expired token'
      })
    })

    const testResponseData = await testResponse.json()
    
    if (!testResponseData.ok || testResponseData.error === 'token_expired' || testResponseData.error === 'invalid_auth') {
      console.log('Slack token expired, updating organization status')
      
      // Update organization to mark bot as disconnected when token expires
      if (testResponseData.error === 'token_expired') {
        await getAdminDb()
          .from('organizations')
          .update({
            slack_bot_connected: false,
            slack_bot_token: null, // Clear invalid token
          })
          .eq('slack_workspace_id', workspace_id)
          
        return NextResponse.json({
          success: true,
          fell_back_to_email: true,
          token_status: 'expired_and_cleared'
        })
      }
    }
    
    return NextResponse.json({
      success: false,
      token_status: testResponseData.error || 'unknown_error',
    })
    
  } catch (error) {
    console.error('Slack token expiry test error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    })
  }
}

