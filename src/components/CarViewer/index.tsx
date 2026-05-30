'use client'

import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows, PresentationControls } from '@react-three/drei'
import type { CarPart } from '@/types'
import * as THREE from 'three'

function CarModel({ color, selectedParts }: { color: string; selectedParts: CarPart[] }) {
  const hasWheels = selectedParts.some(p => p.category === 'wheels')
  const hasWing = selectedParts.some(p => p.id.includes('wing') || p.id.includes('body-kit'))
  const hasLip = selectedParts.some(p => p.id.includes('lip'))
  const hasExhaust = selectedParts.some(p => p.category === 'exhaust')

  const bodyColor = new THREE.Color(color)
  const glassColor = new THREE.Color('#0a1520')
  const wheelColor = hasWheels ? new THREE.Color('#d0d0d0') : new THREE.Color('#111111')
  const rimColor = hasWheels ? new THREE.Color('#f0f0f0') : new THREE.Color('#222222')
  const rubberColor = new THREE.Color('#0a0a0a')

  return (
    <group position={[0, -0.5, 0]}>
      {/* === BODY === */}
      <mesh position={[0, 0.38, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.72, 0.28, 3.8]} />
        <meshStandardMaterial color={bodyColor} metalness={0.85} roughness={0.15} />
      </mesh>

      {/* Hood slope */}
      <mesh position={[0, 0.52, 1.3]} rotation={[0.18, 0, 0]} castShadow>
        <boxGeometry args={[1.72, 0.08, 1.1]} />
        <meshStandardMaterial color={bodyColor} metalness={0.85} roughness={0.15} />
      </mesh>

      {/* Trunk lid */}
      <mesh position={[0, 0.52, -1.3]} rotation={[-0.1, 0, 0]} castShadow>
        <boxGeometry args={[1.72, 0.08, 0.9]} />
        <meshStandardMaterial color={bodyColor} metalness={0.85} roughness={0.15} />
      </mesh>

      {/* Cabin */}
      <mesh position={[0, 0.78, 0.1]} castShadow>
        <boxGeometry args={[1.52, 0.36, 1.65]} />
        <meshStandardMaterial color={bodyColor} metalness={0.85} roughness={0.15} />
      </mesh>

      {/* Cabin roof */}
      <mesh position={[0, 0.96, 0.05]} castShadow>
        <boxGeometry args={[1.42, 0.08, 1.4]} />
        <meshStandardMaterial color={bodyColor} metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Windshield */}
      <mesh position={[0, 0.82, 0.88]} rotation={[-0.42, 0, 0]}>
        <boxGeometry args={[1.38, 0.44, 0.06]} />
        <meshStandardMaterial color={glassColor} transparent opacity={0.55} metalness={0.05} roughness={0} />
      </mesh>

      {/* Rear window */}
      <mesh position={[0, 0.82, -0.72]} rotation={[0.35, 0, 0]}>
        <boxGeometry args={[1.38, 0.36, 0.06]} />
        <meshStandardMaterial color={glassColor} transparent opacity={0.55} metalness={0.05} roughness={0} />
      </mesh>

      {/* Side windows L */}
      <mesh position={[-0.77, 0.82, 0.08]}>
        <boxGeometry args={[0.04, 0.28, 1.0]} />
        <meshStandardMaterial color={glassColor} transparent opacity={0.5} />
      </mesh>
      {/* Side windows R */}
      <mesh position={[0.77, 0.82, 0.08]}>
        <boxGeometry args={[0.04, 0.28, 1.0]} />
        <meshStandardMaterial color={glassColor} transparent opacity={0.5} />
      </mesh>

      {/* Front bumper */}
      <mesh position={[0, 0.3, 2.0]} castShadow>
        <boxGeometry args={[1.72, 0.32, 0.12]} />
        <meshStandardMaterial color={bodyColor} metalness={0.7} roughness={0.25} />
      </mesh>

      {/* Rear bumper */}
      <mesh position={[0, 0.3, -2.0]} castShadow>
        <boxGeometry args={[1.72, 0.32, 0.12]} />
        <meshStandardMaterial color={bodyColor} metalness={0.7} roughness={0.25} />
      </mesh>

      {/* Grille */}
      <mesh position={[0, 0.28, 2.07]}>
        <boxGeometry args={[0.9, 0.16, 0.04]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.8} />
      </mesh>

      {/* Headlights L */}
      <mesh position={[-0.62, 0.36, 2.04]}>
        <boxGeometry args={[0.36, 0.12, 0.04]} />
        <meshStandardMaterial color="#e8f0ff" emissive="#aaccff" emissiveIntensity={0.5} roughness={0.1} />
      </mesh>
      {/* Headlights R */}
      <mesh position={[0.62, 0.36, 2.04]}>
        <boxGeometry args={[0.36, 0.12, 0.04]} />
        <meshStandardMaterial color="#e8f0ff" emissive="#aaccff" emissiveIntensity={0.5} roughness={0.1} />
      </mesh>

      {/* Taillights L */}
      <mesh position={[-0.62, 0.36, -2.04]}>
        <boxGeometry args={[0.38, 0.1, 0.04]} />
        <meshStandardMaterial color="#ff1100" emissive="#ff0000" emissiveIntensity={0.8} />
      </mesh>
      {/* Taillights R */}
      <mesh position={[0.62, 0.36, -2.04]}>
        <boxGeometry args={[0.38, 0.1, 0.04]} />
        <meshStandardMaterial color="#ff1100" emissive="#ff0000" emissiveIntensity={0.8} />
      </mesh>

      {/* Door handles L */}
      <mesh position={[-0.87, 0.65, 0.2]}>
        <boxGeometry args={[0.04, 0.04, 0.18]} />
        <meshStandardMaterial color="#888888" metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Door handles R */}
      <mesh position={[0.87, 0.65, 0.2]}>
        <boxGeometry args={[0.04, 0.04, 0.18]} />
        <meshStandardMaterial color="#888888" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* === WHEELS — FL, FR, RL, RR === */}
      {([[-0.94, 1.18], [0.94, 1.18], [-0.94, -1.18], [0.94, -1.18]] as [number, number][]).map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          {/* Tyre */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.32, 0.32, 0.22, 32]} />
            <meshStandardMaterial color={rubberColor} roughness={0.95} />
          </mesh>
          {/* Rim face */}
          <mesh rotation={[0, 0, Math.PI / 2]} position={[x > 0 ? 0.1 : -0.1, 0, 0]}>
            <cylinderGeometry args={[0.24, 0.24, 0.02, 32]} />
            <meshStandardMaterial color={rimColor} metalness={0.95} roughness={0.05} />
          </mesh>
          {/* Spokes */}
          {[0, 1, 2, 3, 4].map(s => (
            <mesh
              key={s}
              rotation={[0, 0, Math.PI / 2]}
              position={[
                x > 0 ? 0.095 : -0.095,
                Math.sin((s / 5) * Math.PI * 2) * 0.14,
                Math.cos((s / 5) * Math.PI * 2) * 0.14
              ]}
            >
              <boxGeometry args={[0.01, 0.05, 0.18]} />
              <meshStandardMaterial color={wheelColor} metalness={0.9} roughness={0.1} />
            </mesh>
          ))}
          {/* Centre cap */}
          <mesh rotation={[0, 0, Math.PI / 2]} position={[x > 0 ? 0.1 : -0.1, 0, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.025, 16]} />
            <meshStandardMaterial color="#222222" metalness={0.8} roughness={0.2} />
          </mesh>
        </group>
      ))}

      {/* === MODS === */}

      {/* Front lip */}
      {hasLip && (
        <mesh position={[0, 0.14, 2.07]} castShadow>
          <boxGeometry args={[1.7, 0.1, 0.1]} />
          <meshStandardMaterial color="#111111" roughness={0.6} />
        </mesh>
      )}

      {/* Rear wing */}
      {hasWing && (
        <group position={[0, 1.04, -1.6]}>
          <mesh>
            <boxGeometry args={[1.55, 0.05, 0.32]} />
            <meshStandardMaterial color="#111111" metalness={0.4} roughness={0.4} />
          </mesh>
          {[-0.68, 0.68].map((x, i) => (
            <mesh key={i} position={[x, -0.14, 0.02]}>
              <boxGeometry args={[0.07, 0.28, 0.07]} />
              <meshStandardMaterial color="#111111" metalness={0.4} roughness={0.4} />
            </mesh>
          ))}
        </group>
      )}

      {/* Exhaust tip */}
      {hasExhaust && (
        <group position={[0.28, 0.08, -2.06]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.07, 0.09, 0.14, 16]} />
            <meshStandardMaterial color="#aaaaaa" metalness={0.95} roughness={0.05} />
          </mesh>
        </group>
      )}

      {/* Floor shadow plane */}
      <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[4, 6]} />
        <meshStandardMaterial color="#000000" transparent opacity={0} />
      </mesh>
    </group>
  )
}

interface CarViewerProps {
  carColor: string
  selectedParts: CarPart[]
}

export default function CarViewer({ carColor, selectedParts }: CarViewerProps) {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [3.2, 1.4, 5.5], fov: 42 }}
        shadows
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[6, 8, 4]} intensity={1.4} castShadow shadow-mapSize={[2048, 2048]} />
        <directionalLight position={[-4, 4, -4]} intensity={0.4} color="#6688ff" />
        <pointLight position={[0, 6, 0]} intensity={0.3} color="#ffffff" />

        <Suspense fallback={null}>
          <PresentationControls
            global
            rotation={[0, -0.3, 0]}
            polar={[-0.1, 0.15]}
            azimuth={[-Infinity, Infinity]}
          >
            <CarModel color={carColor} selectedParts={selectedParts} />
          </PresentationControls>

          <ContactShadows
            position={[0, -1.0, 0]}
            opacity={0.7}
            scale={10}
            blur={2.5}
            far={3}
          />
          <Environment preset="city" />
        </Suspense>
      </Canvas>
    </div>
  )
}
