import { fetchLinkedInPaid } from '@/lib/linkedin/paid'
import { fetchLinkedInOrganic } from '@/lib/linkedin/organic'
import {
  upsertCampaignRows,
  upsertCreativeRows,
  upsertFollowerStatsRows,
  upsertOrganicPostRows,
  upsertPaidAnalyticsRows,
  upsertPaidReachPeriodRows,
} from './upsert'

export interface PaidEtlResult {
  campaigns: number
  creatives: number
  analyticsRows: number
  usedFallback: boolean
}

export interface OrganicEtlResult {
  posts: number
  followerStatsRows: number
  usedFallback: boolean
}

export interface EtlRunResult {
  paid: PaidEtlResult
  organic: OrganicEtlResult
}

export async function runPaidEtl(): Promise<PaidEtlResult> {
  const paid = await fetchLinkedInPaid()
  // Campaigns before creatives before analytics — each table has a foreign
  // key into the one before it, so insert order must respect that.
  await upsertCampaignRows(paid.campaigns)
  await upsertCreativeRows(paid.creatives)
  await upsertPaidAnalyticsRows(paid.analyticsRows)
  await upsertPaidReachPeriodRows(paid.reachPeriods)

  return {
    campaigns: paid.campaigns.length,
    creatives: paid.creatives.length,
    analyticsRows: paid.analyticsRows.length,
    usedFallback: paid.usedFallback,
  }
}

export async function runOrganicEtl(): Promise<OrganicEtlResult> {
  const organic = await fetchLinkedInOrganic()
  await upsertOrganicPostRows(organic.posts)
  await upsertFollowerStatsRows(organic.followerStats)

  return {
    posts: organic.posts.length,
    followerStatsRows: organic.followerStats.length,
    usedFallback: organic.usedFallback,
  }
}

/** Both halves in sequence — used by the on-demand "Atualizar dados" button. */
export async function runEtl(): Promise<EtlRunResult> {
  const paid = await runPaidEtl()
  const organic = await runOrganicEtl()
  return { paid, organic }
}
