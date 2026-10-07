import { useEffect, useMemo } from 'react'
import { Mesh, MeshStandardMaterial, SphereGeometry } from 'three'
import { stage } from '../core/stage'
import { disposeTree, useSceneRoot } from '../core/useSceneRoot'

/** Space (placeholder while the real scene is built). */
export default function SpaceScene() {
  const root = useSceneRoot('space', (visible) => {
    if (!visible || !stage.lights) return
    stage.lights.sun.intensity = 3
    stage.lights.sun.position.set(3, 1, 2)
  })
  useMemo(() => {
    root.add(new Mesh(new SphereGeometry(1, 64, 32), new MeshStandardMaterial({ color: '#4da3ff' })))
  }, [root])
  useEffect(() => () => disposeTree(root), [root])
  return null
}
