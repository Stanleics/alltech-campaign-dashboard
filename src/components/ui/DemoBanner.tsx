import { Info } from 'lucide-react'

export function DemoBanner({ visible }: { visible: boolean }) {
  if (!visible) return null

  return (
    <div className="flex items-center justify-center gap-2 bg-alltech-orange/15 px-4 py-2 text-center text-sm font-medium text-alltech-blue">
      <Info size={16} />
      <span>
        Exibindo dados de exemplo — configure as credenciais em <code>.env</code> para ver dados reais.
      </span>
    </div>
  )
}
