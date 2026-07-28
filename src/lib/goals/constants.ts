export type KpiGoalKey = 'paidImpressions' | 'paidReach' | 'frequency' | 'engagementRate' | 'paidFollowerGain' | 'ctr'

export interface KpiGoal {
  key: KpiGoalKey
  label: string
  month3Target: number
  month6Target: number
}

// Source: client's "KPIs de Autoridade" planning slide (2026-07-27 session).
// Rates (engagementRate, ctr) are stored as fractions (0.004 = 0.4%).
export const KPI_GOALS: KpiGoal[] = [
  { key: 'paidImpressions', label: 'Impressões (pago) / mês', month3Target: 15000, month6Target: 30000 },
  { key: 'paidReach', label: 'Alcance único de gestores / mês', month3Target: 5000, month6Target: 10000 },
  { key: 'frequency', label: 'Frequência média (views/pessoa)', month3Target: 3, month6Target: 4 },
  { key: 'engagementRate', label: 'Taxa de engajamento (pago)', month3Target: 0.004, month6Target: 0.006 },
  { key: 'paidFollowerGain', label: 'Seguidores ganhos via anúncios', month3Target: 50, month6Target: 80 },
  { key: 'ctr', label: 'CTR (cliques para a página)', month3Target: 0.002, month6Target: 0.006 },
]
