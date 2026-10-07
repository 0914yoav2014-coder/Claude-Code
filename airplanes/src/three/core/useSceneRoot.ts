import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import { Group, Material, Mesh, type Object3D, Texture } from 'three'
import { view, type SceneId } from './view'

/** Disposes geometries, materials and their textures below `root` (scene unmount). */
export function disposeTree(root: Object3D): void {
  root.traverse((o) => {
    const m = o as Mesh
    if (m.geometry) m.geometry.dispose()
    const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : []
    for (const mat of mats as Material[]) {
      for (const v of Object.values(mat)) if (v instanceof Texture) v.dispose()
      const u = (mat as unknown as { uniforms?: Record<string, { value: unknown }> }).uniforms
      if (u) for (const k in u) if (u[k].value instanceof Texture) (u[k].value as Texture).dispose()
      mat.dispose()
    }
  })
}

/**
 * A scene's root group: added to the R3F scene on mount, visible only while the timeline shows
 * this scene, disposed on unmount. `update` runs only while visible (priority -1: after the rig).
 */
export function useSceneRoot(id: SceneId, update: (visible: boolean) => void): Group {
  const scene = useThree((s) => s.scene)
  const root = useMemo(() => {
    const g = new Group()
    g.name = id
    g.visible = false
    return g
  }, [id])
  useEffect(() => {
    scene.add(root)
    return () => {
      scene.remove(root)
    }
  }, [scene, root])
  useFrame(() => {
    const visible = view.scene === id && view.fade < 0.999
    root.visible = visible
    update(visible)
  }, -1)
  return root
}
