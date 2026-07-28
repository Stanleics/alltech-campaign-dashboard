import { describe, expect, it } from 'vitest'
import { computeGoals } from './compute-goals'

describe('computeGoals', () => {
  it('sums paidFollowerGain only from paid_follower_gain, never organic + paid', () => {
    // Regression test: the Python dashboard's "Seguidores ganhos" card sums
    // organic + paid. The slide's KPI is "seguidores ganhos via anúncios" —
    // paid only. A large organic gain here must not leak into the total.
    const results = computeGoals(
      [new Date('2026-07-01T00:00:00Z')],
      [],
      [
        { organicFollowerGain: 1000, paidFollowerGain: 12 },
        { organicFollowerGain: 500, paidFollowerGain: 8 },
      ],
      new Date('2026-07-15T00:00:00Z'),
    )

    const followerGoal = results.find((r) => r.key === 'paidFollowerGain')!
    expect(followerGoal.currentValue).toBe(20)
  })

  it('computes month1Start as the earliest campaign start date, ignoring nulls', () => {
    const results = computeGoals(
      [null, new Date('2026-07-10T00:00:00Z'), new Date('2026-07-01T00:00:00Z')],
      [{ impressions: 3000, reach: 1000, clicks: 6, likes: 0, comments: 0, shares: 0 }],
      [],
      new Date('2026-08-01T00:00:00Z'), // 31 days after 2026-07-01 ~= 1.03 months
    )

    const impressionsGoal = results.find((r) => r.key === 'paidImpressions')!
    expect(impressionsGoal.currentValue).toBe(3000)
    // paced target at ~1.03 months toward month3Target=15000 should be > 0 and < 15000
    expect(impressionsGoal.pacedTargetValue).toBeGreaterThan(0)
    expect(impressionsGoal.pacedTargetValue).toBeLessThan(15000)
    expect(impressionsGoal.progressPct).not.toBeNull()
  })

  it('returns progressPct = null when there is no campaign yet (pre-launch)', () => {
    const results = computeGoals([], [], [], new Date('2026-07-15T00:00:00Z'))
    for (const r of results) {
      expect(r.progressPct).toBeNull()
      expect(r.pacedTargetValue).toBe(0)
    }
  })

  it('computes frequency, engagementRate and ctr as derived rates with 0-denominator guards', () => {
    const withData = computeGoals(
      [new Date('2026-07-01T00:00:00Z')],
      [{ impressions: 1000, reach: 250, clicks: 4, likes: 5, comments: 2, shares: 1 }],
      [],
      new Date('2026-07-01T00:00:00Z'),
    )
    expect(withData.find((r) => r.key === 'frequency')!.currentValue).toBe(4) // 1000/250
    expect(withData.find((r) => r.key === 'engagementRate')!.currentValue).toBe(0.008) // 8/1000
    expect(withData.find((r) => r.key === 'ctr')!.currentValue).toBe(0.004) // 4/1000

    const noData = computeGoals([new Date('2026-07-01T00:00:00Z')], [], [], new Date('2026-07-01T00:00:00Z'))
    expect(noData.find((r) => r.key === 'frequency')!.currentValue).toBe(0)
    expect(noData.find((r) => r.key === 'engagementRate')!.currentValue).toBe(0)
    expect(noData.find((r) => r.key === 'ctr')!.currentValue).toBe(0)
  })

  it('returns all 6 KPIs from KPI_GOALS in order', () => {
    const results = computeGoals([], [], [], new Date())
    expect(results.map((r) => r.key)).toEqual([
      'paidImpressions',
      'paidReach',
      'frequency',
      'engagementRate',
      'paidFollowerGain',
      'ctr',
    ])
  })
})
