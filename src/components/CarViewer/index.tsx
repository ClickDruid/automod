'use client'

import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows, Float } from '@react-three/drei'
import { CarPart } from '@/types'
import * as THREE from 'three'

function PlaceholderCar({ color, selectedParts }: { color: string; selectedParts: CarPart[] }) {
  const groupRef = useRef<THREE.Group>(null)

  const hasWheels = selectedParts.some(p => p.category === 'wheels')
  const hasWing = selectedParts.some(p => p.category === 'aero' && p.id.includes('wing'))
  const hasLip = selectedParts.some(p => p.category === 'aero' && p.id.includes('lip'))

  const bodyColor = new THREE.Color(color)
  const glassColor = new THREE.Color('#1a2a3a')
  const wheelColor = hasWheels ? new THREE.Color('#C0C0C0') : new THREE.Color('#1a1a1a')
  const rimColor = hasWheels ? new THREE.Color('#E8E8E8') : new THREE.Color('#2a2a2a')

  return (
    <group ref={groupRef}>
      {/* Main body */}
      <mesh position={[0, 0.18, 0]} castShadow>
        <boxGeometry args={[1.8, 0.36, 3.6]} />
        <meshStandardMaterial color={bodyColor} metalness={0.7} roughness={0.2} />
      </mesh>

      {/* Cabin */}
      <mesh position={[0, 0.52, 0.1]} castShadow>
        <boxGeometry args={[1.5, 0.36, 1.8]} />
        <meshStandardMaterial color={bodyColor} metalness={0.7} roughness={0.2} />
      </mesh>

      {/* Windshield */}
      <mesh position={[0, 0.52, 0.96]} rotation={[-0.3, 0, 0]}>
        <boxGeometry args={[1.35, 0.36, 0.08]} />
        <meshStandardMaterial color={glassColor} transparent opacity={0.6} metalness={0.1} roughness={0} />
      </mesh>

      {/* Rear window */}
      <mesh position={[0, 0.52, -0.76]} rotation={[0.3, 0, 0]}>
        <boxGeometry args={[1.35, 0.36, 0.08]} />
        <meshStandardMaterial color={glassColor} transparent opacity={0.6} metalness={0.1} roughness={0} />
      </mesh>

      {/* Hood */}
      <mesh position={[0, 0.36, 1.55]} castShadow>
        <boxGeometry args={[1.8, 0.06, 0.9]} />
        <meshStandardMaterial color={bodyColor} metalness={0.7} roughness={0.2} />
      </mesh>

      {/* Trunk */}
      <mesh position={[0, 0.36, -1.45]} castShadow>
        <boxGeometry args={[1.8, 0.06, 0.7]} />
        <meshStandardMaterial color={bodyColor} metalness={0.7} roughness={0.2} />
      </mesh>

      {/* Front bumper */}
      <mesh position={[0, 0.12, 1.85]} castShadow>
        <boxGeometry args={[1.75, 0.24, 0.1]} />
        <meshStandardMaterial color={bodyColor} metalness={0.5} roughness={0.3} />
      </mesh>

      {/* Rear bumper */}
      <mesh position={[0, 0.12, -1.85]} castShadow>
        <boxGeometry args={[1.75, 0.24, 0.1]} />
        <meshStandardMaterial color={bodyColor} metalness={0.5} roughness={0.3} />
      </mesh>

      {/* Headlights */}
      {[-0.65, 0.65].map((x, i) => (
        <mesh key={i} position={[x, 0.22, 1.88]}>
          <boxGeometry args={[0.4, 0.12, 0.04]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffff88" emissiveIntensity={0.3} />
        </mesh>
      ))}

      {/* Taillights */}
      {[-0.65, 0.65].map((x, i) => (
        <mesh key={i} position={[x, 0.22, -1.88]}>
          <boxGeometry args={[0.4, 0.12, 0.04]} />
          <meshStandardMaterial color="#ff2200" emissive="#ff0000" emissiveIntensity={0.4} />
        </mesh>
      ))}

      {/* Wheels — FL, FR, RL, RR */}
      {[[-0.95, 1.1], [0.95, 1.1], [-0.95, -1.1], [0.95, -1.1]].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.28, 0.28, 0.18, 24]} />
            <meshStandardMaterial color={wheelColor} roughness={0.9} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]} position={[x > 0 ? 0.08 : -0.08, 0, 0]}>
            <cylinderGeometry args={[0.2, 0.2, 0.02, 24]} />
            <meshStandardMaterial color={rimColor} metalness={0.9} roughness={0.1} />
          </mesh>
          {[0, 1, 2, 3, 4].map((spoke) => (
            <mesh
              key={spoke}
              rotation={[0, 0, Math.PI / 2]}
              position={[x > 0 ? 0.075 : -0.075, Math.sin((spoke / 5) * Math.PI * 2) * 0.12, Math.cos((spoke / 5) * Math.PI * 2) * 0.12]}
            >
              <boxGeometry args={[0.01, 0.04, 0.1]} />
              <meshStandardMaterial color={rimColor} metalness={0.9} roughness={0.1} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Front lip — shows when aero lip selected */}
      {hasLip && (
        <mesh position={[0, 0.01, 1.91]} castShadow>
          <boxGeometry args={[1.8, 0.06, 0.08]} />
          <meshStandardMaterial color="#111111" roughness={0.5} />
        </mesh>
      )}

      {/* Rear wing — shows when wing selected */}
      {hasWing && (
        <group position={[0, 0.72, -1.4]}>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[1.5, 0.04, 0.3]} />
            <meshStandardMaterial color="#111111" metalness={0.3} roughness={0.4} />
          </mesh>
          {[-0.65, 0.65].map((x, i) => (
            <mesh key={i} position={[x, -0.12, 0.02]}>
              <boxGeometry args={[0.06, 0.24, 0.06]} />
              <meshStandardMaterial color="#111111" metalness={0.3} roughness={0.4} />
            </mesh>
          ))}
        </group>
      )}

      {/* Exhaust tip */}
      {selectedParts.some(p => p.category === 'exhaust') && (
        <mesh position={[0.3, -0.02, -1.9]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.06, 0.08, 0.12, 12]} />
          <meshStandardMaterial color="#888888" metalness={0.9} roughness={0.1} />
        </mesh>
      )}
    </group>
  )
}

interface CarViewerProps {
  carColor: string
  selectedParts: CarPart[]
}

export default function CarViewer({ carColor, selectedParts }: CarViewerProps) {
  return (
    <div className="w-full h-full rounded-xl overflow-hidden bg-zinc-950">
      <Canvas
        camera={{ position: [3.5, 2, 4], fov: 45 }}
        shadows
        gl={{ antialias: true }}
      >
        <ambientLight intensity={0.3} />
        <directionalLight
          position={[5, 8, 5]}
          intensity={1.2}
          castShadow
          shadow-mapSize={[2048, 2048]}
        />
        <pointLight position={[-3, 3, -3]} intensity={0.5} color="#4466ff" />

        <Suspense fallback={null}>
          <Float speed={1} rotationIntensity={0.1} floatIntensity={0.15}>
            <PlaceholderCar color={carColor} selectedParts={selectedParts} />
          </Float>
          <ContactShadows
            position={[0, -0.32, 0]}
            opacity={0.6}
            scale={8}
            blur={2}
            far={4}
          />
          <Environment preset="city" />
        </Suspense>

        <OrbitControls
          enablePan={false}
          minDistance={3}
          maxDistance={8}
          minPolarAngle={Math.PI / 8}
          maxPolarAngle={Math.PI / 2.2}
          autoRotate
          autoRotateSpeed={0.8}
        />
      </Canvas>
    </div>
  )
}
