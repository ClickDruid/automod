'use client'

import { Suspense, useRef, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, Environment, ContactShadows, CameraControls } from '@react-three/drei'
import type { CarPart, PartCategory } from '@/types'
import * as THREE from 'three'

useGLTF.preload('/models/ferrari.glb')

// ─── Camera positions per part category ──────────────────────────────────────
const CAMERA_PRESETS: Record<PartCategory | 'default', {
  pos: [number, number, number]
  target: [number, number, number]
}> = {
  engine:       { pos: [0, 1.8, 4.5],    target: [0, 0.6, 1.8]    },
  intake:       { pos: [1.6, 1.6, 4.2],  target: [0.4, 0.5, 1.8]  },
  exhaust:      { pos: [1.8, 0.5, -4.2], target: [0.3, -0.1, -2.4] },
  suspension:   { pos: [3.4, 0.3, 1.5],  target: [1.1, -0.3, 1.0]  },
  brakes:       { pos: [3.2, 0.6, 1.8],  target: [1.1, -0.1, 1.2]  },
  wheels:       { pos: [3.6, 0.7, 0.2],  target: [1.2, -0.1, 0]    },
  aero:         { pos: [2.6, 2.0, -3.5], target: [0, 0.8, -1.8]    },
  transmission: { pos: [2.8, 0.4, 0.4],  target: [0, -0.4, 0]      },
  default:      { pos: [3.5, 1.6, 5.5],  target: [0, 0.3, 0]       },
}

// ─── Part-to-visual-change mapping ───────────────────────────────────────────
function useCarMods(selectedParts: CarPart[]) {
  const hasExhaust   = selectedParts.some(p => p.category === 'exhaust')
  const hasWing      = selectedParts.some(p => p.id.includes('wing') || p.id.includes('body-kit'))
  const hasLip       = selectedParts.some(p => p.id.includes('lip')  || p.id.includes('body-kit'))
  const hasSkirts    = selectedParts.some(p => p.id.includes('skirt') || p.id.includes('body-kit'))
  const hasBrakes    = selectedParts.some(p => p.category === 'brakes')
  const hasWheels    = selectedParts.some(p => p.category === 'wheels')
  const hasEngine    = selectedParts.some(p => p.category === 'engine')
  const tierOfWheels = selectedParts.find(p => p.category === 'wheels') as (CarPart & { tier?: number }) | undefined
  const wheelTier    = tierOfWheels?.tier ?? 0

  // Brake caliper colour based on tier
  const brakeTier  = (selectedParts.find(p => p.category === 'brakes') as (CarPart & { tier?: number }) | undefined)?.tier ?? 0
  const calColor   = brakeTier >= 4 ? '#ef4444' : brakeTier >= 2 ? '#f97316' : '#ffcc00'

  return { hasExhaust, hasWing, hasLip, hasSkirts, hasBrakes, hasWheels,
           hasEngine, wheelTier, calColor, brakeTier }
}

// ─── Ferrari model + overlays ─────────────────────────────────────────────────
function FerrariModel({ color, selectedParts }: { color: string; selectedParts: CarPart[] }) {
  const { scene } = useGLTF('/models/ferrari.glb')
  const bodyColor = new THREE.Color(color)

  const mods = useCarMods(selectedParts)

  // Tint body panels
  useEffect(() => {
    scene.traverse(child => {
      if (!(child instanceof THREE.Mesh)) return
      const mats = Array.isArray(child.material) ? child.material : [child.material]
      mats.forEach(m => {
        if (m instanceof THREE.MeshStandardMaterial && m.color.r + m.color.g + m.color.b > 0.6) {
          m.color.set(bodyColor)
          m.metalness = 0.9
          m.roughness = 0.15
          m.needsUpdate = true
        }
      })
    })
  }, [color, scene])

  // Shared materials
  const carbonMat  = new THREE.MeshStandardMaterial({ color: '#111111', metalness: 0.3, roughness: 0.5 })
  const chromeMat  = new THREE.MeshStandardMaterial({ color: '#aaaaaa', metalness: 0.95, roughness: 0.05 })
  const glowMat    = new THREE.MeshStandardMaterial({ color: '#ff6600', emissive: '#ff3300', emissiveIntensity: 0.6, transparent: true, opacity: 0.4 })

  return (
    <group>
      {/* ── Base model ── */}
      <primitive object={scene} scale={1} position={[0, -0.44, 0]} />

      {/* ── FRONT LIP ── */}
      {mods.hasLip && (
        <mesh position={[0, -0.28, 2.26]} castShadow>
          <boxGeometry args={[1.62, 0.09, 0.12]} />
          <primitive object={carbonMat} attach="material" />
        </mesh>
      )}

      {/* ── SIDE SKIRTS ── */}
      {mods.hasSkirts && (<>
        <mesh position={[-0.9, -0.19, 0.1]} castShadow>
          <boxGeometry args={[0.08, 0.14, 3.0]} />
          <primitive object={carbonMat} attach="material" />
        </mesh>
        <mesh position={[0.9, -0.19, 0.1]} castShadow>
          <boxGeometry args={[0.08, 0.14, 3.0]} />
          <primitive object={carbonMat} attach="material" />
        </mesh>
      </>)}

      {/* ── REAR WING ── */}
      {mods.hasWing && (
        <group position={[0, 0.72, -2.0]}>
          {/* Main blade */}
          <mesh>
            <boxGeometry args={[1.48, 0.06, 0.34]} />
            <primitive object={carbonMat} attach="material" />
          </mesh>
          {/* End plates */}
          {([-0.68, 0.68] as number[]).map((x, i) => (
            <mesh key={i} position={[x, -0.13, 0]}>
              <boxGeometry args={[0.07, 0.26, 0.38]} />
              <primitive object={carbonMat} attach="material" />
            </mesh>
          ))}
          {/* Supports */}
          {([-0.3, 0.3] as number[]).map((x, i) => (
            <mesh key={i} position={[x, -0.22, 0.06]}>
              <boxGeometry args={[0.05, 0.3, 0.06]} />
              <primitive object={carbonMat} attach="material" />
            </mesh>
          ))}
        </group>
      )}

      {/* ── DUAL EXHAUST TIPS ── */}
      {mods.hasExhaust && (
        <group position={[0, -0.28, -2.3]}>
          {([-0.28, 0.28] as number[]).map((x, i) => (
            <group key={i} position={[x, 0, 0]}>
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.072, 0.09, 0.16, 20]} />
                <primitive object={chromeMat} attach="material" />
              </mesh>
              {/* Inner dark */}
              <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.01]}>
                <cylinderGeometry args={[0.055, 0.055, 0.1, 20]} />
                <meshStandardMaterial color="#050505" roughness={0.8} />
              </mesh>
            </group>
          ))}
        </group>
      )}

      {/* ── BRAKE CALIPERS (visible through wheel gaps) ── */}
      {mods.hasBrakes && (
        <group>
          {([[-1.0, 1.3], [1.0, 1.3], [-1.0, -1.3], [1.0, -1.3]] as [number,number][]).map(([x, z], i) => (
            <mesh key={i} position={[x, -0.14, z]}>
              <boxGeometry args={[0.06, 0.18, 0.22]} />
              <meshStandardMaterial color={mods.calColor} metalness={0.7} roughness={0.3} />
            </mesh>
          ))}
        </group>
      )}

      {/* ── WHEEL OVERLAYS (aftermarket rims) ── */}
      {mods.hasWheels && (
        <group>
          {([[-1.02, 1.3], [1.02, 1.3], [-1.02, -1.3], [1.02, -1.3]] as [number,number][]).map(([x, z], i) => {
            const rimCol = mods.wheelTier >= 4 ? '#e8e8e8' : mods.wheelTier >= 3 ? '#c8c8c8' : '#b0b0b0'
            return (
              <group key={i} position={[x, -0.14, z]}>
                {/* Rim face disc */}
                <mesh rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[0.26, 0.26, 0.04, 32]} />
                  <meshStandardMaterial color={rimCol} metalness={0.95} roughness={0.05} />
                </mesh>
                {/* Spokes */}
                {Array.from({ length: mods.wheelTier >= 3 ? 10 : 5 }).map((_, s) => (
                  <mesh
                    key={s}
                    rotation={[0, 0, Math.PI / 2]}
                    position={[
                      x > 0 ? 0.015 : -0.015,
                      Math.sin((s / (mods.wheelTier >= 3 ? 10 : 5)) * Math.PI * 2) * 0.15,
                      Math.cos((s / (mods.wheelTier >= 3 ? 10 : 5)) * Math.PI * 2) * 0.15,
                    ]}
                  >
                    <boxGeometry args={[0.01, 0.04, 0.2]} />
                    <meshStandardMaterial color={rimCol} metalness={0.9} roughness={0.1} />
                  </mesh>
                ))}
              </group>
            )
          })}
        </group>
      )}

      {/* ── ENGINE / INTAKE — carbon hood highlight ── */}
      {mods.hasEngine && (
        <mesh position={[0, 0.52, 1.4]} rotation={[0.18, 0, 0]}>
          <boxGeometry args={[1.4, 0.01, 0.9]} />
          <primitive object={glowMat} attach="material" />
        </mesh>
      )}
    </group>
  )
}

// ─── Camera brain ─────────────────────────────────────────────────────────────
function SceneController({
  focusedCategory,
}: {
  focusedCategory: PartCategory | null
}) {
  const controlsRef = useRef<CameraControls>(null)
  const isAutoRotating = useRef(true)
  const returnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const focusedRef = useRef(focusedCategory)

  // Keep ref in sync with prop
  useEffect(() => {
    focusedRef.current = focusedCategory
  }, [focusedCategory])

  // Auto-rotate via azimuth
  useFrame((_, delta) => {
    if (!isAutoRotating.current || !controlsRef.current) return
    controlsRef.current.azimuthAngle += delta * 0.38
  })

  // React to focused category
  useEffect(() => {
    if (!controlsRef.current) return

    if (focusedCategory === null) {
      isAutoRotating.current = true
      return
    }

    isAutoRotating.current = false
    const { pos, target } = CAMERA_PRESETS[focusedCategory] ?? CAMERA_PRESETS.default
    controlsRef.current.setLookAt(
      pos[0], pos[1], pos[2],
      target[0], target[1], target[2],
      true
    )
  }, [focusedCategory])

  // User drag → pause → return to focus
  useEffect(() => {
    const ctrl = controlsRef.current
    if (!ctrl) return

    const onStart = () => {
      isAutoRotating.current = false
      if (returnTimerRef.current) clearTimeout(returnTimerRef.current)
    }

    const onEnd = () => {
      if (returnTimerRef.current) clearTimeout(returnTimerRef.current)
      returnTimerRef.current = setTimeout(() => {
        const cat = focusedRef.current
        if (cat) {
          const { pos, target } = CAMERA_PRESETS[cat] ?? CAMERA_PRESETS.default
          ctrl.setLookAt(pos[0], pos[1], pos[2], target[0], target[1], target[2], true)
        } else {
          isAutoRotating.current = true
        }
      }, 3000)
    }

    ctrl.addEventListener('controlstart', onStart)
    ctrl.addEventListener('controlend', onEnd)
    return () => {
      ctrl.removeEventListener('controlstart', onStart)
      ctrl.removeEventListener('controlend', onEnd)
      if (returnTimerRef.current) clearTimeout(returnTimerRef.current)
    }
  }, [])

  return (
    <CameraControls
      ref={controlsRef}
      makeDefault
      minDistance={1.5}
      maxDistance={10}
      polarAngle={Math.PI / 3}
    />
  )
}

// ─── Loader overlay ───────────────────────────────────────────────────────────
function Loader() {
  return (
    <mesh>
      <boxGeometry args={[0, 0, 0]} />
      <meshBasicMaterial />
    </mesh>
  )
}

// ─── Public props ─────────────────────────────────────────────────────────────
interface CarViewerProps {
  carColor: string
  selectedParts: CarPart[]
  focusedCategory: PartCategory | null
}

export default function CarViewer({ carColor, selectedParts, focusedCategory }: CarViewerProps) {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [3.5, 1.6, 5.5], fov: 42 }}
        shadows
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.55} />
        <directionalLight position={[6, 8, 4]} intensity={1.6} castShadow shadow-mapSize={[2048, 2048]} />
        <directionalLight position={[-5, 4, -4]} intensity={0.5} color="#6688ff" />
        <pointLight position={[0, 6, 0]} intensity={0.4} />

        <Suspense fallback={<Loader />}>
          <FerrariModel color={carColor} selectedParts={selectedParts} />
          <ContactShadows position={[0, -0.46, 0]} opacity={0.75} scale={12} blur={3} far={4} />
          <Environment preset="city" />
        </Suspense>

        <SceneController focusedCategory={focusedCategory} />
      </Canvas>
    </div>
  )
}
