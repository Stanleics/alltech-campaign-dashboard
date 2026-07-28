import { describe, expect, it } from 'vitest'
import { computePaidPerformanceRows, type PaidAnalyticsInput } from './compute-paid-performance'

const campaigns = new Map([
  ['urn:li:sponsoredCampaign:1', { name: 'Autoridade Q3', objectiveType: 'BRAND_AWARENESS', status: 'ACTIVE' }],
])
const creatives = new Map([['urn:li:sponsoredCreative:1', { headline: 'Criativo A', pillar: 'lideranca' }]])

function row(overrides: Partial<PaidAnalyticsInput> = {}): PaidAnalyticsInput {
  return {
    campaignId: 'urn:li:sponsoredCampaign:1',
    creativeId: 'urn:li:sponsoredCreative:1',
    dateStart: '2026-07-20',
    dateEnd: '2026-07-20',
    impressions: 1000,
    clicks: 20,
    reach: 500,
    likes: 10,
    comments: 3,
    shares: 2,
    follows: 1,
    cost: 100,
    ...overrides,
  }
}

describe('computePaidPerformanceRows', () => {
  it('joins analytics with campaign + creative and computes the view math', () => {
    const [result] = computePaidPerformanceRows([row()], campaigns, creatives)

    expect(result).toMatchObject({
      campaignName: 'Autoridade Q3',
      objectiveType: 'BRAND_AWARENESS',
      campaignStatus: 'ACTIVE',
      creativeHeadline: 'Criativo A',
      pillar: 'lideranca',
      frequency: 2, // 1000 / 500
      ctr: 0.02, // 20 / 1000
      engagements: 15, // 10 + 3 + 2
      engagementRate: 0.015, // 15 / 1000
      cpc: 5, // 100 / 20
      cpm: 100, // 100 / 1000 * 1000
      costPerEngagement: 100 / 15,
    })
  })

  it('returns null for frequency/ctr/engagementRate/cpc/cpm/costPerEngagement when the denominator is 0', () => {
    const [result] = computePaidPerformanceRows(
      [row({ reach: 0, impressions: 0, clicks: 0, likes: 0, comments: 0, shares: 0 })],
      campaigns,
      creatives,
    )

    expect(result.frequency).toBeNull()
    expect(result.ctr).toBeNull()
    expect(result.engagementRate).toBeNull()
    expect(result.cpc).toBeNull()
    expect(result.cpm).toBeNull()
    expect(result.costPerEngagement).toBeNull()
  })

  it('drops rows whose campaign or creative is unknown', () => {
    const result = computePaidPerformanceRows(
      [row({ campaignId: 'urn:li:sponsoredCampaign:missing' })],
      campaigns,
      creatives,
    )
    expect(result).toEqual([])
  })
})
