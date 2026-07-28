import { getOrganicPerformance } from '@/lib/metrics/compute-organic-performance'
import { resolveDateRange, toDateBounds } from '@/lib/date-range'
import { PeriodPicker } from '@/components/ui/PeriodPicker'
import { OrganicPerformanceTable } from '@/components/organic/OrganicPerformanceTable'

export const dynamic = 'force-dynamic'

export default async function OrganicPage({
  searchParams,
}: {
  searchParams: { since?: string; until?: string }
}) {
  const { since, until } = resolveDateRange(searchParams)
  const { startDate, endDate } = toDateBounds({ since, until })

  const rows = await getOrganicPerformance(startDate, endDate)

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <h1 className="mb-4 text-xl font-medium text-alltech-blue">Orgânico</h1>
        <div className="mb-6">
          <PeriodPicker since={since} until={until} />
        </div>
        <OrganicPerformanceTable rows={rows} />
      </div>
    </main>
  )
}
