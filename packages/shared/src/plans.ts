// Single source of truth for all plan features and pricing
export const PLANS = {
  starter: {
    name: 'Starter',
    monthly_per_seat: 199,
    annual_per_seat: 159, // 20% off
    monthly_cap: 3000,
    annual_cap: 28800,     // 3000 × 12 × 0.80
    max_seats: 15,
    features: {
      daily_checkins: true,
      burnout_score: true,        // rule-based, no Groq
      ai_explanation: false,
      manager_nudges: false,
      prediction_days: 0,
      anonymous_escalation: false,
      benchmarking: false,
      slack_bot: false,
    }
  },
  growth: {
    name: 'Growth',
    monthly_per_seat: 299,
    annual_per_seat: 239,
    monthly_cap: 9000,
    annual_cap: 86400,
    max_seats: 100,
    features: {
      daily_checkins: true,
      burnout_score: true,
      ai_explanation: true,       // calls Groq
      manager_nudges: true,       // calls Groq
      prediction_days: 14,
      anonymous_escalation: false,
      benchmarking: false,
      slack_bot: true,
    }
  },
  pro: {
    name: 'Pro',
    monthly_per_seat: 499,
    annual_per_seat: 399,
    monthly_cap: null,            // no cap
    annual_cap: null,
    max_seats: null,              // unlimited
    features: {
      daily_checkins: true,
      burnout_score: true,
      ai_explanation: true,
      manager_nudges: true,
      prediction_days: 30,
      anonymous_escalation: true,
      benchmarking: true,
      slack_bot: true,
    }
  }
} as const

export type Plan = keyof typeof PLANS
export type Feature = keyof typeof PLANS.starter.features

// Helper functions for plan checking
export function hasFeature(orgPlan: Plan, feature: Feature): boolean {
  return !!PLANS[orgPlan].features[feature]
}

export function requireFeature(orgPlan: Plan, requiredFeature: Feature): { allowed: boolean } | { allowed: false; upgradePlan: Plan; feature: Feature } {
  if (hasFeature(orgPlan, requiredFeature)) {
    return { allowed: true }
  }
  
  // Find the cheapest plan that has this feature
  for (const [planName, planConfig] of Object.entries(PLANS)) {
    if (planConfig.features[requiredFeature]) {
      return { allowed: false, upgradePlan: planName as Plan, feature: requiredFeature }
    }
  }
  
  return { allowed: false, upgradePlan: 'pro', feature: requiredFeature }
}

export function getMinRequiredPlan(feature: Feature): Plan {
  for (const [planName, planConfig] of Object.entries(PLANS)) {
    if (planConfig.features[feature]) {
      return planName as Plan
    }
  }
  return 'pro'
}

export function calculatePrice(plan: Plan, seats: number, billingCycle: 'monthly' | 'annual'): { price: number; isCapReached: boolean } {
  const planConfig = PLANS[plan]
  const perSeat = billingCycle === 'annual' ? planConfig.annual_per_seat : planConfig.monthly_per_seat
  const rawPrice = seats * perSeat
  
  if (!planConfig.max_seats) {
    return { price: rawPrice, isCapReached: false }
  }
  
  const cap = billingCycle === 'annual' ? planConfig.annual_cap : planConfig.monthly_cap
  const finalPrice = Math.min(rawPrice, cap)
  
  return { price: finalPrice, isCapReached: rawPrice > cap }
}

export function getPlanDescription(plan: Plan): string {
  const descriptions = {
    starter: "Perfect for small teams just getting started with wellness tracking",
    growth: " Ideal for growing teams that need AI-powered insights and Slack integration",
    pro: "Complete platform for organizations serious about employee wellness"
  }
  return descriptions[plan]
}

// Error responses for feature gating
export function createPlanErrorResponse(feature: Feature, requiredPlan: Plan) {
  return {
    error: 'plan_required',
    required_plan: requiredPlan,
    feature,
    message: `This feature is available on ${PLANS[requiredPlan].name} plan. Upgrade to unlock ${feature}.`
  }
}