'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toIsoDateInTimeZone } from '@/lib/date-range'

function daysAgo(now: Date, days: number): Date {
  const d = new Date(now)
  d.setDate(d.getDate() - days)
  return d
}

// Mirrors the period shortcuts already shipped in the Python/Streamlit
// dashboard (7/30/90 days + custom), not the Medseek preset set.
const PRESETS: { label: string; range: (now: Date) => { since: string; until: string } }[] = [
  {
    label: '7 dias',
    range: (now) => ({ since: toIsoDateInTimeZone(daysAgo(now, 7)), until: toIsoDateInTimeZone(now) }),
  },
  {
    label: '30 dias',
    range: (now) => ({ since: toIsoDateInTimeZone(daysAgo(now, 30)), until: toIsoDateInTimeZone(now) }),
  },
  {
    label: '90 dias',
    range: (now) => ({ since: toIsoDateInTimeZone(daysAgo(now, 90)), until: toIsoDateInTimeZone(now) }),
  },
]

export function PeriodPicker({ since, until }: { since: string; until: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const [customSince, setCustomSince] = useState(since)
  const [customUntil, setCustomUntil] = useState(until)
  const [showCustom, setShowCustom] = useState(false)

  useEffect(() => {
    setCustomSince(since)
    setCustomUntil(until)
  }, [since, until])

  function applyRange(nextSince: string, nextUntil: string) {
    const params = new URLSearchParams({ since: nextSince, until: nextUntil })
    router.push(`${pathname}?${params.toString()}`)
  }

  const activePreset = PRESETS.find((preset) => {
    const range = preset.range(new Date())
    return range.since === since && range.until === until
  })

  return (
    <div className="flex flex-wrap items-center gap-2">
      {PRESETS.map((preset) => {
        const isActive = preset.label === activePreset?.label
        return (
          <button
            key={preset.label}
            type="button"
            onClick={() => {
              const range = preset.range(new Date())
              applyRange(range.since, range.until)
            }}
            className={`rounded px-3 py-1.5 text-sm ${
              isActive ? 'bg-alltech-blue text-white' : 'bg-alltech-blue/10 text-alltech-blue'
            }`}
          >
            {preset.label}
          </button>
        )
      })}
      <button
        type="button"
        onClick={() => setShowCustom((v) => !v)}
        className={`rounded px-3 py-1.5 text-sm ${
          !activePreset ? 'bg-alltech-blue text-white' : 'bg-alltech-blue/10 text-alltech-blue'
        }`}
      >
        Personalizado
      </button>
      {showCustom && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={customSince}
            onChange={(e) => setCustomSince(e.target.value)}
            className="rounded border border-alltech-blue/20 px-2 py-1 text-sm"
          />
          <input
            type="date"
            value={customUntil}
            onChange={(e) => setCustomUntil(e.target.value)}
            className="rounded border border-alltech-blue/20 px-2 py-1 text-sm"
          />
          <button
            type="button"
            onClick={() => applyRange(customSince, customUntil)}
            className="rounded bg-alltech-orange px-3 py-1.5 text-sm text-white"
          >
            Aplicar
          </button>
        </div>
      )}
    </div>
  )
}
