export function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-alltech-blue/10 bg-white p-4 shadow-sm">
      <p className="text-sm text-alltech-blue/70">{label}</p>
      <p className="mt-1 text-2xl font-bold text-alltech-blue">{value}</p>
    </div>
  )
}
