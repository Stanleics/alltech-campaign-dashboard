import { prisma } from '@/lib/prisma'
import type { CampaignRow, CreativeRow, PaidAnalyticsRow } from '@/lib/linkedin/paid'
import type { FollowerStatsRow, OrganicPostRow } from '@/lib/linkedin/organic'

export async function upsertCampaignRows(rows: CampaignRow[]): Promise<void> {
  for (const row of rows) {
    await prisma.dimCampaign.upsert({
      where: { id: row.id },
      create: {
        id: row.id,
        adAccountId: row.adAccountId,
        campaignGroupId: row.campaignGroupId,
        name: row.name,
        objectiveType: row.objectiveType,
        format: row.format,
        status: row.status,
        budgetAmount: row.budgetAmount,
        currency: row.currency,
        startDate: row.startDate ? new Date(row.startDate) : null,
        endDate: row.endDate ? new Date(row.endDate) : null,
      },
      update: {
        adAccountId: row.adAccountId,
        campaignGroupId: row.campaignGroupId,
        name: row.name,
        objectiveType: row.objectiveType,
        format: row.format,
        status: row.status,
        budgetAmount: row.budgetAmount,
        currency: row.currency,
        startDate: row.startDate ? new Date(row.startDate) : null,
        endDate: row.endDate ? new Date(row.endDate) : null,
      },
    })
  }
}

export async function upsertCreativeRows(rows: CreativeRow[]): Promise<void> {
  for (const row of rows) {
    await prisma.dimCreative.upsert({
      where: { id: row.id },
      create: {
        id: row.id,
        campaignId: row.campaignId,
        format: row.format,
        headline: row.headline,
        pillar: row.pillar,
        status: row.status,
        startDate: row.startDate ? new Date(row.startDate) : null,
      },
      update: {
        campaignId: row.campaignId,
        format: row.format,
        headline: row.headline,
        pillar: row.pillar,
        status: row.status,
        startDate: row.startDate ? new Date(row.startDate) : null,
      },
    })
  }
}

export async function upsertPaidAnalyticsRows(rows: PaidAnalyticsRow[]): Promise<void> {
  for (const row of rows) {
    await prisma.factPaidAnalytics.upsert({
      where: {
        creativeId_dateStart_dateEnd: {
          creativeId: row.creativeId,
          dateStart: new Date(row.dateStart),
          dateEnd: new Date(row.dateEnd),
        },
      },
      create: {
        creativeId: row.creativeId,
        campaignId: row.campaignId,
        dateStart: new Date(row.dateStart),
        dateEnd: new Date(row.dateEnd),
        impressions: row.impressions,
        clicks: row.clicks,
        reach: row.reach,
        likes: row.likes,
        comments: row.comments,
        shares: row.shares,
        follows: row.follows,
        cost: row.cost,
      },
      update: {
        campaignId: row.campaignId,
        impressions: row.impressions,
        clicks: row.clicks,
        reach: row.reach,
        likes: row.likes,
        comments: row.comments,
        shares: row.shares,
        follows: row.follows,
        cost: row.cost,
      },
    })
  }
}

export async function upsertOrganicPostRows(rows: OrganicPostRow[]): Promise<void> {
  for (const row of rows) {
    if (!row.publishedAt) continue // published_at is NOT NULL; skip posts with no known publish date
    await prisma.factOrganicPost.upsert({
      where: { id: row.id },
      create: {
        id: row.id,
        publishedAt: new Date(row.publishedAt),
        type: row.type,
        headline: row.headline,
        impressions: row.impressions,
        clicks: row.clicks,
        likes: row.likes,
        comments: row.comments,
        shares: row.shares,
        engagementRate: row.engagementRate,
        wasBoosted: row.wasBoosted,
        boostedByCampaignId: row.boostedByCampaignId,
      },
      update: {
        type: row.type,
        headline: row.headline,
        impressions: row.impressions,
        clicks: row.clicks,
        likes: row.likes,
        comments: row.comments,
        shares: row.shares,
        engagementRate: row.engagementRate,
        wasBoosted: row.wasBoosted,
        boostedByCampaignId: row.boostedByCampaignId,
      },
    })
  }
}

export async function upsertFollowerStatsRows(rows: FollowerStatsRow[]): Promise<void> {
  for (const row of rows) {
    await prisma.factFollowerStats.upsert({
      where: {
        dateStart_dateEnd: {
          dateStart: new Date(row.dateStart),
          dateEnd: new Date(row.dateEnd),
        },
      },
      create: {
        dateStart: new Date(row.dateStart),
        dateEnd: new Date(row.dateEnd),
        organicFollowerGain: row.organicFollowerGain,
        paidFollowerGain: row.paidFollowerGain,
        totalFollowers: row.totalFollowers,
      },
      update: {
        organicFollowerGain: row.organicFollowerGain,
        paidFollowerGain: row.paidFollowerGain,
        totalFollowers: row.totalFollowers,
      },
    })
  }
}
