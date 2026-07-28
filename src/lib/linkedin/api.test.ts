import { describe, expect, it, vi, afterEach } from 'vitest'
import { chunked, dateRangeFragment, getAll, msToDateStr, urnList } from './api'

describe('urnList', () => {
  it('percent-encodes a single URN inside List(...)', () => {
    // Real org URN for this account — validated against the LinkedIn API in the Python collector.
    expect(urnList(['urn:li:organization:10445000'])).toBe('List(urn%3Ali%3Aorganization%3A10445000)')
  })

  it('joins multiple URNs with a literal, non-encoded comma', () => {
    expect(urnList(['urn:li:sponsoredCampaign:1', 'urn:li:sponsoredCampaign:2'])).toBe(
      'List(urn%3Ali%3AsponsoredCampaign%3A1,urn%3Ali%3AsponsoredCampaign%3A2)',
    )
  })

  it('returns List() for an empty array', () => {
    expect(urnList([])).toBe('List()')
  })
})

describe('dateRangeFragment', () => {
  it('renders a Rest.li date range fragment from UTC calendar dates', () => {
    const start = new Date(Date.UTC(2026, 3, 30)) // April 30, 2026
    const end = new Date(Date.UTC(2026, 6, 29)) // July 29, 2026 (month is 0-indexed)
    expect(dateRangeFragment(start, end)).toBe('(start:(day:30,month:4,year:2026),end:(day:29,month:7,year:2026))')
  })
})

describe('msToDateStr', () => {
  it('converts epoch ms to a UTC date string', () => {
    const ms = Date.UTC(2026, 5, 29) // June 29, 2026 UTC midnight
    expect(msToDateStr(ms)).toBe('2026-06-29')
  })

  it('returns null for null or undefined', () => {
    expect(msToDateStr(null)).toBeNull()
    expect(msToDateStr(undefined)).toBeNull()
  })
})

describe('chunked', () => {
  it('splits an array into chunks of the given size', () => {
    expect(chunked([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]])
  })

  it('returns an empty array for empty input', () => {
    expect(chunked([], 3)).toEqual([])
  })
})

describe('getAll', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('follows start/count pagination until a short page is returned', async () => {
    const pages = [
      { elements: [{ id: 1 }, { id: 2 }], paging: {} },
      { elements: [{ id: 3 }], paging: {} },
    ]
    const fetchMock = vi.fn().mockImplementation(async (url: string) => {
      const page = pages.shift()
      return {
        ok: true,
        json: async () => page,
      }
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await getAll('/posts', 'q=author&author=urn', 2, 5)

    expect(result).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }])
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://api.linkedin.com/rest/posts?q=author&author=urn&start=0&count=2',
    )
    expect(fetchMock.mock.calls[1][0]).toBe(
      'https://api.linkedin.com/rest/posts?q=author&author=urn&start=2&count=2',
    )
  })

  it('stops once paging.total is reached even on a full page', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ elements: [{ id: 1 }, { id: 2 }], paging: { total: 2 } }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await getAll('/posts', 'q=author', 2, 5)

    expect(result).toEqual([{ id: 1 }, { id: 2 }])
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('throws on a non-ok response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 401, text: async () => 'unauthorized' }),
    )

    await expect(getAll('/posts', 'q=author')).rejects.toThrow('LinkedIn API error: 401 unauthorized')
  })
})
