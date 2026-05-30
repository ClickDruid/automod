'use client'

import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, Environment, ContactShadows, CameraControls } from '@react-three/drei'
import type { CarPart, PartCategory } from '@/types'
import * as THREE from 'three'

useGLTF.preload('/models/ferrari.glb')

// ─── Camera presets (front = -Z, rear = +Z) ──────────────────────────────────
const CAM: Record<PartCategory | 'default', {
  pos: [number, number, number]
  target: [number, number, number]
}> = {
  engine:       { pos: [0.8,  1.2, -4.6],  target: [0,    0.44, -1.8]  },
  intake:       { pos: [1.4,  1.2, -4.4],  target: [0.3,  0.44, -1.8]  },
  exhaust:      { pos: [-2.0, 0.2,  4.8],  target: [0,   -0.22,  2.2]  },
  suspension:   { pos: [ 3.6, 0.1,  2.0],  target: [0.96,-0.12,  1.32] },
  brakes:       { pos: [ 3.4, 0.3,  2.2],  target: [0.96,-0.12,  1.32] },
  wheels:       { pos: [ 3.6, 0.4,  1.8],  target: [0.96,-0.12,  1.32] },
  aero:         { pos: [-3.0, 1.6,  4.0],  target: [0,    0.65,  1.74] },
  transmission: { pos: [ 2.6, 0.1,  0.6],  target: [0,   -0.36,  0]    },
  default:      { pos: [ 3.5, 1.6,  5.5],  target: [0,    0.3,   0]    },
}

// Ferrari 458 world coords (car at [0,-0.44,0], front=-Z, rear=+Z)
const F = {
  frontZ: -2.26, rearZ: +2.26,
  halfW:   0.96,
  groundY:-0.44, wheelY: -0.12,
  fWheelZ:-1.32, rWheelZ:+1.32,
  bumperY:-0.33, rockerY:-0.09,
  hoodY:   0.44, rearDeckY: 0.32,
}

// ─── Pulsing glow mesh ────────────────────────────────────────────────────────
function GlowMesh({
  position, rotation, args, shape = 'box', color = '#f97316',
}: {
  position: [number, number, number]
  rotation?: [number, number, number]
  args: [number, number, number] | [number, number]
  shape?: 'box' | 'plane' | 'torus'
  color?: string
}) {
  const ref = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (!ref.current) return
    const m = ref.current.material as THREE.MeshStandardMaterial
    const t = clock.elapsedTime
    const pulse = (Math.sin(t * 2.8) * 0.5 + 0.5) * 0.42 + 0.18
    m.opacity = pulse
    m.emissiveIntensity = pulse * 1.4
  })

  return (
    <mesh ref={ref} position={position} rotation={rotation ?? [0, 0, 0]}>
      {shape === 'box'   && <boxGeometry args={args as [number,number,number]} />}
      {shape === 'plane' && <planeGeometry args={args as [number,number]} />}
      {shape === 'torus' && <torusGeometry args={[...(args as [number,number]), 12, 32] as unknown as [number,number,number,number]} />}
      <meshStandardMaterial
        color={color} emissive={color} emissiveIntensity={0.6}
        transparent opacity={0.30} depthWrite={false} side={THREE.DoubleSide}
      />
    </mesh>
  )
}

// ─── Zone glow sets per part category ────────────────────────────────────────
// Each shows WHERE on the car the selected part is located.

function HoodGlow() {
  const midZ = (F.frontZ + F.fWheelZ) / 2   // ≈ -1.79 (bonnet centre)
  return (
    <>
      <GlowMesh position={[0, F.hoodY + 0.015, midZ]}
        rotation={[-0.18, 0, 0]}
        args={[1.28, 0.01, 0.88]} shape="box" />
      {/* edge strip at front of hood */}
      <GlowMesh position={[0, F.hoodY - 0.04, F.fWheelZ + 0.12]}
        args={[1.28, 0.01, 0.08]} shape="box" />
    </>
  )
}

function FrontGlow() {
  return (
    <>
      {/* Full-width strip at front bumper bottom */}
      <GlowMesh position={[0, F.bumperY - 0.01, F.frontZ]}
        rotation={[0, 0, 0]}
        args={[1.62, 0.01, 0.22]} shape="box" />
      {/* Ambient fill on bumper face */}
      <GlowMesh position={[0, F.bumperY + 0.08, F.frontZ - 0.02]}
        rotation={[0, 0, 0]}
        args={[1.62, 0.24]} shape="plane" />
    </>
  )
}

function SidesGlow() {
  const frontEnd = F.fWheelZ + 0.40   // -0.92
  const rearEnd  = F.rWheelZ - 0.40   // +0.92
  const len      = rearEnd - frontEnd  // 1.84
  const midZ     = 0
  return (
    <>
      <GlowMesh position={[ F.halfW + 0.02, F.rockerY, midZ]}
        args={[0.01, 0.14, len]} shape="box" />
      <GlowMesh position={[-F.halfW - 0.02, F.rockerY, midZ]}
        args={[0.01, 0.14, len]} shape="box" />
    </>
  )
}

function RearGlow() {
  const wingZ = F.rearZ - 0.52   // +1.74 above deck
  return (
    <>
      {/* Rear deck plane */}
      <GlowMesh position={[0, F.rearDeckY + 0.01, wingZ]}
        rotation={[-0.15, 0, 0]}
        args={[1.44, 0.01, 0.30]} shape="box" />
      {/* Rear face fill */}
      <GlowMesh position={[0, F.rearDeckY + 0.15, F.rearZ]}
        args={[1.44, 0.38]} shape="plane" />
    </>
  )
}

function RearLowGlow() {
  const y = F.groundY + 0.21
  const z = F.rearZ
  return (
    <>
      {/* Two exhaust position rings */}
      {([-0.30, 0.30] as number[]).map((x, i) => (
        <GlowMesh key={i} position={[x, y, z]}
          rotation={[Math.PI / 2, 0, 0]}
          args={[0.10, 0.022] as [number, number]}
          shape="torus" />
      ))}
      {/* Low rear bumper strip */}
      <GlowMesh position={[0, y, z]}
        args={[0.9, 0.01, 0.08]} shape="box" />
    </>
  )
}

function WheelsGlow() {
  const positions: [number,number,number][] = [
    [ F.halfW, F.wheelY, F.fWheelZ],
    [-F.halfW, F.wheelY, F.fWheelZ],
    [ F.halfW, F.wheelY, F.rWheelZ],
    [-F.halfW, F.wheelY, F.rWheelZ],
  ]
  return (
    <>
      {positions.map(([x, y, z], i) => (
        <GlowMesh key={i} position={[x, y, z]}
          rotation={[0, 0, Math.PI / 2]}
          args={[0.26, 0.022] as [number, number]}
          shape="torus" />
      ))}
    </>
  )
}

function CenterGlow() {
  return (
    <GlowMesh position={[0, F.groundY + 0.05, 0]}
      rotation={[Math.PI / 2, 0, 0]}
      args={[0.6, 0.01, 2.0]} shape="box"
      color="#a855f7" />
  )
}

// ─── Zone selection logic ─────────────────────────────────────────────────────
function getZone(part: CarPart): string {
  const cat = part.category
  const id  = part.id
  if (cat === 'engine' || cat === 'intake')  return 'hood'
  if (cat === 'exhaust')                      return 'rear-low'
  if (cat === 'wheels' || cat === 'brakes' || cat === 'suspension') return 'wheels'
  if (cat === 'transmission')                 return 'center'
  if (cat === 'aero') {
    if (id.includes('lip'))           return 'front'
    if (id.includes('skirt') || id.includes('mud')) return 'sides'
    if (id.includes('wing') || id.includes('body-kit')) return 'rear'
    return 'rear'
  }
  return 'center'
}

// ─── Ferrari base model + zone glow ──────────────────────────────────────────
function FerrariScene({ color, selectedPart }: {
  color: string
  selectedPart: CarPart | null
}) {
  const { scene } = useGLTF('/models/ferrari.glb')
  const bodyColor = new THREE.Color(color)

  // Recolour body
  const prevColor = useRef('')
  if (prevColor.current !== color) {
    prevColor.current = color
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
  }

  const zone = selectedPart ? getZone(selectedPart) : null

  return (
    <group>
      <primitive object={scene} scale={1} position={[0, -0.44, 0]} />
      {zone === 'hood'     && <HoodGlow />}
      {zone === 'front'    && <FrontGlow />}
      {zone === 'sides'    && <SidesGlow />}
      {zone === 'rear'     && <RearGlow />}
      {zone === 'rear-low' && <RearLowGlow />}
      {zone === 'wheels'   && <WheelsGlow />}
      {zone === 'center'   && <CenterGlow />}
    </group>
  )
}

// ─── Camera controller ────────────────────────────────────────────────────────
function SceneController({ focusedCategory }: { focusedCategory: PartCategory | null }) {
  const ctrlRef    = useRef<CameraControls>(null)
  const orbiting   = useRef(true)
  const returnTimer= useRef<ReturnType<typeof setTimeout> | null>(null)
  const focusedRef = useRef(focusedCategory)

  useFrame((_, dt) => {
    if (orbiting.current && ctrlRef.current) ctrlRef.current.rotate(dt * 0.36, 0, false)
  })

  // Update ref without triggering effect
  focusedRef.current = focusedCategory

  useFrame(() => {}) // keep component alive for ref updates

  const prevCat = useRef<PartCategory | null>(null)
  if (prevCat.current !== focusedCategory) {
    prevCat.current = focusedCategory
    const ctrl = ctrlRef.current
    if (ctrl) {
      if (focusedCategory === null) {
        orbiting.current = false
        const { pos, target } = CAM.default
        ctrl.setLookAt(pos[0], pos[1], pos[2], target[0], target[1], target[2], true)
          .then(() => { orbiting.current = true })
      } else {
        orbiting.current = false
        const { pos, target } = CAM[focusedCategory] ?? CAM.default
        ctrl.setLookAt(pos[0], pos[1], pos[2], target[0], target[1], target[2], true)
      }
    }
  }

  return (
    <CameraControls
      ref={ctrlRef}
      makeDefault
      minDistance={1.8}
      maxDistance={10}
      onStart={() => {
        orbiting.current = false
        if (returnTimer.current) clearTimeout(returnTimer.current)
      }}
      onEnd={() => {
        if (returnTimer.current) clearTimeout(returnTimer.current)
        returnTimer.current = setTimeout(() => {
          const cat = focusedRef.current
          const ctrl = ctrlRef.current
          if (!ctrl) return
          if (cat) {
            const { pos, target } = CAM[cat] ?? CAM.default
            ctrl.setLookAt(pos[0], pos[1], pos[2], target[0], target[1], target[2], true)
          } else {
            orbiting.current = true
          }
        }, 3000)
      }}
    />
  )
}

// ─── Public API ───────────────────────────────────────────────────────────────
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
        <directionalLight position={[6, 8, 4]} intensity={1.6} castShadow shadow-mapSize={[2048, 2048]} />
        <directionalLight position={[-5, 4, -4]} intensity={0.5} color="#6688ff" />
        <pointLight position={[0, 6, 0]} intensity={0.4} />
        <Suspense fallback={null}>
          <FerrariScene color={carColor} selectedPart={selectedPart} />
          <ContactShadows position={[0, -0.46, 0]} opacity={0.75} scale={12} blur={3} far={4} />
          <Environment preset="city" />
        </Suspense>
        <SceneController focusedCategory={focusedCategory} />
      </Canvas>
    </div>
  )
}
