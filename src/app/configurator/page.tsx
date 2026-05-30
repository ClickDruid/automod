'use client'

import { useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import { calculateStats, STAT_LABELS, STAT_COLORS } from '@/lib/stats'
import type { CarModel, CarPart, CarStats, PartCategory } from '@/types'

import carsData from '@/data/cars.json'
import partsData from '@/data/parts.json'

const cars  = carsData as CarModel[]
const parts = partsData as CarPart[]

const CarViewer = dynamic(() => import('@/components/CarViewer'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="text-zinc-600 text-sm animate-pulse tracking-widest">LOADING 3D...</div>
    </div>
  ),
})

// ─── Category meta ────────────────────────────────────────────────────────────
const CAT_META: Record<string, { label: string; icon: string; color: string; zone: string }> = {
  engine:       { label: 'Engine',       icon: '⚙️',  color: '#f97316', zone: 'Engine Bay'       },
  intake:       { label: 'Intake',       icon: '🌀',  color: '#06b6d4', zone: 'Engine Bay'       },
  exhaust:      { label: 'Exhaust',      icon: '💨',  color: '#94a3b8', zone: 'Rear Bumper'      },
  suspension:   { label: 'Suspension',   icon: '🔧',  color: '#3b82f6', zone: 'All Four Corners' },
  brakes:       { label: 'Brakes',       icon: '🛑',  color: '#ef4444', zone: 'All Four Corners' },
  wheels:       { label: 'Wheels',       icon: '⭕',  color: '#a855f7', zone: 'All Four Corners' },
  aero:         { label: 'Aero',         icon: '🏁',  color: '#22c55e', zone: 'Exterior Body'    },
  transmission: { label: 'Transmission', icon: '⚡',  color: '#eab308', zone: 'Centre Drivetrain' },
}

const TIER_LABELS: Record<number, string> = { 1:'STREET', 2:'SPORT', 3:'TRACK', 4:'RACE', 5:'EXTREME' }
const TIER_COLORS: Record<number, string> = {
  1:'#6b7280', 2:'#3b82f6', 3:'#22c55e', 4:'#f97316', 5:'#ef4444',
}

const CATEGORIES = [
  { id: 'all',          label: 'ALL'   },
  { id: 'engine',       label: 'ENGINE' },
  { id: 'intake',       label: 'INTAKE' },
  { id: 'exhaust',      label: 'EXHAUST'},
  { id: 'suspension',   label: 'SUSP'  },
  { id: 'brakes',       label: 'BRAKES'},
  { id: 'wheels',       label: 'WHEELS'},
  { id: 'aero',         label: 'AERO'  },
  { id: 'transmission', label: 'TRANS' },
]

// ─── Stat bar ─────────────────────────────────────────────────────────────────
function StatBar({ label, statKey, value, delta }: {
  label: string; statKey: keyof CarStats; value: number; delta: number
}) {
  const color = STAT_COLORS[statKey]
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color }}>{label}</span>
        <div className="flex items-center gap-1.5">
          <AnimatePresence mode="popLayout">
            {delta !== 0 && (
              <motion.span key={delta} initial={{ opacity:0, y:-4 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                className={`text-[10px] font-black tabular-nums ${delta > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {delta > 0 ? '+' : ''}{delta}
              </motion.span>
            )}
          </AnimatePresence>
          <span className="text-xs font-black tabular-nums text-white w-6 text-right">{Math.round(value)}</span>
        </div>
      </div>
      <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
        <motion.div className="h-full rounded-full" style={{ backgroundColor: color }}
          animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
          transition={{ type: 'spring', stiffness: 100, damping: 18 }} />
      </div>
    </div>
  )
}

// ─── Product image placeholder ────────────────────────────────────────────────
// Uses the part's category accent color + icon as a styled thumbnail.
// In production this would be replaced with the client's actual product photo.
function ProductImage({ part }: { part: CarPart }) {
  const meta = CAT_META[part.category]
  const tier = (part as CarPart & { tier?: number }).tier ?? 1
  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center rounded-xl overflow-hidden relative"
      style={{ background: `radial-gradient(ellipse at 30% 30%, ${meta.color}22 0%, #09090b 70%)` }}
    >
      <div className="text-5xl mb-2 opacity-80">{meta.icon}</div>
      <p className="text-[8px] font-black tracking-widest uppercase opacity-40 text-white">
        {part.brand}
      </p>
      {/* Tier badge */}
      <div
        className="absolute top-2 right-2 text-[8px] font-black tracking-widest px-1.5 py-0.5 rounded"
        style={{ color: TIER_COLORS[tier], backgroundColor: `${TIER_COLORS[tier]}22` }}
      >
        {TIER_LABELS[tier]}
      </div>
    </div>
  )
}

// ─── Product spotlight (shown in 3D area when a part is selected) ─────────────
function ProductSpotlight({ part, car }: { part: CarPart; car: CarModel }) {
  const meta      = CAT_META[part.category]
  const tier      = (part as CarPart & { tier?: number }).tier ?? 1
  const statDeltas = Object.entries(part.stats) as [keyof CarStats, number][]

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={{ type: 'spring', stiffness: 260, damping: 28 }}
      className="absolute bottom-10 left-4 right-4 z-10"
    >
      <div className="bg-zinc-950/92 border border-zinc-800 backdrop-blur-md rounded-2xl p-3 flex gap-3 items-stretch">
        {/* Product image */}
        <div className="w-20 h-20 flex-shrink-0">
          <ProductImage part={part} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[9px] font-black tracking-widest text-zinc-500 uppercase">{part.brand}</span>
            <span className="text-[8px] font-black tracking-widest px-1.5 py-px rounded"
              style={{ color: TIER_COLORS[tier], backgroundColor: `${TIER_COLORS[tier]}18` }}>
              {TIER_LABELS[tier]}
            </span>
          </div>
          <p className="text-sm font-black text-white leading-tight mb-1 truncate">{part.name}</p>

          {/* Stat changes */}
          <div className="flex flex-wrap gap-1 mb-1.5">
            {statDeltas.map(([key, val]) => (
              <span key={key} className="text-[9px] font-black px-1.5 py-px rounded"
                style={{ color: STAT_COLORS[key], backgroundColor: `${STAT_COLORS[key]}18` }}>
                {val > 0 ? '+' : ''}{val} {STAT_LABELS[key].toUpperCase()}
              </span>
            ))}
          </div>

          {/* Zone label */}
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 animate-pulse"
              style={{ backgroundColor: meta.color }} />
            <span className="text-[9px] text-zinc-500 font-medium">
              Fits at: <span className="text-zinc-300">{meta.zone}</span>
            </span>
          </div>
        </div>

        {/* Price */}
        <div className="flex flex-col items-end justify-between flex-shrink-0">
          <span className="text-base font-black text-white">
            ${part.price >= 1000 ? `${(part.price / 1000).toFixed(1)}k` : part.price}
          </span>
          <span className="text-[9px] text-zinc-600 font-medium">
            {car.year} {car.name}
          </span>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Part card ────────────────────────────────────────────────────────────────
function PartCard({ part, isSelected, onToggle }: {
  part: CarPart; isSelected: boolean; onToggle: () => void
}) {
  const tier        = (part as CarPart & { tier?: number }).tier ?? 1
  const statEntries = Object.entries(part.stats) as [keyof CarStats, number][]
  const meta        = CAT_META[part.category]

  return (
    <motion.button
      onClick={onToggle}
      whileTap={{ scale: 0.98 }}
      className={`w-full text-left p-3 rounded-xl border transition-all duration-150 ${
        isSelected
          ? 'border-orange-500 bg-orange-500/8 shadow-[0_0_16px_rgba(249,115,22,0.12)]'
          : 'border-zinc-800/60 bg-zinc-900/50 hover:border-zinc-600'
      }`}
    >
      <div className="flex items-start gap-2.5">
        {/* Radio */}
        <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
          isSelected ? 'border-orange-500 bg-orange-500' : 'border-zinc-600'
        }`}>
          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[9px] font-black tracking-widest uppercase text-zinc-500">{part.brand}</span>
            <span className="text-[8px] font-black tracking-widest px-1.5 py-px rounded"
              style={{ color: TIER_COLORS[tier], backgroundColor: `${TIER_COLORS[tier]}18` }}>
              {TIER_LABELS[tier]}
            </span>
          </div>
          <p className="text-xs font-semibold text-white leading-tight mb-1.5">{part.name}</p>
          <div className="flex flex-wrap gap-1">
            {statEntries.map(([key, val]) => (
              <span key={key} className="text-[9px] font-black px-1.5 py-px rounded"
                style={{ color: STAT_COLORS[key], backgroundColor: `${STAT_COLORS[key]}18` }}>
                {val > 0 ? '+' : ''}{val} {STAT_LABELS[key].toUpperCase()}
              </span>
            ))}
          </div>
        </div>

        <div className="flex-shrink-0 text-right">
          <span className="text-sm font-black text-white">
            ${part.price >= 1000 ? `${(part.price / 1000).toFixed(1)}k` : part.price}
          </span>
          {isSelected && (
            <p className="text-[8px] text-zinc-500 mt-0.5">
              {meta.icon} {meta.zone}
            </p>
          )}
        </div>
      </div>
    </motion.button>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ConfiguratorPage() {
  const [selectedCar,    setSelectedCar]    = useState<CarModel>(cars[0])
  const [selectedPart,   setSelectedPart]   = useState<CarPart | null>(null)
  const [activeCategory, setActiveCategory] = useState<PartCategory | 'all'>('all')
  const [focusedCategory,setFocusedCategory]= useState<PartCategory | null>(null)

  const currentStats = useMemo(
    () => calculateStats(selectedCar.baseStats, selectedPart ? [selectedPart] : []),
    [selectedCar, selectedPart]
  )
  const statKeys   = Object.keys(selectedCar.baseStats) as (keyof CarStats)[]
  const totalBoost = useMemo(
    () => statKeys.reduce((acc, k) => acc + currentStats[k] - selectedCar.baseStats[k], 0),
    [currentStats, selectedCar, statKeys]
  )

  const compatibleParts = parts.filter(p => p.compatible.includes(selectedCar.id))
  const filteredParts   = activeCategory === 'all'
    ? compatibleParts
    : compatibleParts.filter(p => p.category === activeCategory)

  const buildLabel =
    totalBoost === 0   ? null
    : totalBoost < 10  ? 'STREET BUILD'
    : totalBoost < 25  ? 'SPORT BUILD'
    : totalBoost < 45  ? 'TRACK BUILD'
    : totalBoost < 70  ? 'RACE BUILD'
    : 'EXTREME BUILD'

  const handleToggle = (part: CarPart) => {
    const isSame     = selectedPart?.id === part.id
    const sameCat    = selectedPart?.category === part.category
    if (isSame) {
      setSelectedPart(null)
      setFocusedCategory(null)
    } else {
      setSelectedPart(part)
      if (!sameCat) setFocusedCategory(part.category)
    }
  }

  const handleCarChange = (car: CarModel) => {
    setSelectedCar(car); setSelectedPart(null); setFocusedCategory(null)
  }

  return (
    <div className="h-screen bg-zinc-950 text-white flex flex-col overflow-hidden">

      {/* Header */}
      <header className="flex-shrink-0 border-b border-zinc-900 px-4 h-12 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-orange-500 font-black text-lg">AUTO</span>
          <span className="text-white font-black text-lg">MOD</span>
          <span className="text-[10px] text-zinc-600 border border-zinc-800 px-1.5 py-px rounded-full font-bold tracking-wider">DEMO</span>
        </div>
        <div className="flex items-center gap-1.5">
          {cars.map(car => (
            <button key={car.id} onClick={() => handleCarChange(car)}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                selectedCar.id === car.id ? 'bg-orange-500 text-white' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
              }`}>
              {car.year} {car.brand} {car.name}
            </button>
          ))}
        </div>
        <a href="/" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">← Overview</a>
      </header>

      {/* 3-column layout */}
      <div className="flex-1 flex overflow-hidden min-h-0">

        {/* LEFT — Stats */}
        <div className="w-52 flex-shrink-0 border-r border-zinc-900 flex flex-col p-4 gap-4 overflow-hidden">
          <div>
            <p className="text-[10px] font-black tracking-widest text-zinc-600 uppercase mb-0.5">{selectedCar.brand}</p>
            <p className="text-base font-black text-white leading-tight">{selectedCar.year} {selectedCar.name}</p>
            <AnimatePresence>
              {buildLabel && (
                <motion.div key={buildLabel} initial={{ opacity:0, y:4 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                  className="mt-1.5 inline-flex items-center gap-1 text-[9px] font-black tracking-widest px-2 py-0.5 rounded bg-orange-500/15 text-orange-400 border border-orange-500/20">
                  ▲ {buildLabel}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex flex-col gap-2.5 flex-1">
            <p className="text-[10px] font-black tracking-widest text-zinc-600 uppercase">Performance</p>
            {statKeys.map(key => (
              <StatBar key={key} label={STAT_LABELS[key]} statKey={key}
                value={currentStats[key]} delta={currentStats[key] - selectedCar.baseStats[key]} />
            ))}
          </div>

          {totalBoost > 0 && (
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center">
              <p className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase mb-1">Total Gain</p>
              <p className="text-2xl font-black text-emerald-400">+{totalBoost}</p>
            </motion.div>
          )}

          {selectedPart && (
            <p className="text-[10px] text-zinc-600 font-bold tracking-widest uppercase text-center truncate">
              {selectedPart.brand} · ${selectedPart.price.toLocaleString()}
            </p>
          )}
        </div>

        {/* CENTER — 3D Car */}
        <div className="flex-1 min-w-0 relative bg-zinc-950 flex flex-col overflow-hidden">
          {/* Floor glow */}
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-orange-500/4 to-transparent pointer-events-none z-0" />

          {/* 3D canvas */}
          <div className="flex-1 min-h-0 relative">
            <CarViewer carColor={selectedCar.color} selectedPart={selectedPart} focusedCategory={focusedCategory} />

            {/* Overview button */}
            <AnimatePresence>
              {focusedCategory && (
                <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }}
                  className="absolute top-3 left-1/2 -translate-x-1/2 z-20">
                  <button onClick={() => setFocusedCategory(null)}
                    className="flex items-center gap-1.5 bg-zinc-900/90 border border-zinc-700 hover:border-orange-500 text-zinc-300 hover:text-white text-[10px] font-black tracking-widest px-3 py-1.5 rounded-full backdrop-blur-sm transition-all">
                    ← OVERVIEW
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Product spotlight */}
            <AnimatePresence>
              {selectedPart && (
                <ProductSpotlight part={selectedPart} car={selectedCar} />
              )}
            </AnimatePresence>
          </div>

          {/* Bottom hint */}
          <div className="flex-shrink-0 h-8 flex items-center justify-center border-t border-zinc-900/50 z-10">
            <p className="text-[10px] text-zinc-700 font-medium tracking-wider">
              {focusedCategory
                ? 'DRAG TO INSPECT · RELEASES RETURN IN 3S · ← OVERVIEW TO ORBIT'
                : 'SELECT ANY PART → SEE WHERE IT FITS ON YOUR CAR'}
            </p>
          </div>
        </div>

        {/* RIGHT — Parts */}
        <div className="w-80 flex-shrink-0 border-l border-zinc-900 flex flex-col overflow-hidden">

          {/* Category tabs */}
          <div className="flex-shrink-0 border-b border-zinc-900 px-3 py-2">
            <div className="flex flex-wrap gap-1">
              {CATEGORIES.filter(c => c.id === 'all' || compatibleParts.some(p => p.category === c.id)).map(cat => (
                <button key={cat.id} onClick={() => setActiveCategory(cat.id as PartCategory | 'all')}
                  className={`text-[10px] font-black tracking-wider px-2.5 py-1 rounded-lg border transition-all ${
                    activeCategory === cat.id
                      ? 'bg-orange-500 border-orange-500 text-white'
                      : 'border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300'
                  }`}>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-shrink-0 px-3 py-1.5 border-b border-zinc-900/40">
            <p className="text-[9px] text-zinc-600 font-bold tracking-widest">
              ONE PART · TAP TO SELECT · TAP AGAIN TO REMOVE
            </p>
          </div>

          {/* Parts list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-hide">
            {filteredParts.length === 0
              ? <div className="text-center py-8 text-zinc-700 text-xs font-bold tracking-wider">NO PARTS</div>
              : filteredParts.map(part => (
                  <PartCard key={part.id} part={part}
                    isSelected={selectedPart?.id === part.id}
                    onToggle={() => handleToggle(part)} />
                ))
            }
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 border-t border-zinc-900 p-3">
            {selectedPart ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-400 font-bold tracking-wider truncate pr-2">{selectedPart.name}</span>
                  <span className="text-base font-black text-white flex-shrink-0">${selectedPart.price.toLocaleString()}</span>
                </div>
                <button className="w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-black text-xs tracking-widest transition-colors">
                  REQUEST QUOTE →
                </button>
                <button onClick={() => { setSelectedPart(null); setFocusedCategory(null) }}
                  className="w-full py-1.5 rounded-xl border border-zinc-800 text-zinc-600 hover:text-zinc-400 font-bold text-[10px] tracking-widest transition-colors">
                  CLEAR SELECTION
                </button>
              </div>
            ) : (
              <p className="text-center text-[10px] text-zinc-700 font-bold tracking-wider py-1">
                SELECT A PART TO BEGIN
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
