import { getAdminDb } from '@resylia/db'

export interface BurnoutPrediction {
  user_id: string
  prediction_score: number
  risk_level: 'low' | 'medium' | 'high'
  factors: string[]
  recommendation: string
}

export async function burnoutPredictor(userId: string, orgId: string): Promise<BurnoutPrediction> {
  const admin = getAdminDb()
  
  // Get user's recent checkins
  const { data: checkins } = await admin
    .from('checkins')
    .select('stress, energy, focus, burnout_risk_score, checked_in_at')
    .eq('user_id', userId)
    .order('checked_in_at', { ascending: false })
    .limit(10)

  if (!checkins || checkins.length === 0) {
    return {
      user_id: userId,
      prediction_score: 0,
      risk_level: 'low',
      factors: ['insufficient_data'],
      recommendation: 'Need more data to assess burnout risk'
    }
  }

  // Calculate trend
  const recentStress = checkins.slice(0, 5).map(c => c.stress || 0)
  const recentEnergy = checkins.slice(0, 5).map(c => c.energy || 0)
  
  const avgStress = recentStress.reduce((a, b) => a + b, 0) / recentStress.length
  const avgEnergy = recentEnergy.reduce((a, b) => a + b, 0) / recentEnergy.length
  
  // Simple burnout calculation
  const predictionScore = (avgStress * 0.6) + ((1 - avgEnergy) * 0.4)
  
  let riskLevel: 'low' | 'medium' | 'high' = 'low'
  const factors: string[] = []
  
  if (predictionScore > 0.7) {
    riskLevel = 'high'
    factors.push('high_stress_levels', 'low_energy_levels')
  } else if (predictionScore > 0.4) {
    riskLevel = 'medium'
    factors.push('moderate_stress', 'decreasing_energy')
  }
  
  // Check for recent burnout risk scores
  const recentRiskScores = checkins.map(c => c.burnout_risk_score || 0).filter(score => score > 0)
  if (recentRiskScores.length > 0 && Math.max(...recentRiskScores) > 0.8) {
    factors.push('high_burnout_risk_score')
    riskLevel = 'high'
  }
  
  const recommendations = {
    low: 'Continue monitoring regular check-ins',
    medium: 'Consider workload review and check-in frequency',
    high: 'Immediate intervention recommended - discuss workload and consider time off'
  }
  
  return {
    user_id: userId,
    prediction_score: parseFloat(predictionScore.toFixed(2)),
    risk_level: riskLevel,
    factors,
    recommendation: recommendations[riskLevel]
  }
}