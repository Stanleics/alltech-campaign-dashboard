'use client'

import { useState } from 'react'
import type { PaidPerformanceRow } from '@/lib/metrics/compute-paid-performance'

type SortKey = 'impressions' | 'reach' | 'ctr' | 'engagementRate' | 'cost'

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatPercent(value: number | null): string {
  return value !== null ? `${(value * 100).toFixed(2)}%` : '—'
}

function formatNumber(value: number): string {
  return value.toLocaleString('pt-BR')
}

export function PaidPerformanceTable({ rows }: { rows: PaidPerformanceRow[] }) {
  const [sortKey, setSortKey] = useState<SortKey>('impressions')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  function sortValue(r: PaidPerformanceRow): number {
    if (sortKey === 'ctr') return r.ctr ?? 0
    if (sortKey === 'engagementRate') return r.engagementRate ?? 0
    return r[sortKey]
  }

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const sorted = [...rows].sort((a, b) => {
    const diff = sortValue(a) - sortValue(b)
    return sortDir === 'asc' ? diff : -diff
  })

  const headers: { key: SortKey; label: string }[] = [
    { key: 'impressions', label: 'Impressões' },
    { key: 'reach', label: 'Alcance' },
    { key: 'ctr', label: 'CTR' },
    { key: 'engagementRate', label: 'Engajamento' },
    { key: 'cost', label: 'Custo' },
  ]

  if (rows.length === 0) {
    return <p className="text-sm text-alltech-blue/60">Nenhum dado de mídia paga no período selecionado.</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-alltech-blue/20 text-left text-alltech-blue/70">
            <th className="py-2">Criativo</th>
            <th className="py-2">Campanha</th>
            <th className="py-2">Período</th>
            {headers.map((h) => (
              <th key={h.key} className="cursor-pointer select-none py-2" onClick={() => toggleSort(h.key)}>
                {h.label} {sortKey === h.key ? (sortDir === 'asc' ? '↑' : '↓') : ''}
              </th>
            ))}
            <th className="py-2">Frequência</th>
            <th className="py-2">CPC</th>
            <th className="py-2">CPM</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r, i) => (
            <tr key={`${r.dateStart}__${r.creativeHeadline}__${i}`} className="border-b border-alltech-blue/10">
              <td className="py-2 font-medium">{r.creativeHeadline ?? '—'}</td>
              <td className="py-2 text-alltech-blue/70">{r.campaignName}</td>
              <td className="py-2 text-alltech-blue/70">{r.dateStart}</td>
              <td className="py-2">{formatNumber(r.impressions)}</td>
              <td className="py-2">{formatNumber(r.reach)}</td>
              <td className="py-2">{formatPercent(r.ctr)}</td>
              <td className="py-2">{formatPercent(r.engagementRate)}</td>
              <td className="py-2">{formatCurrency(r.cost)}</td>
              <td className="py-2">{r.frequency !== null ? r.frequency.toFixed(2) : '—'}</td>
              <td className="py-2">{r.cpc !== null ? formatCurrency(r.cpc) : '—'}</td>
              <td className="py-2">{r.cpm !== null ? formatCurrency(r.cpm) : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
