'use client'

import StatBar from './StatBar'
import { STAT_LABELS } from '@/lib/stats'
import type { CarStats } from '@/types'
import { motion } from 'framer-motion'

interface StatsPanelProps {
  baseStats: CarStats
  currentStats: CarStats
}

export default function StatsPanel({ baseStats, currentStats }: StatsPanelProps) {
  const statKeys = Object.keys(baseStats) as (keyof CarStats)[]

  const totalBoost = statKeys.reduce((acc, key) => {
    return acc + (currentStats[key] - baseStats[key])
  }, 0)

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white tracking-wider uppercase">
          Car Stats
        </h3>
        {totalBoost !== 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              totalBoost > 0
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-red-500/10 text-red-400 border border-red-500/20'
            }`}
          >
            {totalBoost > 0 ? '+' : ''}{totalBoost} total
          </motion.div>
        )}
      </div>

      <div className="space-y-3">
        {statKeys.map((key) => (
          <StatBar
            key={key}
            label={STAT_LABELS[key]}
            statKey={key}
            value={currentStats[key]}
            delta={currentStats[key] - baseStats[key]}
          />
        ))}
      </div>

      {totalBoost > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="pt-2 border-t border-zinc-800"
        >
          <p className="text-xs text-zinc-500 text-center">
            {totalBoost < 10 && 'Mild upgrade — good for daily use'}
            {totalBoost >= 10 && totalBoost < 25 && 'Noticeable improvement — street build'}
            {totalBoost >= 25 && totalBoost < 50 && 'Serious build — track ready'}
            {totalBoost >= 50 && 'Beast mode — full race spec'}
          </p>
        </motion.div>
      )}
    </div>
  )
}
