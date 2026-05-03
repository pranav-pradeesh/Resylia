// Scoring functions for AI wellness analysis

export function calculateBurnoutRiskScore(energy: number, stress: number, workload: number, sentiment?: number): number {
  // Convert 1-10 scale to 0-1 scale for analysis
  const normalizedEnergy = (10 - energy) / 9 // Inverse relationship: lower energy = higher risk
  const normalizedStress = (stress - 1) / 9   // Direct relationship: higher stress = higher risk
  const normalizedWorkload = (workload - 1) / 9 // Direct relationship: higher workload = higher risk
  
  // Base calculation with weighted factors
  let riskScore = (normalizedEnergy * 0.3) + (normalizedStress * 0.4) + (normalizedWorkload * 0.3)
  
  // Adjust with sentiment if available (inverse relationship: lower sentiment = higher risk)
  if (sentiment !== undefined) {
    const normalizedSentiment = (10 - sentiment) / 9
    riskScore = (riskScore * 0.8) + (normalizedSentiment * 0.2)
  }
  
  // Ensure score is between 0 and 1
  return Math.max(0, Math.min(1, riskScore))
}

export function calculateSentimentScore(energy: number, stress: number, mood: number): number {
  // Weighted combination of wellbeing factors
  // Energy: positive factor (1-10 scale)
  // Stress: negative factor (1-10 scale)
  // Mood: positive factor (1-10 scale)
  
  const normalizedEnergy = energy / 10
  const normalizedStress = (10 - stress) / 9  // Invert stress scale
  const normalizedMood = mood / 10
  
  // Calculate sentiment with weighted average
  const sentiment = (normalizedEnergy * 0.4) + (normalizedStress * 0.2) + (normalizedMood * 0.4)
  
  // Return as percentage-like score (0-100 scale)
  return Math.round(sentiment * 100)
}