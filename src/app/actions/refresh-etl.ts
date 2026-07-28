'use server'

import { runEtl } from '@/lib/etl/run'

export async function refreshEtl(): Promise<void> {
  await runEtl()
}
