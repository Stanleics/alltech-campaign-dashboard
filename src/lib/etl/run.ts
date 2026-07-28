import { fetchLinkedInPaid } from '@/lib/linkedin/paid'
import { fetchLinkedInOrganic } from '@/lib/linkedin/organic'
import {
  upsertCampaignRows,
  upsertCreativeRows,
  upsertFollowerStatsRows,
  upsertOrganicPostRows,
  upsertPaidAnalyticsRows,
} from './upsert'

export interface EtlRunResult {
  paid: { campaigns: number; creatives: number; analyticsRows: number; usedFallback: boolean }
  organic: { posts: number; followerStatsRows: number; usedFallback: boolean }
}

export async function runEtl(): Promise<EtlRunResult> {
  const paid = await fetchLinkedInPaid()
  // Campaigns before creatives before analytics — each table has a foreign
  // key into the one before it, so insert order must respect that.
  await upsertCampaignRows(paid.campaigns)
  await upsertCreativeRows(paid.creatives)
  await upsertPaidAnalyticsRows(paid.analyticsRows)

  const organic = await fetchLinkedInOrganic()
  await upsertOrganicPostRows(organic.posts)
  await upsertFollowerStatsRows(organic.followerStats)

  return {
    paid: {
      campaigns: paid.campaigns.length,
      creatives: paid.creatives.length,
      analyticsRows: paid.analyticsRows.length,
      usedFallback: paid.usedFallback,
    },
    organic: {
      posts: organic.posts.length,
      followerStatsRows: organic.followerStats.length,
      usedFallback: organic.usedFallback,
    },
  }
}
