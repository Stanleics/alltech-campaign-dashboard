import { NextRequest, NextResponse } from 'next/server'
import { isAuthorizedCron } from '@/lib/etl/cron-auth'
import { runPaidEtl } from '@/lib/etl/run'

// Paid-media half only. The organic half runs on its own cron at /api/etl/organic
// so a slow or failing step on one side can't block the other.
export const maxDuration = 300

export async function GET(request: NextRequest) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const result = await runPaidEtl()
  return NextResponse.json({ paid: result })
}
