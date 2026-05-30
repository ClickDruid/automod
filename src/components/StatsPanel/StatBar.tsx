'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { STAT_COLORS } from '@/lib/stats'
import type { CarStats } from '@/types'

interface StatBarProps {
  label: string
  statKey: keyof CarStats
  value: number
  delta?: number
}

export default function StatBar({ label, statKey, value, delta }: StatBarProps) {
  const color = STAT_COLORS[statKey]
  const hasDelta = delta !== undefined && delta !== 0
  const isPositive = (delta ?? 0) > 0

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium tracking-widest uppercase text-zinc-400">
          {label}
        </span>
        <div className="flex items-center gap-2">
          <AnimatePresence>
            {hasDelta && (
              <motion.span
                key={delta}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                className={`text-xs font-bold tabular-nums ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}
              >
                {isPositive ? '+' : ''}{delta}
              </motion.span>
            )}
          </AnimatePresence>
          <span className="text-sm font-bold tabular-nums text-white w-8 text-right">
            {Math.round(value)}
          </span>
        </div>
      </div>
      <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={false}
          animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />
      </div>
    </div>
  )
}
