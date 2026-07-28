const MS_PER_DAY = 86_400_000

export function monthsElapsed(startDate: Date, today: Date): number {
  return (today.getTime() - startDate.getTime()) / MS_PER_DAY / 30
}

/** Linearly interpolates 0 → month3 → month6, capped at the month-6 value. */
export function pacedTarget(monthsElapsed: number, month3: number, month6: number): number {
  if (monthsElapsed <= 0) return 0
  if (monthsElapsed >= 6) return month6
  if (monthsElapsed <= 3) return (monthsElapsed / 3) * month3
  return month3 + ((monthsElapsed - 3) / 3) * (month6 - month3)
}
