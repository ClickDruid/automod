import type { CarStats, StatModifier, CarPart } from '@/types'

export const STAT_MAX = 100
export const STAT_MIN = 0

export function calculateStats(baseStats: CarStats, selectedParts: CarPart[]): CarStats {
  const result = { ...baseStats }
  for (const part of selectedParts) {
    for (const [key, value] of Object.entries(part.stats)) {
      const stat = key as keyof CarStats
      result[stat] = Math.min(STAT_MAX, Math.max(STAT_MIN, result[stat] + (value ?? 0)))
    }
  }
  return result
}

export function getStatDelta(base: CarStats, current: CarStats): Partial<CarStats> {
  const delta: Partial<CarStats> = {}
  for (const key of Object.keys(base) as (keyof CarStats)[]) {
    const diff = current[key] - base[key]
    if (diff !== 0) delta[key] = diff
  }
  return delta
}

export function getTotalModifier(parts: CarPart[]): StatModifier {
  const total: StatModifier = {}
  for (const part of parts) {
    for (const [key, value] of Object.entries(part.stats)) {
      const stat = key as keyof StatModifier
      total[stat] = (total[stat] ?? 0) + (value ?? 0)
    }
  }
  return total
}

export const STAT_LABELS: Record<keyof CarStats, string> = {
  power: 'Power',
  handling: 'Handling',
  braking: 'Braking',
  suspension: 'Suspension',
  weight: 'Weight',
  turbo: 'Turbo',
}

export const STAT_COLORS: Record<keyof CarStats, string> = {
  power: '#F97316',
  handling: '#22C55E',
  braking: '#EF4444',
  suspension: '#3B82F6',
  weight: '#A855F7',
  turbo: '#06B6D4',
}
