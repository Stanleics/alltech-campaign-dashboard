import { NextRequest, NextResponse } from 'next/server'
import { isAuthorizedCron } from '@/lib/etl/cron-auth'
import { runOrganicEtl } from '@/lib/etl/run'

// Organic posts + follower stats. Separate from /api/etl/run (paid) so each
// cron gets its own function invocation and time budget.
export const maxDuration = 300

export async function GET(request: NextRequest) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const result = await runOrganicEtl()
  return NextResponse.json({ organic: result })
}
