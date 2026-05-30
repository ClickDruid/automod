'use client'

import { Suspense, useRef, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, Environment, ContactShadows, CameraControls } from '@react-three/drei'
import type { CarPart, PartCategory } from '@/types'
import * as THREE from 'three'

useGLTF.preload('/models/ferrari.glb')

// ─── Ferrari 458 Spider — corrected coordinate system ─────────────────────────
//
// The Ferrari GLB has its front facing NEGATIVE Z and rear facing POSITIVE Z.
// Car is positioned at [0, -0.44, 0] in the scene.
// All values are in WORLD SPACE.
//
// Real dimensions: 4.527m long, 1.937m wide, 1.218m high. Wheelbase 2.65m.
//
const F = {
  frontZ:    -2.26,   // ← front bumper face   (NEGATIVE Z)
  rearZ:     +2.26,   // → rear bumper face    (POSITIVE Z)
  halfW:      0.96,   // half body width (X)
  groundY:   -0.44,   // world Y of tyre contact
  wheelY:    -0.12,   // world Y of wheel centre (groundY + wheel radius 0.32)
  fWheelZ:   -1.32,   // front wheel centre Z  (NEGATIVE = toward front)
  rWheelZ:   +1.32,   // rear wheel centre Z   (POSITIVE = toward rear)
  bumperY:   -0.33,   // bottom of front bumper (groundY + ground clearance 0.115)
  rockerY:   -0.09,   // bottom of door sill / rocker panel
  hoodY:      0.44,   // top surface of bonnet / hood
  rearDeckY:  0.32,   // top surface of rear trunk / deck
  roofY:      0.76,   // top of cabin roof
}

// ─── Camera presets — all tuned to correct Z direction ───────────────────────
const CAM: Record<PartCategory | 'default', {
  pos: [number, number, number]
  target: [number, number, number]
}> = {
  // Engine / intake → zoom to FRONT bonnet area
  engine:       { pos: [0.6,  1.0, -4.4],  target: [0,    0.44, -1.8]  },
  intake:       { pos: [1.2,  1.0, -4.2],  target: [0.3,  0.44, -1.8]  },
  // Exhaust → zoom to REAR bumper
  exhaust:      { pos: [-1.8, 0.1,  4.6],  target: [0,   -0.24,  2.2]  },
  // Suspension / brakes / wheels → zoom to REAR wheel
  suspension:   { pos: [ 3.4, 0.0,  1.8],  target: [0.96,-0.12,  1.3]  },
  brakes:       { pos: [ 3.2, 0.2,  2.0],  target: [0.96,-0.12,  1.3]  },
  wheels:       { pos: [ 3.5, 0.3,  1.6],  target: [0.96,-0.12,  1.3]  },
  // Aero → zoom to REAR deck (wing location)
  aero:         { pos: [-2.8, 1.5,  3.8],  target: [0,    0.66,  1.72] },
  // Transmission → centre undercar
  transmission: { pos: [ 2.5, 0.0,  0.5],  target: [0,   -0.35,  0]    },
  // Default → orbiting overview
  default:      { pos: [ 3.5, 1.6,  5.5],  target: [0,    0.3,   0]    },
}

// ─── Shared material props ───────────────────────────────────────────────────
const carbonMat = {
  color: '#1c1c1c' as const,
  metalness: 0.28,
  roughness: 0.38,
  emissive: '#101010' as const,
  emissiveIntensity: 0.18,
}

// ─── FRONT LIP ───────────────────────────────────────────────────────────────
// Sits at the FRONT of the car (negative Z), at the bottom of the front bumper.
// Blade extends slightly forward (more negative Z) and angles downward.
function FrontLip() {
  // Front lip lives at frontZ, bottom of bumper
  const z = F.frontZ - 0.02   // just in front of bumper face (more negative)
  const y = F.bumperY - 0.01  // at bumper bottom, slightly lower

  return (
    <group position={[0, y, z]}>
      {/* Wide main blade — angled down toward the road */}
      <mesh rotation={[0.22, 0, 0]} castShadow>
        <boxGeometry args={[1.60, 0.024, 0.19]} />
        <meshStandardMaterial {...carbonMat} />
      </mesh>
      {/* Left side canard fin */}
      <mesh position={[-0.72, 0.01, 0.05]} rotation={[0.10, -0.18, 0]} castShadow>
        <boxGeometry args={[0.15, 0.016, 0.20]} />
        <meshStandardMaterial {...carbonMat} />
      </mesh>
      {/* Right side canard fin */}
      <mesh position={[ 0.72, 0.01, 0.05]} rotation={[0.10,  0.18, 0]} castShadow>
        <boxGeometry args={[0.15, 0.016, 0.20]} />
        <meshStandardMaterial {...carbonMat} />
      </mesh>
      {/* Centre splitter — extends further forward */}
      <mesh position={[0, -0.025, -0.09]} castShadow>
        <boxGeometry args={[0.48, 0.010, 0.15]} />
        <meshStandardMaterial {...carbonMat} />
      </mesh>
    </group>
  )
}

// ─── SIDE SKIRTS ─────────────────────────────────────────────────────────────
// Run along BOTH SIDES of the car at the rocker/sill line,
// between front and rear wheel arches.
function SideSkirts() {
  // Span between wheel arches (not over them)
  const frontEnd = F.fWheelZ + 0.40   // just behind front arch → -1.32 + 0.40 = -0.92
  const rearEnd  = F.rWheelZ - 0.40   // just ahead of rear arch → +1.32 - 0.40 = +0.92
  const length   = rearEnd - frontEnd   // 1.84 m
  const midZ     = (frontEnd + rearEnd) / 2   // 0  (centred on car)

  const panelY = F.rockerY - 0.06     // hangs below rocker sill
  const panelH = 0.13                 // height of skirt

  return (
    <>
      {/* RIGHT side skirt panel (positive X) */}
      <mesh position={[ F.halfW + 0.016, panelY, midZ]} castShadow>
        <boxGeometry args={[0.030, panelH, length]} />
        <meshStandardMaterial {...carbonMat} />
      </mesh>
      {/* RIGHT skirt bottom return lip */}
      <mesh position={[ F.halfW - 0.005, panelY - panelH * 0.49, midZ]} castShadow>
        <boxGeometry args={[0.058, 0.012, length]} />
        <meshStandardMaterial {...carbonMat} />
      </mesh>

      {/* LEFT side skirt panel (negative X) */}
      <mesh position={[-F.halfW - 0.016, panelY, midZ]} castShadow>
        <boxGeometry args={[0.030, panelH, length]} />
        <meshStandardMaterial {...carbonMat} />
      </mesh>
      {/* LEFT skirt bottom return lip */}
      <mesh position={[-F.halfW + 0.005, panelY - panelH * 0.49, midZ]} castShadow>
        <boxGeometry args={[0.058, 0.012, length]} />
        <meshStandardMaterial {...carbonMat} />
      </mesh>
    </>
  )
}

// ─── REAR WING ───────────────────────────────────────────────────────────────
// Sits above the REAR trunk deck (positive Z), not the front.
// Blade + gurney flap + shaped endplates + mounting pylons.
function RearWing() {
  const wingZ  = F.rearZ - 0.52        // 52 cm in from rear face → +1.74
  const bladeY = F.rearDeckY + 0.35    // 35 cm above rear deck → +0.67
  const baseY  = F.rearDeckY + 0.04   // mount base on deck surface → +0.36

  return (
    <group>
      {/* Wing blade */}
      <mesh position={[0, bladeY, wingZ]} rotation={[0.15, 0, 0]} castShadow>
        <boxGeometry args={[1.44, 0.038, 0.30]} />
        <meshStandardMaterial {...carbonMat} />
      </mesh>
      {/* Gurney flap on trailing edge (toward front of car = negative Z offset) */}
      <mesh position={[0, bladeY - 0.030, wingZ - 0.14]} castShadow>
        <boxGeometry args={[1.44, 0.064, 0.012]} />
        <meshStandardMaterial {...carbonMat} />
      </mesh>
      {/* Left endplate */}
      <mesh position={[-0.72, bladeY - 0.055, wingZ]} castShadow>
        <boxGeometry args={[0.014, 0.250, 0.34]} />
        <meshStandardMaterial {...carbonMat} />
      </mesh>
      {/* Right endplate */}
      <mesh position={[ 0.72, bladeY - 0.055, wingZ]} castShadow>
        <boxGeometry args={[0.014, 0.250, 0.34]} />
        <meshStandardMaterial {...carbonMat} />
      </mesh>
      {/* Left pylon */}
      <mesh position={[-0.28, (bladeY + baseY) / 2, wingZ + 0.04]}
        rotation={[-0.08, 0, 0]} castShadow>
        <boxGeometry args={[0.034, bladeY - baseY + 0.02, 0.044]} />
        <meshStandardMaterial {...carbonMat} />
      </mesh>
      {/* Right pylon */}
      <mesh position={[ 0.28, (bladeY + baseY) / 2, wingZ + 0.04]}
        rotation={[-0.08, 0, 0]} castShadow>
        <boxGeometry args={[0.034, bladeY - baseY + 0.02, 0.044]} />
        <meshStandardMaterial {...carbonMat} />
      </mesh>
    </group>
  )
}

// ─── DUAL EXHAUST TIPS ───────────────────────────────────────────────────────
// At the REAR of the car (positive Z), low near the bumper bottom.
function ExhaustTips() {
  const z = F.rearZ + 0.01     // flush with rear bumper face → +2.27
  const y = F.groundY + 0.21   // 21 cm above ground → -0.23

  return (
    <group>
      {([-0.30, 0.30] as number[]).map((x, i) => (
        <group key={i} position={[x, y, z]}>
          {/* Outer chrome barrel */}
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.070, 0.082, 0.22, 24]} />
            <meshStandardMaterial color="#cccccc" metalness={0.95} roughness={0.04} />
          </mesh>
          {/* Inner bore (dark) */}
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.05]}>
            <cylinderGeometry args={[0.053, 0.053, 0.16, 24]} />
            <meshStandardMaterial color="#060606" roughness={0.9} />
          </mesh>
          {/* Chrome tip flange ring */}
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.06]}>
            <torusGeometry args={[0.069, 0.009, 12, 24]} />
            <meshStandardMaterial color="#cccccc" metalness={0.95} roughness={0.04} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

// ─── BRAKE CALIPERS ──────────────────────────────────────────────────────────
// Visible caliper body at each wheel — one per corner.
function BrakeCalipers({ color }: { color: string }) {
  // Four wheel positions
  const corners: [number, number, number][] = [
    [ F.halfW - 0.07, F.wheelY, F.fWheelZ],   // front-right
    [-F.halfW + 0.07, F.wheelY, F.fWheelZ],   // front-left
    [ F.halfW - 0.07, F.wheelY, F.rWheelZ],   // rear-right
    [-F.halfW + 0.07, F.wheelY, F.rWheelZ],   // rear-left
  ]

  return (
    <group>
      {corners.map(([x, y, z], i) => (
        <group key={i} position={[x, y, z]}>
          <mesh castShadow>
            <boxGeometry args={[0.052, 0.22, 0.26]} />
            <meshStandardMaterial color={color} metalness={0.58} roughness={0.32} />
          </mesh>
          <mesh position={[0, 0.10, 0]} castShadow>
            <boxGeometry args={[0.052, 0.040, 0.26]} />
            <meshStandardMaterial color={color} metalness={0.58} roughness={0.32} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

// ─── AFTERMARKET WHEEL FACES ─────────────────────────────────────────────────
// Overlaid on existing GLTF tyres. Disc face is in the YZ plane (perpendicular
// to X = axle direction). Spokes rotate radially using X-axis rotation.
function WheelFaces({ tier }: { tier: number }) {
  const rimColor   = tier >= 5 ? '#f0f0f0' : tier >= 4 ? '#e0e0e0' : tier >= 3 ? '#c8c8c8' : '#b0b0b0'
  const spokeCount = tier >= 4 ? 10 : tier >= 3 ? 7 : 5
  const OUTER_X    = F.halfW + 0.02   // just outside body edge

  const wheels: [number, number, number][] = [
    [ OUTER_X, F.wheelY, F.fWheelZ],  // front-right
    [-OUTER_X, F.wheelY, F.fWheelZ],  // front-left
    [ OUTER_X, F.wheelY, F.rWheelZ],  // rear-right
    [-OUTER_X, F.wheelY, F.rWheelZ],  // rear-left
  ]

  return (
    <group>
      {wheels.map(([x, y, z], wi) => (
        <group key={wi} position={[x, y, z]}>

          {/* Thin dark backing disc — face is in YZ plane (cylinder axis = X) */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.25, 0.25, 0.010, 32]} />
            <meshStandardMaterial color="#0a0a0a" roughness={0.55} transparent opacity={0.92} />
          </mesh>

          {/* Radial spokes — each rotated by angle `a` around X axis
              so local Z (long axis) aligns with the radial direction in the YZ plane */}
          {Array.from({ length: spokeCount }).map((_, s) => {
            const a = (s / spokeCount) * Math.PI * 2
            // Spoke midpoint sits at radius 0.12 in the YZ plane
            const sy = Math.sin(a) * 0.12
            const sz = Math.cos(a) * 0.12
            return (
              <mesh key={s} position={[0, sy, sz]} rotation={[-a, 0, 0]}>
                {/* X=thin(axle), Y=tangential width, Z=radial length */}
                <boxGeometry args={[0.009, 0.036, 0.21]} />
                <meshStandardMaterial color={rimColor} metalness={0.92} roughness={0.06} />
              </mesh>
            )
          })}

          {/* Centre hub cap */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.046, 0.046, 0.018, 20]} />
            <meshStandardMaterial color={rimColor} metalness={0.92} roughness={0.08} />
          </mesh>

          {/* Outer rim lip ring */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.245, 0.012, 12, 32]} />
            <meshStandardMaterial color={rimColor} metalness={0.90} roughness={0.10} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

// ─── ENGINE / INTAKE GLOW ─────────────────────────────────────────────────────
// Orange highlight on the bonnet (FRONT of car, negative Z area).
function EngineGlow() {
  // Hood area: between front bumper and front wheel
  const midZ = (F.frontZ + F.fWheelZ) / 2   // ≈ -1.79 (hood centre)
  return (
    <mesh position={[0, F.hoodY + 0.006, midZ]}>
      <boxGeometry args={[1.30, 0.008, 0.92]} />
      <meshStandardMaterial
        color="#ff5500" emissive="#ff3300"
        emissiveIntensity={0.9} transparent opacity={0.38} />
    </mesh>
  )
}

// ─── SUSPENSION INDICATOR ────────────────────────────────────────────────────
function SuspensionIndicator({ tier }: { tier: number }) {
  const drop = tier >= 4 ? 0.04 : tier >= 2 ? 0.02 : 0.01
  return (
    <group>
      {([F.fWheelZ, F.rWheelZ] as number[]).map((z, i) => (
        <mesh key={i} position={[0, F.wheelY - 0.29 - drop, z]}
          rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.08, 0.012, 8, 16, Math.PI * 1.5]} />
          <meshStandardMaterial color="#f97316" metalness={0.4} roughness={0.4}
            transparent opacity={0.65} />
        </mesh>
      ))}
    </group>
  )
}

// ─── Ferrari model + conditional overlays ─────────────────────────────────────
function FerrariModel({ color, selectedPart }: {
  color: string
  selectedPart: CarPart | null
}) {
  const { scene } = useGLTF('/models/ferrari.glb')
  const bodyColor = new THREE.Color(color)

  useEffect(() => {
    scene.traverse(child => {
      if (!(child instanceof THREE.Mesh)) return
      const mats = Array.isArray(child.material) ? child.material : [child.material]
      mats.forEach(m => {
        if (!(m instanceof THREE.MeshStandardMaterial)) return
        const { r, g, b } = m.color
        if (r + g + b > 0.55) {
          m.color.set(bodyColor)
          m.metalness = 0.88
          m.roughness = 0.14
          m.needsUpdate = true
        }
      })
    })
  }, [color, scene])

  // Part visibility derived from single selected part
  const cat    = selectedPart?.category ?? null
  const partId = selectedPart?.id ?? ''
  const tier   = (selectedPart as (CarPart & { tier?: number }) | null)?.tier ?? 1

  const showLip        = cat === 'aero'      && (partId.includes('lip')   || partId.includes('body-kit'))
  const showSkirts     = cat === 'aero'      && (partId.includes('skirt') || partId.includes('body-kit') || partId.includes('mud-flap'))
  const showWing       = cat === 'aero'      && (partId.includes('wing')  || partId.includes('body-kit'))
  const showExhaust    = cat === 'exhaust'
  const showBrakes     = cat === 'brakes'
  const showWheels     = cat === 'wheels'
  const showEngine     = cat === 'engine'    || cat === 'intake'
  const showSuspension = cat === 'suspension'

  const brakeColor = tier >= 4 ? '#ef4444' : tier >= 2 ? '#f97316' : '#eab308'

  return (
    <group>
      <primitive object={scene} scale={1} position={[0, -0.44, 0]} />
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

  useFrame((_, delta) => {
    if (!isOrbiting.current || !controlsRef.current) return
    controlsRef.current.rotate(delta * 0.36, 0, false)
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
      <Canvas camera={{ position: [3.5, 1.6, 5.5], fov: 42 }} shadows
        gl={{ antialias: true, alpha: true }} style={{ background: 'transparent' }}>
        <ambientLight intensity={0.55} />
        <directionalLight position={[6, 8, 4]} intensity={1.6} castShadow
          shadow-mapSize={[2048, 2048]} />
        <directionalLight position={[-5, 4, -4]} intensity={0.5} color="#6688ff" />
        <pointLight position={[0, 6, 0]} intensity={0.4} />
        <Suspense fallback={null}>
          <FerrariModel color={carColor} selectedPart={selectedPart} />
          <ContactShadows position={[0, -0.46, 0]} opacity={0.75} scale={12} blur={3} far={4} />
          <Environment preset="city" />
        </Suspense>
        <SceneController focusedCategory={focusedCategory} />
      </Canvas>
    </div>
  )
}
