'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { refreshEtl } from '@/app/actions/refresh-etl'

export function RefreshDataButton() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState(false)

  function handleClick() {
    setError(false)
    startTransition(async () => {
      try {
        await refreshEtl()
        router.refresh()
      } catch {
        setError(true)
      }
    })
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="rounded bg-alltech-blue px-3 py-1.5 text-sm text-white disabled:opacity-60"
      >
        {isPending ? 'Atualizando…' : 'Atualizar dados'}
      </button>
      {error && <span className="text-sm text-red-600">Falha ao atualizar. Tente de novo.</span>}
    </div>
  )
}
