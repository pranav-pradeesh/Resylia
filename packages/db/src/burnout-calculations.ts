import { getAdminDb, SupabaseClient } from './client'

// Rule-based burnout score calculation for starter plan
export async function getUserBurnoutScoreRuleBased(
  userId: string, 
  orgId: string, 
  data: { energy: number; stress: number; workload: number; free_text?: string }
): Promise<{ sentiment_score: number; burnout_risk_score: number }> {
  // Simple rule-based calculation
  const energyScore = (10 - data.energy) / 10 // Lower energy = higher risk
  const stressScore = data.stress / 10 // Higher stress = higher risk
  const workloadScore = (data.workload - 5) / 10 // Higher workload = higher risk
  
  // Simple sentiment score based on inputs
  const sentimentScore = Math.max(0, Math.min(1, (data.energy / 10 + (10 - data.stress) / 10 + (10 - data.workload) / 10) / 3))
  
  // Calculate burnout risk
  const burnoutRiskScore = Math.max(0, (energyScore + stressScore + workloadScore) / 3)
  
  return {
    sentiment_score: Math.round(sentimentScore * 100) / 100,
    burnout_risk_score: Math.round(burnoutRiskScore * 100) / 100,
  }
}

// AI-powered burnout score calculation for growth/pro plans
export async function getUserBurnoutScoreWithAI(
  userId: string, 
  orgId: string, 
  data: { energy: number; stress: number; workload: number; free_text?: string }
): Promise<{ sentiment_score: number; burnout_risk_score: number }> {
  // This would call Groq API for AI analysis
  // For now, implement a more sophisticated rule-based approach
  
  // Get historical data for better analysis
  const admin = getAdminDb()
  const { data: recentCheckins } = await admin
    .from('checkins')
    .select('energy, stress, workload, checked_in_at')
    .eq('user_id', userId)
    .gte('checked_in_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .order('checked_in_at', { ascending: true })

  // Calculate trends
  const trends = calculateTrends(recentCheckins || [])
  
  // Enhanced sentiment score incorporating trends
  const baseSentiment = (data.energy / 10 + (10 - data.stress) / 10 + (10 - data.workload) / 10) / 3
  
  // Adjust based on trends
  let trendAdjustment = 0
  if (trends.energyTrend < -0.1) trendAdjustment -= 0.2 // Declining energy
  if (trends.stressTrend > 0.1) trendAdjustment += 0.3 // Increasing stress
  if (trends.workloadTrend > 0.15) trendAdjustment += 0.2 // Increasing workload
  
  const sentimentScore = Math.max(0, Math.min(1, baseSentiment + trendAdjustment))
  
  // Enhanced burnout risk calculation
  const energyScore = (10 - data.energy) / 10
  const stressScore = data.stress / 10
  const workloadScore = (data.workload - 5) / 10
  
  // Incorporate text sentiment if available
  let textAdjustment = 0
  if (data.free_text) {
    textAdjustment = analyzeTextSentiment(data.free_text)
  }
  
  const burnoutRiskScore = Math.max(0, Math.min(1, (energyScore + stressScore + workloadScore) / 3 + textAdjustment))
  
  return {
    sentiment_score: Math.round(sentimentScore * 100) / 100,
    burnout_risk_score: Math.round(burnoutRiskScore * 100) / 100,
  }
}

function calculateTrends(checkins: any[]) {
  if (checkins.length < 2) {
    return {
      energyTrend: 0,
      stressTrend: 0,
      workloadTrend: 0,
    }
  }

  const n = checkins.length
  const energyTrend = calculateLinearRegression(checkins.map(c => c.energy))
  const stressTrend = calculateLinearRegression(checkins.map(c => c.stress))
  const workloadTrend = calculateLinearRegression(checkins.map(c => c.workload))

  return {
    energyTrend,
    stressTrend,
    workloadTrend,
  }
}

function calculateLinearRegression(values: number[]): number {
  if (values.length < 2) return 0
  
  const n = values.length
  const xSum = (n * (n - 1)) / 2
  const ySum = values.reduce((sum, val) => sum + val, 0)
  const xySum = values.reduce((sum, val, index) => sum + val * index, 0)
  const x2Sum = (n * (n - 1) * (2 * n - 1)) / 6

  return (n * xySum - xSum * ySum) / (n * x2Sum - xSum * xSum)
}

function analyzeTextSentiment(text: string): number {
  // Simple sentiment analysis (not using Groq in this implementation)
  // In real implementation, this would call Groq API
  
  const negativeWords = ['stress', 'overwhelm', 'burnout', 'tired', 'exhausted', 'depressed', 'anxious']
  const positiveWords = ['energy', 'motivated', 'productive', 'focused', 'balanced', 'happy', 'well']
  
  const lowerText = text.toLowerCase()
  
  let negativeCount = 0
  let positiveCount = 0
  
  negativeWords.forEach(word => {
    if (lowerText.includes(word)) negativeCount++
  })
  
  positiveWords.forEach(word => {
    if (lowerText.includes(word)) positiveCount++
  })
  
  const score = (negativeCount - positiveCount) / 10 // Scale to +/- range
  return Math.max(-0.5, Math.min(0.5, score))
}