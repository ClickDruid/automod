'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

const MAKES = ['Toyota', 'Honda', 'Subaru', 'Mitsubishi', 'Nissan', 'Mazda', 'BMW', 'Mercedes-AMG', 'Porsche', 'Ford', 'Chevrolet', 'Volkswagen']

const MODELS: Record<string, string[]> = {
  Toyota:       ['GR86', 'GR Supra', 'GR Yaris', 'Corolla', 'Camry'],
  Honda:        ['Civic Si', 'Civic Type R', 'Integra', 'Accord', 'S2000'],
  Subaru:       ['WRX', 'WRX STI', 'BRZ', 'Forester', 'Outback'],
  Mitsubishi:   ['Lancer Evolution', 'Eclipse Cross'],
  Nissan:       ['GT-R', 'Z', '370Z', 'Sentra'],
  Mazda:        ['MX-5 Miata', 'Mazda3', 'RX-7', 'RX-8'],
  BMW:          ['M3', 'M4', 'M2', '3 Series', '5 Series'],
  'Mercedes-AMG': ['A45', 'C63', 'GT', 'CLA45'],
  Porsche:      ['911', '718 Cayman', '718 Boxster', 'Macan'],
  Ford:         ['Mustang', 'Focus RS', 'Fiesta ST'],
  Chevrolet:    ['Corvette', 'Camaro', 'Silverado'],
  Volkswagen:   ['Golf GTI', 'Golf R', 'Jetta GLI'],
}

const YEARS = Array.from({ length: 25 }, (_, i) => String(2024 - i))

const PHOTO_SLOTS = [
  { id: 'front', label: 'FRONT',  icon: '⬆' },
  { id: 'rear',  label: 'REAR',   icon: '⬇' },
  { id: 'left',  label: 'LEFT',   icon: '◀' },
  { id: 'right', label: 'RIGHT',  icon: '▶' },
]

type PhotoSlot = { id: string; label: string; icon: string }

export default function MyCarPage() {
  const [make,  setMake]  = useState('')
  const [model, setModel] = useState('')
  const [year,  setYear]  = useState('')
  const [color, setColor] = useState('#C0392B')
  const [mods,  setMods]  = useState('')
  const [photos, setPhotos] = useState<Record<string, string>>({})
  const [step,  setStep]  = useState<'build' | 'generating' | 'done'>('build')
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const handlePhoto = (slotId: string, file: File | undefined) => {
    if (!file) return
    const url = URL.createObjectURL(file)
    setPhotos(prev => ({ ...prev, [slotId]: url }))
  }

  const canGenerate = make && model && year

  const handleGenerate = () => {
    if (!canGenerate) return
    setStep('generating')
    setTimeout(() => setStep('done'), 3200)
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Nav */}
      <nav className="border-b border-zinc-900 px-6 h-12 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Link href="/" className="flex items-center gap-1">
            <span className="text-orange-500 font-black text-xl">AUTO</span>
            <span className="text-white font-black text-xl">MOD</span>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/configurator" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
            Configurator
          </Link>
          <Link href="/how-it-works" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
            Integration
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <p className="text-[10px] font-black tracking-widest text-orange-500 uppercase mb-2">My Car</p>
          <h1 className="text-3xl font-black text-white mb-3">Build your car&apos;s digital twin</h1>
          <p className="text-zinc-400 text-sm leading-relaxed max-w-xl">
            Upload photos of your car from all four angles. Our AI reconstructs it as a 3D model
            you can explore and modify — then head to the configurator to spec your build.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {step === 'build' && (
            <motion.div key="build" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* Left: Photo upload */}
                <div>
                  <p className="text-[10px] font-black tracking-widest text-zinc-500 uppercase mb-4">
                    Step 1 — Upload 4 photos
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {PHOTO_SLOTS.map((slot: PhotoSlot) => (
                      <div key={slot.id}>
                        <input
                          ref={el => { fileRefs.current[slot.id] = el }}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={e => handlePhoto(slot.id, e.target.files?.[0])}
                        />
                        <button
                          onClick={() => fileRefs.current[slot.id]?.click()}
                          className="w-full aspect-[4/3] rounded-xl border-2 border-dashed border-zinc-800 hover:border-orange-500/50 transition-all overflow-hidden relative group"
                        >
                          {photos[slot.id] ? (
                            <img src={photos[slot.id]} alt={slot.label}
                              className="w-full h-full object-cover" />
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full gap-2">
                              <span className="text-2xl text-zinc-700 group-hover:text-orange-500 transition-colors">
                                {slot.icon}
                              </span>
                              <span className="text-[9px] font-black tracking-widest text-zinc-600 group-hover:text-zinc-400 transition-colors">
                                {slot.label}
                              </span>
                            </div>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="text-[9px] text-zinc-600 mt-3 leading-relaxed">
                    Best results: shoot from level, car fills the frame, good natural lighting.
                    All 4 angles recommended for accurate reconstruction.
                  </p>
                </div>

                {/* Right: Car details */}
                <div>
                  <p className="text-[10px] font-black tracking-widest text-zinc-500 uppercase mb-4">
                    Step 2 — Tell us about your car
                  </p>

                  <div className="space-y-3">
                    {/* Make */}
                    <div>
                      <label className="text-[9px] font-black tracking-widest text-zinc-500 uppercase block mb-1">Make</label>
                      <select
                        value={make}
                        onChange={e => { setMake(e.target.value); setModel('') }}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white focus:border-orange-500 focus:outline-none transition-colors"
                      >
                        <option value="">Select make...</option>
                        {MAKES.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>

                    {/* Model */}
                    <div>
                      <label className="text-[9px] font-black tracking-widest text-zinc-500 uppercase block mb-1">Model</label>
                      <select
                        value={model}
                        onChange={e => setModel(e.target.value)}
                        disabled={!make}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white focus:border-orange-500 focus:outline-none transition-colors disabled:opacity-40"
                      >
                        <option value="">Select model...</option>
                        {(MODELS[make] ?? []).map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>

                    {/* Year */}
                    <div>
                      <label className="text-[9px] font-black tracking-widest text-zinc-500 uppercase block mb-1">Year</label>
                      <select
                        value={year}
                        onChange={e => setYear(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white focus:border-orange-500 focus:outline-none transition-colors"
                      >
                        <option value="">Select year...</option>
                        {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>

                    {/* Colour */}
                    <div>
                      <label className="text-[9px] font-black tracking-widest text-zinc-500 uppercase block mb-1">
                        Colour
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={color}
                          onChange={e => setColor(e.target.value)}
                          className="w-10 h-10 rounded-lg border border-zinc-700 cursor-pointer bg-transparent"
                        />
                        <span className="text-sm text-zinc-400 font-mono">{color.toUpperCase()}</span>
                      </div>
                    </div>

                    {/* Modifications */}
                    <div>
                      <label className="text-[9px] font-black tracking-widest text-zinc-500 uppercase block mb-1">
                        Existing modifications (optional)
                      </label>
                      <textarea
                        value={mods}
                        onChange={e => setMods(e.target.value)}
                        placeholder="e.g. BC Racing coilovers, Enkei RPF1 wheels, short shifter, cold air intake..."
                        rows={3}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-orange-500 focus:outline-none transition-colors resize-none"
                      />
                    </div>

                    {/* Generate button */}
                    <button
                      onClick={handleGenerate}
                      disabled={!canGenerate}
                      className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-sm tracking-widest transition-colors mt-2"
                    >
                      GENERATE MY CAR →
                    </button>

                    {!canGenerate && (
                      <p className="text-[9px] text-zinc-600 text-center">
                        Select make, model and year to continue
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 'generating' && (
            <motion.div
              key="generating"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-24"
            >
              <div className="inline-block relative mb-8">
                <div className="w-16 h-16 rounded-full border-4 border-zinc-800 border-t-orange-500 animate-spin" />
              </div>
              <p className="text-sm font-black text-white tracking-widest mb-2">GENERATING 3D MODEL</p>
              <p className="text-xs text-zinc-500">Analysing photos · Mapping to {make} {model} · Applying colour profile...</p>
            </motion.div>
          )}

          {step === 'done' && (
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6">
                <svg className="w-7 h-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-xl font-black text-white mb-1">{year} {make} {model}</p>
              <p className="text-sm text-zinc-400 mb-8">Your 3D model is ready. Open the configurator to start building.</p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/configurator"
                  className="px-8 py-3 bg-orange-500 hover:bg-orange-400 text-white font-black text-sm tracking-widest rounded-xl transition-colors"
                >
                  OPEN CONFIGURATOR →
                </Link>
                <button
                  onClick={() => { setStep('build'); setPhotos({}) }}
                  className="px-6 py-3 border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 font-bold text-sm rounded-xl transition-colors"
                >
                  Try another car
                </button>
              </div>

              <div className="mt-10 p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl text-left max-w-sm mx-auto">
                <p className="text-[9px] font-black tracking-widest text-zinc-500 uppercase mb-2">Demo note</p>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  In this demo, all cars use the same Ferrari base model. The full product uses
                  AI photo reconstruction to build an accurate 3D twin of your specific car,
                  including your paint, wheels and body mods.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
