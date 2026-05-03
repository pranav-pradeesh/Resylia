import { getAdminDb } from '@resylia/db'



async function sendSlackNudge(orgId: string, nudges: any[]): Promise<void> {
  try {
    const { data: org, error } = await getAdminDb()
      .from('organizations')
      .select('slack_bot_token, manager_slack_channel_id')
      .eq('id', orgId)
      .single<{ [key: string]: any }>()

    if (error || !org || !org.slack_bot_token) {
      console.log('Slack bot not configured for org:', orgId)
      return
    }

    // Send high-priority nudges to manager's Slack channel
    const highPriorityNudges = nudges.filter(n => n.priority === 'high')
    
    if (highPriorityNudges.length > 0) {
      // Group similar nudges
      const groupedByIssueType = groupNudgesByIssueType(highPriorityNudges)
      
      for (const [issue, nudgesGroup] of Object.entries(groupedByIssueType)) {
        const message = createSlackMessage(nudgesGroup as any[])
        
        const response = await fetch('https://slack.com/api/chat.postMessage', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${org.slack_bot_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            channel: org.manager_slack_channel_id,
            text: `🚨 *${issue}*`
          })
        })

        if (!response.ok) {
          console.error('Failed to send Slack notification:', await response.text())
        }
      }
    }
    
    console.log(`Sent ${highPriorityNudges.length} Slack notifications to managers in org ${orgId}`)

  } catch (error) {
      console.error('Failed to send Slack nudges:', error)
    throw error
  }
}

function createSlackMessage(nudges: any[]): string {
  if (nudges.length === 0) {
    return ''
  }

  const issueTypes = nudges.reduce((acc, n) => {
      const issue = n.issue_type || 'general'
      if (!acc[issue]) acc[issue] = []
      acc[issue].push(n)
      return acc
    }, {} as { [key: string]: any[] })

  const issueType = Object.keys(issueTypes)[0] // Take the most common issue type
  const groupedNudges = issueTypes[issueType]

  const names = groupedNudges.map(n => n.employee_name).join(', ')
  const descriptions = groupedNudges.map(n => n.issue_description).join('; ')

  return `🚨 Manager Alert: ${names}\n\nIssues:\n• ${descriptions}\n\nRecommended Actions:\n${groupedNudges.map(n => n.action).join('\n- ')}\n\nPlease check in with these team members today and take preventive action.`
}

function groupNudgesByIssueType(nudges: any[]): { [key: string]: any } {
  const grouped: { [key: string]: any } = {}
  
  for (const n of nudges) {
    const issue = n.issue_type || 'general'
    if (!grouped[issue]) grouped[issue] = []
    grouped[issue].push(n)
  }
  
  return grouped
}

export async function sendSlackMessage({ channel, blocks }: { channel: string; blocks: any[] }) {
  try {
    // Get the first org's Slack token for now (in production, you'd need org context)
    const { data: org, error: orgError } = await getAdminDb()
      .from('organizations')
      .select('slack_bot_token')
      .limit(1)
      .single<{ [key: string]: any }>()

    if (orgError || !org || !org.slack_bot_token) {
      console.log('Slack bot not configured')
      return
    }

    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${org.slack_bot_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channel,
        blocks,
      }),
    })

    if (!response.ok) {
      console.error('Failed to send Slack message:', await response.text())
    }
  } catch (error) {
    console.error('Error sending Slack message:', error)
  }
}

export async function sendEscalationAlert(channel: string, alert: any) {
  try {
    // Get the first org's Slack token for now (in production, you'd need org context)
    const { data: org, error: orgError } = await getAdminDb()
      .from('organizations')
      .select('slack_bot_token')
      .limit(1)
      .single<{ [key: string]: any }>()

    if (orgError || !org || !org.slack_bot_token) {
      console.log('Slack bot not configured for escalation')
      return
    }

    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${org.slack_bot_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channel,
        text: `🚨 Escalation Alert: ${alert.severity} in ${alert.department}`,
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: `🚨 ${alert.severity.toUpperCase()} Escalation Alert`,
            },
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*Department:*\n${alert.department}`,
              },
              {
                type: 'mrkdwn',
                text: `*Severity:*\n${alert.severity}`,
              },
            ],
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Issue:*\n${alert.issue}`,
            },
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `Timestamp: ${alert.timestamp}`,
              },
            ],
          },
        ],
      }),
    })

    if (!response.ok) {
      console.error('Failed to send escalation alert:', await response.text())
    }
  } catch (error) {
    console.error('Error sending escalation alert:', error)
  }
}

