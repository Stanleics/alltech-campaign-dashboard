import { describe, expect, it } from 'vitest'
import { monthsElapsed, pacedTarget } from './pacing'

describe('monthsElapsed', () => {
  it('computes elapsed months as days-since-start / 30', () => {
    const start = new Date('2026-07-01T00:00:00Z')
    const today = new Date('2026-08-30T00:00:00Z') // 60 days later
    expect(monthsElapsed(start, today)).toBeCloseTo(2, 5)
  })

  it('returns a negative value when today is before start', () => {
    const start = new Date('2026-07-01T00:00:00Z')
    const today = new Date('2026-06-01T00:00:00Z')
    expect(monthsElapsed(start, today)).toBeLessThan(0)
  })
})

describe('pacedTarget', () => {
  const m3 = 15000
  const m6 = 30000

  it('is 0 at the start (monthsElapsed = 0)', () => {
    expect(pacedTarget(0, m3, m6)).toBe(0)
  })

  it('is 0 for any negative elapsed (pre-launch edge case)', () => {
    expect(pacedTarget(-1, m3, m6)).toBe(0)
  })

  it('is exactly month3Target at monthsElapsed = 3', () => {
    expect(pacedTarget(3, m3, m6)).toBe(m3)
  })

  it('is exactly month6Target at monthsElapsed = 6', () => {
    expect(pacedTarget(6, m3, m6)).toBe(m6)
  })

  it('interpolates linearly halfway through the first segment (1.5 months)', () => {
    expect(pacedTarget(1.5, m3, m6)).toBe(7500) // half of m3
  })

  it('interpolates linearly halfway through the second segment (4.5 months)', () => {
    expect(pacedTarget(4.5, m3, m6)).toBe(22500) // m3 + half of (m6 - m3)
  })

  it('caps at month6Target beyond 6 months', () => {
    expect(pacedTarget(9, m3, m6)).toBe(m6)
  })
})
