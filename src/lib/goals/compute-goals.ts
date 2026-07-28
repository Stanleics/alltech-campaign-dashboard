import { prisma } from '@/lib/prisma'
import { KPI_GOALS, type KpiGoalKey } from './constants'
import { monthsElapsed, pacedTarget } from './pacing'

export interface PaidAnalyticsGoalInput {
  impressions: number
  reach: number
  clicks: number
  likes: number
  comments: number
  shares: number
}

export interface FollowerStatsGoalInput {
  organicFollowerGain: number
  paidFollowerGain: number
}

export interface GoalResult {
  key: KpiGoalKey
  label: string
  currentValue: number
  month3Target: number
  month6Target: number
  pacedTargetValue: number
  /** null when there's no campaign yet (pre-launch) or the paced target is still 0. */
  progressPct: number | null
}

function sum<T>(items: T[], pick: (item: T) => number): number {
  return items.reduce((total, item) => total + pick(item), 0)
}

export function computeGoals(
  campaignStartDates: (Date | null)[],
  paidAnalyticsRows: PaidAnalyticsGoalInput[],
  followerStatsRows: FollowerStatsGoalInput[],
  today: Date,
): GoalResult[] {
  const validStartDates = campaignStartDates.filter((d): d is Date => d !== null)
  const month1Start = validStartDates.length > 0 ? new Date(Math.min(...validStartDates.map((d) => d.getTime()))) : null
  const elapsed = month1Start ? monthsElapsed(month1Start, today) : 0

  const totalImpressions = sum(paidAnalyticsRows, (r) => r.impressions)
  const totalReach = sum(paidAnalyticsRows, (r) => r.reach)
  const totalClicks = sum(paidAnalyticsRows, (r) => r.clicks)
  const totalEngagements = sum(paidAnalyticsRows, (r) => r.likes + r.comments + r.shares)
  // Only paid_follower_gain — the KPI is "seguidores ganhos via anúncios", not
  // organic + paid combined (that's a deliberate departure from the Python
  // dashboard's "Seguidores ganhos" card, which sums both).
  const totalPaidFollowerGain = sum(followerStatsRows, (r) => r.paidFollowerGain)

  const currentValues: Record<KpiGoalKey, number> = {
    paidImpressions: totalImpressions,
    paidReach: totalReach,
    frequency: totalReach > 0 ? totalImpressions / totalReach : 0,
    engagementRate: totalImpressions > 0 ? totalEngagements / totalImpressions : 0,
    paidFollowerGain: totalPaidFollowerGain,
    ctr: totalImpressions > 0 ? totalClicks / totalImpressions : 0,
  }

  return KPI_GOALS.map((goal): GoalResult => {
    const currentValue = currentValues[goal.key]
    const pacedTargetValue = pacedTarget(elapsed, goal.month3Target, goal.month6Target)
    const progressPct = month1Start === null || pacedTargetValue <= 0 ? null : (currentValue / pacedTargetValue) * 100

    return {
      key: goal.key,
      label: goal.label,
      currentValue,
      month3Target: goal.month3Target,
      month6Target: goal.month6Target,
      pacedTargetValue,
      progressPct,
    }
  })
}

export async function getGoals(startDate: Date, endDate: Date, today: Date = new Date()): Promise<GoalResult[]> {
  const [campaigns, analyticsRows, followerRows] = await Promise.all([
    prisma.dimCampaign.findMany({ select: { startDate: true } }),
    prisma.factPaidAnalytics.findMany({ where: { dateStart: { gte: startDate }, dateEnd: { lte: endDate } } }),
    prisma.factFollowerStats.findMany({ where: { dateStart: { gte: startDate }, dateEnd: { lte: endDate } } }),
  ])

  const paidAnalyticsInputs: PaidAnalyticsGoalInput[] = analyticsRows.map((a) => ({
    impressions: Number(a.impressions ?? 0),
    reach: Number(a.reach ?? 0),
    clicks: Number(a.clicks ?? 0),
    likes: Number(a.likes ?? 0),
    comments: Number(a.comments ?? 0),
    shares: Number(a.shares ?? 0),
  }))
  const followerInputs: FollowerStatsGoalInput[] = followerRows.map((f) => ({
    organicFollowerGain: Number(f.organicFollowerGain ?? 0),
    paidFollowerGain: Number(f.paidFollowerGain ?? 0),
  }))

  return computeGoals(
    campaigns.map((c) => c.startDate),
    paidAnalyticsInputs,
    followerInputs,
    today,
  )
}
