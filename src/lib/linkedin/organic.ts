import { chunked, getAll, msToDateStr, urnList } from './api'

const POST_COUNT = 50 // most recent posts; TODO: paginate full history
const STATS_CHUNK_SIZE = 20
const FOLLOWER_LOOKBACK_DAYS = 90

export interface OrganicPostRow {
  id: string
  publishedAt: string | null
  type: string | null
  headline: string | null
  impressions: number
  clicks: number
  likes: number
  comments: number
  shares: number
  engagementRate: number
  wasBoosted: boolean
  boostedByCampaignId: string | null
}

export interface FollowerStatsRow {
  dateStart: string
  dateEnd: string
  organicFollowerGain: number
  paidFollowerGain: number
  totalFollowers: number
}

export interface FetchLinkedInOrganicResult {
  posts: OrganicPostRow[]
  followerStats: FollowerStatsRow[]
  usedFallback: boolean
}

interface RawPost {
  id: string
  publishedAt?: number
  createdAt?: number
  commentary?: string
  content?: { carousel?: unknown; article?: unknown; multiImage?: unknown; media?: { id?: string } }
  adContext?: { isDsc?: boolean }
}

interface RawShareStatistics {
  impressionCount?: number
  clickCount?: number
  likeCount?: number
  commentCount?: number
  shareCount?: number
  engagement?: number
}

export function postType(content: RawPost['content']): string {
  const c = content ?? {}
  if ('carousel' in c) return 'CAROUSEL'
  if ('article' in c) return 'ARTICLE'
  const mediaId = c.media?.id ?? ''
  if (mediaId.startsWith('urn:li:video:')) return 'VIDEO'
  if (mediaId.startsWith('urn:li:image:')) return 'IMAGE'
  if ('multiImage' in c) return 'IMAGE'
  return 'TEXT'
}

export function transformPost(raw: RawPost, statsById: Map<string, RawShareStatistics>): OrganicPostRow {
  const stats = statsById.get(raw.id) ?? {}
  const commentaryLines = (raw.commentary ?? '').trim().split(/\r?\n/)
  const headline = raw.commentary?.trim() ? commentaryLines[0].slice(0, 150) : null

  return {
    id: raw.id,
    publishedAt: msToDateStr(raw.publishedAt || raw.createdAt),
    type: postType(raw.content),
    headline,
    impressions: stats.impressionCount ?? 0,
    clicks: stats.clickCount ?? 0,
    likes: stats.likeCount ?? 0,
    comments: stats.commentCount ?? 0,
    shares: stats.shareCount ?? 0,
    engagementRate: stats.engagement ?? 0,
    wasBoosted: Boolean(raw.adContext?.isDsc ?? false),
    boostedByCampaignId: null,
  }
}

interface FollowerCountBucket {
  followerCounts?: { organicFollowerCount?: number; paidFollowerCount?: number }
}

interface FollowerSeriesElement {
  followerGains?: { organicFollowerGain?: number; paidFollowerGain?: number }
  timeRange?: { start?: number; end?: number }
}

export function totalFollowersFromLifetime(lifetimeBuckets: FollowerCountBucket[]): number {
  let total = 0
  for (const bucket of lifetimeBuckets) {
    const counts = bucket.followerCounts ?? {}
    total += (counts.organicFollowerCount ?? 0) + (counts.paidFollowerCount ?? 0)
  }
  return total
}

/**
 * Reconstructs the running `totalFollowers` for each period in `series` by
 * walking backward from the current lifetime total (`totalNow`), then
 * forward again applying each period's gain — mirrors the Python collector,
 * which has no "historical total" endpoint, only current totals + daily gains.
 */
export function computeFollowerStatsRows(totalNow: number, series: FollowerSeriesElement[]): FollowerStatsRow[] {
  const totalGain = series.reduce((sum, el) => {
    const gains = el.followerGains ?? {}
    return sum + (gains.organicFollowerGain ?? 0) + (gains.paidFollowerGain ?? 0)
  }, 0)

  let runningTotal = totalNow - totalGain
  const rows: FollowerStatsRow[] = []

  for (const el of series) {
    const gains = el.followerGains ?? {}
    const organicGain = gains.organicFollowerGain ?? 0
    const paidGain = gains.paidFollowerGain ?? 0
    runningTotal += organicGain + paidGain

    const timeRange = el.timeRange ?? {}
    const dateStart = msToDateStr(timeRange.start)
    const dateEnd = msToDateStr(timeRange.end)
    if (!dateStart || !dateEnd) continue

    rows.push({
      dateStart,
      dateEnd,
      organicFollowerGain: organicGain,
      paidFollowerGain: paidGain,
      totalFollowers: runningTotal,
    })
  }

  return rows
}

async function fetchShareStats(rawPosts: RawPost[], orgUrnEnc: string): Promise<Map<string, RawShareStatistics>> {
  const shareIds = rawPosts.filter((p) => p.id.startsWith('urn:li:share:')).map((p) => p.id)
  const ugcIds = rawPosts.filter((p) => p.id.startsWith('urn:li:ugcPost:')).map((p) => p.id)

  const statsById = new Map<string, RawShareStatistics>()

  for (const chunk of chunked(shareIds, STATS_CHUNK_SIZE)) {
    const elements = await getAll(
      '/organizationalEntityShareStatistics',
      `q=organizationalEntity&organizationalEntity=${orgUrnEnc}&shares=${urnList(chunk)}`,
      STATS_CHUNK_SIZE,
      1,
    )
    for (const el of elements as { share: string; totalShareStatistics?: RawShareStatistics }[]) {
      statsById.set(el.share, el.totalShareStatistics ?? {})
    }
  }

  for (const chunk of chunked(ugcIds, STATS_CHUNK_SIZE)) {
    const elements = await getAll(
      '/organizationalEntityShareStatistics',
      `q=organizationalEntity&organizationalEntity=${orgUrnEnc}&ugcPosts=${urnList(chunk)}`,
      STATS_CHUNK_SIZE,
      1,
    )
    for (const el of elements as { ugcPost: string; totalShareStatistics?: RawShareStatistics }[]) {
      statsById.set(el.ugcPost, el.totalShareStatistics ?? {})
    }
  }

  return statsById
}

async function fetchFollowerStats(orgUrnEnc: string): Promise<FollowerStatsRow[]> {
  const lifetime = await getAll(
    '/organizationalEntityFollowerStatistics',
    `q=organizationalEntity&organizationalEntity=${orgUrnEnc}`,
    1,
    1,
  )
  const totalNow = totalFollowersFromLifetime(
    (lifetime[0]?.followerCountsBySeniority as FollowerCountBucket[] | undefined) ?? [],
  )

  const end = new Date()
  end.setUTCHours(0, 0, 0, 0)
  const start = new Date(end)
  start.setUTCDate(start.getUTCDate() - FOLLOWER_LOOKBACK_DAYS)
  const timeIntervals = `(timeGranularityType:DAY,timeRange:(start:${start.getTime()},end:${end.getTime()}))`

  const series = await getAll(
    '/organizationalEntityFollowerStatistics',
    `q=organizationalEntity&organizationalEntity=${orgUrnEnc}&timeIntervals=${timeIntervals}`,
    100,
    5,
  )

  return computeFollowerStatsRows(totalNow, series as unknown as FollowerSeriesElement[])
}

export async function fetchLinkedInOrganic(): Promise<FetchLinkedInOrganicResult> {
  const orgUrn = process.env.LINKEDIN_ORGANIZATION_URN
  const accessToken = process.env.LINKEDIN_ACCESS_TOKEN

  if (!orgUrn || !accessToken) {
    return { posts: [], followerStats: [], usedFallback: true }
  }

  const orgUrnEnc = encodeURIComponent(orgUrn)

  const rawPosts = (await getAll(
    '/posts',
    `q=author&author=${orgUrnEnc}`,
    POST_COUNT,
    1,
  )) as unknown as RawPost[]
  const statsById = await fetchShareStats(rawPosts, orgUrnEnc)
  const posts = rawPosts.map((p) => transformPost(p, statsById))

  const followerStats = await fetchFollowerStats(orgUrnEnc)

  return { posts, followerStats, usedFallback: false }
}
