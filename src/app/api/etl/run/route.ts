import { NextRequest, NextResponse } from 'next/server'
import { runEtl } from '@/lib/etl/run'

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const result = await runEtl()
  return NextResponse.json(result)
}
