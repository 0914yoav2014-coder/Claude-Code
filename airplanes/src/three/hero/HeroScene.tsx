import { useThree } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import { Group, type PerspectiveCamera } from 'three'
import { PLANES } from '../../data/planes'
import { ASSETS } from '../../lib/assets'
import { frame } from '../../state/frame'
import { demand } from '../core/demand'
import { sunsetEnv } from '../core/env'
import { expect } from '../core/progress'
import { quality } from '../core/quality'
import { stage } from '../core/stage'
import { loadTexture, solidTexture, uploadInIdle } from '../core/textures'
import { useSceneRoot } from '../core/useSceneRoot'
import { view } from '../core/view'
import { buildPlane, type PlaneModel } from '../models/build'
import { CloudPuffs } from './puffs'
import { cloudDeck, DECK_PERIOD, skyDome, SUN_DIR } from './sky'

/**
 * The cinematic hero: golden sunset above a sea of clouds, the A350 at the origin flying toward −Z
 * (units of 10 m) while cloud puffs stream past and recycle on an exact 8 s loop. Climbing (scroll)
 * raises the camera through an upper cloud layer while the sky fades to dusk and black; the shared
 * star dome takes over for the hand-off to space.
 */
const TAU = Math.PI * 2
const SCALE = 0.1

export default function HeroScene() {
  const gl = useThree((s) => s.gl)
  const camera = useThree((s) => s.camera) as PerspectiveCamera
  const size = useThree((s) => s.size)

  const parts = useMemo(() => {
    const sky = skyDome()
    const deck = cloudDeck(-16)
    const puffs = new CloudPuffs(solidTexture(0, 0, 0, 0))
    const jetRoot = new Group()
    jetRoot.name = 'jet'
    return { sky, deck, puffs, jetRoot, jet: null as PlaneModel | null }
  }, [])

  const root = useSceneRoot('hero', (visible) => {
    if (!visible) return
    const { sky, deck, puffs, jetRoot, jet } = parts
    const t = frame.loopT
    const ph = ((t % 8) / 8) * TAU
    const alt = view.altitude
    sky.position.copy(camera.position)
    sky.material.uniforms.uAltitude.value = alt
    deck.material.uniforms.uAltitude.value = alt
    deck.material.uniforms.uScroll.value = ((t % 8) / 8) * DECK_PERIOD
    puffs.material.uniforms.uAltitude.value = alt
    puffs.update(t % 8, quality.settings.puffs, camera.position)

    // the jet: a slow S-turn inside the loop (banks into the turns), a gentle bob
    jetRoot.position.set(Math.sin(ph) * 0.35, Math.sin(ph * 2 + 0.7) * 0.12, 0)
    jetRoot.rotation.set(Math.sin(ph * 2) * 0.012, -Math.cos(ph) * 0.03, -Math.cos(ph) * 0.11, 'YXZ')
    if (jet) {
      const pxPerUnit = (size.height / 2 / Math.tan((camera.fov * Math.PI) / 360)) * gl.getPixelRatio() * SCALE
      jet.lights.update(t, pxPerUnit, 1, 1 - alt * 0.6)
    }

    if (stage.bloom) {
      stage.bloom.threshold = 1.15
      stage.bloom.strength = 0.32
      stage.bloom.radius = 0.6
    }
    if (stage.lights) {
      const L = stage.lights
      L.sun.color.set('#ffb070')
      L.sun.intensity = 2.2 * (1 - alt * 0.7)
      L.sun.position.copy(SUN_DIR).multiplyScalar(40)
      L.sun.target.position.set(0, 0, 0)
      L.sun.target.updateMatrixWorld()
      L.hemi.color.set('#ffc49a')
      L.hemi.groundColor.set('#6c5a86')
      L.hemi.intensity = 0.55 * (1 - alt * 0.6)
      L.rim.color.set('#ffd9b8')
      L.rim.intensity = 0.9 * (1 - alt * 0.7)
      L.rim.position.set(-14, 9, 22)
      L.rim.target.position.set(0, 0, 0)
      L.rim.target.updateMatrixWorld()
      L.rim.angle = 0.5
      L.rim.penumbra = 1
    }
  })

  useEffect(() => {
    const { sky, deck, puffs, jetRoot } = parts
    root.add(sky, deck, jetRoot, puffs)
    let alive = true
    const doneEnv = expect('hero-env', 1)
    const doneJet = expect('hero-jet', 2)
    const donePuffs = expect('hero-puffs', 1)
    const envRT = sunsetEnv(gl)
    doneEnv()
    // the jet: build after the first paint of the loader so the page stays responsive
    const id = window.setTimeout(() => {
      if (!alive) return
      const jet = buildPlane(PLANES[0], 'hero', envRT.texture, false)
      jet.group.traverse((o) => {
        const m = (o as { material?: { envMapIntensity?: number } }).material
        if (m && 'envMapIntensity' in m) m.envMapIntensity = 0.55
      })
      jet.group.scale.setScalar(SCALE)
      jetRoot.add(jet.group)
      parts.jet = jet
      doneJet()
      demand.invalidate(2)
    }, 0)
    loadTexture(ASSETS.fx.cloudPuffs).then((tex) => {
      if (!alive) return tex?.dispose()
      if (!tex) return donePuffs()
      uploadInIdle(gl, tex, () => {
        if (!alive) return tex.dispose()
        const old = puffs.material.uniforms.uAtlas.value
        puffs.material.uniforms.uAtlas.value = tex
        old.dispose()
        donePuffs()
        demand.invalidate(2)
      })
    })
    return () => {
      alive = false
      window.clearTimeout(id)
      root.remove(sky, deck, jetRoot, puffs)
      parts.jet?.dispose()
      parts.jet = null
      sky.geometry.dispose()
      sky.material.dispose()
      deck.geometry.dispose()
      deck.material.dispose()
      ;(puffs.material.uniforms.uAtlas.value as { dispose(): void }).dispose()
      puffs.dispose()
      envRT.dispose()
    }
  }, [parts, root, gl])

  return null
}
