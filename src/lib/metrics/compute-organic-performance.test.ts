import { describe, expect, it } from 'vitest'
import { computeOrganicPerformanceRows, type OrganicPostInput } from './compute-organic-performance'

function post(overrides: Partial<OrganicPostInput> = {}): OrganicPostInput {
  return {
    id: 'urn:li:share:1',
    publishedAt: '2026-07-20',
    type: 'IMAGE',
    headline: 'Post orgânico',
    impressions: 500,
    clicks: 10,
    likes: 8,
    comments: 2,
    shares: 1,
    engagementRate: 0.022,
    wasBoosted: false,
    boostedByCampaignId: null,
    ...overrides,
  }
}

describe('computeOrganicPerformanceRows', () => {
  it('passes through post fields unchanged', () => {
    const [result] = computeOrganicPerformanceRows([post()], new Map())
    expect(result).toMatchObject({
      id: 'urn:li:share:1',
      impressions: 500,
      clicks: 10,
      engagementRate: 0.022,
      boostedByCampaignName: null,
    })
  })

  it('resolves boostedByCampaignName from the campaign map when boosted', () => {
    const campaigns = new Map([['urn:li:sponsoredCampaign:1', { name: 'Autoridade Q3' }]])
    const [result] = computeOrganicPerformanceRows(
      [post({ wasBoosted: true, boostedByCampaignId: 'urn:li:sponsoredCampaign:1' })],
      campaigns,
    )
    expect(result.boostedByCampaignName).toBe('Autoridade Q3')
  })

  it('returns null boostedByCampaignName when the referenced campaign is unknown', () => {
    const [result] = computeOrganicPerformanceRows(
      [post({ wasBoosted: true, boostedByCampaignId: 'urn:li:sponsoredCampaign:missing' })],
      new Map(),
    )
    expect(result.boostedByCampaignName).toBeNull()
  })
})
