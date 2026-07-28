import { describe, expect, it } from 'vitest'
import { transformAnalyticsRow, transformCampaign, transformCreative } from './paid'

describe('transformCampaign', () => {
  it('maps a raw adCampaigns element into a CampaignRow', () => {
    const row = transformCampaign({
      id: 123456,
      account: 'urn:li:sponsoredAccount:551772607',
      campaignGroup: 'urn:li:sponsoredCampaignGroup:1',
      name: 'Alltech - Autoridade Q3',
      objectiveType: 'BRAND_AWARENESS',
      format: 'SPONSORED_UPDATES',
      status: 'ACTIVE',
      totalBudget: { amount: '5000.00', currencyCode: 'BRL' },
      runSchedule: { start: Date.UTC(2026, 6, 7), end: Date.UTC(2026, 11, 31) },
    })

    expect(row).toEqual({
      id: 'urn:li:sponsoredCampaign:123456',
      adAccountId: 'urn:li:sponsoredAccount:551772607',
      campaignGroupId: 'urn:li:sponsoredCampaignGroup:1',
      name: 'Alltech - Autoridade Q3',
      objectiveType: 'BRAND_AWARENESS',
      format: 'SPONSORED_UPDATES',
      status: 'ACTIVE',
      budgetAmount: 5000,
      currency: 'BRL',
      startDate: '2026-07-07',
      endDate: '2026-12-31',
    })
  })

  it('defaults optional fields to null when absent', () => {
    const row = transformCampaign({ id: 1, name: 'Sem budget/schedule' })
    expect(row.campaignGroupId).toBeNull()
    expect(row.budgetAmount).toBeNull()
    expect(row.currency).toBeNull()
    expect(row.startDate).toBeNull()
    expect(row.endDate).toBeNull()
  })
})

describe('transformCreative', () => {
  it('maps a raw creatives element into a CreativeRow', () => {
    const row = transformCreative({
      id: 'urn:li:sponsoredCreative:987',
      campaign: 'urn:li:sponsoredCampaign:123456',
      format: 'SINGLE_IMAGE',
      name: 'Criativo - carrossel gestores',
      intendedStatus: 'ACTIVE',
      createdAt: Date.UTC(2026, 6, 1),
    })

    expect(row).toEqual({
      id: 'urn:li:sponsoredCreative:987',
      campaignId: 'urn:li:sponsoredCampaign:123456',
      format: 'SINGLE_IMAGE',
      headline: 'Criativo - carrossel gestores',
      pillar: null,
      status: 'ACTIVE',
      startDate: '2026-07-01',
    })
  })

  it('falls back to review.status when intendedStatus is absent', () => {
    const row = transformCreative({
      id: 'urn:li:sponsoredCreative:1',
      campaign: 'urn:li:sponsoredCampaign:1',
      review: { status: 'PENDING' },
    })
    expect(row.status).toBe('PENDING')
  })
})

describe('transformAnalyticsRow', () => {
  const creativeToCampaign = new Map([['urn:li:sponsoredCreative:987', 'urn:li:sponsoredCampaign:123456']])

  it('maps a raw adAnalytics element into a PaidAnalyticsRow', () => {
    const row = transformAnalyticsRow(
      {
        pivotValues: ['urn:li:sponsoredCreative:987'],
        dateRange: { start: { year: 2026, month: 7, day: 20 }, end: { year: 2026, month: 7, day: 20 } },
        impressions: 1200,
        clicks: 30,
        approximateMemberReach: 900,
        likes: 5,
        comments: 1,
        shares: 2,
        follows: 3,
        costInLocalCurrency: '42.50',
      },
      creativeToCampaign,
    )

    expect(row).toEqual({
      creativeId: 'urn:li:sponsoredCreative:987',
      campaignId: 'urn:li:sponsoredCampaign:123456',
      dateStart: '2026-07-20',
      dateEnd: '2026-07-20',
      impressions: 1200,
      clicks: 30,
      reach: 900,
      likes: 5,
      comments: 1,
      shares: 2,
      follows: 3,
      cost: 42.5,
    })
  })

  it('returns null when the creative is not in the known campaign set', () => {
    const row = transformAnalyticsRow(
      {
        pivotValues: ['urn:li:sponsoredCreative:unknown'],
        dateRange: { start: { year: 2026, month: 7, day: 20 }, end: { year: 2026, month: 7, day: 20 } },
      },
      creativeToCampaign,
    )
    expect(row).toBeNull()
  })

  it('returns null when pivotValues is missing', () => {
    expect(transformAnalyticsRow({}, creativeToCampaign)).toBeNull()
  })

  it('defaults missing metrics to 0 and missing cost to 0', () => {
    const row = transformAnalyticsRow(
      {
        pivotValues: ['urn:li:sponsoredCreative:987'],
        dateRange: { start: { year: 2026, month: 1, day: 5 }, end: { year: 2026, month: 1, day: 5 } },
      },
      creativeToCampaign,
    )
    expect(row).toMatchObject({ impressions: 0, clicks: 0, reach: 0, cost: 0 })
  })
})
