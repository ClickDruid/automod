'use client'

import { Suspense, useRef, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, Environment, ContactShadows, CameraControls } from '@react-three/drei'
import type { CarPart, PartCategory } from '@/types'
import * as THREE from 'three'

useGLTF.preload('/models/ferrari.glb')

// ─── Camera presets ───────────────────────────────────────────────────────────
const CAM: Record<PartCategory | 'default', {
  pos: [number, number, number]
  target: [number, number, number]
}> = {
  engine:       { pos: [0.6, 1.0, 4.2],   target: [0, 0.44, 1.8]    },
  intake:       { pos: [1.2, 1.0, 4.0],   target: [0.3, 0.44, 1.8]  },
  exhaust:      { pos: [1.6, 0.1, -4.2],  target: [0.2, -0.24, -2.2] },
  suspension:   { pos: [3.4, -0.1, 1.4],  target: [0.96, -0.12, 1.3] },
  brakes:       { pos: [3.2, 0.2, 1.8],   target: [0.96, -0.12, 1.3] },
  wheels:       { pos: [3.5, 0.3, 0.2],   target: [0.96, -0.12, 0]   },
  aero:         { pos: [2.8, 1.4, -3.4],  target: [0, 0.62, -1.72]   },
  transmission: { pos: [2.5, 0.0, 0.5],   target: [0, -0.35, 0]      },
  default:      { pos: [3.5, 1.6, 5.5],   target: [0, 0.3, 0]        },
}

// ─── Ferrari 458 Spider — real world dimensions mapped to Three.js scene ──────
// Car primitive is at position [0, -0.44, 0].
// 1 unit ≈ 1 metre. Ferrari 458: 4.527m long, 1.937m wide, 1.218m high.
// Wheelbase 2.65m. Ground clearance 0.115m. Wheel radius ≈ 0.32m.
const F = {
  frontZ:    2.26,   // front bumper face Z
  rearZ:    -2.26,   // rear bumper face Z
  halfW:     0.96,   // half body width X
  groundY:  -0.44,   // world Y of tyre contact
  wheelY:   -0.12,   // world Y of wheel centre (groundY + 0.32)
  fWheelZ:   1.32,   // front wheel centre Z
  rWheelZ:  -1.32,   // rear wheel centre Z
  bumperY:  -0.33,   // bottom of front bumper (groundY + ground clearance 0.115)
  rockerY:  -0.09,   // bottom of door sill / rocker panel
  hoodY:     0.44,   // top surface of bonnet/hood
  rearDeckY: 0.32,   // top surface of rear trunk/deck
  roofY:     0.76,   // top of cabin roof
}

// ─── Shared material ──────────────────────────────────────────────────────────
const carbonProps = {
  color: '#1e1e1e' as const,
  metalness: 0.25,
  roughness: 0.40,
  emissive: '#0f0f0f' as const,
  emissiveIntensity: 0.15,
}

// ─── FRONT LIP ────────────────────────────────────────────────────────────────
// Lives at the front bumper bottom — blade across the full width + side canards
function FrontLip() {
  return (
    <group position={[0, F.bumperY - 0.02, F.frontZ + 0.02]}>
      {/* Wide blade spanning full bumper width, angled forward-down */}
      <mesh rotation={[-0.25, 0, 0]} castShadow>
        <boxGeometry args={[1.60, 0.025, 0.20]} />
        <meshStandardMaterial {...carbonProps} />
      </mesh>
      {/* Left canard fin */}
      <mesh position={[-0.72, 0.01, -0.05]} rotation={[-0.10, 0.20, 0]} castShadow>
        <boxGeometry args={[0.15, 0.018, 0.22]} />
        <meshStandardMaterial {...carbonProps} />
      </mesh>
      {/* Right canard fin */}
      <mesh position={[0.72, 0.01, -0.05]} rotation={[-0.10, -0.20, 0]} castShadow>
        <boxGeometry args={[0.15, 0.018, 0.22]} />
        <meshStandardMaterial {...carbonProps} />
      </mesh>
      {/* Centre splitter — extends further forward under bumper */}
      <mesh position={[0, -0.024, 0.08]} castShadow>
        <boxGeometry args={[0.50, 0.010, 0.16]} />
        <meshStandardMaterial {...carbonProps} />
      </mesh>
    </group>
  )
}

// ─── SIDE SKIRTS ─────────────────────────────────────────────────────────────
// Runs along BOTH sides of the car at the rocker/sill line,
// between the wheel arches (not touching the tyres)
function SideSkirts() {
  // Length: between wheel arches
  const skirtFrontZ = F.fWheelZ - 0.42   // just behind front wheel arch
  const skirtRearZ  = F.rWheelZ + 0.42   // just ahead of rear wheel arch
  const length = skirtFrontZ - skirtRearZ // total span
  const midZ   = (skirtFrontZ + skirtRearZ) / 2
  const panelY = F.rockerY - 0.055        // panel hangs below rocker
  const panelH = 0.14                     // height of skirt panel

  return (
    <>
      {/* Right skirt panel */}
      <mesh position={[F.halfW + 0.012, panelY, midZ]} castShadow>
        <boxGeometry args={[0.026, panelH, length]} />
        <meshStandardMaterial {...carbonProps} />
      </mesh>
      {/* Right bottom lip — returns inward */}
      <mesh position={[F.halfW - 0.004, panelY - panelH * 0.48, midZ]} castShadow>
        <boxGeometry args={[0.060, 0.012, length]} />
        <meshStandardMaterial {...carbonProps} />
      </mesh>

      {/* Left skirt panel */}
      <mesh position={[-(F.halfW + 0.012), panelY, midZ]} castShadow>
        <boxGeometry args={[0.026, panelH, length]} />
        <meshStandardMaterial {...carbonProps} />
      </mesh>
      {/* Left bottom lip */}
      <mesh position={[-(F.halfW - 0.004), panelY - panelH * 0.48, midZ]} castShadow>
        <boxGeometry args={[0.060, 0.012, length]} />
        <meshStandardMaterial {...carbonProps} />
      </mesh>
    </>
  )
}

// ─── REAR WING ───────────────────────────────────────────────────────────────
// Mounted above the rear deck — blade + gurney flap + endplates + pylons.
// Positioned at the REAR of the car, above the trunk.
function RearWing() {
  const wingZ  = F.rearZ  + 0.54        // above rear deck (not bumper)
  const bladeY = F.rearDeckY + 0.34     // 34 cm above rear deck surface
  const baseY  = F.rearDeckY + 0.04     // mount base on trunk

  return (
    <group>
      {/* Main blade */}
      <mesh position={[0, bladeY, wingZ]} rotation={[-0.15, 0, 0]} castShadow>
        <boxGeometry args={[1.44, 0.036, 0.31]} />
        <meshStandardMaterial {...carbonProps} />
      </mesh>
      {/* Gurney flap on trailing edge */}
      <mesh position={[0, bladeY - 0.028, wingZ - 0.15]} castShadow>
        <boxGeometry args={[1.44, 0.060, 0.012]} />
        <meshStandardMaterial {...carbonProps} />
      </mesh>
      {/* Left endplate */}
      <mesh position={[-0.72, bladeY - 0.050, wingZ]} castShadow>
        <boxGeometry args={[0.014, 0.240, 0.34]} />
        <meshStandardMaterial {...carbonProps} />
      </mesh>
      {/* Right endplate */}
      <mesh position={[0.72, bladeY - 0.050, wingZ]} castShadow>
        <boxGeometry args={[0.014, 0.240, 0.34]} />
        <meshStandardMaterial {...carbonProps} />
      </mesh>
      {/* Left pylon */}
      <mesh position={[-0.28, (bladeY + baseY) / 2, wingZ + 0.04]}
        rotation={[0.08, 0, 0]} castShadow>
        <boxGeometry args={[0.034, bladeY - baseY, 0.044]} />
        <meshStandardMaterial {...carbonProps} />
      </mesh>
      {/* Right pylon */}
      <mesh position={[0.28, (bladeY + baseY) / 2, wingZ + 0.04]}
        rotation={[0.08, 0, 0]} castShadow>
        <boxGeometry args={[0.034, bladeY - baseY, 0.044]} />
        <meshStandardMaterial {...carbonProps} />
      </mesh>
    </group>
  )
}

// ─── EXHAUST TIPS ─────────────────────────────────────────────────────────────
// Dual chrome tips at the REAR of the car, low near the bumper.
function ExhaustTips() {
  const y = F.groundY + 0.20   // 20 cm above ground
  const z = F.rearZ  - 0.01   // flush with rear bumper

  return (
    <group>
      {([-0.30, 0.30] as number[]).map((x, i) => (
        <group key={i} position={[x, y, z]}>
          {/* Outer chrome barrel */}
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.070, 0.080, 0.22, 24]} />
            <meshStandardMaterial color="#c8c8c8" metalness={0.95} roughness={0.04} />
          </mesh>
          {/* Inner dark bore */}
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.05]}>
            <cylinderGeometry args={[0.052, 0.052, 0.16, 24]} />
            <meshStandardMaterial color="#050505" roughness={0.9} />
          </mesh>
          {/* Tip flange ring */}
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.06]}>
            <torusGeometry args={[0.068, 0.009, 12, 24]} />
            <meshStandardMaterial color="#c8c8c8" metalness={0.95} roughness={0.04} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

// ─── BRAKE CALIPERS ──────────────────────────────────────────────────────────
// Coloured caliper body visible through wheel spokes — at each wheel position.
function BrakeCalipers({ color }: { color: string }) {
  const calMat = { color, metalness: 0.60, roughness: 0.30 }
  const wheels: [number, number, number, number][] = [
    [F.halfW - 0.08,  F.wheelY, F.fWheelZ,  1],
    [-(F.halfW - 0.08), F.wheelY, F.fWheelZ, -1],
    [F.halfW - 0.08,  F.wheelY, F.rWheelZ,  1],
    [-(F.halfW - 0.08), F.wheelY, F.rWheelZ, -1],
  ]
  return (
    <group>
      {wheels.map(([x, y, z], i) => (
        <group key={i} position={[x, y, z]}>
          <mesh castShadow>
            <boxGeometry args={[0.052, 0.22, 0.26]} />
            <meshStandardMaterial {...calMat} />
          </mesh>
          {/* Piston bridge */}
          <mesh position={[0, 0.09, 0]} castShadow>
            <boxGeometry args={[0.052, 0.040, 0.26]} />
            <meshStandardMaterial {...calMat} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

// ─── AFTERMARKET WHEEL FACES ─────────────────────────────────────────────────
// Overlaid on the existing GLTF tyres — only the visible rim face is replaced.
function WheelFaces({ tier }: { tier: number }) {
  const rimColor = tier >= 5 ? '#f0f0f0' : tier >= 4 ? '#e0e0e0' : tier >= 3 ? '#c8c8c8' : '#b2b2b2'
  const spokes   = tier >= 4 ? 10 : tier >= 3 ? 7 : 5

  const wheels: [number, number, number, 1 | -1][] = [
    [F.halfW + 0.015,  F.wheelY, F.fWheelZ,  1],
    [-(F.halfW + 0.015), F.wheelY, F.fWheelZ, -1],
    [F.halfW + 0.015,  F.wheelY, F.rWheelZ,  1],
    [-(F.halfW + 0.015), F.wheelY, F.rWheelZ, -1],
  ]

  return (
    <group>
      {wheels.map(([x, y, z, side], wi) => (
        <group key={wi} position={[x, y, z]}>
          {/* Dark face disc */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.265, 0.265, 0.014, 32]} />
            <meshStandardMaterial color="#0a0a0a" roughness={0.5} />
          </mesh>
          {/* Spokes */}
          {Array.from({ length: spokes }).map((_, s) => {
            const a = (s / spokes) * Math.PI * 2
            return (
              <mesh key={s} rotation={[0, 0, Math.PI / 2]}
                position={[0, Math.sin(a) * 0.14, Math.cos(a) * 0.14]}>
                <boxGeometry args={[0.010, 0.040, 0.23]} />
                <meshStandardMaterial color={rimColor} metalness={0.92} roughness={0.06} />
              </mesh>
            )
          })}
          {/* Centre cap */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.048, 0.048, 0.018, 20]} />
            <meshStandardMaterial color={rimColor} metalness={0.92} roughness={0.08} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

// ─── ENGINE / INTAKE GLOW ─────────────────────────────────────────────────────
// Orange glow overlay on the bonnet to signal engine/intake selection.
function EngineGlow() {
  return (
    <mesh position={[0, F.hoodY + 0.006, (F.frontZ + F.fWheelZ) / 2]}>
      <boxGeometry args={[1.30, 0.008, 0.90]} />
      <meshStandardMaterial
        color="#ff5500" emissive="#ff3300"
        emissiveIntensity={0.85} transparent opacity={0.38} />
    </mesh>
  )
}

// ─── SUSPENSION HELPER (subtle ride-height indicator) ────────────────────────
function SuspensionIndicator({ tier }: { tier: number }) {
  // Show a subtle spring icon near each wheel
  const drop = tier >= 4 ? 0.04 : tier >= 2 ? 0.02 : 0.01
  return (
    <group>
      {([F.fWheelZ, F.rWheelZ] as number[]).map((z, i) => (
        <mesh key={i} position={[0, F.wheelY - 0.29 - drop, z]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.08, 0.012, 8, 16, Math.PI * 1.5]} />
          <meshStandardMaterial color="#f97316" metalness={0.4} roughness={0.4}
            transparent opacity={0.6} />
        </mesh>
      ))}
    </group>
  )
}

// ─── Main Ferrari scene ───────────────────────────────────────────────────────
function FerrariModel({ color, selectedPart }: {
  color: string
  selectedPart: CarPart | null
}) {
  const { scene } = useGLTF('/models/ferrari.glb')
  const bodyColor = new THREE.Color(color)

  // Recolour body panels when colour prop changes
  useEffect(() => {
    scene.traverse(child => {
      if (!(child instanceof THREE.Mesh)) return
      const mats = Array.isArray(child.material) ? child.material : [child.material]
      mats.forEach(m => {
        if (!(m instanceof THREE.MeshStandardMaterial)) return
        const { r, g, b } = m.color
        // Only repaint panels that are already coloured (skip dark plastic/glass)
        if (r + g + b > 0.6) {
          m.color.set(bodyColor)
          m.metalness = 0.88
          m.roughness = 0.14
          m.needsUpdate = true
        }
      })
    })
  }, [color, scene])

  // Determine which parts to show from the single selected part
  const cat    = selectedPart?.category ?? null
  const partId = selectedPart?.id ?? ''
  const tier   = (selectedPart as (CarPart & { tier?: number }) | null)?.tier ?? 1

  const showLip        = cat === 'aero'        && (partId.includes('lip') || partId.includes('body-kit'))
  const showSkirts     = cat === 'aero'        && (partId.includes('skirt') || partId.includes('body-kit') || partId.includes('mud-flap'))
  const showWing       = cat === 'aero'        && (partId.includes('wing') || partId.includes('body-kit'))
  const showExhaust    = cat === 'exhaust'
  const showBrakes     = cat === 'brakes'
  const showWheels     = cat === 'wheels'
  const showEngine     = cat === 'engine'      || cat === 'intake'
  const showSuspension = cat === 'suspension'

  const brakeColor = tier >= 4 ? '#ef4444' : tier >= 2 ? '#f97316' : '#eab308'

  return (
    <group>
      {/* Base car model */}
      <primitive object={scene} scale={1} position={[0, -0.44, 0]} />

      {/* Part overlays — each positioned at the correct real location on the car */}
      {showLip        && <FrontLip />}
      {showSkirts     && <SideSkirts />}
      {showWing       && <RearWing />}
      {showExhaust    && <ExhaustTips />}
      {showBrakes     && <BrakeCalipers color={brakeColor} />}
      {showWheels     && <WheelFaces tier={tier} />}
      {showEngine     && <EngineGlow />}
      {showSuspension && <SuspensionIndicator tier={tier} />}
    </group>
  )
}

// ─── Camera controller ────────────────────────────────────────────────────────
function SceneController({ focusedCategory }: { focusedCategory: PartCategory | null }) {
  const controlsRef = useRef<CameraControls>(null)
  const isOrbiting  = useRef(true)
  const returnTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const focusedRef  = useRef(focusedCategory)

  useEffect(() => { focusedRef.current = focusedCategory }, [focusedCategory])

  // Constant slow orbit when in overview mode
  useFrame((_, delta) => {
    if (!isOrbiting.current || !controlsRef.current) return
    controlsRef.current.rotate(delta * 0.36, 0, false)
  })

  // React to focused category changes
  useEffect(() => {
    const ctrl = controlsRef.current
    if (!ctrl) return

    if (focusedCategory === null) {
      // Animate to default position then resume orbit
      isOrbiting.current = false
      const { pos, target } = CAM.default
      ctrl.setLookAt(pos[0], pos[1], pos[2], target[0], target[1], target[2], true)
        .then(() => { isOrbiting.current = true })
      return
    }

    // Zoom to the relevant part of the car
    isOrbiting.current = false
    const { pos, target } = CAM[focusedCategory] ?? CAM.default
    ctrl.setLookAt(pos[0], pos[1], pos[2], target[0], target[1], target[2], true)
  }, [focusedCategory])

  // User drag interaction: stop orbit, resume after 3s release
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
    ctrl.addEventListener('controlend',   onEnd)
    return () => {
      ctrl.removeEventListener('controlstart', onStart)
      ctrl.removeEventListener('controlend',   onEnd)
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
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [3.5, 1.6, 5.5], fov: 42 }}
        shadows
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.55} />
        <directionalLight position={[6, 8, 4]} intensity={1.6} castShadow
          shadow-mapSize={[2048, 2048]} />
        <directionalLight position={[-5, 4, -4]} intensity={0.5} color="#6688ff" />
        <pointLight position={[0, 6, 0]} intensity={0.4} />

        <Suspense fallback={null}>
          <FerrariModel color={carColor} selectedPart={selectedPart} />
          <ContactShadows
            position={[0, -0.46, 0]} opacity={0.75} scale={12} blur={3} far={4} />
          <Environment preset="city" />
        </Suspense>

        <SceneController focusedCategory={focusedCategory} />
      </Canvas>
    </div>
  )
}
