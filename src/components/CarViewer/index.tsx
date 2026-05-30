'use client'

import { Suspense, useRef, useEffect, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, Environment, ContactShadows, CameraControls } from '@react-three/drei'
import type { CarPart, PartCategory } from '@/types'
import * as THREE from 'three'

useGLTF.preload('/models/ferrari.glb')

// ─── Camera presets ───────────────────────────────────────────────────────────
const CAM: Record<PartCategory | 'default', { pos: [number,number,number]; target: [number,number,number] }> = {
  engine:       { pos: [0.5, 1.5, 4.2],   target: [0, 0.55, 1.8]   },
  intake:       { pos: [1.4, 1.4, 4.0],   target: [0.3, 0.5, 1.8]  },
  exhaust:      { pos: [1.6, 0.4, -4.0],  target: [0.2, -0.1, -2.3] },
  suspension:   { pos: [3.2, 0.2, 1.4],   target: [1.0, -0.2, 1.0]  },
  brakes:       { pos: [3.0, 0.5, 1.8],   target: [1.0, -0.1, 1.2]  },
  wheels:       { pos: [3.4, 0.6, 0],     target: [1.1, -0.15, 0]   },
  aero:         { pos: [2.4, 1.8, -3.4],  target: [0, 0.7, -1.9]    },
  transmission: { pos: [2.6, 0.3, 0.5],   target: [0, -0.4, 0]      },
  default:      { pos: [3.5, 1.6, 5.5],   target: [0, 0.3, 0]       },
}

// ─── Shared materials ─────────────────────────────────────────────────────────
const mkCarbon = () => new THREE.MeshStandardMaterial({
  color: '#141414', metalness: 0.25, roughness: 0.45, side: THREE.DoubleSide,
})
const mkChrome = () => new THREE.MeshStandardMaterial({
  color: '#d0d0d0', metalness: 0.96, roughness: 0.04,
})
const mkGloss = (col = '#0e0e0e') => new THREE.MeshStandardMaterial({
  color: col, metalness: 0.15, roughness: 0.25,
})

// ─── FRONT LIP ────────────────────────────────────────────────────────────────
// Real lip: thin angled blade + side canards + central splitter
function FrontLip() {
  const mat = useMemo(mkCarbon, [])

  const bladeGeo = useMemo(() => {
    // Lip blade cross-section (YZ plane): thin wedge that tapers forward & down
    const shape = new THREE.Shape()
    shape.moveTo(0, 0)                          // rear attach
    shape.lineTo(0.005, 0)
    shape.bezierCurveTo(0.01, -0.018, 0.06, -0.04, 0.11, -0.052) // underside curve
    shape.lineTo(0.11, -0.042)
    shape.bezierCurveTo(0.06, -0.028, 0.01, -0.008, 0, 0)        // top surface
    shape.closePath()
    return new THREE.ExtrudeGeometry(shape, { depth: 1.58, bevelEnabled: false })
  }, [])

  // Side canard (small fin)
  const canardGeo = useMemo(() => {
    const shape = new THREE.Shape()
    shape.moveTo(0, 0); shape.lineTo(0.18, -0.02); shape.lineTo(0.18, -0.04)
    shape.lineTo(0, -0.01); shape.closePath()
    return new THREE.ExtrudeGeometry(shape, { depth: 0.008, bevelEnabled: false })
  }, [])

  return (
    <group position={[0, -0.285, 2.21]}>
      {/* Main blade – spans full width, rotated to align chord along Z */}
      <mesh
        geometry={bladeGeo}
        material={mat}
        position={[-0.79, 0, 0]}
        rotation={[0, Math.PI / 2, 0]}
        castShadow
      />
      {/* Left canard */}
      <mesh geometry={canardGeo} material={mat} position={[-0.88, -0.01, 0.01]} rotation={[0, 0.3, 0]} castShadow />
      {/* Right canard */}
      <mesh geometry={canardGeo} material={mat} position={[0.88, -0.01, 0.01]} rotation={[0, -0.3, Math.PI]} castShadow />
      {/* Central splitter plate */}
      <mesh castShadow>
        <boxGeometry args={[0.42, 0.008, 0.13]} />
        <primitive object={mat} attach="material" />
      </mesh>
    </group>
  )
}

// ─── SIDE SKIRTS ──────────────────────────────────────────────────────────────
// Real skirt: ExtrudeGeometry with shaped cross-section (not a box)
function SideSkirts() {
  const mat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#0f0f0f', metalness: 0.2, roughness: 0.42,
  }), [])

  // Right skirt cross-section (X = outward, Y = up, extruded along Z)
  const rightGeo = useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(0, 0)                                              // top-inner (attach line)
    s.lineTo(0.014, 0.008)                                      // top outer bead
    s.lineTo(0.06, -0.018)                                      // upper angled face
    s.lineTo(0.075, -0.072)                                     // outer face mid
    s.bezierCurveTo(0.082, -0.105, 0.072, -0.128, 0.052, -0.133) // bottom curve
    s.lineTo(0.024, -0.136)                                     // bottom underside
    s.lineTo(0, -0.132)                                         // inner bottom
    s.closePath()
    return new THREE.ExtrudeGeometry(s, { depth: 3.04, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 2 })
  }, [])

  // Left skirt: mirror shape
  const leftGeo = useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(0, 0)
    s.lineTo(-0.014, 0.008)
    s.lineTo(-0.06, -0.018)
    s.lineTo(-0.075, -0.072)
    s.bezierCurveTo(-0.082, -0.105, -0.072, -0.128, -0.052, -0.133)
    s.lineTo(-0.024, -0.136)
    s.lineTo(0, -0.132)
    s.closePath()
    return new THREE.ExtrudeGeometry(s, { depth: 3.04, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 2 })
  }, [])

  return (
    <>
      <mesh geometry={rightGeo} material={mat} position={[0.878, -0.06, -1.52]} castShadow />
      <mesh geometry={leftGeo}  material={mat} position={[-0.878, -0.06, -1.52]} castShadow />
    </>
  )
}

// ─── REAR WING ────────────────────────────────────────────────────────────────
// Real wing: airfoil-section blade + proper endplates + angled mounting pylons
function RearWing() {
  const carbonMat = useMemo(mkCarbon, [])

  // Airfoil blade (NACA-style simplified profile)
  const bladeGeo = useMemo(() => {
    const shape = new THREE.Shape()
    // Upper surface
    shape.moveTo(0, 0)
    shape.bezierCurveTo(0.018, 0.028, 0.08, 0.040, 0.18, 0.030)
    shape.bezierCurveTo(0.24, 0.022, 0.30, 0.008, 0.33, 0)
    // Lower surface
    shape.bezierCurveTo(0.30, -0.006, 0.24, -0.012, 0.18, -0.013)
    shape.bezierCurveTo(0.08, -0.014, 0.018, -0.010, 0, 0)
    // Wing span (extruded along Z = 1.48 wide)
    return new THREE.ExtrudeGeometry(shape, { depth: 1.48, bevelEnabled: false })
  }, [])

  // Endplate: shaped plate at wing tip
  const endplateGeo = useMemo(() => {
    const shape = new THREE.Shape()
    shape.moveTo(-0.06, 0.08)
    shape.bezierCurveTo(-0.04, 0.10, 0.04, 0.10, 0.06, 0.08)
    shape.lineTo(0.38, -0.06)
    shape.bezierCurveTo(0.40, -0.09, 0.38, -0.13, 0.34, -0.14)
    shape.lineTo(-0.02, -0.14)
    shape.bezierCurveTo(-0.06, -0.13, -0.08, -0.09, -0.06, -0.06)
    shape.closePath()
    return new THREE.ExtrudeGeometry(shape, { depth: 0.012, bevelEnabled: true, bevelSize: 0.004, bevelThickness: 0.004 })
  }, [])

  return (
    // Group centered at rear of car
    <group position={[0, 0.66, -1.98]}>
      {/* Blade: spans from x=-0.74 to x=0.74 → rotate so extrusion is along X */}
      <mesh
        geometry={bladeGeo}
        material={carbonMat}
        position={[0.74, 0, -0.06]}
        rotation={[0.06, -Math.PI / 2, 0]}
        castShadow
      />

      {/* Left endplate */}
      <mesh geometry={endplateGeo} material={carbonMat} position={[-0.74, -0.06, -0.06]} rotation={[0, Math.PI / 2, 0]} castShadow />
      {/* Right endplate */}
      <mesh geometry={endplateGeo} material={carbonMat} position={[0.74, -0.06, -0.06]} rotation={[0, -Math.PI / 2, 0]} castShadow />

      {/* Left mounting pylon */}
      <mesh position={[-0.26, -0.22, -0.04]} rotation={[0.08, 0, 0]} castShadow>
        <boxGeometry args={[0.038, 0.42, 0.052]} />
        <primitive object={carbonMat} attach="material" />
      </mesh>
      {/* Right mounting pylon */}
      <mesh position={[0.26, -0.22, -0.04]} rotation={[0.08, 0, 0]} castShadow>
        <boxGeometry args={[0.038, 0.42, 0.052]} />
        <primitive object={carbonMat} attach="material" />
      </mesh>
    </group>
  )
}

// ─── EXHAUST TIPS ─────────────────────────────────────────────────────────────
// Real dual oval exhaust with chrome surround + dark inner bore
function ExhaustTips() {
  const chromeMat = useMemo(mkChrome, [])
  const boreMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#040404', roughness: 0.9 }), [])

  return (
    <group position={[0, -0.27, -2.32]}>
      {([-0.30, 0.30] as number[]).map((x, i) => (
        <group key={i} position={[x, 0, 0]}>
          {/* Outer chrome tip */}
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.068, 0.076, 0.18, 24]} />
            <primitive object={chromeMat} attach="material" />
          </mesh>
          {/* Inner bore (dark) */}
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.04]}>
            <cylinderGeometry args={[0.052, 0.052, 0.14, 24]} />
            <primitive object={boreMat} attach="material" />
          </mesh>
          {/* Tip flange ring */}
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.04]}>
            <torusGeometry args={[0.066, 0.008, 12, 24]} />
            <primitive object={chromeMat} attach="material" />
          </mesh>
        </group>
      ))}
    </group>
  )
}

// ─── BRAKE CALIPERS ───────────────────────────────────────────────────────────
// Realistic caliper body visible through wheel spokes
function BrakeCalipers({ color }: { color: string }) {
  const mat = useMemo(() => new THREE.MeshStandardMaterial({
    color, metalness: 0.6, roughness: 0.35,
  }), [color])

  return (
    <group>
      {([[-1.02, 1.3], [1.02, 1.3], [-1.02, -1.3], [1.02, -1.3]] as [number,number][]).map(([x, z], i) => (
        <group key={i} position={[x > 0 ? x - 0.08 : x + 0.08, -0.14, z]}>
          {/* Main caliper body */}
          <mesh castShadow>
            <boxGeometry args={[0.055, 0.20, 0.25]} />
            <primitive object={mat} attach="material" />
          </mesh>
          {/* Piston bridge */}
          <mesh position={[0, 0.08, 0]} castShadow>
            <boxGeometry args={[0.055, 0.04, 0.25]} />
            <primitive object={mat} attach="material" />
          </mesh>
          {/* Bleed nipple */}
          <mesh position={[0, 0.09, 0.08]} castShadow>
            <cylinderGeometry args={[0.008, 0.008, 0.02, 8]} />
            <meshStandardMaterial color="#888888" metalness={0.9} roughness={0.1} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

// ─── AFTERMARKET WHEELS ───────────────────────────────────────────────────────
// Proper rim with barrel, face, spokes and hub — overlaid on Ferrari's existing tyre
function AftermarketWheels({ tier }: { tier: number }) {
  const rimCol  = tier >= 5 ? '#f2f2f2' : tier >= 4 ? '#e0e0e0' : tier >= 3 ? '#cccccc' : '#bbbbbb'
  const rimMat  = useMemo(() => new THREE.MeshStandardMaterial({ color: rimCol, metalness: 0.92, roughness: 0.06 }), [rimCol])
  const darkMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#111111', metalness: 0.3, roughness: 0.5 }), [])
  const spokeCount = tier >= 4 ? 10 : tier >= 3 ? 7 : 5

  // Rim barrel profile (lathe around Y, then rotated 90° to face outward)
  const rimBarrelGeo = useMemo(() => {
    const pts = [
      new THREE.Vector2(0.28, 0),
      new THREE.Vector2(0.29, 0.012),
      new THREE.Vector2(0.29, 0.032),
      new THREE.Vector2(0.26, 0.040),
      new THREE.Vector2(0.20, 0.048),
      new THREE.Vector2(0.09, 0.052),
      new THREE.Vector2(0.05, 0.050),
      new THREE.Vector2(0.05, 0.022),
      new THREE.Vector2(0.0,  0.018),
    ]
    return new THREE.LatheGeometry(pts, 32)
  }, [])

  const positions: [number,number,number][] = [
    [-1.02, -0.14, 1.30], [1.02, -0.14, 1.30],
    [-1.02, -0.14, -1.30], [1.02, -0.14, -1.30],
  ]

  return (
    <group>
      {positions.map(([x, y, z], wi) => {
        const facingLeft = x < 0
        return (
          <group key={wi} position={[x, y, z]}>
            {/* Lathe rim barrel */}
            <mesh
              geometry={rimBarrelGeo}
              material={rimMat}
              rotation={[0, 0, Math.PI / 2]}
              scale={[1, facingLeft ? 1 : -1, 1]}
              castShadow
            />
            {/* Face disc */}
            <mesh rotation={[0, 0, Math.PI / 2]} position={[facingLeft ? -0.052 : 0.052, 0, 0]} castShadow>
              <cylinderGeometry args={[0.25, 0.25, 0.012, 32]} />
              <primitive object={darkMat} attach="material" />
            </mesh>
            {/* Spokes */}
            {Array.from({ length: spokeCount }).map((_, s) => {
              const angle = (s / spokeCount) * Math.PI * 2
              const sx = Math.sin(angle) * 0.14
              const sz = Math.cos(angle) * 0.14
              return (
                <mesh
                  key={s}
                  rotation={[0, 0, Math.PI / 2]}
                  position={[facingLeft ? -0.048 : 0.048, sx, sz]}
                  castShadow
                >
                  <boxGeometry args={[0.010, 0.040, 0.21]} />
                  <primitive object={rimMat} attach="material" />
                </mesh>
              )
            })}
            {/* Centre cap */}
            <mesh rotation={[0, 0, Math.PI / 2]} position={[facingLeft ? -0.054 : 0.054, 0, 0]}>
              <cylinderGeometry args={[0.048, 0.048, 0.016, 20]} />
              <primitive object={rimMat} attach="material" />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}

// ─── ENGINE GLOW (visual cue for engine/intake parts) ────────────────────────
function EngineGlow() {
  return (
    <mesh position={[0, 0.50, 1.38]} rotation={[0.18, 0, 0]}>
      <boxGeometry args={[1.28, 0.008, 0.85]} />
      <meshStandardMaterial
        color="#ff5500"
        emissive="#ff3300"
        emissiveIntensity={0.8}
        transparent
        opacity={0.35}
      />
    </mesh>
  )
}

// ─── Ferrari model + conditional overlays ────────────────────────────────────
function FerrariModel({ color, selectedPart }: { color: string; selectedPart: CarPart | null }) {
  const { scene } = useGLTF('/models/ferrari.glb')
  const bodyColor = useMemo(() => new THREE.Color(color), [color])

  const cat    = selectedPart?.category ?? null
  const partId = selectedPart?.id ?? ''
  const tier   = (selectedPart as (CarPart & { tier?: number }) | null)?.tier ?? 1

  const showLip    = cat === 'aero' && (partId.includes('lip')   || partId.includes('body-kit'))
  const showSkirts = cat === 'aero' && (partId.includes('skirt') || partId.includes('body-kit'))
  const showWing   = cat === 'aero' && (partId.includes('wing')  || partId.includes('body-kit'))
  const showExh    = cat === 'exhaust'
  const showBrakes = cat === 'brakes'
  const showWheels = cat === 'wheels'
  const showEngine = cat === 'engine' || cat === 'intake'

  const brakeColor = tier >= 4 ? '#ef4444' : tier >= 2 ? '#f97316' : '#f0c040'

  // Recolour body panels
  useEffect(() => {
    scene.traverse(child => {
      if (!(child instanceof THREE.Mesh)) return
      const mats = Array.isArray(child.material) ? child.material : [child.material]
      mats.forEach(m => {
        if (m instanceof THREE.MeshStandardMaterial) {
          const { r, g, b } = m.color
          if (r + g + b > 0.6) {
            m.color.set(bodyColor)
            m.metalness = 0.9
            m.roughness = 0.15
            m.needsUpdate = true
          }
        }
      })
    })
  }, [color, scene])

  return (
    <group>
      <primitive object={scene} scale={1} position={[0, -0.44, 0]} />
      {showLip    && <FrontLip />}
      {showSkirts && <SideSkirts />}
      {showWing   && <RearWing />}
      {showExh    && <ExhaustTips />}
      {showBrakes && <BrakeCalipers color={brakeColor} />}
      {showWheels && <AftermarketWheels tier={tier} />}
      {showEngine && <EngineGlow />}
    </group>
  )
}

// ─── Camera brain ─────────────────────────────────────────────────────────────
function SceneController({ focusedCategory }: { focusedCategory: PartCategory | null }) {
  const controlsRef   = useRef<CameraControls>(null)
  const isOrbiting    = useRef(true)
  const returnTimer   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const focusedRef    = useRef(focusedCategory)

  useEffect(() => { focusedRef.current = focusedCategory }, [focusedCategory])

  // Orbit via azimuth rotation
  useFrame((_, delta) => {
    if (!isOrbiting.current || !controlsRef.current) return
    controlsRef.current.rotate(delta * 0.38, 0, false)
  })

  // React to focused category
  useEffect(() => {
    const ctrl = controlsRef.current
    if (!ctrl) return

    if (focusedCategory === null) {
      // Return to default orbit position, then resume orbit
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

  // User drag → stop orbit → 3s after release, return to focus / orbit
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
          // Resume orbiting from current position
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

  return (
    <CameraControls
      ref={controlsRef}
      makeDefault
      minDistance={1.8}
      maxDistance={10}
    />
  )
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
      <Canvas camera={{ position: [3.5, 1.6, 5.5], fov: 42 }} shadows gl={{ antialias: true, alpha: true }} style={{ background: 'transparent' }}>
        <ambientLight intensity={0.55} />
        <directionalLight position={[6, 8, 4]} intensity={1.6} castShadow shadow-mapSize={[2048, 2048]} />
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
