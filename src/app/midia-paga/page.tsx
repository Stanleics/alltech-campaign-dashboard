import { getPaidPerformance } from '@/lib/metrics/compute-paid-performance'
import { resolveDateRange, toDateBounds } from '@/lib/date-range'
import { PeriodPicker } from '@/components/ui/PeriodPicker'
import { StatCard } from '@/components/ui/StatCard'
import { PaidPerformanceTable } from '@/components/paid/PaidPerformanceTable'

export const dynamic = 'force-dynamic'

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default async function PaidMediaPage({
  searchParams,
}: {
  searchParams: { since?: string; until?: string }
}) {
  const { since, until } = resolveDateRange(searchParams)
  const { startDate, endDate } = toDateBounds({ since, until })

  const rows = await getPaidPerformance(startDate, endDate)
  const totalCost = rows.reduce((sum, r) => sum + r.cost, 0)

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <h1 className="mb-4 text-xl font-medium text-alltech-blue">Mídia paga</h1>
        <div className="mb-6">
          <PeriodPicker since={since} until={until} />
        </div>
        <div className="mb-6 max-w-xs">
          <StatCard label="Valor investido no período" value={formatCurrency(totalCost)} />
        </div>
        <PaidPerformanceTable rows={rows} />
      </div>
    </main>
  )
}
