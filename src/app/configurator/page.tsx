'use client'

import { useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import { calculateStats, STAT_LABELS, STAT_COLORS } from '@/lib/stats'
import type { CarModel, CarPart, CarStats, PartCategory } from '@/types'

import carsData from '@/data/cars.json'
import partsData from '@/data/parts.json'

const cars = carsData as CarModel[]
const parts = partsData as CarPart[]

const CarViewer = dynamic(() => import('@/components/CarViewer'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="text-zinc-600 text-sm animate-pulse tracking-widest">LOADING...</div>
    </div>
  ),
})

const CATEGORIES: { id: PartCategory | 'all'; label: string; icon: string }[] = [
  { id: 'all', label: 'All', icon: '⚡' },
  { id: 'engine', label: 'Engine', icon: '⚙️' },
  { id: 'intake', label: 'Intake', icon: '🌀' },
  { id: 'exhaust', label: 'Exhaust', icon: '💨' },
  { id: 'suspension', label: 'Suspension', icon: '🔧' },
  { id: 'brakes', label: 'Brakes', icon: '🛑' },
  { id: 'wheels', label: 'Wheels', icon: '🎡' },
  { id: 'aero', label: 'Aero', icon: '🏁' },
  { id: 'transmission', label: 'Trans', icon: '⚡' },
]

const TIER_LABELS: Record<number, string> = {
  1: 'STREET',
  2: 'SPORT',
  3: 'TRACK',
  4: 'RACE',
  5: 'EXTREME',
}

const TIER_COLORS: Record<number, string> = {
  1: '#6b7280',
  2: '#3b82f6',
  3: '#22c55e',
  4: '#f97316',
  5: '#ef4444',
}

function StatBar({ label, statKey, value, delta }: {
  label: string
  statKey: keyof CarStats
  value: number
  delta: number
}) {
  const color = STAT_COLORS[statKey]
  const hasDelta = delta !== 0

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color }}>
          {label}
        </span>
        <div className="flex items-center gap-1.5">
          <AnimatePresence mode="popLayout">
            {hasDelta && (
              <motion.span
                key={delta}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`text-[10px] font-black tabular-nums ${delta > 0 ? 'text-emerald-400' : 'text-red-400'}`}
              >
                {delta > 0 ? '+' : ''}{delta}
              </motion.span>
            )}
          </AnimatePresence>
          <span className="text-xs font-black tabular-nums text-white w-6 text-right">
            {Math.round(value)}
          </span>
        </div>
      </div>
      <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
          transition={{ type: 'spring', stiffness: 100, damping: 18 }}
        />
      </div>
    </div>
  )
}

function PartRow({ part, isSelected, onToggle }: {
  part: CarPart
  isSelected: boolean
  onToggle: () => void
}) {
  const tier = (part as CarPart & { tier?: number }).tier ?? 1
  const statEntries = Object.entries(part.stats) as [keyof CarStats, number][]

  return (
    <motion.button
      onClick={onToggle}
      whileTap={{ scale: 0.98 }}
      className={`w-full text-left p-3 rounded-xl border transition-all duration-150 ${
        isSelected
          ? 'border-orange-500/60 bg-orange-500/8'
          : 'border-zinc-800/60 bg-zinc-900/60 hover:border-zinc-700'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <div className={`mt-0.5 w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all ${
          isSelected ? 'border-orange-500 bg-orange-500' : 'border-zinc-600'
        }`}>
          {isSelected && (
            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Brand + tier */}
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[9px] font-black tracking-widest uppercase text-zinc-500">
              {part.brand}
            </span>
            <span
              className="text-[9px] font-black tracking-widest px-1.5 py-px rounded"
              style={{ color: TIER_COLORS[tier], backgroundColor: `${TIER_COLORS[tier]}18` }}
            >
              {TIER_LABELS[tier]}
            </span>
          </div>

          {/* Name */}
          <p className="text-xs font-semibold text-white leading-tight mb-1.5">
            {part.name}
          </p>

          {/* Stat pills */}
          <div className="flex flex-wrap gap-1">
            {statEntries.map(([key, val]) => (
              <span
                key={key}
                className="text-[9px] font-black px-1.5 py-px rounded"
                style={{
                  color: STAT_COLORS[key],
                  backgroundColor: `${STAT_COLORS[key]}18`,
                }}
              >
                {val > 0 ? '+' : ''}{val} {STAT_LABELS[key].toUpperCase()}
              </span>
            ))}
          </div>
        </div>

        {/* Price */}
        <div className="text-right flex-shrink-0">
          <span className="text-sm font-black text-white">
            ${part.price >= 1000 ? `${(part.price / 1000).toFixed(1)}k` : part.price}
          </span>
        </div>
      </div>
    </motion.button>
  )
}

export default function ConfiguratorPage() {
  const [selectedCar, setSelectedCar] = useState<CarModel>(cars[0])
  const [selectedParts, setSelectedParts] = useState<CarPart[]>([])
  const [activeCategory, setActiveCategory] = useState<PartCategory | 'all'>('all')
  const [focusedCategory, setFocusedCategory] = useState<PartCategory | null>(null)

  const currentStats = useMemo(
    () => calculateStats(selectedCar.baseStats, selectedParts),
    [selectedCar, selectedParts]
  )

  const statKeys = Object.keys(selectedCar.baseStats) as (keyof CarStats)[]

  const totalBoost = useMemo(
    () => statKeys.reduce((acc, k) => acc + (currentStats[k] - selectedCar.baseStats[k]), 0),
    [currentStats, selectedCar, statKeys]
  )

  const totalCost = selectedParts.reduce((acc, p) => acc + p.price, 0)

  const compatibleParts = parts.filter(p => p.compatible.includes(selectedCar.id))
  const filteredParts = activeCategory === 'all'
    ? compatibleParts
    : compatibleParts.filter(p => p.category === activeCategory)

  const selectedIds = new Set(selectedParts.map(p => p.id))

  const handleCarChange = (car: CarModel) => {
    setSelectedCar(car)
    setSelectedParts([])
    setFocusedCategory(null)
  }

  const handleToggle = (part: CarPart) => {
    const isRemoving = !!selectedParts.find(p => p.id === part.id)
    setSelectedParts(prev =>
      isRemoving ? prev.filter(p => p.id !== part.id) : [...prev, part]
    )
    if (isRemoving) {
      // Zoom out when deselected
      setFocusedCategory(null)
    } else {
      // Zoom to the part area when selected
      setFocusedCategory(part.category)
    }
  }

  const buildLabel = totalBoost === 0 ? null
    : totalBoost < 10 ? 'STREET BUILD'
    : totalBoost < 25 ? 'SPORT BUILD'
    : totalBoost < 45 ? 'TRACK BUILD'
    : totalBoost < 70 ? 'RACE BUILD'
    : 'EXTREME BUILD'

  return (
    <div className="h-screen bg-zinc-950 text-white flex flex-col overflow-hidden">

      {/* ── HEADER ── */}
      <header className="flex-shrink-0 border-b border-zinc-900 px-4 h-12 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-orange-500 font-black text-lg">AUTO</span>
          <span className="text-white font-black text-lg">MOD</span>
          <span className="text-[10px] text-zinc-600 border border-zinc-800 px-1.5 py-px rounded-full font-bold tracking-wider">DEMO</span>
        </div>

        {/* Car tabs */}
        <div className="flex items-center gap-1.5">
          {cars.map(car => (
            <button
              key={car.id}
              onClick={() => handleCarChange(car)}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                selectedCar.id === car.id
                  ? 'bg-orange-500 text-white'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
              }`}
            >
              {car.year} {car.brand} {car.name}
            </button>
          ))}
        </div>

        <a href="/" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
          ← Overview
        </a>
      </header>

      {/* ── MAIN 3-COLUMN LAYOUT ── */}
      <div className="flex-1 flex overflow-hidden min-h-0">

        {/* ── LEFT: STATS PANEL ── */}
        <div className="w-56 flex-shrink-0 border-r border-zinc-900 bg-zinc-950 flex flex-col p-4 gap-4 overflow-hidden">

          {/* Car info */}
          <div>
            <p className="text-[10px] font-black tracking-widest text-zinc-600 uppercase mb-0.5">
              {selectedCar.brand}
            </p>
            <p className="text-base font-black text-white leading-tight">
              {selectedCar.year} {selectedCar.name}
            </p>
            {buildLabel && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-1.5 inline-flex items-center gap-1 text-[9px] font-black tracking-widest px-2 py-0.5 rounded bg-orange-500/15 text-orange-400 border border-orange-500/20"
              >
                ▲ {buildLabel}
              </motion.div>
            )}
          </div>

          {/* Stat bars */}
          <div className="flex flex-col gap-2.5 flex-1">
            <p className="text-[10px] font-black tracking-widest text-zinc-600 uppercase">
              Performance
            </p>
            {statKeys.map(key => (
              <StatBar
                key={key}
                label={STAT_LABELS[key]}
                statKey={key}
                value={currentStats[key]}
                delta={currentStats[key] - selectedCar.baseStats[key]}
              />
            ))}
          </div>

          {/* Total boost badge */}
          {totalBoost > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center"
            >
              <p className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase mb-1">Total Gain</p>
              <p className="text-2xl font-black text-emerald-400">+{totalBoost}</p>
            </motion.div>
          )}

          {/* Selected count */}
          <div className="text-center">
            <p className="text-[10px] text-zinc-600 font-bold tracking-widest uppercase">
              {selectedParts.length} parts · ${totalCost.toLocaleString()}
            </p>
          </div>
        </div>

        {/* ── CENTER: 3D CAR ── */}
        <div className="flex-1 min-w-0 relative bg-zinc-950 flex flex-col overflow-hidden">
          {/* Garage floor glow */}
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-orange-500/5 to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-orange-500/10" />

          <div className="flex-1 min-h-0">
            <CarViewer
              carColor={selectedCar.color}
              selectedParts={selectedParts}
              focusedCategory={focusedCategory}
            />
          </div>

          {/* Overview button — only shown when zoomed in */}
          <AnimatePresence>
            {focusedCategory && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="absolute top-3 left-1/2 -translate-x-1/2 z-10"
              >
                <button
                  onClick={() => setFocusedCategory(null)}
                  className="flex items-center gap-1.5 bg-zinc-900/90 border border-zinc-700 hover:border-orange-500 text-zinc-300 hover:text-white text-[10px] font-black tracking-widest px-3 py-1.5 rounded-full backdrop-blur-sm transition-all"
                >
                  ← OVERVIEW
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom hint */}
          <div className="flex-shrink-0 h-8 flex items-center justify-center gap-4 border-t border-zinc-900/50">
            <p className="text-[10px] text-zinc-700 font-medium tracking-wider">
              {focusedCategory
                ? 'DRAG TO INSPECT · AUTO-RETURNS IN 3S · CLICK OVERVIEW TO ORBIT'
                : 'DRAG TO ROTATE · PINCH TO ZOOM · SELECT A PART TO FOCUS'}
            </p>
          </div>
        </div>

        {/* ── RIGHT: PARTS PANEL ── */}
        <div className="w-80 flex-shrink-0 border-l border-zinc-900 bg-zinc-950 flex flex-col overflow-hidden">

          {/* Category tabs */}
          <div className="flex-shrink-0 border-b border-zinc-900 px-3 py-2">
            <div className="flex flex-wrap gap-1">
              {CATEGORIES.filter(c =>
                c.id === 'all' || compatibleParts.some(p => p.category === c.id)
              ).map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`text-[10px] font-black tracking-wider px-2.5 py-1 rounded-lg border transition-all ${
                    activeCategory === cat.id
                      ? 'bg-orange-500 border-orange-500 text-white'
                      : 'border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300'
                  }`}
                >
                  {cat.label.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Parts list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-hide">
            {filteredParts.length === 0 ? (
              <div className="text-center py-8 text-zinc-700 text-xs font-bold tracking-wider">
                NO PARTS AVAILABLE
              </div>
            ) : (
              filteredParts.map(part => (
                <PartRow
                  key={part.id}
                  part={part}
                  isSelected={selectedIds.has(part.id)}
                  onToggle={() => handleToggle(part)}
                />
              ))
            )}
          </div>

          {/* Cart footer */}
          <div className="flex-shrink-0 border-t border-zinc-900 p-3 space-y-2">
            {selectedParts.length > 0 ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500 font-bold tracking-wider">
                    {selectedParts.length} PARTS SELECTED
                  </span>
                  <span className="text-base font-black text-white">
                    ${totalCost.toLocaleString()}
                  </span>
                </div>
                <button className="w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-black text-xs tracking-widest transition-colors">
                  REQUEST QUOTE →
                </button>
                <button
                  onClick={() => { setSelectedParts([]); setFocusedCategory(null) }}
                  className="w-full py-1.5 rounded-xl border border-zinc-800 text-zinc-600 hover:text-zinc-400 font-bold text-[10px] tracking-widest transition-colors"
                >
                  CLEAR BUILD
                </button>
              </>
            ) : (
              <p className="text-center text-[10px] text-zinc-700 font-bold tracking-wider py-1">
                SELECT PARTS TO START YOUR BUILD
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
