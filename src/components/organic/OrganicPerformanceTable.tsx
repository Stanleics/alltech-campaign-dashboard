'use client'

import { useState } from 'react'
import type { OrganicPerformanceRow } from '@/lib/metrics/compute-organic-performance'

type SortKey = 'impressions' | 'likes' | 'comments' | 'shares' | 'engagementRate'

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(2)}%`
}

function formatNumber(value: number): string {
  return value.toLocaleString('pt-BR')
}

export function OrganicPerformanceTable({ rows }: { rows: OrganicPerformanceRow[] }) {
  const [sortKey, setSortKey] = useState<SortKey>('impressions')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const sorted = [...rows].sort((a, b) => {
    const diff = a[sortKey] - b[sortKey]
    return sortDir === 'asc' ? diff : -diff
  })

  const headers: { key: SortKey; label: string }[] = [
    { key: 'impressions', label: 'Impressões' },
    { key: 'likes', label: 'Curtidas' },
    { key: 'comments', label: 'Comentários' },
    { key: 'shares', label: 'Compart.' },
    { key: 'engagementRate', label: 'Engajamento' },
  ]

  if (rows.length === 0) {
    return <p className="text-sm text-alltech-blue/60">Nenhum post orgânico no período selecionado.</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-alltech-blue/20 text-left text-alltech-blue/70">
            <th className="py-2">Post</th>
            <th className="py-2">Publicado em</th>
            <th className="py-2">Tipo</th>
            {headers.map((h) => (
              <th key={h.key} className="cursor-pointer select-none py-2" onClick={() => toggleSort(h.key)}>
                {h.label} {sortKey === h.key ? (sortDir === 'asc' ? '↑' : '↓') : ''}
              </th>
            ))}
            <th className="py-2">Impulsionado</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => (
            <tr key={r.id} className="border-b border-alltech-blue/10">
              <td className="max-w-xs truncate py-2 font-medium">{r.headline ?? '—'}</td>
              <td className="py-2 text-alltech-blue/70">{r.publishedAt}</td>
              <td className="py-2 text-alltech-blue/70">{r.type ?? '—'}</td>
              <td className="py-2">{formatNumber(r.impressions)}</td>
              <td className="py-2">{formatNumber(r.likes)}</td>
              <td className="py-2">{formatNumber(r.comments)}</td>
              <td className="py-2">{formatNumber(r.shares)}</td>
              <td className="py-2">{formatPercent(r.engagementRate)}</td>
              <td className="py-2">{r.wasBoosted ? (r.boostedByCampaignName ?? 'Sim') : 'Não'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
