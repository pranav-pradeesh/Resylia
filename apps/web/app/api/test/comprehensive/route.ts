import { NextRequest, NextResponse } from 'next/server'

// Test runner for all comprehensive test cases
export async function GET(request: NextRequest) {
  const testResults = {
    pricing_page: {
      basic: await testPricingPageBasic(),
      seatCalculator: await testSeatCalculator(),
      annualToggle: await testAnnualToggle(),
      mobileLayout: await testMobileLayout(),
      errorHandling: await testPricingErrorHandling(),
    },
    plan_gating: {
      starterBasic: await testStarterBasicFeatures(),
      starterAiBlock: await testStarterAIBlocked(),
      growthAiWorks: await testGrowthAIWorks(),
      proAllFeatures: await testProAllFeatures(),
      api403Response: await testAPI403Response(),
    },
    slack: {
      basicLogin: await testBasicSlackLogin(),
      onboardingFlow: await testOnboardingFlow(),
      skipForNow: await testSkipForNow(),
      botConnection: await testBotConnection(),
      fallbackEmail: await testFallbackEmail(),
    },
    razorpay: {
      trialCreation: await testTrialCreation(),
      trialNoCharge: await testTrialNoCharge(),
      planAssignment: await testPlanAssignment(),
      seatEnforcement: await testSeatEnforcement(),
      webhookUpdate: await testWebhookUpdate(),
      trialExpiry: await testTrialExpiry(),
      failedPayment: await testFailedPayment(),
    },
    locked_ui: {
      lockedStarterAi: await testLockedStarterAI(),
      lockedGrowthBenchmarking: await testLockedGrowthBenchmarking(),
      upgradePrompt: await testUpgradePrompt(),
      silentFailure: await testSilentFailure(),
    },
    edge_cases: {
      zeroEmployees: await testZeroEmployees(),
      slackTokenExpiry: await testSlackTokenExpiry(),
      webhookDuplicate: await testWebhookDuplicate(),
    }
  }

  const summary = generateTestSummary(testResults)
  
  return NextResponse.json({
    success: true,
    summary,
    results: testResults,
  })
}

// Pricing Page Tests
async function testPricingPageBasic() {
  try {
    // Test starter monthly pricing: 10 seats × ₹199 = ₹1,990
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/test/pricing`, {
      method: 'POST',
      body: JSON.stringify({ plan: 'starter', seats: 10, billing: 'monthly' })
    })
    const data = await response.json()
    
    return {
      success: data.price === 1990,
      message: `Expected ₹1990, got ₹${data.price}`,
      data
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

async function testSeatCalculator() {
  try {
    // Test cap enforcement: 16 seats on Starter → capped at ₹3,000
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/test/pricing`, {
      method: 'POST',
      body: JSON.stringify({ 
        plan: 'starter', 
        seats: 16, 
        billing: 'monthly' 
      })
    })
    const data = await response.json()
    
    return {
      success: data.price === 3000 && data.isCapReached === true,
      message: `Expected capped at ₹3,000, got ₹${data.price}`,
      data
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

async function testAnnualToggle() {
  // Test annual pricing shows 20% off
  const monthlyPrice = 199
  const expectedAnnualPrice = Math.round(monthlyPrice * 0.8)
  // Should be 159 for monthly price of 199
  
  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/test/pricing`, {
    method: 'POST',
    body: JSON.stringify({ 
      plan: 'starter', 
      seats: 1, 
      billing: 'annual' 
    })
  })
  const data = await response.json()
  
  return {
    success: data.price === 159,
    message: `Expected ₹159, got ₹${data.price}`,
    data
  }
}

// Plan Gating Tests
async function testStarterBasicFeatures() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/checkin`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer starter-org-token'
      },
      body: JSON.stringify({
        energy: 7,
        stress: 4,
        workload: 6
      })
    })
    
    const data = await response.json()
    
    return {
      success: response.ok && data.checkin && !data.ai_explanation,
      message: 'Starter should get check-in without AI',
      data
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

async function testStarterAIBlocked() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/ai/explain`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer starter-org-token'
      }
    })
    
    const data = await response.json()
    
    return {
      success: response.status === 403 && data.error === 'plan_required',
      message: 'Starter AI should return 403 plan_required',
      data
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// Slack Integration Tests
async function testBasicSlackLogin() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/slack`)
    const data = await response.json()
    
    // Check if URL contains only basic scopes
    const hasBotScopes = data.auth_url?.includes('chat:write') || false
    
    return {
      success: !hasBotScopes,
      message: 'Login should only request basic scopes, not bot scopes',
      data
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

async function testOnboardingFlow() {
  try {
    // Test that onboarding appears after first login
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/onboarding/status`)
    const data = await response.json()
    
    return {
      success: !data.onboarding_completed,
      message: 'Onboarding should show for new users',
      data
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// Razorpay Tests
async function testTrialCreation() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/payment/trial`, {
      method: 'POST',
      body: JSON.stringify({
        plan: 'growth',
        seats: 10,
        billing: 'monthly'
      })
    })
    
    const data = await response.json()
    
    return {
      success: response.ok && data.subscription_id && data.trial_ends_at,
      message: 'Trial should be created with 14-day period',
      data
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// Utility functions
function generateTestSummary(results: any) {
  const allTests = Object.keys(results).flatMap(category => 
    Object.keys(results[category])
  )
  
  const passedTests = Object.values(results).flat()
    .filter((result: any) => result.success === true)
    .length
  
  return {
    total: allTests.length,
    passed: passedTests,
    failed: allTests.length - passedTests,
    pass_rate: Math.round((passedTests / allTests.length) * 100)
  }
}

async function testMobileLayout() {
  try {
    // Test mobile stacking behavior (would need to check viewport)
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/test/mobile-layout`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
      }
    })
    const data = await response.json()
    
    return {
      success: data.isStacked === true,
      message: 'Mobile should stack cards vertically',
      data
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

async function testPricingErrorHandling() {
  try {
    // Test typing 0 seats
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/test/pricing-error`, {
      method: 'POST',
      body: JSON.stringify({ plan: 'starter', seats: 0, billing: 'monthly' })
    })
    const data = await response.json()
    
    return {
      success: data.error?.includes('Minimum 1 seat'),
      message: 'Should show "Minimum 1 seat" error',
      data
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

async function testGrowthAIWorks() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/checkin`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer growth-org-token'
      },
      body: JSON.stringify({
        energy: 7,
        stress: 4,
        workload: 6
      })
    })
    const data = await response.json()
    
    return {
      success: response.ok && data.ai_explanation !== null,
      message: 'Growth plan should get AI explanations',
      data
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

async function testProAllFeatures() {
  try {
    const planFeatures = ['ai_explanation', 'manager_nudges', 'prediction_days', 'anonymous_escalation', 'benchmarking']
    const results = []
    
    for (const feature of planFeatures) {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/features/${feature}`, {
        headers: {
          'Authorization': 'Bearer pro-org-token'
        }
      })
      
      results.push({
        feature,
        accessible: response.ok,
        status: response.status
      })
    }
    
    const allAccessible = results.every(r => r.accessible)
    
    return {
      success: allAccessible,
      message: 'Pro plan should have access to all features',
      data: results
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

async function testAPI403Response() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/ai/explain`, {
      headers: {
        'Authorization': 'Bearer starter-org-token'
      }
    })
    const data = await response.json()
    
    return {
      success: response.status === 403 && data.error === 'plan_required',
      message: 'Should return 403 with plan_required error',
      data
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

async function testSkipForNow() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/onboarding/complete`, {
      method: 'POST',
      body: JSON.stringify({
        skip_slack: true
      })
    })
    const data = await response.json()
    
    return {
      success: response.ok && data.success === true,
      message: 'Skip for now should complete onboarding',
      data
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

async function testBotConnection() {
  try {
    // Test successful bot connection
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/test/slack-bot-success`)
    const data = await response.json()
    
    return {
      success: data.slack_bot_connected === true,
      message: 'Bot connection should update organization',
      data
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

async function testFallbackEmail() {
  try {
    // Test email fallback when Slack not connected
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/checkin/email`, {
      method: 'POST',
      body: JSON.stringify({
        energy: 7,
        stress: 4,
        workload: 6
      })
    })
    const data = await response.json()
    
    return {
      success: response.ok && data.delivered_via === 'email',
      message: 'Should fallback to email when no Slack',
      data
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

async function testSeatEnforcement() {
  try {
    // Test seat limit enforcement
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/employees/add`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer starter-org-token' // Starter has 15 seat limit
      },
      body: JSON.stringify({
        email: 'test16@example.com' // 16th employee
      })
    })
    const data = await response.json()
    
    return {
      success: response.status === 400 && data.error?.includes('seat limit'),
      message: 'Should block adding employees beyond seat limit',
      data
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

async function testWebhookUpdate() {
  try {
    // Test webhook processing and database update
    const webhookPayload = {
      event: 'subscription.activated',
      payload: {
        subscription: {
          id: 'test_sub_id',
          current_end: Date.now() / 1000 + 86400
        }
      }
    }
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/webhooks/test`, {
      method: 'POST',
      body: JSON.stringify(webhookPayload)
    })
    const data = await response.json()
    
    return {
      success: response.ok && data.processed === true,
      message: 'Webhook should update database correctly',
      data
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

async function testTrialExpiry() {
  try {
    // Test trial expiry notification and downgrade
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/test/trial-expiry`)
    const data = await response.json()
    
    return {
      success: data.email_sent && data.downgrade_scheduled,
      message: 'Should send expiry emails and schedule downgrade',
      data
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

async function testFailedPayment() {
  try {
    // Test failed payment handling
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/test/payment-fail`)
    const data = await response.json()
    
    return {
      success: response.ok && data.grace_period_started,
      message: 'Should start 7-day grace period before downgrade',
      data
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

async function testLockedStarterAI() {
  try {
    // Test locked feature UI for starter
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/test/locked-feature`, {
      method: 'POST',
      body: JSON.stringify({
        plan: 'starter',
        feature: 'ai_explanation'
      })
    })
    const data = await response.json()
    
    return {
      success: data.locked === true && data.upgrade_prompt === 'growth',
      message: 'Starter AI should show locked state with growth upgrade',
      data
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

async function testLockedGrowthBenchmarking() {
  try {
    // Test locked feature UI for growth
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/test/locked-feature`, {
      method: 'POST',
      body: JSON.stringify({
        plan: 'growth',
        feature: 'benchmarking'
      })
    })
    const data = await response.json()
    
    return {
      success: data.locked === true && data.upgrade_prompt === 'pro',
      message: 'Growth benchmarking should show locked state with pro upgrade',
      data
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

async function testUpgradePrompt() {
  try {
    // Test upgrade prompt click
    const response = await fetch(`${process.NEXT_PUBLIC_BASE_URL}/api/test/upgrade-click`, {
      method: 'POST',
      body: JSON.stringify({
        feature: 'ai_explanation',
        required_plan: 'growth',
        redirect_to: '/pricing'
      })
    })
    const data = await response.json()
    
    return {
      success: data.redirect_triggered === true,
      message: 'Upgrade button should redirect to pricing',
      data
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

async function testSilentFailure() {
  try {
    // Confirm no silent failures exist
    const testCases = [
      { endpoint: '/api/ai/explain', plan: 'starter' },
      { endpoint: '/api/benchmarking', plan: 'growth' },  
      { endpoint: '/api/escalation', plan: 'growth' }
    ]
    
    const results = []
    
    for (const testCase of testCases) {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}${testCase.endpoint}`, {
        headers: {
          'Authorization': `Bearer ${testCase.plan}-org-token`
        }
      })
      
      results.push({
        endpoint: testCase.endpoint,
        plan: testCase.plan,
        status: response.status,
        has_proper_response: response.status === 403 || response.status === 200
      })
    }
    
    return {
      success: results.every(r => r.has_proper_response),
      message: 'All endpoints should return proper responses (not 500)',
      data: results
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

async function testZeroEmployees() {
  try {
    // Test organization with 0 employees
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/test/zero-employees`)
    const data = await response.json()
    
    return {
      success: response.ok && data.no_checkins_sent === true,
      message: 'No errors should be thrown for zero employees',
      data
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

async function testSlackTokenExpiry() {
  try {
    // Test Slack bot token expiry handling
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/test/slack-expiry`, {
      method: 'POST',
      body: JSON.stringify({
        expired_token: 'xoxb-expired-123'
      })
    })
    const data = await response.json()
    
    return {
      success: data.fell_back_to_email === true,
      message: 'Expired Slack token should fall back to email',
      data
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

async function testWebhookDuplicate() {
  try {
    // Test webhook idempotency
    const duplicatePayload = {
      event: 'subscription.activated',
      idempotency_key: 'test-key-123'
    }
    
    // Send same webhook twice
    const response1 = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/test/webhook-duplicate`, {
      method: 'POST',
      body: JSON.stringify({ ...duplicatePayload, attempt: 1 })
    })
    
    const response2 = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/test/webhook-duplicate`, {
      method: 'POST',
      body: JSON.stringify({ ...duplicatePayload, attempt: 2 })
    })
    
    const data1 = await response1.json()
    const data2 = await response2.json()
    
    return {
      success: data1.processed === true && data2.processed === false,
      message: 'Second webhook should be ignored (idempotent)',
      data: { first: data1, second: data2 }
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}