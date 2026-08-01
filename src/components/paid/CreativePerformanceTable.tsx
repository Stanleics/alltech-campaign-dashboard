import type { CreativePerformanceRow } from '@/lib/metrics/compute-paid-performance'

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatPercent(value: number | null): string {
  return value !== null ? `${(value * 100).toFixed(2)}%` : '—'
}

function formatNumber(value: number): string {
  return value.toLocaleString('pt-BR')
}

export function CreativePerformanceTable({ rows }: { rows: CreativePerformanceRow[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-alltech-blue/60">Nenhum dado de mídia paga no período selecionado.</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1000px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-alltech-blue/20 text-left text-alltech-blue/70">
            <th className="py-2">Campanha</th>
            <th className="py-2">Criativo</th>
            <th className="py-2">Status</th>
            <th className="py-2">Impressões</th>
            <th className="py-2">Alcance</th>
            <th className="py-2">Frequência</th>
            <th className="py-2">CTR</th>
            <th className="py-2">Engajamento</th>
            <th className="py-2">Investido</th>
            <th className="py-2">CPC</th>
            <th className="py-2">CPM</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.creativeId} className="border-b border-alltech-blue/10">
              <td className="py-2 font-medium">{r.campaignName}</td>
              <td className="py-2 text-alltech-blue/70">{r.creativeHeadline || '—'}</td>
              <td className="py-2 text-alltech-blue/70">{r.campaignStatus ?? '—'}</td>
              <td className="py-2">{formatNumber(r.impressions)}</td>
              <td className="py-2">{formatNumber(r.reach)}</td>
              <td className="py-2">{r.frequency !== null ? r.frequency.toFixed(2) : '—'}</td>
              <td className="py-2">{formatPercent(r.ctr)}</td>
              <td className="py-2">{formatPercent(r.engagementRate)}</td>
              <td className="py-2">{formatCurrency(r.cost)}</td>
              <td className="py-2">{r.cpc !== null ? formatCurrency(r.cpc) : '—'}</td>
              <td className="py-2">{r.cpm !== null ? formatCurrency(r.cpm) : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
