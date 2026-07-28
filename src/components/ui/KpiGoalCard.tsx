export interface KpiGoalCardProps {
  label: string
  currentValueLabel: string
  windowLabel: string
  pacedTargetLabel: string
  month3Label: string
  month6Label: string
  /** null = no campaign yet (pre-launch) — renders without a progress bar. */
  progressPct: number | null
}

export function KpiGoalCard({
  label,
  currentValueLabel,
  windowLabel,
  pacedTargetLabel,
  month3Label,
  month6Label,
  progressPct,
}: KpiGoalCardProps) {
  const clampedPct = progressPct !== null ? Math.min(Math.max(progressPct, 0), 100) : null
  const barColor = progressPct !== null && progressPct >= 100 ? 'bg-alltech-blue' : 'bg-alltech-orange'

  return (
    <div className="rounded-lg border border-alltech-blue/10 bg-white p-4 shadow-sm">
      <p className="text-sm text-alltech-blue/70">{label}</p>
      <p className="mt-1 text-2xl font-bold text-alltech-blue">{currentValueLabel}</p>
      <p className="mt-1 text-xs text-alltech-gray">{windowLabel}</p>

      {clampedPct !== null ? (
        <div className="mt-3">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-alltech-gray/20">
            <div className={`h-full rounded-full ${barColor}`} style={{ width: `${clampedPct}%` }} />
          </div>
          <p className="mt-1 text-xs text-alltech-blue/60">Meta agora: {pacedTargetLabel}</p>
        </div>
      ) : (
        <p className="mt-3 text-xs text-alltech-blue/60">Aguardando início de campanha</p>
      )}

      <p className="mt-2 text-xs text-alltech-gray">
        Mês 3: {month3Label} · Mês 6: {month6Label}
      </p>
    </div>
  )
}
