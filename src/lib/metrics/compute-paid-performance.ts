import { prisma } from '@/lib/prisma'

export interface PaidAnalyticsInput {
  campaignId: string
  creativeId: string
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

export interface CampaignInfo {
  name: string
  objectiveType: string | null
  status: string | null
}

export interface CreativeInfo {
  headline: string | null
  pillar: string | null
}

export interface PaidPerformanceRow {
  campaignId: string
  campaignName: string
  objectiveType: string | null
  campaignStatus: string | null
  creativeId: string
  creativeHeadline: string | null
  pillar: string | null
  dateStart: string
  dateEnd: string
  impressions: number
  reach: number
  frequency: number | null
  clicks: number
  ctr: number | null
  engagements: number
  engagementRate: number | null
  follows: number
  cost: number
  cpc: number | null
  cpm: number | null
  costPerEngagement: number | null
}

/** Replicates `vw_paid_performance` from the Python dashboard's schema.sql. */
export function computePaidPerformanceRows(
  analytics: PaidAnalyticsInput[],
  campaigns: Map<string, CampaignInfo>,
  creatives: Map<string, CreativeInfo>,
): PaidPerformanceRow[] {
  return analytics
    .map((a): PaidPerformanceRow | null => {
      const campaign = campaigns.get(a.campaignId)
      const creative = creatives.get(a.creativeId)
      if (!campaign || !creative) return null

      const engagements = a.likes + a.comments + a.shares

      return {
        campaignId: a.campaignId,
        campaignName: campaign.name,
        objectiveType: campaign.objectiveType,
        campaignStatus: campaign.status,
        creativeId: a.creativeId,
        creativeHeadline: creative.headline,
        pillar: creative.pillar,
        dateStart: a.dateStart,
        dateEnd: a.dateEnd,
        impressions: a.impressions,
        reach: a.reach,
        frequency: a.reach > 0 ? a.impressions / a.reach : null,
        clicks: a.clicks,
        ctr: a.impressions > 0 ? a.clicks / a.impressions : null,
        engagements,
        engagementRate: a.impressions > 0 ? engagements / a.impressions : null,
        follows: a.follows,
        cost: a.cost,
        cpc: a.clicks > 0 ? a.cost / a.clicks : null,
        cpm: a.impressions > 0 ? (a.cost / a.impressions) * 1000 : null,
        costPerEngagement: engagements > 0 ? a.cost / engagements : null,
      }
    })
    .filter((row): row is PaidPerformanceRow => row !== null)
}

export interface CreativePerformanceRow {
  campaignId: string
  campaignName: string
  objectiveType: string | null
  campaignStatus: string | null
  creativeId: string
  creativeHeadline: string | null
  impressions: number
  reach: number
  frequency: number | null
  clicks: number
  ctr: number | null
  engagements: number
  engagementRate: number | null
  follows: number
  cost: number
  cpc: number | null
  cpm: number | null
  costPerEngagement: number | null
}

/** Rolls the per-creative-per-day rows up to one row per creative, covering the whole period they were fetched for. */
export function aggregateByCreative(rows: PaidPerformanceRow[]): CreativePerformanceRow[] {
  interface Totals {
    campaignId: string
    campaignName: string
    objectiveType: string | null
    campaignStatus: string | null
    creativeHeadline: string | null
    impressions: number
    reach: number
    clicks: number
    engagements: number
    follows: number
    cost: number
  }

  const totals = new Map<string, Totals>()

  for (const r of rows) {
    const t = totals.get(r.creativeId) ?? {
      campaignId: r.campaignId,
      campaignName: r.campaignName,
      objectiveType: r.objectiveType,
      campaignStatus: r.campaignStatus,
      creativeHeadline: r.creativeHeadline,
      impressions: 0,
      reach: 0,
      clicks: 0,
      engagements: 0,
      follows: 0,
      cost: 0,
    }
    t.impressions += r.impressions
    t.reach += r.reach
    t.clicks += r.clicks
    t.engagements += r.engagements
    t.follows += r.follows
    t.cost += r.cost
    totals.set(r.creativeId, t)
  }

  return Array.from(totals.entries())
    .map(([creativeId, t]) => ({
      campaignId: t.campaignId,
      campaignName: t.campaignName,
      objectiveType: t.objectiveType,
      campaignStatus: t.campaignStatus,
      creativeId,
      creativeHeadline: t.creativeHeadline,
      impressions: t.impressions,
      reach: t.reach,
      frequency: t.reach > 0 ? t.impressions / t.reach : null,
      clicks: t.clicks,
      ctr: t.impressions > 0 ? t.clicks / t.impressions : null,
      engagements: t.engagements,
      engagementRate: t.impressions > 0 ? t.engagements / t.impressions : null,
      follows: t.follows,
      cost: t.cost,
      cpc: t.clicks > 0 ? t.cost / t.clicks : null,
      cpm: t.impressions > 0 ? (t.cost / t.impressions) * 1000 : null,
      costPerEngagement: t.engagements > 0 ? t.cost / t.engagements : null,
    }))
    .sort((a, b) => a.campaignName.localeCompare(b.campaignName) || b.cost - a.cost)
}

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export async function getPaidPerformance(startDate: Date, endDate: Date): Promise<PaidPerformanceRow[]> {
  const [analyticsRows, campaignRows, creativeRows] = await Promise.all([
    prisma.factPaidAnalytics.findMany({
      where: { dateStart: { gte: startDate }, dateEnd: { lte: endDate } },
    }),
    prisma.dimCampaign.findMany(),
    prisma.dimCreative.findMany(),
  ])

  const campaigns = new Map<string, CampaignInfo>(
    campaignRows.map((c) => [c.id, { name: c.name, objectiveType: c.objectiveType, status: c.status }]),
  )
  const creatives = new Map<string, CreativeInfo>(
    creativeRows.map((c) => [c.id, { headline: c.headline, pillar: c.pillar }]),
  )
  const analytics: PaidAnalyticsInput[] = analyticsRows.map((a) => ({
    campaignId: a.campaignId,
    creativeId: a.creativeId,
    dateStart: toIsoDate(a.dateStart),
    dateEnd: toIsoDate(a.dateEnd),
    impressions: Number(a.impressions ?? 0),
    clicks: Number(a.clicks ?? 0),
    reach: Number(a.reach ?? 0),
    likes: Number(a.likes ?? 0),
    comments: Number(a.comments ?? 0),
    shares: Number(a.shares ?? 0),
    follows: Number(a.follows ?? 0),
    cost: Number(a.cost ?? 0),
  }))

  return computePaidPerformanceRows(analytics, campaigns, creatives)
}
