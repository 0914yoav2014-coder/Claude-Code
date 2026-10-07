import { useEffect, useMemo } from 'react'
import { BoxGeometry, Mesh, MeshStandardMaterial } from 'three'
import { stage } from '../core/stage'
import { disposeTree, useSceneRoot } from '../core/useSceneRoot'

/** Hangar (placeholder while the real scene is built). */
export default function HangarScene() {
  const root = useSceneRoot('hangar', (visible) => {
    if (!visible || !stage.lights) return
    stage.lights.hemi.intensity = 1
  })
  useMemo(() => {
    root.add(new Mesh(new BoxGeometry(8, 2, 8), new MeshStandardMaterial({ color: '#a9b8cf' })))
  }, [root])
  useEffect(() => () => disposeTree(root), [root])
  return null
}
