'use client'

import { Suspense, useRef, useEffect, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useGLTF, Environment, ContactShadows, CameraControls } from '@react-three/drei'
import type { CarPart, PartCategory } from '@/types'
import * as THREE from 'three'

useGLTF.preload('/models/ferrari.glb')

// ─── Camera presets ───────────────────────────────────────────────────────────
const CAM: Record<PartCategory | 'default', { pos: [number,number,number]; target: [number,number,number] }> = {
  engine:       { pos: [0.5, 1.2, 4.0],   target: [0, 0.4, 1.5]    },
  intake:       { pos: [1.2, 1.2, 4.0],   target: [0.2, 0.4, 1.5]  },
  exhaust:      { pos: [1.5, 0.2, -4.0],  target: [0.2, -0.2, -2.2] },
  suspension:   { pos: [3.2, 0.0, 1.4],   target: [1.0, -0.3, 1.0]  },
  brakes:       { pos: [3.2, 0.3, 1.8],   target: [1.0, -0.15, 1.2] },
  wheels:       { pos: [3.4, 0.4, 0.2],   target: [1.0, -0.15, 0]   },
  aero:         { pos: [2.8, 1.6, -3.2],  target: [0, 0.5, -1.8]    },
  transmission: { pos: [2.6, 0.1, 0.5],   target: [0, -0.4, 0]      },
  default:      { pos: [3.5, 1.6, 5.5],   target: [0, 0.3, 0]       },
}

// ─── Measure model bounds once, then anchor parts to real coordinates ─────────
function BoundsReader({ onBounds }: { onBounds: (b: THREE.Box3) => void }) {
  const { scene } = useGLTF('/models/ferrari.glb')
  useEffect(() => {
    const box = new THREE.Box3().setFromObject(scene)
    onBounds(box)
  }, [scene, onBounds])
  return null
}

// ─── FRONT LIP ───────────────────────────────────────────────────────────────
// Thin blade angled slightly down + side canards
function FrontLip({ frontZ, bottomY }: { frontZ: number; bottomY: number }) {
  const y = bottomY - 0.02   // just below bumper bottom
  const z = frontZ + 0.01    // flush with front

  return (
    <group>
      {/* Main blade */}
      <mesh position={[0, y - 0.04, z]} rotation={[-0.22, 0, 0]} castShadow>
        <boxGeometry args={[1.62, 0.022, 0.18]} />
        <meshStandardMaterial color="#111111" metalness={0.25} roughness={0.38} />
      </mesh>
      {/* Left canard fin */}
      <mesh position={[-0.74, y - 0.03, z - 0.04]} rotation={[-0.1, 0.18, 0]} castShadow>
        <boxGeometry args={[0.14, 0.016, 0.18]} />
        <meshStandardMaterial color="#111111" metalness={0.25} roughness={0.38} />
      </mesh>
      {/* Right canard fin */}
      <mesh position={[0.74, y - 0.03, z - 0.04]} rotation={[-0.1, -0.18, 0]} castShadow>
        <boxGeometry args={[0.14, 0.016, 0.18]} />
        <meshStandardMaterial color="#111111" metalness={0.25} roughness={0.38} />
      </mesh>
      {/* Centre splitter (extends forward under bumper) */}
      <mesh position={[0, y - 0.048, z + 0.06]} castShadow>
        <boxGeometry args={[0.44, 0.009, 0.12]} />
        <meshStandardMaterial color="#111111" metalness={0.15} roughness={0.42} />
      </mesh>
    </group>
  )
}

// ─── SIDE SKIRTS ─────────────────────────────────────────────────────────────
// Panel along rocker, thin and tall, correctly at body edge
function SideSkirts({ halfWidth, rockerY, frontZ, rearZ }: {
  halfWidth: number; rockerY: number; frontZ: number; rearZ: number
}) {
  const length = (frontZ - 0.35) - (rearZ + 0.35)  // between wheel arches
  const midZ   = (frontZ - 0.35 + rearZ + 0.35) / 2
  const panelY = rockerY - 0.06   // skirting hangs below rocker
  const panelH = 0.13             // skirt height

  return (
    <>
      {/* Left skirt */}
      <mesh position={[-halfWidth - 0.01, panelY, midZ]} castShadow>
        <boxGeometry args={[0.022, panelH, length]} />
        <meshStandardMaterial color="#111111" metalness={0.2} roughness={0.40} />
      </mesh>
      {/* Left skirt bottom lip */}
      <mesh position={[-halfWidth + 0.01, panelY - panelH / 2 + 0.006, midZ]} castShadow>
        <boxGeometry args={[0.06, 0.010, length]} />
        <meshStandardMaterial color="#111111" metalness={0.2} roughness={0.40} />
      </mesh>

      {/* Right skirt */}
      <mesh position={[halfWidth + 0.01, panelY, midZ]} castShadow>
        <boxGeometry args={[0.022, panelH, length]} />
        <meshStandardMaterial color="#111111" metalness={0.2} roughness={0.40} />
      </mesh>
      {/* Right skirt bottom lip */}
      <mesh position={[halfWidth - 0.01, panelY - panelH / 2 + 0.006, midZ]} castShadow>
        <boxGeometry args={[0.06, 0.010, length]} />
        <meshStandardMaterial color="#111111" metalness={0.2} roughness={0.40} />
      </mesh>
    </>
  )
}

// ─── REAR WING ───────────────────────────────────────────────────────────────
// Airfoil blade on pylons with endplates — mounted above rear deck
function RearWing({ rearZ, roofY }: { rearZ: number; roofY: number }) {
  const wZ    = rearZ + 0.45      // 45cm from rear
  const baseY = roofY - 0.28     // below roof level (convertible rear deck)
  const wingY = baseY + 0.28     // blade sits 28cm above rear deck

  return (
    <group>
      {/* Wing blade (airfoil profile approximated) */}
      <mesh position={[0, wingY, wZ]} rotation={[-0.18, 0, 0]} castShadow>
        <boxGeometry args={[1.42, 0.032, 0.30]} />
        <meshStandardMaterial color="#111111" metalness={0.30} roughness={0.35} />
      </mesh>
      {/* Gurney flap on trailing edge */}
      <mesh position={[0, wingY - 0.024, wZ - 0.14]} castShadow>
        <boxGeometry args={[1.42, 0.052, 0.010]} />
        <meshStandardMaterial color="#111111" metalness={0.30} roughness={0.35} />
      </mesh>
      {/* Left endplate */}
      <mesh position={[-0.71, wingY - 0.04, wZ]} castShadow>
        <boxGeometry args={[0.012, 0.22, 0.32]} />
        <meshStandardMaterial color="#111111" metalness={0.28} roughness={0.38} />
      </mesh>
      {/* Right endplate */}
      <mesh position={[0.71, wingY - 0.04, wZ]} castShadow>
        <boxGeometry args={[0.012, 0.22, 0.32]} />
        <meshStandardMaterial color="#111111" metalness={0.28} roughness={0.38} />
      </mesh>
      {/* Left pylon */}
      <mesh position={[-0.28, baseY + 0.14, wZ + 0.04]} rotation={[0.10, 0, 0]} castShadow>
        <boxGeometry args={[0.032, 0.28, 0.040]} />
        <meshStandardMaterial color="#111111" metalness={0.28} roughness={0.38} />
      </mesh>
      {/* Right pylon */}
      <mesh position={[0.28, baseY + 0.14, wZ + 0.04]} rotation={[0.10, 0, 0]} castShadow>
        <boxGeometry args={[0.032, 0.28, 0.040]} />
        <meshStandardMaterial color="#111111" metalness={0.28} roughness={0.38} />
      </mesh>
    </group>
  )
}

// ─── DUAL EXHAUST TIPS ───────────────────────────────────────────────────────
function ExhaustTips({ rearZ, groundY }: { rearZ: number; groundY: number }) {
  const y = groundY + 0.18   // 18cm above ground
  const z = rearZ - 0.02
  return (
    <group>
      {([-0.30, 0.30] as number[]).map((x, i) => (
        <group key={i} position={[x, y, z]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.068, 0.078, 0.20, 24]} />
            <meshStandardMaterial color="#cccccc" metalness={0.96} roughness={0.04} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.04]}>
            <cylinderGeometry args={[0.050, 0.050, 0.14, 24]} />
            <meshStandardMaterial color="#040404" roughness={0.9} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.04]}>
            <torusGeometry args={[0.066, 0.009, 12, 24]} />
            <meshStandardMaterial color="#cccccc" metalness={0.96} roughness={0.04} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

// ─── BRAKE CALIPERS ──────────────────────────────────────────────────────────
function BrakeCalipers({ wheelCenters, halfWidth, color }: {
  wheelCenters: [number,number][]; halfWidth: number; color: string
}) {
  return (
    <group>
      {wheelCenters.flatMap(([y, z]) =>
        ([-1, 1] as number[]).map((side, i) => (
          <group key={`${z}-${i}`} position={[side * (halfWidth - 0.08), y, z]}>
            <mesh castShadow>
              <boxGeometry args={[0.050, 0.20, 0.24]} />
              <meshStandardMaterial color={color} metalness={0.62} roughness={0.32} />
            </mesh>
            <mesh position={[0, 0.08, 0]} castShadow>
              <boxGeometry args={[0.050, 0.038, 0.24]} />
              <meshStandardMaterial color={color} metalness={0.62} roughness={0.32} />
            </mesh>
          </group>
        ))
      )}
    </group>
  )
}

// ─── AFTERMARKET WHEEL FACES ─────────────────────────────────────────────────
function WheelFaces({ wheelCenters, halfWidth, tier }: {
  wheelCenters: [number,number][]; halfWidth: number; tier: number
}) {
  const rimColor = tier >= 5 ? '#f2f2f2' : tier >= 4 ? '#e0e0e0' : tier >= 3 ? '#c8c8c8' : '#b0b0b0'
  const spokeCount = tier >= 4 ? 10 : tier >= 3 ? 7 : 5

  return (
    <group>
      {wheelCenters.flatMap(([y, z]) =>
        ([-1, 1] as number[]).map((side, si) => (
          <group key={`${z}-${si}`} position={[side * (halfWidth + 0.02), y, z]}>
            {/* Face disc */}
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.26, 0.26, 0.012, 32]} />
              <meshStandardMaterial color="#0a0a0a" roughness={0.5} />
            </mesh>
            {/* Spokes */}
            {Array.from({ length: spokeCount }).map((_, s) => {
              const a = (s / spokeCount) * Math.PI * 2
              return (
                <mesh key={s} rotation={[0, 0, Math.PI / 2]}
                  position={[0, Math.sin(a) * 0.14, Math.cos(a) * 0.14]}>
                  <boxGeometry args={[0.008, 0.038, 0.22]} />
                  <meshStandardMaterial color={rimColor} metalness={0.92} roughness={0.06} />
                </mesh>
              )
            })}
            {/* Centre cap */}
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.046, 0.046, 0.016, 20]} />
              <meshStandardMaterial color={rimColor} metalness={0.92} roughness={0.08} />
            </mesh>
          </group>
        ))
      )}
    </group>
  )
}

// ─── Engine glow ─────────────────────────────────────────────────────────────
function EngineGlow({ roofY, frontZ }: { roofY: number; frontZ: number }) {
  return (
    <mesh position={[0, roofY - 0.60, frontZ - 0.78]}>
      <boxGeometry args={[1.28, 0.006, 0.88]} />
      <meshStandardMaterial color="#ff5500" emissive="#ff3300"
        emissiveIntensity={0.9} transparent opacity={0.35} />
    </mesh>
  )
}

// ─── Ferrari model + dynamic part overlays ───────────────────────────────────
function FerrariScene({ color, selectedPart, onBounds }: {
  color: string
  selectedPart: CarPart | null
  onBounds: (b: THREE.Box3) => void
}) {
  const { scene } = useGLTF('/models/ferrari.glb')
  const bodyColor = new THREE.Color(color)
  const offset: [number,number,number] = [0, -0.44, 0]

  // Measure model bounds (LOCAL space, before y offset)
  const [bounds, setBounds] = useState<THREE.Box3 | null>(null)
  useEffect(() => {
    const box = new THREE.Box3().setFromObject(scene)
    setBounds(box)
    // Convert to world space (add y offset)
    const wb = box.clone()
    wb.min.y += offset[1]
    wb.max.y += offset[1]
    onBounds(wb)
  }, [scene])

  // Recolour body
  useEffect(() => {
    scene.traverse(child => {
      if (!(child instanceof THREE.Mesh)) return
      const mats = Array.isArray(child.material) ? child.material : [child.material]
      mats.forEach(m => {
        if (!(m instanceof THREE.MeshStandardMaterial)) return
        const { r, g, b } = m.color
        if (r + g + b > 0.5) {
          m.color.set(bodyColor)
          m.metalness = 0.9
          m.roughness = 0.15
          m.needsUpdate = true
        }
      })
    })
  }, [color, scene])

  if (!bounds) return <primitive object={scene} scale={1} position={offset} />

  // World-space anchors derived from measured bounds
  const W = {
    frontZ:    bounds.max.z + offset[1] * 0,   // world Z front (offset doesn't affect Z)
    rearZ:     bounds.min.z,
    halfWidth: bounds.max.x,
    roofY:     bounds.max.y + offset[1],
    groundY:   bounds.min.y + offset[1],
    rockerY:   bounds.min.y + offset[1] + (bounds.max.y - bounds.min.y) * 0.22,
    wheelFrontZ: bounds.max.z - (bounds.max.z - bounds.min.z) * 0.28,
    wheelRearZ:  bounds.min.z + (bounds.max.z - bounds.min.z) * 0.28,
    wheelY:    bounds.min.y + offset[1] + (bounds.max.y - bounds.min.y) * 0.24,
  }

  const cat    = selectedPart?.category ?? null
  const partId = selectedPart?.id ?? ''
  const tier   = (selectedPart as (CarPart & { tier?: number }) | null)?.tier ?? 1

  const showLip    = cat === 'aero' && (partId.includes('lip')   || partId.includes('body-kit'))
  const showSkirts = cat === 'aero' && (partId.includes('skirt') || partId.includes('body-kit') || partId.includes('mud'))
  const showWing   = cat === 'aero' && (partId.includes('wing')  || partId.includes('body-kit'))
  const showExh    = cat === 'exhaust'
  const showBrakes = cat === 'brakes'
  const showWheels = cat === 'wheels'
  const showEngine = cat === 'engine' || cat === 'intake'

  const brakeColor = tier >= 4 ? '#ef4444' : tier >= 2 ? '#f97316' : '#eab308'
  const wheelCenters: [number,number][] = [[W.wheelY, W.wheelFrontZ], [W.wheelY, W.wheelRearZ]]

  return (
    <group>
      <primitive object={scene} scale={1} position={offset} />
      {showLip    && <FrontLip    frontZ={W.frontZ}    bottomY={W.groundY + (W.rockerY - W.groundY) * 0.5} />}
      {showSkirts && <SideSkirts  halfWidth={W.halfWidth} rockerY={W.rockerY} frontZ={W.frontZ} rearZ={W.rearZ} />}
      {showWing   && <RearWing    rearZ={W.rearZ}      roofY={W.roofY} />}
      {showExh    && <ExhaustTips rearZ={W.rearZ}      groundY={W.groundY} />}
      {showBrakes && <BrakeCalipers wheelCenters={wheelCenters} halfWidth={W.halfWidth} color={brakeColor} />}
      {showWheels && <WheelFaces   wheelCenters={wheelCenters} halfWidth={W.halfWidth} tier={tier} />}
      {showEngine && <EngineGlow   roofY={W.roofY}     frontZ={W.frontZ} />}
    </group>
  )
}

// ─── Camera controller ────────────────────────────────────────────────────────
function SceneController({ focusedCategory }: { focusedCategory: PartCategory | null }) {
  const controlsRef  = useRef<CameraControls>(null)
  const isOrbiting   = useRef(true)
  const returnTimer  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const focusedRef   = useRef(focusedCategory)

  useEffect(() => { focusedRef.current = focusedCategory }, [focusedCategory])

  useFrame((_, delta) => {
    if (!isOrbiting.current || !controlsRef.current) return
    controlsRef.current.rotate(delta * 0.38, 0, false)
  })

  useEffect(() => {
    const ctrl = controlsRef.current
    if (!ctrl) return
    if (focusedCategory === null) {
      isOrbiting.current = false
      const { pos, target } = CAM.default
      ctrl.setLookAt(pos[0], pos[1], pos[2], target[0], target[1], target[2], true)
        .then(() => { isOrbiting.current = true })
      return
    }
    isOrbiting.current = false
    const { pos, target } = CAM[focusedCategory] ?? CAM.default
    ctrl.setLookAt(pos[0], pos[1], pos[2], target[0], target[1], target[2], true)
  }, [focusedCategory])

  useEffect(() => {
    const ctrl = controlsRef.current
    if (!ctrl) return
    const onStart = () => {
      isOrbiting.current = false
      if (returnTimer.current) clearTimeout(returnTimer.current)
    }
    const onEnd = () => {
      if (returnTimer.current) clearTimeout(returnTimer.current)
      returnTimer.current = setTimeout(() => {
        const cat = focusedRef.current
        if (!ctrl) return
        if (cat) {
          const { pos, target } = CAM[cat] ?? CAM.default
          ctrl.setLookAt(pos[0], pos[1], pos[2], target[0], target[1], target[2], true)
        } else {
          isOrbiting.current = true
        }
      }, 3000)
    }
    ctrl.addEventListener('controlstart', onStart)
    ctrl.addEventListener('controlend', onEnd)
    return () => {
      ctrl.removeEventListener('controlstart', onStart)
      ctrl.removeEventListener('controlend', onEnd)
      if (returnTimer.current) clearTimeout(returnTimer.current)
    }
  }, [])

  return <CameraControls ref={controlsRef} makeDefault minDistance={1.8} maxDistance={10} />
}

// ─── Public component ─────────────────────────────────────────────────────────
interface CarViewerProps {
  carColor: string
  selectedPart: CarPart | null
  focusedCategory: PartCategory | null
}

export default function CarViewer({ carColor, selectedPart, focusedCategory }: CarViewerProps) {
  const [bounds, setBounds] = useState<THREE.Box3 | null>(null)

  return (
    <div className="w-full h-full">
      <Canvas camera={{ position: [3.5, 1.6, 5.5], fov: 42 }} shadows
        gl={{ antialias: true, alpha: true }} style={{ background: 'transparent' }}>
        <ambientLight intensity={0.55} />
        <directionalLight position={[6, 8, 4]} intensity={1.6} castShadow shadow-mapSize={[2048, 2048]} />
        <directionalLight position={[-5, 4, -4]} intensity={0.5} color="#6688ff" />
        <pointLight position={[0, 6, 0]} intensity={0.4} />
        <Suspense fallback={null}>
          <FerrariScene color={carColor} selectedPart={selectedPart} onBounds={setBounds} />
          <ContactShadows position={[0, -0.46, 0]} opacity={0.75} scale={12} blur={3} far={4} />
          <Environment preset="city" />
        </Suspense>
        <SceneController focusedCategory={focusedCategory} />
      </Canvas>

      {/* Debug: show detected bounds in corner — remove for production */}
      {bounds && process.env.NODE_ENV === 'development' && (
        <div className="absolute bottom-10 left-2 text-[8px] text-zinc-700 font-mono leading-tight pointer-events-none">
          X:{bounds.min.x.toFixed(2)}→{bounds.max.x.toFixed(2)}{' '}
          Y:{bounds.min.y.toFixed(2)}→{bounds.max.y.toFixed(2)}{' '}
          Z:{bounds.min.z.toFixed(2)}→{bounds.max.z.toFixed(2)}
        </div>
      )}
    </div>
  )
}
