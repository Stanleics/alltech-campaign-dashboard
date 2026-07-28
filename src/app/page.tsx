import { getGoals } from '@/lib/goals/compute-goals'
import type { KpiGoalKey } from '@/lib/goals/constants'
import { KpiGoalCard } from '@/components/ui/KpiGoalCard'
import { DemoBanner } from '@/components/ui/DemoBanner'
import { RefreshDataButton } from '@/components/ui/RefreshDataButton'

export const dynamic = 'force-dynamic'

function formatGoalValue(key: KpiGoalKey, value: number): string {
  if (key === 'engagementRate' || key === 'ctr') {
    return `${(value * 100).toFixed(2)}%`
  }
  if (key === 'frequency') {
    return value.toFixed(2)
  }
  return Math.round(value).toLocaleString('pt-BR')
}

export default async function OverviewPage() {
  // The 6 goal cards always use a fixed trailing-30-day window (not the
  // adjustable period picker used on the other pages) — the targets are
  // "/mês", and normalizing a custom window to a monthly rate would distort
  // a short window's number.
  const until = new Date()
  until.setUTCHours(23, 59, 59, 999)
  const startDate = new Date(until)
  startDate.setUTCDate(startDate.getUTCDate() - 30)
  startDate.setUTCHours(0, 0, 0, 0)

  const goals = await getGoals(startDate, until)
  const usingSampleData = !process.env.LINKEDIN_ACCESS_TOKEN

  return (
    <main className="min-h-screen">
      <DemoBanner visible={usingSampleData} />
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-xl font-medium text-alltech-blue">Visão geral</h1>
          <RefreshDataButton />
        </div>
        <p className="mb-6 max-w-2xl text-sm text-alltech-blue/70">
          Todas as metas medem presença e autoridade. A conversão comercial é consequência
          natural — não o gatilho que mede o sucesso desta estratégia.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => (
            <KpiGoalCard
              key={goal.key}
              label={goal.label}
              currentValueLabel={formatGoalValue(goal.key, goal.currentValue)}
              windowLabel="Últimos 30 dias"
              pacedTargetLabel={formatGoalValue(goal.key, goal.pacedTargetValue)}
              month3Label={formatGoalValue(goal.key, goal.month3Target)}
              month6Label={formatGoalValue(goal.key, goal.month6Target)}
              progressPct={goal.progressPct}
            />
          ))}
        </div>
      </div>
    </main>
  )
}
