import { useEffect, useMemo } from 'react'
import { Mesh, MeshStandardMaterial, SphereGeometry } from 'three'
import { expect } from '../core/progress'
import { stage } from '../core/stage'
import { disposeTree, useSceneRoot } from '../core/useSceneRoot'

/** Hero (placeholder while the real scene is built). */
export default function HeroScene() {
  const root = useSceneRoot('hero', (visible) => {
    if (!visible || !stage.lights) return
    stage.lights.sun.intensity = 3
    stage.lights.sun.position.set(-3, 2, -8)
    stage.lights.hemi.intensity = 0.6
  })
  useMemo(() => {
    root.add(new Mesh(new SphereGeometry(1, 32, 16), new MeshStandardMaterial({ color: '#ff8a3d' })))
  }, [root])
  useEffect(() => {
    const done = expect('hero-placeholder')
    done()
    return () => disposeTree(root)
  }, [root])
  return null
}
