'use client'

import { Suspense, useRef, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useGLTF, Environment, ContactShadows, CameraControls } from '@react-three/drei'
import type { CarPart, PartCategory } from '@/types'
import * as THREE from 'three'

// Pre-load the model
useGLTF.preload('/models/ferrari.glb')

// Camera positions per part category
const CAMERA_POSITIONS: Record<PartCategory | 'default', {
  pos: [number, number, number]
  target: [number, number, number]
}> = {
  engine:       { pos: [2.2, 1.4, 3.8],  target: [0, 0.4, 1.5]  },
  intake:       { pos: [1.8, 1.6, 4.2],  target: [0, 0.5, 1.8]  },
  exhaust:      { pos: [2.0, 0.8, -4.0], target: [0.3, 0.1, -2.2] },
  suspension:   { pos: [3.2, 0.6, 1.2],  target: [1.0, -0.2, 0.8] },
  brakes:       { pos: [3.0, 0.8, 1.5],  target: [1.0, 0, 1.0]   },
  wheels:       { pos: [3.4, 0.9, 0],    target: [1.2, -0.1, 0]  },
  aero:         { pos: [2.5, 2.2, -3.2], target: [0, 1.0, -1.5]  },
  transmission: { pos: [2.5, 0.6, 0.5],  target: [0, -0.3, 0]    },
  default:      { pos: [3.5, 1.6, 5.5],  target: [0, 0.3, 0]     },
}

function FerrariModel({ color, selectedParts }: {
  color: string
  selectedParts: CarPart[]
}) {
  const { scene } = useGLTF('/models/ferrari.glb')
  const aoTexture = new THREE.TextureLoader().load('/models/ferrari_ao.png')
  const bodyColor = new THREE.Color(color)

  useEffect(() => {
    scene.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return
      const name = child.name.toLowerCase()

      if (name.includes('body') || name.includes('car') || name === 'mesh_0') {
        if (Array.isArray(child.material)) {
          child.material.forEach(m => {
            if (m instanceof THREE.MeshStandardMaterial) {
              m.color = bodyColor
              m.metalness = 0.9
              m.roughness = 0.15
              if (aoTexture) m.aoMap = aoTexture
            }
          })
        } else if (child.material instanceof THREE.MeshStandardMaterial) {
          child.material.color = bodyColor
          child.material.metalness = 0.9
          child.material.roughness = 0.15
          if (aoTexture) child.material.aoMap = aoTexture
        }
      }
    })
  }, [color, scene])

  const hasWing = selectedParts.some(p => p.category === 'aero' && p.id.includes('wing'))
  const hasLip  = selectedParts.some(p => p.id.includes('lip'))

  return (
    <group>
      <primitive object={scene} scale={1} position={[0, -0.44, 0]} />

      {/* Front lip overlay */}
      {hasLip && (
        <mesh position={[0, -0.28, 2.1]} castShadow>
          <boxGeometry args={[1.65, 0.08, 0.1]} />
          <meshStandardMaterial color="#111111" roughness={0.5} />
        </mesh>
      )}

      {/* Rear wing overlay */}
      {hasWing && (
        <group position={[0, 0.55, -1.75]}>
          <mesh>
            <boxGeometry args={[1.4, 0.05, 0.28]} />
            <meshStandardMaterial color="#111111" metalness={0.4} roughness={0.4} />
          </mesh>
          {([-0.6, 0.6] as number[]).map((x, i) => (
            <mesh key={i} position={[x, -0.12, 0]}>
              <boxGeometry args={[0.06, 0.24, 0.06]} />
              <meshStandardMaterial color="#111111" metalness={0.4} roughness={0.4} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  )
}

// Handles auto-rotation + camera zoom to part
function SceneController({
  lastCategory,
  isAnimating,
  onAnimationDone,
}: {
  lastCategory: PartCategory | 'default' | null
  isAnimating: boolean
  onAnimationDone: () => void
}) {
  const controlsRef = useRef<CameraControls>(null)
  const autoRotating = useRef(true)
  const rotationAngle = useRef(0)
  const { camera } = useThree()

  // Auto-rotate when not animating to a part
  useFrame((_, delta) => {
    if (!autoRotating.current || !controlsRef.current) return
    rotationAngle.current += delta * 0.35
    const r = 5.8
    camera.position.x = Math.sin(rotationAngle.current) * r
    camera.position.z = Math.cos(rotationAngle.current) * r
    camera.position.y = 1.6
    camera.lookAt(0, 0.3, 0)
  })

  // Zoom to part when category changes
  useEffect(() => {
    if (!lastCategory || !controlsRef.current) return

    autoRotating.current = false
    const { pos, target } = CAMERA_POSITIONS[lastCategory] ?? CAMERA_POSITIONS.default

    controlsRef.current.setLookAt(
      pos[0], pos[1], pos[2],
      target[0], target[1], target[2],
      true // animate
    ).then(() => {
      // After 2.5s return to orbit
      setTimeout(() => {
        // Sync rotation angle to current camera position before resuming
        rotationAngle.current = Math.atan2(camera.position.x, camera.position.z)
        autoRotating.current = true
        onAnimationDone()
      }, 2500)
    })
  }, [lastCategory])

  return (
    <CameraControls
      ref={controlsRef}
      makeDefault
      minDistance={2}
      maxDistance={10}
      enabled={!autoRotating.current}
    />
  )
}

interface CarViewerProps {
  carColor: string
  selectedParts: CarPart[]
  lastToggledCategory: PartCategory | null
  onCameraAnimDone: () => void
}

export default function CarViewer({
  carColor,
  selectedParts,
  lastToggledCategory,
  onCameraAnimDone,
}: CarViewerProps) {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [3.5, 1.6, 5.5], fov: 42 }}
        shadows
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight
          position={[6, 8, 4]}
          intensity={1.6}
          castShadow
          shadow-mapSize={[2048, 2048]}
        />
        <directionalLight position={[-5, 4, -4]} intensity={0.5} color="#6688ff" />
        <pointLight position={[0, 6, 0]} intensity={0.4} />

        <Suspense fallback={null}>
          <FerrariModel color={carColor} selectedParts={selectedParts} />

          <ContactShadows
            position={[0, -0.46, 0]}
            opacity={0.75}
            scale={12}
            blur={3}
            far={4}
          />
          <Environment preset="city" />
        </Suspense>

        <SceneController
          lastCategory={lastToggledCategory}
          isAnimating={!!lastToggledCategory}
          onAnimationDone={onCameraAnimDone}
        />
      </Canvas>
    </div>
  )
}
