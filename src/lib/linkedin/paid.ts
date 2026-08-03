import { chunked, dateRangeFragment, getAll, msToDateStr, urnList } from './api'

const LOOKBACK_DAYS = 365

export interface CampaignRow {
  id: string
  adAccountId: string
  campaignGroupId: string | null
  name: string
  objectiveType: string | null
  format: string | null
  status: string | null
  budgetAmount: number | null
  currency: string | null
  startDate: string | null
  endDate: string | null
}

export interface CreativeRow {
  id: string
  campaignId: string
  format: string | null
  headline: string | null
  pillar: string | null
  status: string | null
  startDate: string | null
}

export interface PaidAnalyticsRow {
  creativeId: string
  campaignId: string
  dateStart: string
  dateEnd: string
  impressions: number
  clicks: number
  reach: number
  likes: number
  comments: number
  shares: number
  follows: number
  cost: number
}

export interface FetchLinkedInPaidResult {
  campaigns: CampaignRow[]
  creatives: CreativeRow[]
  analyticsRows: PaidAnalyticsRow[]
  usedFallback: boolean
}

interface RawCampaign {
  id: number | string
  account?: string
  campaignGroup?: string
  name: string
  objectiveType?: string
  format?: string
  status?: string
  totalBudget?: { amount?: string; currencyCode?: string }
  runSchedule?: { start?: number; end?: number }
}

interface RawCreative {
  id: string
  campaign?: string
  format?: string
  name?: string
  intendedStatus?: string
  review?: { status?: string }
  createdAt?: number
}

interface RawDatePart {
  year: number
  month: number
  day: number
}

interface RawAnalyticsRow {
  pivotValues?: string[]
  dateRange?: { start?: RawDatePart; end?: RawDatePart }
  impressions?: number
  clicks?: number
  approximateMemberReach?: number
  likes?: number
  comments?: number
  shares?: number
  follows?: number
  costInLocalCurrency?: string
}

export function transformCampaign(raw: RawCampaign): CampaignRow {
  const schedule = raw.runSchedule ?? {}
  const budget = raw.totalBudget ?? {}
  return {
    id: `urn:li:sponsoredCampaign:${raw.id}`,
    adAccountId: raw.account ?? '',
    campaignGroupId: raw.campaignGroup ?? null,
    name: raw.name,
    objectiveType: raw.objectiveType ?? null,
    format: raw.format ?? null,
    status: raw.status ?? null,
    budgetAmount: budget.amount ? Number(budget.amount) : null,
    currency: budget.currencyCode ?? null,
    startDate: msToDateStr(schedule.start),
    endDate: msToDateStr(schedule.end),
  }
}

export function transformCreative(raw: RawCreative): CreativeRow {
  return {
    id: raw.id,
    campaignId: raw.campaign ?? '',
    format: raw.format ?? null,
    headline: raw.name ?? null,
    pillar: null,
    status: raw.intendedStatus ?? raw.review?.status ?? null,
    startDate: msToDateStr(raw.createdAt),
  }
}

function formatDatePart(p?: RawDatePart): string | null {
  if (!p) return null
  const y = String(p.year).padStart(4, '0')
  const m = String(p.month).padStart(2, '0')
  const d = String(p.day).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Returns `null` when the row's creative isn't part of the campaign set we
 * fetched creatives for — mirrors the Python collector's `if row["campaignId"]`
 * filter, which drops analytics rows for creatives outside our account.
 */
export function transformAnalyticsRow(
  raw: RawAnalyticsRow,
  creativeToCampaign: Map<string, string>,
): PaidAnalyticsRow | null {
  const creativeId = raw.pivotValues?.[0]
  if (!creativeId) return null

  const campaignId = creativeToCampaign.get(creativeId)
  if (!campaignId) return null

  const dateStart = formatDatePart(raw.dateRange?.start)
  const dateEnd = formatDatePart(raw.dateRange?.end)
  if (!dateStart || !dateEnd) return null

  return {
    creativeId,
    campaignId,
    dateStart,
    dateEnd,
    impressions: raw.impressions ?? 0,
    clicks: raw.clicks ?? 0,
    reach: raw.approximateMemberReach ?? 0,
    likes: raw.likes ?? 0,
    comments: raw.comments ?? 0,
    shares: raw.shares ?? 0,
    follows: raw.follows ?? 0,
    cost: raw.costInLocalCurrency ? Number(raw.costInLocalCurrency) : 0,
  }
}

export async function fetchLinkedInPaid(): Promise<FetchLinkedInPaidResult> {
  const adAccountUrn = process.env.LINKEDIN_AD_ACCOUNT_URN
  const accessToken = process.env.LINKEDIN_ACCESS_TOKEN

  if (!adAccountUrn || !accessToken) {
    return { campaigns: [], creatives: [], analyticsRows: [], usedFallback: true }
  }

  const accountId = adAccountUrn.split(':').pop() as string

  const rawCampaigns = await getAll(`/adAccounts/${accountId}/adCampaigns`, 'q=search')
  const campaigns = rawCampaigns.map((c) => transformCampaign(c as unknown as RawCampaign))
  const campaignUrns = campaigns.map((c) => c.id)

  const rawCreatives: Record<string, unknown>[] = []
  for (const chunk of chunked(campaignUrns, 20)) {
    const page = await getAll(`/adAccounts/${accountId}/creatives`, `q=criteria&campaigns=${urnList(chunk)}`)
    rawCreatives.push(...page)
  }
  const creatives = rawCreatives.map((cr) => transformCreative(cr as unknown as RawCreative))
  const creativeToCampaign = new Map(creatives.map((cr) => [cr.id, cr.campaignId]))

  const endDate = new Date()
  endDate.setUTCHours(0, 0, 0, 0)
  const startDate = new Date(endDate)
  startDate.setUTCDate(startDate.getUTCDate() - LOOKBACK_DAYS)

  const fields = [
    'impressions',
    'clicks',
    'likes',
    'comments',
    'shares',
    'follows',
    'costInLocalCurrency',
    'dateRange',
    'pivotValues',
    'approximateMemberReach',
  ].join(',')
  const analyticsQuery =
    `q=analytics&pivot=CREATIVE&timeGranularity=DAILY` +
    `&dateRange=${dateRangeFragment(startDate, endDate)}` +
    `&accounts=${urnList([adAccountUrn])}` +
    `&fields=${fields}`

  // page/max bumped from the getAll defaults (50/20 -> 1,000 rows) because a
  // 365-day daily-granularity window across multiple creatives can exceed
  // that cap; 100/50 covers ~5,000 rows before silently truncating older data.
  const rawAnalytics = await getAll('/adAnalytics', analyticsQuery, 100, 50)
  const analyticsRows = rawAnalytics
    .map((r) => transformAnalyticsRow(r as unknown as RawAnalyticsRow, creativeToCampaign))
    .filter((row): row is PaidAnalyticsRow => row !== null)

  return { campaigns, creatives, analyticsRows, usedFallback: false }
}
