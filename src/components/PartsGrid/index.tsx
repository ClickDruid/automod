'use client'

import { useState } from 'react'
import PartCard from './PartCard'
import type { CarPart, PartCategory } from '@/types'

interface PartsGridProps {
  parts: CarPart[]
  selectedParts: CarPart[]
  onToggle: (part: CarPart) => void
  carId: string
}

const CATEGORIES: { id: PartCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All Parts' },
  { id: 'engine', label: 'Engine' },
  { id: 'intake', label: 'Intake' },
  { id: 'exhaust', label: 'Exhaust' },
  { id: 'suspension', label: 'Suspension' },
  { id: 'brakes', label: 'Brakes' },
  { id: 'wheels', label: 'Wheels' },
  { id: 'aero', label: 'Aero' },
  { id: 'transmission', label: 'Transmission' },
]

export default function PartsGrid({ parts, selectedParts, onToggle, carId }: PartsGridProps) {
  const [activeCategory, setActiveCategory] = useState<PartCategory | 'all'>('all')

  const compatible = parts.filter(p => p.compatible.includes(carId))
  const filtered = activeCategory === 'all'
    ? compatible
    : compatible.filter(p => p.category === activeCategory)

  const selectedIds = new Set(selectedParts.map(p => p.id))

  const totalCost = selectedParts.reduce((acc, p) => acc + p.price, 0)

  return (
    <div className="flex flex-col h-full">
      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-4">
        {CATEGORIES.filter(c => {
          if (c.id === 'all') return true
          return compatible.some(p => p.category === c.id)
        }).map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${
              activeCategory === cat.id
                ? 'bg-orange-500 border-orange-500 text-white'
                : 'border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-300'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Parts list */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-hide">
        {filtered.length === 0 ? (
          <div className="text-center py-10 text-zinc-600 text-sm">
            No parts in this category
          </div>
        ) : (
          filtered.map(part => (
            <PartCard
              key={part.id}
              part={part}
              isSelected={selectedIds.has(part.id)}
              onToggle={onToggle}
            />
          ))
        )}
      </div>

      {/* Cart summary */}
      {selectedParts.length > 0 && (
        <div className="mt-4 pt-4 border-t border-zinc-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-zinc-400">
              {selectedParts.length} part{selectedParts.length > 1 ? 's' : ''} selected
            </span>
            <span className="text-base font-bold text-white">
              ${totalCost.toLocaleString()}
            </span>
          </div>
          <button className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-semibold text-sm transition-colors">
            Request Quote →
          </button>
          <p className="text-xs text-zinc-600 text-center mt-2">
            Demo only — connect to your store to enable checkout
          </p>
        </div>
      )}
    </div>
  )
}
