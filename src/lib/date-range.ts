export interface DateRangeParams {
  since?: string
  until?: string
}

export interface DateRange {
  since: string
  until: string
}

// The dashboard's audience is Brazil-based, so "today" must mean the
// calendar day in Brazil, not the server/browser's own timezone (Vercel's
// serverless runtime defaults to UTC). Using UTC directly rolls "today" over
// to tomorrow starting at 21:00 BRT (UTC-3).
const DASHBOARD_TIME_ZONE = 'America/Sao_Paulo'

export function toIsoDateInTimeZone(date: Date, timeZone: string = DASHBOARD_TIME_ZONE): string {
  // en-CA formats as YYYY-MM-DD, the ISO date shape this app uses for since/until.
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(
    date,
  )
}

export function resolveDateRange(params: DateRangeParams, now: Date = new Date()): DateRange {
  if (params.since && params.until) {
    return { since: params.since, until: params.until }
  }

  const until = new Date(now)
  const since = new Date(until)
  since.setDate(since.getDate() - 30)

  return {
    since: toIsoDateInTimeZone(since),
    until: toIsoDateInTimeZone(until),
  }
}

export interface DateBounds {
  startDate: Date
  endDate: Date
}

/**
 * Converts a date-only DateRange (e.g. from resolveDateRange) into Date
 * objects suitable for use as inclusive bounds against real timestamp
 * columns (e.g. Prisma `gte`/`lte` filters on a DateTime field).
 *
 * `since` parses as-is: a date-only ISO string is UTC midnight at the start
 * of that day, which is correct for a `gte` lower bound.
 *
 * `until` is adjusted to the end of that day (23:59:59.999 UTC) so it is
 * inclusive of the entire day when used as an `lte` upper bound — otherwise
 * a naive `new Date(until)` would parse as midnight and exclude every
 * timestamp on that day except the exact instant of midnight.
 */
export function toDateBounds(range: DateRange): DateBounds {
  const startDate = new Date(range.since)
  const endDate = new Date(range.until)
  endDate.setUTCHours(23, 59, 59, 999)

  return { startDate, endDate }
}
