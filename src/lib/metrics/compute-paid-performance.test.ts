import { describe, expect, it } from 'vitest'
import { aggregateByCreative, computePaidPerformanceRows, type PaidAnalyticsInput } from './compute-paid-performance'

const campaigns = new Map([
  ['urn:li:sponsoredCampaign:1', { name: 'Autoridade Q3', objectiveType: 'BRAND_AWARENESS', status: 'ACTIVE' }],
])
const creatives = new Map([
  ['urn:li:sponsoredCreative:1', { headline: 'Criativo A', pillar: 'lideranca' }],
  ['urn:li:sponsoredCreative:2', { headline: 'Criativo B', pillar: 'lideranca' }],
])

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

describe('aggregateByCreative', () => {
  it('rolls up multiple day rows from the same creative into a single totals row', () => {
    const rows = computePaidPerformanceRows(
      [
        row({ dateStart: '2026-07-20', dateEnd: '2026-07-20', impressions: 1000, clicks: 20, reach: 500, cost: 100 }),
        row({ dateStart: '2026-07-21', dateEnd: '2026-07-21', impressions: 500, clicks: 10, reach: 250, cost: 50 }),
      ],
      campaigns,
      creatives,
    )

    const [result] = aggregateByCreative(rows)

    expect(result).toMatchObject({
      campaignId: 'urn:li:sponsoredCampaign:1',
      campaignName: 'Autoridade Q3',
      creativeId: 'urn:li:sponsoredCreative:1',
      creativeHeadline: 'Criativo A',
      impressions: 1500,
      reach: 750,
      clicks: 30,
      engagements: 30, // 15 per row * 2
      cost: 150,
      frequency: 2, // 1500 / 750
      ctr: 0.02, // 30 / 1500
    })
  })

  it('keeps different creatives from the same campaign in separate rows, sorted by cost within the campaign', () => {
    const rows = computePaidPerformanceRows(
      [
        row({ creativeId: 'urn:li:sponsoredCreative:1', cost: 50 }),
        row({ creativeId: 'urn:li:sponsoredCreative:2', cost: 150 }),
      ],
      campaigns,
      creatives,
    )

    const result = aggregateByCreative(rows)

    expect(result).toHaveLength(2)
    expect(result.map((r) => r.creativeId)).toEqual([
      'urn:li:sponsoredCreative:2', // higher cost, same campaign, sorts first
      'urn:li:sponsoredCreative:1',
    ])
  })

  it('keeps campaigns in separate rows', () => {
    const campaignsB = new Map([
      ...campaigns,
      ['urn:li:sponsoredCampaign:2', { name: 'Boost Q3', objectiveType: 'ENGAGEMENT', status: 'ACTIVE' }],
    ])
    const rows = computePaidPerformanceRows(
      [row(), row({ campaignId: 'urn:li:sponsoredCampaign:2', creativeId: 'urn:li:sponsoredCreative:2' })],
      campaignsB,
      creatives,
    )

    const result = aggregateByCreative(rows)

    expect(result).toHaveLength(2)
    expect(result.map((r) => r.campaignId).sort()).toEqual([
      'urn:li:sponsoredCampaign:1',
      'urn:li:sponsoredCampaign:2',
    ])
  })

  it('returns null for derived metrics when the denominator is 0', () => {
    const rows = computePaidPerformanceRows(
      [row({ impressions: 0, clicks: 0, reach: 0, likes: 0, comments: 0, shares: 0 })],
      campaigns,
      creatives,
    )

    const [result] = aggregateByCreative(rows)

    expect(result.frequency).toBeNull()
    expect(result.ctr).toBeNull()
    expect(result.engagementRate).toBeNull()
    expect(result.cpc).toBeNull()
    expect(result.cpm).toBeNull()
    expect(result.costPerEngagement).toBeNull()
  })
})
