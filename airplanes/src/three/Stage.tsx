import { Canvas, useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import { addTick } from '../lib/loop'
import { store } from '../state/store'

/**
 * The 3D stage (3D-owned; Lead stub). One fixed canvas behind the page, frameloop "never":
 * FrameDriver renders from the shared loop's 'render' phase only when something changed.
 * The 3D agent replaces this with the camera rig, scene gates and the real scenes.
 */
function FrameDriver() {
  const advance = useThree((s) => s.advance)
  useEffect(() => {
    let first = true
    return addTick('render', (now) => {
      advance(now)
      if (first) {
        first = false
        store.getState().setBoot({ firstFrame: true, assets: 1 })
      }
    })
  }, [advance])
  return null
}

export default function Stage() {
  return (
    <Canvas
      frameloop="never"
      resize={{ scroll: false, debounce: { scroll: 0, resize: 150 } }}
      dpr={[1, 1.5]}
      gl={{ antialias: false, powerPreference: 'high-performance' }}
      camera={{ position: [0, 0, 5], fov: 35 }}
    >
      <color attach="background" args={['#0B1426']} />
      <FrameDriver />
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 2, 4]} intensity={2} />
      <mesh>
        <icosahedronGeometry args={[1, 4]} />
        <meshStandardMaterial color="#4DA3FF" roughness={0.6} />
      </mesh>
    </Canvas>
  )
}
