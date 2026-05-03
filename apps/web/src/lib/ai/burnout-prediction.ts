import { getAdminDb } from '@resylia/db'
import { calculateBurnoutRiskScore } from './scoring'

interface BurnoutPrediction {
  user_id: string
  current_risk: number
  prediction_7_days: number
  prediction_14_days: number
  prediction_30_days: number
  estimated_burnout_date: string | null
  confidence_score: number
  risk_factors: string[]
  recommended_actions: string[]
}

interface PredictionModel {
  name: string
  weight: number
  predict: (checkins: any[]) => number
}

class BurnoutPredictor {
  private models: PredictionModel[]

  constructor() {
    this.models = [
      {
        name: 'trend_analysis',
        weight: 0.4,
        predict: this.trendAnalysis.bind(this),
      },
      {
        name: 'energy_stress_correlation',
        weight: 0.3,
        predict: this.energyStressCorrelation.bind(this),
      },
      {
        name: 'workload_impact',
        weight: 0.2,
        predict: this.workloadImpact.bind(this),
      },
      {
        name: 'sentiment_degradation',
        weight: 0.1,
        predict: this.sentimentDegradation.bind(this),
      },
    ]
  }

  async predictBurnoutTimeline(userId: string, orgId: string): Promise<BurnoutPrediction> {
    // Get last 30 days of check-ins for prediction
    const admin = getAdminDb()
    const { data: checkins } = await admin
      .from('checkins')
      .select('*')
      .eq('user_id', userId)
      .eq('org_id', orgId)
      .gte('checked_in_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('checked_in_at', { ascending: true })

    if (!checkins || checkins.length < 7) {
      return this.getDefaultPrediction(userId, checkins[0]?.burnout_risk_score || 0)
    }

    // Run all prediction models
    const modelPredictions = this.models.map(model => ({
      name: model.name,
      weight: model.weight,
      prediction: model.predict(checkins),
    }))

    // Calculate weighted average of predictions
    const weightedPredictions = modelPredictions.reduce((sum, model) => 
      sum + model.prediction * model.weight, 0
    ) / this.models.reduce((sum, model) => sum + model.weight, 0)

    const currentRisk = checkins[checkins.length - 1]?.burnout_risk_score || 0
    
    // Extrapolate future risk based on current trajectory
    const trajectory = this.calculateTrajectory(checkins)
    
    const prediction7days = Math.min(1, currentRisk + (trajectory * 7))
    const prediction14days = Math.min(1, currentRisk + (trajectory * 14))
    const prediction30days = Math.min(1, currentRisk + (trajectory * 30))
    
    // Estimate when burnout might occur (risk >= 0.8)
    const estimatedBurnoutDate = this.estimateBurnoutDate(currentRisk, trajectory)
    
    // Identify key risk factors
    const riskFactors = this.identifyRiskFactors(checkins)
    
    // Generate recommended actions
    const recommendedActions = this.generateRecommendedActions(riskFactors, trajectory)

    return {
      user_id: userId,
      current_risk: Math.round(currentRisk * 100) / 100,
      prediction_7_days: Math.round(prediction7days * 100) / 100,
      prediction_14_days: Math.round(prediction14days * 100) / 100,
      prediction_30_days: Math.round(prediction30days * 100) / 100,
      estimated_burnout_date: estimatedBurnoutDate,
      confidence_score: this.calculateConfidence(checkins.length, trajectory),
      risk_factors: riskFactors,
      recommended_actions: recommendedActions,
    }
  }

  private trendAnalysis(checkins: any[]): number {
    // Analyze the trend of burnout risk over time
    const risks = checkins.map(c => c.burnout_risk_score || 0)
    
    if (risks.length < 2) return 0
    
    // Calculate linear regression
    const n = risks.length
    const sumX = (n * (n - 1)) / 2
    const sumY = risks.reduce((sum, val) => sum + val, 0)
    const sumXY = risks.reduce((sum, val, index) => sum + val * index, 0)
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6
    
    return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  }

  private energyStressCorrelation(checkins: any[]): number {
    // Calculate correlation between declining energy and increasing stress
    const recentCheckins = checkins.slice(-7) // Last 7 days
    if (recentCheckins.length < 3) return 0
    
    const energyChange = recentCheckins[0].energy - recentCheckins[recentCheckins.length - 1].energy
    const stressChange = recentCheckins[recentCheckins.length - 1].stress - recentCheckins[0].stress
    const workloadChange = recentCheckins[0].workload - recentCheckins[recentCheckins.length - 1].workload
    
    // Negative correlation when energy decreases while stress increases
    const correlation = (energyChange * -0.5) + (stressChange * 0.3) + (workloadChange * 0.2)
    return Math.max(-1, Math.min(1, correlation / 10)) // Normalize to [-1, 1]
  }

  private workloadImpact(checkins: any[]): number {
    // Analyze impact of sustained high workload
    const recentCheckins = checkins.slice(-7)
    if (recentCheckins.length < 3) return 0
    
    const avgWorkload = recentCheckins.reduce((sum, c) => sum + c.workload, 0) / recentCheckins.length
    const avgEnergy = recentCheckins.reduce((sum, c) => sum + c.energy, 0) / recentCheckins.length
    
    // High workload with low energy = high risk
    if (avgWorkload > 7 && avgEnergy < 4) return 0.8
    if (avgWorkload > 8 && avgEnergy < 5) return 0.6
    if (avgWorkload > 6) return 0.3
    
    return 0
  }

  private sentimentDegradation(checkins: any[]): number {
    // Analyze sentiment score degradation
    const recentCheckins = checkins.slice(-5) // Last 5 days
    if (recentCheckins.length < 3) return 0
    
    const sentiments = recentCheckins.map(c => c.sentiment_score || 0)
    const sentimentChange = sentiments[0] - sentiments[sentiments.length - 1]
    
    return Math.max(-1, Math.min(1, sentimentChange / 10))
  }

  private calculateTrajectory(checkins: any[]): number {
    // Calculate the trajectory of burnout risk change
    if (checkins.length < 3) return 0
    
    const recentRisks = checkins.slice(-5).map(c => c.burnout_risk_score || 0)
    const trajectory = recentRisks[recentRisks.length - 1] - recentRisks[0]
    
    return trajectory / (recentRisks.length - 1) // Daily change
  }

  private estimateBurnoutDate(currentRisk: number, trajectory: number): string | null {
    if (trajectory <= 0) return null // Risk not increasing
    
    const daysToBurnout = Math.ceil((0.8 - currentRisk) / trajectory)
    
    if (daysToBurnout <= 0 || daysToBurnout > 60) return null // Predict within 60 days only
    
    const burnoutDate = new Date()
    burnoutDate.setDate(burnoutDate.getDate() + daysToBurnout)
    
    return burnoutDate.toISOString().split('T')[0]
  }

  private identifyRiskFactors(checkins: any[]): string[] {
    const factors: string[] = []
    const recentCheckins = checkins.slice(-7)
    
    if (recentCheckins.length < 3) return factors

    const avgEnergy = recentCheckins.reduce((sum, c) => sum + c.energy, 0) / recentCheckins.length
    const avgStress = recentCheckins.reduce((sum, c) => sum + c.stress, 0) / recentCheckins.length
    const avgWorkload = recentCheckins.reduce((sum, c) => sum + c.workload, 0) / recentCheckins.length
    
    if (avgEnergy < 4) factors.push('Low energy levels')
    if (avgStress > 7) factors.push('High stress levels')
    if (avgWorkload > 8) factors.push('Excessive workload')
    if (this.trendAnalysis(recentCheckins) > 0.1) factors.push('Declining wellness trend')
    
    // Check for specific patterns
    if (recentCheckins.every(c => c.energy < 5)) factors.push('Consistent low energy')
    if (recentCheckins.every(c => c.stress > 6)) factors.push('Sustained high stress')
    
    return factors
  }

  private generateRecommendedActions(riskFactors: string[], trajectory: number): string[] {
    const actions: string[] = []
    
    // Based on risk factors
    if (riskFactors.includes('Low energy levels')) {
      actions.push('Consider flexible scheduling or reduced hours')
    }
    if (riskFactors.includes('High stress levels')) {
      actions.push('Schedule stress management resources')
    }
    if (riskFactors.includes('Excessive workload')) {
      actions.push('Reassess project deadlines and priorities')
    }
    
    // Based on trajectory
    if (trajectory > 0.05) {
      actions.push('Immediate intervention recommended')
    }
    if (trajectory > 0.1) {
      actions.push('Consider temporary role adjustment')
    }
    
    // Default actions
    if (actions.length === 0) {
      actions.push('Monitor wellness trends closely')
      actions.push('Encourage regular breaks')
    }
    
    return actions
  }

  private calculateConfidence(dataPoints: number, trajectory: number): number {
    let confidence = Math.min(1, dataPoints / 30) // More data = higher confidence
    
    // High confidence if trajectory is clearly positive or negative
    if (Math.abs(trajectory) > 0.05) {
      confidence = Math.min(1, confidence + 0.2)
    }
    
    return Math.round(confidence * 100) / 100
  }

  private getDefaultPrediction(userId: string, currentRisk: number): BurnoutPrediction {
    return {
      user_id: userId,
      current_risk: currentRisk,
      prediction_7_days: currentRisk,
      prediction_14_days: currentRisk,
      prediction_30_days: currentRisk,
      estimated_burnout_date: null,
      confidence_score: 0.3,
      risk_factors: ['Insufficient data for prediction'],
      recommended_actions: ['Continue daily check-ins for better predictions'],
    }
  }
}

export const burnoutPredictor = new BurnoutPredictor()