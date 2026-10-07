import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Suspense, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ACESFilmicToneMapping, Color, HalfFloatType, PCFShadowMap, Scene, Vector2, WebGLRenderTarget } from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { debug } from '../lib/debug'
import { env } from '../lib/env'
import { addTick } from '../lib/loop'
import { KEYS, storage } from '../lib/storage'
import { COLORS } from '../lib/tokens'
import { frame } from '../state/frame'
import { CAM_KEYS, store, useApp } from '../state/store'
import { defaultMarkers } from '../state/timeline'
import { demand } from './core/demand'
import { LightRig } from './core/lights'
import { allDone, resetProgress } from './core/progress'
import { quality, syncQuality } from './core/quality'
import { setUploadListener } from './core/textures'
import { computeView, dipping, view, type SceneId } from './core/view'
import { createGovernor, tierKey } from './quality/governor'
import CameraRig from './rig/CameraRig'
import { stage } from './core/stage'
import { NavyFade } from './scenes/fade'
import { StarDome } from './scenes/stars'
import HeroScene from './hero/HeroScene'
import SpaceScene from './globe/SpaceScene'
import HangarScene from './hangar/HangarScene'

/**
 * The 3D stage (CONTRACTS §7–§10): one fixed canvas behind the page with frameloop "never".
 * FrameDriver renders from the shared loop's 'render' phase only when something changed, and
 * nothing at all after the night marker or in hidden tabs. Scenes mount lazily (within one
 * segment of being needed), each behind its own Suspense boundary, and then stay mounted.
 */

const NAVY = new Color(COLORS.navy)

const MOUNT_AT: Record<SceneId, number> = {
  hero: 0,
  space: CAM_KEYS.indexOf('climb'),
  hangar: CAM_KEYS.indexOf('globe'),
}

function FrameDriver() {
  const advance = useThree((s) => s.advance)
  const gl = useThree((s) => s.gl)
  const setDpr = useThree((s) => s.setDpr)

  useEffect(() => {
    resetProgress()
    demand.reset()
    const unsync = syncQuality()
    let lastY = Number.NaN
    let lastLoopT = Number.NaN
    let lastPx = 0
    let lastPy = 0
    let lastVw = 0
    let lastVh = 0
    let lastTick = -10
    let tickNo = 0
    let lastRenderAt = 0
    let stopped = false
    let firstFrame = false
    const startedAt = performance.now()

    const governor = createGovernor({
      current: () => {
        const q = store.getState().quality
        return { tier: q.tier === 'high' ? 'high' : 'medium', step: q.step, locked: q.locked || store.getState().mode !== '3d' }
      },
      apply: (at) => {
        store.getState().setTier(at.tier, at.step, 'governor')
        storage.local.set(KEYS.tier, tierKey(at))
      },
      lite: () => store.getState().enterLite('slow-fps'),
    })
    stage.governor = governor
    setUploadListener(() => governor.warmUp(performance.now()))
    debug.three.forceFrameTimes = (ms) => governor.force(ms)
    debug.three.frames = 0
    debug.three.info = () => ({ calls: stage.info.calls, triangles: stage.info.triangles })

    // Tier changes: pixel ratio now (post, shadows, puff and star counts are read by the scenes).
    let version = -1
    const applyTier = () => {
      if (version === quality.version) return
      version = quality.version
      setDpr(Math.min(window.devicePixelRatio || 1, quality.settings.dprCap))
      governor.warmUp(performance.now())
      demand.invalidate(2)
    }
    applyTier()

    const off = addTick('render', (now) => {
      tickNo++
      const s = store.getState()
      if (s.mode !== '3d' || s.motion.hidden) return
      applyTier()
      const vh = frame.vh || window.innerHeight
      const markers = s.markers ?? defaultMarkers(vh)
      computeView(frame.y, markers, vh, s.motion.reduced, now)

      const moved = frame.y !== lastY || frame.loopT !== lastLoopT || frame.px !== lastPx || frame.py !== lastPy || frame.vw !== lastVw || frame.vh !== lastVh
      const wanted = demand.take(now) || dipping()
      if (!moved && !wanted) return
      // After the night marker: one last navy frame, then nothing until the page scrolls back up.
      if (view.stop) {
        if (stopped) return
        stopped = true
      } else stopped = false

      // Hold the very first frame until the hero is ready (the poster stays up meanwhile).
      if (!firstFrame && !allDone() && now - startedAt < 4000) return

      lastY = frame.y
      lastLoopT = frame.loopT
      lastPx = frame.px
      lastPy = frame.py
      lastVw = frame.vw
      lastVh = frame.vh
      advance(now)
      debug.three.frames = (debug.three.frames ?? 0) + 1
      // Governor: only intervals between consecutively rendered ticks (env.test feeds it by hand).
      if (lastTick === tickNo - 1 && !env.test && firstFrame) governor.sample(now - lastRenderAt, now, view.scene === 'hero')
      lastTick = tickNo
      lastRenderAt = now
      if (!firstFrame) {
        firstFrame = true
        governor.warmUp(now)
        store.getState().setBoot({ firstFrame: true, assets: 1 })
      }
    })

    // A lost context that is not restored within 2 s → the lighter version.
    const canvas = gl.domElement
    let lostTimer = 0
    const onLost = (e: Event) => {
      e.preventDefault()
      window.clearTimeout(lostTimer)
      lostTimer = window.setTimeout(() => store.getState().enterLite('context-lost'), 2000)
    }
    const onRestored = () => {
      window.clearTimeout(lostTimer)
      demand.invalidate(3)
    }
    canvas.addEventListener('webglcontextlost', onLost)
    canvas.addEventListener('webglcontextrestored', onRestored)

    return () => {
      off()
      unsync()
      setUploadListener(null)
      window.clearTimeout(lostTimer)
      canvas.removeEventListener('webglcontextlost', onLost)
      canvas.removeEventListener('webglcontextrestored', onRestored)
      debug.three.forceFrameTimes = undefined
      stage.governor = null
    }
  }, [advance, gl, setDpr])

  return null
}

/** Renders the frame last (priority 1 takes over R3F's render): bloom on high, then the navy fade. */
function Renderer() {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const dpr = useThree((s) => s.viewport.dpr)
  const fade = useMemo(() => new NavyFade(), [])
  const fadeScene = useMemo(() => {
    const s = new Scene()
    s.add(fade)
    return s
  }, [fade])
  const post = useApp((s) => s.quality.tier === 'high')

  useEffect(() => {
    gl.toneMapping = ACESFilmicToneMapping
    gl.toneMappingExposure = 1
    gl.shadowMap.type = PCFShadowMap
    gl.shadowMap.autoUpdate = false
    gl.setClearColor(NAVY, 1)
    gl.info.autoReset = false
    // A background colour (not just the clear colour) makes three clear render targets in the
    // right colour space too (RenderPass clears before render() would recompute it).
    scene.background = NAVY
  }, [gl, scene])

  const composer = useMemo(() => {
    if (!post) return null
    const rt = new WebGLRenderTarget(1, 1, { type: HalfFloatType, samples: 4 })
    const c = new EffectComposer(gl, rt)
    c.addPass(new RenderPass(scene, camera))
    const bloom = new UnrealBloomPass(new Vector2(256, 256), 0.42, 0.55, 0.82)
    c.addPass(bloom)
    c.addPass(new OutputPass())
    stage.bloom = bloom
    return c
  }, [post, gl, scene, camera])

  useEffect(() => {
    if (!composer) return
    composer.setPixelRatio(dpr)
    composer.setSize(size.width, size.height)
    demand.invalidate()
  }, [composer, size, dpr])

  useEffect(
    () => () => {
      composer?.dispose()
      stage.bloom = null
    },
    [composer],
  )
  useEffect(
    () => () => {
      fade.geometry.dispose()
      fade.material.dispose()
    },
    [fade],
  )

  useFrame(() => {
    gl.info.reset()
    fade.alpha = view.fade
    if (view.fade >= 0.999) {
      // Fully navy: a plain clear (exactly #0B1426, the CSS night sky's colour).
      gl.setRenderTarget(null)
      gl.setClearColor(NAVY, 1)
      gl.clear()
    } else if (composer) {
      composer.render()
      gl.autoClear = false
      if (fade.visible) gl.render(fadeScene, camera)
      gl.autoClear = true
    } else {
      gl.render(scene, camera)
      if (fade.visible) {
        gl.autoClear = false
        gl.render(fadeScene, camera)
        gl.autoClear = true
      }
    }
    stage.info.calls = gl.info.render.calls
    stage.info.triangles = gl.info.render.triangles
  }, 1)

  return null
}

/** Shared pieces: the light rig and the star dome (camera-centred). */
function Shared() {
  const scene = useThree((s) => s.scene)
  const camera = useThree((s) => s.camera)
  const gl = useThree((s) => s.gl)
  const lights = useMemo(() => new LightRig(), [])
  const stars = useMemo(() => new StarDome(), [])

  useEffect(() => {
    stage.lights = lights
    scene.add(lights)
    scene.add(stars)
    return () => {
      scene.remove(lights)
      scene.remove(stars)
      stars.geometry.dispose()
      stars.material.dispose()
      lights.key.shadow.map?.dispose()
      stage.lights = null
    }
  }, [scene, lights, stars])

  useFrame(() => {
    lights.off()
    const shadows = quality.settings.shadows
    lights.setShadows(shadows)
    gl.shadowMap.enabled = shadows
    stars.position.copy(camera.position)
    stars.material.uniforms.uOpacity.value = view.stars
    stars.material.uniforms.uDpr.value = gl.getPixelRatio()
    stars.material.uniforms.uTime.value = frame.loopT
    stars.visible = view.stars > 0.001
    stars.setCount(quality.settings.stars)
  }, -3)

  return null
}

/** Mounts a scene once the camera is within one segment of it; then it stays mounted. */
function Gate({ id, children }: { id: SceneId; children: ReactNode }) {
  const [on, setOn] = useState(id === 'hero')
  useFrame(() => {
    if (!on && (view.reached >= MOUNT_AT[id] || view.scene === id)) {
      setOn(true)
      stage.governor?.warmUp(performance.now())
      demand.invalidate(2)
    }
  }, -4)
  return on ? <Suspense fallback={null}>{children}</Suspense> : null
}

/** ?scene=<camKey> in the real page: scroll there once the markers are measured. */
function SceneFlag() {
  useEffect(() => {
    const key = env.scene
    if (!key || !CAM_KEYS.includes(key)) return
    const go = () => {
      const m = store.getState().markers
      if (!m) return false
      window.scrollTo({ top: m[key] + 1, behavior: 'instant' })
      return true
    }
    if (go()) return
    const unsub = store.subscribe(() => {
      if (go()) unsub()
    })
    return unsub
  }, [])
  return null
}

export default function Stage({ harness = false }: { harness?: boolean }) {
  const dprCap = useMemo(() => {
    const q = store.getState().quality
    return q.tier === 'high' ? 2 : q.step === 0 ? 1.5 : 1
  }, [])
  return (
    <Canvas
      frameloop="never"
      resize={{ scroll: false, debounce: { scroll: 0, resize: 100 } }}
      dpr={[1, dprCap]}
      gl={{ antialias: false, alpha: false, stencil: false, powerPreference: 'high-performance' }}
      camera={{ position: [0, 1, 12], fov: 32, near: 0.25, far: 1600 }}
      flat={false}
    >
      <FrameDriver />
      <Shared />
      <CameraRig />
      <Gate id="hero">
        <HeroScene />
      </Gate>
      <Gate id="space">
        <SpaceScene />
      </Gate>
      <Gate id="hangar">
        <HangarScene />
      </Gate>
      <Renderer />
      {!harness && <SceneFlag />}
    </Canvas>
  )
}
