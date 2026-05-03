import { getAdminDb } from '@resylia/db'
import { IndustryBenchmarking } from '@resylia/shared'

interface IndustryBenchmark {
  industry: string
  org_size_range: string
  avg_burnout_risk: number
  avg_energy: number
  avg_stress: number
  avg_workload: number
  avg_engagement: number
  sample_size: number
  updated_at: string
  key_insights: string[]
}

interface ComparisonResult {
  industry: string
  org_size_category: string
  your_burnout_risk: number
  industry_avg_burnout_risk: number
  difference_percent: number
  ranking_percentile: number
  key_differences: string[]
  recommendations: string[]
  confidence_level: number
}

class IndustryBenchmarking {
  private static industryMapping: { [key: string]: string[] } = {
    'Technology': ['Software', 'IT Services', 'SaaS', 'Tech Startup'],
    'Healthcare': ['Hospital', 'Medical', 'Healthcare Services', 'Pharmaceutical'],
    'Finance': ['Banking', 'Insurance', 'Financial Services', 'Fintech'],
    'Retail': ['Retail', 'E-commerce', 'Consumer Goods'],
    'Manufacturing': ['Manufacturing', 'Industrial', 'Construction'],
    'Education': ['Education', 'EdTech', 'Training'],
    'Professional Services': ['Consulting', 'Legal', 'Accounting', 'Marketing Agency'],
    'Media': ['Media', 'Entertainment', 'Publishing', 'Advertising'],
  }

  private static orgSizeCategories = {
    'Startup': { min: 1, max: 50 },
    'Small': { min: 51, max: 250 },
    'Medium': { min: 251, max: 1000 },
    'Large': { min: 1001, max: 5000 },
    'Enterprise': { min: 5001, max: Infinity },
  }

  static async getIndustryBenchmark(industry: string, orgSize: number): Promise<IndustryBenchmark> {
    const admin = getAdminDb()
    
    // Get the industry category
    const industryCategory = this.mapToIndustryCategory(industry)
    const sizeCategory = this.getOrgSizeCategory(orgSize)
    
    // Query aggregated benchmarks
    const { data: benchmark } = await admin
      .from('industry_benchmarks')
      .select('*')
      .eq('industry', industryCategory)
      .eq('org_size_range', sizeCategory)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()

    if (!benchmark) {
      // If no specific benchmark exists, get industry-wide data
      return await this.getFallbackBenchmark(industryCategory)
    }

    return benchmark
  }

  static async compareWithIndustry(
    orgData: {
      burnout_risk: number
      energy: number
      stress: number
      workload: number
      engagement: number
    },
    industry: string,
    orgSize: number,
    orgId: string
  ): Promise<ComparisonResult> {
    const benchmark = await this.getIndustryBenchmark(industry, orgSize)

    // Calculate difference percentages
    const burnoutRiskDiff = ((orgData.burnout_risk - benchmark.avg_burnout_risk) / benchmark.avg_burnout_risk) * 100
    const energyDiff = ((orgData.energy - benchmark.avg_energy) / benchmark.avg_energy) * 100
    const stressDiff = ((orgData.stress - benchmark.avg_stress) / benchmark.avg_stress) * 100
    
    // Calculate percentile ranking (simplified - would use actual distribution)
    const rankingPercentile = this.calculatePercentile(orgData.burnout_risk, benchmark.avg_burnout_risk)
    
    // Generate insights
    const keyDifferences = this.generateKeyDifferences(
      orgData,
      benchmark,
      burnoutRiskDiff,
      energyDiff,
      stressDiff
    )
    
    // Generate recommendations
    const recommendations = this.generateBenchmarkingRecommendations(
      burnoutRiskDiff,
      energyDiff,
      stressDiff,
      industry
    )

    // Calculate confidence in comparison
    const confidenceLevel = Math.min(1, benchmark.sample_size / 100) // Higher sample size = higher confidence

    // Store comparison for analytics
    await this.storeComparison(orgId, {
      industry: benchmark.industry,
      org_size_category: benchmark.org_size_range,
      comparison_percentage: burnoutRiskDiff,
      confidence_level: confidenceLevel,
    })

    return {
      industry: benchmark.industry,
      org_size_category: benchmark.org_size_range,
      your_burnout_risk: Math.round(orgData.burnout_risk * 100) / 100,
      industry_avg_burnout_risk: Math.round(benchmark.avg_burnout_risk * 100) / 100,
      difference_percent: Math.round(burnoutRiskDiff * 10) / 10,
      ranking_percentile: Math.round(rankingPercentile * 100) / 100,
      key_differences: keyDifferences,
      recommendations: recommendations,
      confidence_level: Math.round(confidenceLevel * 100) / 100,
    }
  }

  private static mapToIndustryCategory(industry: string): string {
    for (const [category, keywords] of Object.entries(this.industryMapping)) {
      if (keywords.some(keyword => industry.toLowerCase().includes(keyword.toLowerCase()))) {
        return category
      }
    }
    return 'General' // Default category
  }

  private static getOrgSizeCategory(size: number): string {
    for (const [category, range] of Object.entries(this.orgSizeCategories)) {
      if (size >= range.min && size <= range.max) {
        return category
      }
    }
    return 'Unknown'
  }

  private static async getFallbackBenchmark(industry: string): Promise<IndustryBenchmark> {
    const admin = getAdminDb()
    
    // Get industry-wide data (not size-specific)
    const { data: industryData } = await admin
      .from('industry_benchmarks')
      .select('*')
      .eq('industry', industry)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()

    if (!industryData) {
      // Return default values if no data exists
      return {
        industry,
        org_size_range: 'Unknown',
        avg_burnout_risk: 0.35,
        avg_energy: 5.5,
        avg_stress: 5.2,
        avg_workload: 5.8,
        avg_engagement: 0.72,
        sample_size: 0,
        updated_at: new Date().toISOString(),
        key_insights: ['No specific industry data available'],
      }
    }

    return industryData
  }

  private static calculatePercentile(value: number, average: number): number {
    // Simplified percentile calculation
    // In reality, this would use the full distribution of companies
    const standardDeviation = 0.15 // Typical std dev for burnout risk
    const zScore = (value - average) / standardDeviation
    
    // Convert Z-score to percentile
    const percentile = 0.5 * (1 + this.erf(zScore / Math.sqrt(2)))
    return Math.max(0, Math.min(1, percentile))
  }

  private static erf(x: number): number {
    // Error function approximation for percentile calculation
    const a1 =  0.254829592
    const a2 = -0.284496736
    const a3 =  1.421413741
    const a4 = -1.453152027
    const a5 =  1.061405429
    const p  =  0.3275911

    const sign = x >= 0 ? 1 : -1
    x = Math.abs(x)

    const t = 1.0 / (1.0 + p * x)
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x)

    return sign * y
  }

  private static generateKeyDifferences(
    orgData: any,
    benchmark: IndustryBenchmark,
    burnoutDiff: number,
    energyDiff: number,
    stressDiff: number
  ): string[] {
    const differences: string[] = []

    if (Math.abs(burnoutDiff) > 10) {
      difference.push(`Your burnout risk is ${Math.abs(Math.round(burnoutDiff))}% ${burnoutDiff > 0 ? 'higher' : 'lower'} than industry average`)
    }

    if (Math.abs(energyDiff) > 10) {
      differences.push(`Energy levels are ${Math.abs(Math.round(energyDiff))}% ${energyDiff > 0 ? 'higher' : 'lower'} than similar companies`)
    }

    if (Math.abs(stressDiff) > 10) {
      differences.push(`Stress levels are ${Math.abs(Math.round(stressDiff))}% ${stressDiff > 0 ? 'higher' : 'lower'} than industry norms`)
    }

    // Add specific insights from benchmark
    if (benchmark.key_insights.length > 0) {
      differences.push(...benchmark.key_insights.slice(0, 2)) // Limit to prevent too much text
    }

    return differences.slice(0, 4) // Limit to 4 key differences
  }

  private static generateBenchmarkingRecommendations(
    burnoutDiff: number,
    energyDiff: number,
    stressDiff: number,
    industry: string
  ): string[] {
    const recommendations: string[] = []

    // Based on burnout risk difference
    if (burnoutDiff > 20) {
      recommendations.push('🚨 Critical: Your burnout risk is significantly higher than industry average')
      recommendations.push('Consider immediate workload reduction and additional wellness resources')
    } else if (burnoutDiff > 10) {
      recommendations.push('⚠️ Warning: Monitor burnout risk closely with weekly check-ins')
    } else if (burnoutDiff < -10) {
      recommendations.push('✅ Excellent: Your burnout prevention is working better than industry standards')
      recommendations.push('Share your wellness practices with the team to maintain momentum')
    }

    // Based on energy/stress differences
    if (energyDiff < -15) {
      recommendations.push('Consider energy management workshops or flexible scheduling')
    }

    if (stressDiff > 15) {
      recommendations.push('Implement stress management programs and workload reviews')
    }

    // Industry-specific recommendations
    const industryTips: { [key: string]: string[] } = {
      'Technology': ['Consider implementing "no meeting Wednesday" and focus time blocks'],
      'Healthcare': ['Implement peer support programs and regular wellness check-ins'],
      'Finance': ['Quarterly workload reviews during high-stress periods'],
      'Retail': ['During peak seasons, add additional wellness breaks'],
    }

    if (industryTips[industry]) {
      recommendations.push(...industryTips[industry].slice(0, 2))
    }

    return recommendations.slice(0, 5) // Limit to 5 recommendations
  }

  private static async storeComparison(orgId: string, comparisonData: any): Promise<void> {
    const admin = getAdminDb()
    
    await admin
      .from('benchmark_comparisons')
      .insert({
        org_id: orgId,
        industry: comparisonData.industry,
        org_size_category: comparisonData.org_size_category,
        comparison_percentage: comparisonData.comparison_percentage,
        confidence_level: comparisonData.confidence_level,
        compared_at: new Date().toISOString(),
      })
  }

  static async updateIndustryBenchmarks(): Promise<void> {
    const admin = getAdminDb()
    
    // This would be called by a cron job to update benchmarks
    // Query all organizations and aggregate data by industry and size
    
    const { data: organizations } = await admin
      .from('organizations')
      .select('id, industry, seat_count')

    // Group by industry and size category
    const benchmarkData = new Map<string, any[]>()

    for (const org of organizations || []) {
      const industry = this.mapToIndustryCategory(org.industry || 'General')
      const sizeCategory = this.getOrgSizeCategory(org.seat_count)
      const key = `${industry}|${sizeCategory}`
      
      if (!benchmarkData.has(key)) {
        benchmarkData.set(key, [])
      }
      benchmarkData.get(key)!.push(org.id)
    }

    // For each benchmark group, calculate aggregated metrics
    for (const [key, orgIds] of benchmarkData) {
      const [industry, sizeCategory] = key.split('|')
      
      // Get recent checkin data for all orgs in this group
      const { data: checkins } = await admin
        .from('checkins')
        .select('burnout_risk_score, energy, stress, workload, sentiment_score')
        .in('org_id', orgIds)
        .gte('checked_in_at', new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString())

      if (!checkins || checkins.length === 0) continue

      // Calculate averages
      const avgBurnoutRisk = checkins.reduce((sum, c) => sum + (c.burnout_risk_score || 0), 0) / checkins.length
      const avgEnergy = checkins.reduce((sum, c) => sum + c.energy, 0) / checkins.length
      const avgStress = checkins.reduce((sum, c) => sum + c.stress, 0) / checkins.length
      const avgWorkload = checkins.reduce((sum, c) => sum + c.workload, 0) / checkins.length
      const avgEngagement = checkins.reduce((sum, c) => sum + (c.sentiment_score || 0), 0) / checkins.length

      // Update or insert benchmark
      await admin
        .from('industry_benchmarks')
        .upsert({
          industry,
          org_size_range: sizeCategory,
          avg_burnout_risk: Math.round(avgBurnoutRisk * 100) / 100,
          avg_energy: Math.round(avgEnergy * 100) / 100,
          avg_stress: Math.round(avgStress * 100) / 100,
          avg_workload: Math.round(avgWorkload * 100) / 100,
          avg_engagement: Math.round(avgEngagement * 100) / 100,
          sample_size: checkins.length,
          updated_at: new Date().toISOString(),
          key_insights: [], // Would populate with AI-generated insights
        }, {
          onConflict: ['industry', 'org_size_range']
        })
    }
  }
}

export { IndustryBenchmarking, type IndustryBenchmark, type ComparisonResult }