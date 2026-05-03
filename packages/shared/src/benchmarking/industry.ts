import { getAdminDb } from '../../../db/src/client'

// Removed unused Organization import from @/types

export interface IndustryBenchmark {
  industry: string
  org_size_range: string
  avg_burnout_risk: number
  avg_energy: number
  avg_stress: number
  avg_workload: number
  avg_engagement: number
  sample_size: number
  confidence_level: number
}

export interface ComparisonResult {
  organization_metrics: {
    burnout_risk: number
    energy: number
    stress: number
    workload: number
    engagement: number
  }
  industry_benchmark: IndustryBenchmark
  performance_comparison: {
    burnout_risk_diff: number
    energy_diff: number
    stress_diff: number
    workload_diff: number
    engagement_diff: number
  }
  key_differences: string[]
  recommendations: string[]
  confidence_level: number
}

export async function compareWithIndustry(
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
  const benchmark = await getIndustryBenchmark(industry, orgSize)

  const burnoutRiskDiff = ((orgData.burnout_risk - benchmark.avg_burnout_risk) / benchmark.avg_burnout_risk) * 100
  const energyDiff = ((orgData.energy - benchmark.avg_energy) / benchmark.avg_energy) * 100
  const stressDiff = ((orgData.stress - benchmark.avg_stress) / benchmark.avg_stress) * 100
  const workloadDiff = ((orgData.workload - benchmark.avg_workload) / benchmark.avg_workload) * 100
  const engagementDiff = ((orgData.engagement - benchmark.avg_engagement) / benchmark.avg_engagement) * 100

  const keyDifferences: string[] = []
  const recommendations: string[] = []

  if (Math.abs(burnoutRiskDiff) > 15) {
    keyDifferences.push(
      burnoutRiskDiff > 0
        ? `Burnout risk is ${burnoutRiskDiff.toFixed(1)}% higher than industry average`
        : `Burnout risk is ${Math.abs(burnoutRiskDiff).toFixed(1)}% lower than industry average`
    )
    if (burnoutRiskDiff > 0) {
      recommendations.push('Implement stress management programs')
      recommendations.push('Review workload distribution')
    }
  }

  if (Math.abs(energyDiff) > 15) {
    keyDifferences.push(
      energyDiff > 0
        ? `Energy levels are ${energyDiff.toFixed(1)}% higher than industry average`
        : `Energy levels are ${Math.abs(energyDiff).toFixed(1)}% lower than industry average`
    )
    if (energyDiff < 0) {
      recommendations.push('Focus on employee wellness initiatives')
      recommendations.push('Consider flexible working arrangements')
    }
  }

  const confidenceLevel = calculateConfidenceLevel(benchmark.sample_size)

  await storeComparison(orgId, {
    org_data: orgData,
    benchmark,
    comparison: { burnoutRiskDiff, energyDiff, stressDiff, workloadDiff, engagementDiff },
    recommendations,
    confidenceLevel,
  })

  return {
    organization_metrics: orgData,
    industry_benchmark: benchmark,
    performance_comparison: {
      burnout_risk_diff: burnoutRiskDiff,
      energy_diff: energyDiff,
      stress_diff: stressDiff,
      workload_diff: workloadDiff,
      engagement_diff: engagementDiff,
    },
    key_differences: keyDifferences,
    recommendations,
    confidence_level: Math.round(confidenceLevel * 100) / 100,
  }
}

export async function getIndustryBenchmark(industry: string, orgSize: number): Promise<IndustryBenchmark> {
  const admin = getAdminDb()
  const industryCategory = mapToIndustryCategory(industry)
  const orgSizeCategory = getOrgSizeCategory(orgSize)

  const { data: benchmark } = await admin
    .from('industry_benchmarks')
    .select('*')
    .eq('industry', industryCategory)
    .eq('org_size_range', orgSizeCategory)
    .single() as unknown as { data: IndustryBenchmark | null }

  if (!benchmark) {
    return getFallbackBenchmark(industryCategory)
  }

  return benchmark
}

function mapToIndustryCategory(industry: string): string {
  const industryMapping: Record<string, string[]> = {
    'Technology': ['Software', 'IT Services', 'SaaS', 'Tech Startup'],
    'Healthcare': ['Hospital', 'Medical', 'Healthcare Services', 'Pharmaceutical'],
    'Finance': ['Banking', 'Insurance', 'Financial Services', 'Fintech'],
    'Retail': ['Retail', 'E-commerce', 'Consumer Goods'],
    'Manufacturing': ['Manufacturing', 'Industrial', 'Construction'],
    'Education': ['Education', 'EdTech', 'Training'],
    'Professional Services': ['Consulting', 'Legal', 'Accounting', 'Marketing Agency'],
    'Media': ['Media', 'Entertainment', 'Publishing', 'Advertising'],
  }

  for (const [category, keywords] of Object.entries(industryMapping)) {
    if (keywords.some(keyword => industry.toLowerCase().includes(keyword.toLowerCase()))) {
      return category
    }
  }
  return 'General'
}

function getOrgSizeCategory(size: number): string {
  const categories: Record<string, { min: number; max: number }> = {
    'Startup': { min: 1, max: 50 },
    'Small': { min: 51, max: 250 },
    'Medium': { min: 251, max: 1000 },
    'Large': { min: 1001, max: 5000 },
    'Enterprise': { min: 5001, max: Infinity },
  }

  for (const [category, range] of Object.entries(categories)) {
    if (size >= range.min && size <= range.max) return category
  }
  return 'Unknown'
}

function getFallbackBenchmark(industry: string): IndustryBenchmark {
  return {
    industry,
    org_size_range: 'Unknown',
    avg_burnout_risk: 0.35,
    avg_energy: 5.5,
    avg_stress: 5.8,
    avg_workload: 6.2,
    avg_engagement: 6.5,
    sample_size: 50,
    confidence_level: 0.7,
  }
}

function calculateConfidenceLevel(sampleSize: number): number {
  const minSampleSize = 30
  const targetSampleSize = 100
  if (sampleSize >= targetSampleSize) return 0.95
  if (sampleSize <= minSampleSize) return 0.6
  const ratio = (sampleSize - minSampleSize) / (targetSampleSize - minSampleSize)
  return 0.6 + ratio * 0.35
}

async function storeComparison(orgId: string, comparisonData: any): Promise<void> {
  const admin = getAdminDb()
  await (admin
    .from('benchmark_comparisons')
    .insert({
      org_id: orgId,
      comparison_data: comparisonData,
      created_at: new Date().toISOString(),
    }) as unknown as Promise<any>)
}

export default {
  compareWithIndustry,
  getIndustryBenchmark,
}
