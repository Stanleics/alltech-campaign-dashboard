// Rest.li 2.0 encoding rules used by the LinkedIn Marketing API: the
// structural characters of lists/records (`(`, `)`, `,`, the `:` that
// separates a key from its value) must NOT be percent-encoded, but the
// colons inside a URN (a value, not structure) do need to be `%3A` — so the
// querystrings below are built by hand instead of a URLSearchParams, which
// would encode everything.
const BASE = 'https://api.linkedin.com/rest'

function headers(): Record<string, string> {
  return {
    Authorization: `Bearer ${process.env.LINKEDIN_ACCESS_TOKEN}`,
    'LinkedIn-Version': process.env.LINKEDIN_API_VERSION ?? '202601',
    'X-Restli-Protocol-Version': '2.0.0',
  }
}

/** `List(...)` with each URN individually percent-encoded (colons -> %3A). */
export function urnList(urns: string[]): string {
  return `List(${urns.map((u) => encodeURIComponent(u)).join(',')})`
}

/** `(start:(day:D,month:M,year:Y),end:(...))` from UTC calendar dates. */
export function dateRangeFragment(startDate: Date, endDate: Date): string {
  function part(d: Date): string {
    return `(day:${d.getUTCDate()},month:${d.getUTCMonth() + 1},year:${d.getUTCFullYear()})`
  }
  return `(start:${part(startDate)},end:${part(endDate)})`
}

export function msToDateStr(ms: number | null | undefined): string | null {
  if (ms === null || ms === undefined) return null
  return new Date(ms).toISOString().slice(0, 10)
}

export function chunked<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size))
  }
  return chunks
}

/**
 * GET with start/count pagination. `query` is a ready-made Rest.li
 * querystring (no leading `?`). Returns the concatenated `elements` list.
 */
export async function getAll(
  path: string,
  query: string,
  pageSize = 50,
  maxPages = 20,
): Promise<Record<string, unknown>[]> {
  const elements: Record<string, unknown>[] = []
  let start = 0

  for (let i = 0; i < maxPages; i++) {
    const url = `${BASE}${path}?${query}&start=${start}&count=${pageSize}`
    const response = await fetch(url, { headers: headers() })
    if (!response.ok) {
      throw new Error(`LinkedIn API error: ${response.status} ${await response.text()}`)
    }
    const data = (await response.json()) as {
      elements?: Record<string, unknown>[]
      paging?: { total?: number }
    }
    const page = data.elements ?? []
    elements.push(...page)
    const total = data.paging?.total
    start += pageSize
    if (page.length < pageSize || (total !== undefined && start >= total)) {
      break
    }
  }

  return elements
}
