'use client'

import { motion } from 'framer-motion'
import { CarPart, CarStats } from '@/types'
import { STAT_COLORS, STAT_LABELS } from '@/lib/stats'

interface PartCardProps {
  part: CarPart
  isSelected: boolean
  onToggle: (part: CarPart) => void
}

const CATEGORY_ICONS: Record<string, string> = {
  engine: '⚙️',
  suspension: '🔧',
  brakes: '🛑',
  exhaust: '💨',
  aero: '🏁',
  wheels: '🎡',
  intake: '🌀',
  transmission: '⚡',
}

export default function PartCard({ part, isSelected, onToggle }: PartCardProps) {
  const statEntries = Object.entries(part.stats) as [keyof CarStats, number][]

  return (
    <motion.button
      onClick={() => onToggle(part)}
      whileTap={{ scale: 0.97 }}
      className={`w-full text-left rounded-xl border p-4 transition-all duration-200 relative overflow-hidden ${
        isSelected
          ? 'border-orange-500 bg-orange-500/5'
          : 'border-zinc-800 bg-zinc-900 hover:border-zinc-600'
      }`}
    >
      {isSelected && (
        <motion.div
          layoutId="selected-glow"
          className="absolute inset-0 bg-orange-500/5 pointer-events-none"
          initial={false}
        />
      )}

      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{CATEGORY_ICONS[part.category] ?? '🔩'}</span>
          <div>
            <p className="text-xs text-zinc-500 font-medium">{part.brand}</p>
            <p className="text-sm font-semibold text-white leading-tight">{part.name}</p>
          </div>
        </div>
        <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
          isSelected ? 'border-orange-500 bg-orange-500' : 'border-zinc-600'
        }`}>
          {isSelected && (
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </div>

      <p className="text-xs text-zinc-500 mb-3 leading-relaxed line-clamp-2">{part.description}</p>

      {/* Stat modifiers */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {statEntries.map(([key, val]) => (
          <span
            key={key}
            className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: `${STAT_COLORS[key]}18`,
              color: STAT_COLORS[key],
              border: `1px solid ${STAT_COLORS[key]}30`,
            }}
          >
            {val > 0 ? '+' : ''}{val} {STAT_LABELS[key]}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-base font-bold text-white">
          ${part.price.toLocaleString()}
        </span>
        <div className="flex gap-1">
          {part.tags.slice(0, 2).map(tag => (
            <span key={tag} className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </motion.button>
  )
}
