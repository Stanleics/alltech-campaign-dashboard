import { prisma } from '@/lib/prisma'

export interface OrganicPostInput {
  id: string
  publishedAt: string
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

export interface OrganicPerformanceRow {
  id: string
  publishedAt: string
  type: string | null
  headline: string | null
  impressions: number
  clicks: number
  likes: number
  comments: number
  shares: number
  engagementRate: number
  wasBoosted: boolean
  boostedByCampaignName: string | null
}

/** Replicates `vw_organic_performance` from the Python dashboard's schema.sql. */
export function computeOrganicPerformanceRows(
  posts: OrganicPostInput[],
  campaigns: Map<string, { name: string }>,
): OrganicPerformanceRow[] {
  return posts.map((p) => ({
    id: p.id,
    publishedAt: p.publishedAt,
    type: p.type,
    headline: p.headline,
    impressions: p.impressions,
    clicks: p.clicks,
    likes: p.likes,
    comments: p.comments,
    shares: p.shares,
    engagementRate: p.engagementRate,
    wasBoosted: p.wasBoosted,
    boostedByCampaignName: p.boostedByCampaignId ? (campaigns.get(p.boostedByCampaignId)?.name ?? null) : null,
  }))
}

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export async function getOrganicPerformance(startDate: Date, endDate: Date): Promise<OrganicPerformanceRow[]> {
  const [postRows, campaignRows] = await Promise.all([
    prisma.factOrganicPost.findMany({
      where: { publishedAt: { gte: startDate, lte: endDate } },
    }),
    prisma.dimCampaign.findMany(),
  ])

  const campaigns = new Map(campaignRows.map((c) => [c.id, { name: c.name }]))
  const posts: OrganicPostInput[] = postRows.map((p) => ({
    id: p.id,
    publishedAt: toIsoDate(p.publishedAt),
    type: p.type,
    headline: p.headline,
    impressions: Number(p.impressions ?? 0),
    clicks: Number(p.clicks ?? 0),
    likes: Number(p.likes ?? 0),
    comments: Number(p.comments ?? 0),
    shares: Number(p.shares ?? 0),
    engagementRate: Number(p.engagementRate ?? 0),
    wasBoosted: p.wasBoosted ?? false,
    boostedByCampaignId: p.boostedByCampaignId,
  }))

  return computeOrganicPerformanceRows(posts, campaigns)
}
