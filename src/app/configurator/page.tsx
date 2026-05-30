'use client'

import { useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import StatsPanel from '@/components/StatsPanel'
import PartsGrid from '@/components/PartsGrid'
import { calculateStats } from '@/lib/stats'
import type { CarModel, CarPart } from '@/types'

import carsData from '@/data/cars.json'
import partsData from '@/data/parts.json'

const cars = carsData as CarModel[]
const parts = partsData as CarPart[]

const CarViewer = dynamic(() => import('@/components/CarViewer'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-zinc-950 rounded-xl">
      <div className="text-zinc-600 text-sm animate-pulse">Loading 3D viewer...</div>
    </div>
  ),
})

export default function ConfiguratorPage() {
  const [selectedCar, setSelectedCar] = useState<CarModel>(cars[0])
  const [selectedParts, setSelectedParts] = useState<CarPart[]>([])

  const currentStats = useMemo(
    () => calculateStats(selectedCar.baseStats, selectedParts),
    [selectedCar, selectedParts]
  )

  const handleCarChange = (car: CarModel) => {
    setSelectedCar(car)
    setSelectedParts([])
  }

  const handlePartToggle = (part: CarPart) => {
    setSelectedParts(prev =>
      prev.find(p => p.id === part.id)
        ? prev.filter(p => p.id !== part.id)
        : [...prev, part]
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      {/* Top bar */}
      <header className="border-b border-zinc-900 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-orange-500 font-black text-xl tracking-tight">AUTO</span>
          <span className="text-white font-black text-xl tracking-tight">MOD</span>
          <span className="text-xs text-zinc-600 font-medium border border-zinc-800 px-2 py-0.5 rounded-full">
            DEMO
          </span>
        </div>

        {/* Car selector */}
        <div className="flex items-center gap-2">
          {cars.map(car => (
            <button
              key={car.id}
              onClick={() => handleCarChange(car)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                selectedCar.id === car.id
                  ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                  : 'border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300'
              }`}
            >
              {car.year} {car.brand} {car.name}
            </button>
          ))}
        </div>

        <a
          href="/"
          className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          ← Back to overview
        </a>
      </header>

      {/* Main layout */}
      <div className="flex-1 grid grid-cols-[1fr_320px] overflow-hidden">
        {/* Left — 3D viewer + stats */}
        <div className="flex flex-col p-6 gap-6 overflow-hidden">
          {/* 3D viewer */}
          <div className="flex-1 min-h-0">
            <CarViewer
              carColor={selectedCar.color}
              selectedParts={selectedParts}
            />
          </div>

          {/* Stats */}
          <div className="flex-shrink-0">
            <StatsPanel
              baseStats={selectedCar.baseStats}
              currentStats={currentStats}
            />
          </div>
        </div>

        {/* Right — Parts panel */}
        <div className="border-l border-zinc-900 p-6 flex flex-col overflow-hidden">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-white tracking-wider uppercase">
              Parts Catalogue
            </h2>
            <p className="text-xs text-zinc-500 mt-1">
              Select parts to see live stat changes
            </p>
          </div>

          <div className="flex-1 overflow-hidden">
            <PartsGrid
              parts={parts}
              selectedParts={selectedParts}
              onToggle={handlePartToggle}
              carId={selectedCar.id}
            />
          </div>
        </div>
      </div>

      {/* Bottom hint */}
      <div className="border-t border-zinc-900 px-6 py-2 flex items-center gap-4">
        <p className="text-xs text-zinc-600">
          🖱 Drag to rotate · Scroll to zoom
        </p>
        {selectedParts.length > 0 && (
          <p className="text-xs text-orange-500 font-medium">
            {selectedParts.length} parts selected — stats updating live
          </p>
        )}
      </div>
    </div>
  )
}
