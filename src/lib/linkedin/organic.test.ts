import { describe, expect, it } from 'vitest'
import { computeFollowerStatsRows, postType, totalFollowersFromLifetime, transformPost } from './organic'

describe('postType', () => {
  it('detects CAROUSEL', () => {
    expect(postType({ carousel: {} })).toBe('CAROUSEL')
  })
  it('detects ARTICLE', () => {
    expect(postType({ article: {} })).toBe('ARTICLE')
  })
  it('detects VIDEO from a video media urn', () => {
    expect(postType({ media: { id: 'urn:li:video:123' } })).toBe('VIDEO')
  })
  it('detects IMAGE from an image media urn', () => {
    expect(postType({ media: { id: 'urn:li:image:123' } })).toBe('IMAGE')
  })
  it('detects IMAGE from multiImage', () => {
    expect(postType({ multiImage: {} })).toBe('IMAGE')
  })
  it('defaults to TEXT', () => {
    expect(postType({})).toBe('TEXT')
    expect(postType(undefined)).toBe('TEXT')
  })
})

describe('transformPost', () => {
  it('maps a raw post + its share statistics into an OrganicPostRow', () => {
    const statsById = new Map([
      ['urn:li:share:1', { impressionCount: 500, clickCount: 10, likeCount: 8, commentCount: 2, shareCount: 1, engagement: 0.042 }],
    ])
    const row = transformPost(
      {
        id: 'urn:li:share:1',
        publishedAt: Date.UTC(2026, 6, 15),
        commentary: 'Primeira linha do post\nSegunda linha ignorada',
        content: { media: { id: 'urn:li:image:1' } },
      },
      statsById,
    )

    expect(row).toEqual({
      id: 'urn:li:share:1',
      publishedAt: '2026-07-15',
      type: 'IMAGE',
      headline: 'Primeira linha do post',
      impressions: 500,
      clicks: 10,
      likes: 8,
      comments: 2,
      shares: 1,
      engagementRate: 0.042,
      wasBoosted: false,
      boostedByCampaignId: null,
    })
  })

  it('falls back to createdAt when publishedAt is absent', () => {
    const row = transformPost({ id: 'urn:li:share:2', createdAt: Date.UTC(2026, 0, 1) }, new Map())
    expect(row.publishedAt).toBe('2026-01-01')
  })

  it('truncates headline to 150 chars and returns null for empty commentary', () => {
    const long = 'x'.repeat(200)
    const withCommentary = transformPost({ id: 'urn:li:share:3', commentary: long }, new Map())
    expect(withCommentary.headline).toHaveLength(150)

    const withoutCommentary = transformPost({ id: 'urn:li:share:4' }, new Map())
    expect(withoutCommentary.headline).toBeNull()
  })

  it('detects boosted posts from adContext.isDsc', () => {
    const row = transformPost({ id: 'urn:li:share:5', adContext: { isDsc: true } }, new Map())
    expect(row.wasBoosted).toBe(true)
  })

  it('defaults missing stats to 0', () => {
    const row = transformPost({ id: 'urn:li:share:6' }, new Map())
    expect(row).toMatchObject({ impressions: 0, clicks: 0, likes: 0, comments: 0, shares: 0, engagementRate: 0 })
  })
})

describe('totalFollowersFromLifetime', () => {
  it('sums organic + paid across seniority buckets', () => {
    const total = totalFollowersFromLifetime([
      { followerCounts: { organicFollowerCount: 100, paidFollowerCount: 20 } },
      { followerCounts: { organicFollowerCount: 50, paidFollowerCount: 5 } },
    ])
    expect(total).toBe(175)
  })

  it('returns 0 for an empty list', () => {
    expect(totalFollowersFromLifetime([])).toBe(0)
  })
})

describe('computeFollowerStatsRows', () => {
  it('reconstructs a running total by walking back from totalNow, then forward per period', () => {
    // Current lifetime total is 150. Two daily periods gained 5 and 10 followers
    // respectively (organic + paid combined) — so the running total at the end of
    // day 1 must be 150 - 10 = 140, and at the end of day 2 (today) 150.
    const series = [
      {
        followerGains: { organicFollowerGain: 4, paidFollowerGain: 1 },
        timeRange: { start: Date.UTC(2026, 6, 1), end: Date.UTC(2026, 6, 2) },
      },
      {
        followerGains: { organicFollowerGain: 8, paidFollowerGain: 2 },
        timeRange: { start: Date.UTC(2026, 6, 2), end: Date.UTC(2026, 6, 3) },
      },
    ]

    const rows = computeFollowerStatsRows(150, series)

    expect(rows).toEqual([
      {
        dateStart: '2026-07-01',
        dateEnd: '2026-07-02',
        organicFollowerGain: 4,
        paidFollowerGain: 1,
        totalFollowers: 140,
      },
      {
        dateStart: '2026-07-02',
        dateEnd: '2026-07-03',
        organicFollowerGain: 8,
        paidFollowerGain: 2,
        totalFollowers: 150,
      },
    ])
  })

  it('returns an empty array for an empty series', () => {
    expect(computeFollowerStatsRows(100, [])).toEqual([])
  })

  it('skips a period with no time range', () => {
    const rows = computeFollowerStatsRows(10, [{ followerGains: { organicFollowerGain: 1 } }])
    expect(rows).toEqual([])
  })
})
