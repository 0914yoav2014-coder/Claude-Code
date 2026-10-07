import { useThree } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import { Group, Matrix4, Mesh, type PerspectiveCamera, SphereGeometry, type Texture, Vector3 } from 'three'
import { ROUTES } from '../../data/routes'
import { ASSETS } from '../../lib/assets'
import { debug } from '../../lib/debug'
import { easeOutCubic } from '../../lib/ease'
import { MOTION } from '../../lib/tokens'
import { frame } from '../../state/frame'
import { store } from '../../state/store'
import { clamp01 } from '../../state/timeline'
import { demand } from '../core/demand'
import { quality } from '../core/quality'
import { stage } from '../core/stage'
import { loadTexture, solidTexture, uploadInIdle } from '../core/textures'
import { disposeTree, useSceneRoot } from '../core/useSceneRoot'
import { view } from '../core/view'
import { angleTo, facing, hitRoutes, occluded, PATH_N, prepRoutes, vec, type Vec } from './geo'
import { globeInput, attachGlobeInput } from './input'
import { atmosphereMaterial, cloudMaterial, earthMaterial } from './materials'
import { planeMatrix, routePins, routeTubes, tinyPlanes } from './routes'

/**
 * Space: the photo-real Earth (one ShaderMaterial sphere), a drifting cloud layer, a soft blue
 * atmosphere edge, 12 flight paths that draw in one after another with a tiny plane on each, and
 * the globe's own orientation (drag, keys, auto-spin, turn-to-route). The camera rig only moves
 * the camera; the star dome is shared with the hero climb.
 */
const SUN = new Vector3(0.9, 0.28, 0.3).normalize()
const SPIN = 0.035 // rad per loop second
const PITCH_MIN = -0.75
const PITCH_MAX = 0.95
const PLANE_SCALE = 0.052
const START = facing(vec(22, 18))

export default function SpaceScene() {
  const gl = useThree((s) => s.gl)
  const camera = useThree((s) => s.camera) as PerspectiveCamera
  const size = useThree((s) => s.size)

  const parts = useMemo(() => {
    const paths = prepRoutes(ROUTES)
    const seg = quality.settings.detail === 'rich' ? [128, 64] : [96, 48]
    const tex = {
      day: solidTexture(28, 58, 96) as Texture,
      night: solidTexture(0, 0, 0) as Texture,
      normal: solidTexture(128, 128, 255) as Texture,
      water: solidTexture(255, 255, 255) as Texture,
      clouds: solidTexture(0, 0, 0) as Texture,
    }
    const earthMat = earthMaterial(tex)
    const earth = new Mesh(new SphereGeometry(1, seg[0], seg[1]), earthMat)
    earth.name = 'earth'
    const cloudMat = cloudMaterial(tex.clouds)
    const clouds = new Mesh(new SphereGeometry(1.008, seg[0] * 0.75, seg[1] * 0.75), cloudMat)
    clouds.renderOrder = 2
    clouds.visible = false
    clouds.name = 'clouds'
    const atmoMat = atmosphereMaterial(1.12)
    const atmo = new Mesh(new SphereGeometry(1.12, 64, 32), atmoMat)
    atmo.renderOrder = 3
    atmo.name = 'atmosphere'
    const tubes = routeTubes(paths)
    const pins = routePins(paths)
    const planes = tinyPlanes(paths.length)
    const globe = new Group()
    globe.name = 'globe'
    globe.add(earth, clouds, tubes, pins, planes)
    return { paths, earth, earthMat, clouds, cloudMat, atmo, atmoMat, tubes, pins, planes, globe }
  }, [])

  // Orientation and draw-in state (module-free so a remount starts clean).
  const st = useMemo(
    () => ({
      yaw: START.yaw,
      pitch: START.pitch * 0.8,
      tween: null as null | { y0: number; p0: number; y1: number; p1: number; t0: number },
      drawAt: -1,
      drawn: false,
      lastLoopT: frame.loopT,
      lastNow: 0,
    }),
    [],
  )

  const root = useSceneRoot('space', (visible) => {
    if (!visible) return
    const now = frame.now || performance.now()
    const s = store.getState()
    const reduced = s.motion.reduced
    const { earthMat, cloudMat, atmoMat, tubes, pins, planes, paths, globe } = parts

    // ── orientation: user input, inertia, turn-to-route tween, slow auto-spin ──
    const dt = Math.min(100, st.lastNow ? now - st.lastNow : 16)
    st.lastNow = now
    const gi = globeInput
    if (gi.dYaw || gi.dPitch) st.tween = null
    st.yaw += gi.dYaw
    st.pitch += gi.dPitch
    gi.dYaw = 0
    gi.dPitch = 0
    if (!gi.dragging && (Math.abs(gi.vYaw) > 1e-6 || Math.abs(gi.vPitch) > 1e-6)) {
      st.tween = null
      st.yaw += gi.vYaw * dt
      st.pitch += gi.vPitch * dt
      const decay = Math.exp(-dt / 380)
      gi.vYaw *= decay
      gi.vPitch *= decay
      if (Math.abs(gi.vYaw) < 2e-6) gi.vYaw = 0
      if (Math.abs(gi.vPitch) < 2e-6) gi.vPitch = 0
      demand.keep(40)
    }
    if (st.tween) {
      const k = reduced ? 1 : clamp01((now - st.tween.t0) / MOTION.routeFly)
      const e = easeOutCubic(k)
      st.yaw = st.tween.y0 + (st.tween.y1 - st.tween.y0) * e
      st.pitch = st.tween.p0 + (st.tween.p1 - st.tween.p0) * e
      if (k >= 1) st.tween = null
      else demand.keep(40)
    }
    const dLoop = frame.loopT - st.lastLoopT
    st.lastLoopT = frame.loopT
    if (!s.globe.route && !gi.dragging && !st.tween && now - gi.lastAt > 5000 && dLoop > 0 && dLoop < 0.5) st.yaw += dLoop * SPIN
    st.pitch = Math.max(PITCH_MIN, Math.min(PITCH_MAX, st.pitch))
    globe.rotation.set(st.pitch, st.yaw, 0, 'XYZ')
    globe.updateMatrixWorld()

    // ── sun, clouds, atmosphere ──
    earthMat.uniforms.uSun.value.copy(SUN)
    cloudMat.uniforms.uSun.value.copy(SUN)
    atmoMat.uniforms.uSun.value.copy(SUN)
    const shift = (frame.loopT * 0.0018) % 1
    earthMat.uniforms.uCloudShift.value = shift
    cloudMat.uniforms.uShift.value = shift
    if (stage.bloom) {
      stage.bloom.threshold = 0.85
      stage.bloom.strength = 0.4
      stage.bloom.radius = 0.5
    }
    if (stage.lights) {
      const L = stage.lights
      L.sun.color.set('#fff3e2')
      L.sun.intensity = 2.6
      L.sun.position.copy(SUN).multiplyScalar(10)
      L.sun.target.position.set(0, 0, 0)
      L.sun.target.updateMatrixWorld()
      L.hemi.color.set('#9cc0ff')
      L.hemi.groundColor.set('#0b1426')
      L.hemi.intensity = 0.35
    }

    // ── route draw-in (1.2 s each, 0.15 s apart, ease-out) once the globe is in view ──
    const { from, f } = view.seg
    const inView = view.win ? view.win === 'globe' || view.win === 'earth' : (from === 'earth' && f > 0.5) || from === 'globe' || (from === 'globeOut' && f < 0.5)
    if (st.drawAt < 0 && inView) st.drawAt = now
    const draw = tubes.material.uniforms.uDraw.value as Float32Array
    let all = st.drawAt >= 0
    for (const p of paths) {
      const k = reduced && st.drawAt >= 0 ? 1 : st.drawAt < 0 ? 0 : clamp01((now - st.drawAt - p.index * MOTION.routeStagger) / MOTION.routeDraw)
      draw[p.index] = easeOutCubic(k)
      if (k < 1) all = false
    }
    ;(pins.material.uniforms.uDraw.value as Float32Array).set(draw)
    if (st.drawAt >= 0 && !all) demand.keep(40)
    if (all && !st.drawn) {
      st.drawn = true
      store.getState().setGlobe({ drawn: true })
    }
    const sel = s.globe.route ? paths.findIndex((p) => p.route.id === s.globe.route) : -1
    tubes.material.uniforms.uSel.value = sel
    pins.material.uniforms.uSel.value = sel
    tubes.material.uniforms.uTime.value = frame.loopT
    pins.material.uniforms.uTime.value = frame.loopT

    // ── tiny planes ──
    const m = new Matrix4()
    for (const p of paths) {
      const t = reduced ? 0.5 : (frame.loopT / p.period + p.index * 0.37) % 1
      const fade = p.short ? 1 : Math.min(1, t / 0.04, (1 - t) / 0.04)
      const sc = PLANE_SCALE * (p.short ? 0.75 : 1) * (p.index === sel ? 1.35 : 1) * Math.max(0, fade) * (draw[p.index] >= 1 ? 1 : 0)
      planeMatrix(p, t, Math.max(sc, 1e-5), m)
      planes.setMatrixAt(p.index, m)
    }
    planes.instanceMatrix.needsUpdate = true
  })

  // Assemble, load the Earth textures (upload in idle time), dispose on unmount.
  useEffect(() => {
    const { globe, atmo, earthMat, cloudMat, clouds } = parts
    root.add(atmo, globe)
    let alive = true
    const hi = quality.settings.earth4k
    const set = (name: 'uDay' | 'uNight' | 'uNormal' | 'uWater', tex: Texture | null) => {
      if (!tex || !alive) return tex?.dispose()
      uploadInIdle(gl, tex, () => {
        if (!alive) return tex.dispose()
        const old = earthMat.uniforms[name].value as Texture
        earthMat.uniforms[name].value = tex
        old.dispose()
        demand.invalidate(2)
      })
    }
    loadTexture(hi ? ASSETS.earth.day4k : ASSETS.earth.day2k, { srgb: true, anisotropy: 8 }).then((t) => set('uDay', t))
    loadTexture(hi ? ASSETS.earth.night4k : ASSETS.earth.night2k, { srgb: true }).then((t) => set('uNight', t))
    loadTexture(ASSETS.earth.normal2k).then((t) => set('uNormal', t))
    loadTexture(ASSETS.earth.water1k).then((t) => set('uWater', t))
    loadTexture(ASSETS.earth.clouds2k, { repeat: true }).then((t) => {
      if (!t || !alive) return t?.dispose()
      // the repo placeholder is tiny: treat anything under 256 px wide as "no clouds yet"
      const img = t.image as { width: number }
      if (img.width < 256) return t.dispose()
      uploadInIdle(gl, t, () => {
        if (!alive) return t.dispose()
        ;(earthMat.uniforms.uClouds.value as Texture).dispose()
        earthMat.uniforms.uClouds.value = t
        earthMat.uniforms.uCloudsOn.value = 1
        cloudMat.uniforms.uClouds.value = t
        clouds.visible = true
        demand.invalidate(2)
      })
    })
    return () => {
      alive = false
      root.remove(atmo, globe)
      // clouds share the earth's cloud texture: dispose each texture once
      cloudMat.uniforms.uClouds.value = null
      disposeTree(globe)
      disposeTree(atmo)
    }
  }, [parts, root, gl])

  // Route picked anywhere → turn its midpoint to the camera over 1 s (ease-out).
  useEffect(() => {
    const turnTo = (id: string | null) => {
      if (!id) return
      const p = parts.paths.find((q) => q.route.id === id)
      if (!p) return
      const target = facing(p.mid)
      const y1 = st.yaw + angleTo(st.yaw, target.yaw)
      const p1 = Math.max(PITCH_MIN, Math.min(PITCH_MAX, target.pitch * 0.9))
      st.tween = { y0: st.yaw, p0: st.pitch, y1, p1, t0: performance.now() }
      globeInput.vYaw = 0
      globeInput.vPitch = 0
      demand.keep(MOTION.routeFly + 100)
    }
    turnTo(store.getState().globe.route)
    let last = store.getState().globe.route
    return store.subscribe((s) => {
      if (s.globe.route === last) return
      last = s.globe.route
      turnTo(last)
    })
  }, [parts, st])

  // Screen-space projection for picking and the debug hooks (CSS px, client coordinates).
  const project = useMemo(() => {
    const v = new Vector3()
    const camV: Vec = [0, 0, 0]
    return (local: Vec): [number, number, boolean] => {
      v.set(local[0], local[1], local[2]).applyMatrix4(parts.globe.matrixWorld)
      camV[0] = camera.position.x
      camV[1] = camera.position.y
      camV[2] = camera.position.z
      const hidden = occluded(camV, [v.x, v.y, v.z])
      v.project(camera)
      const rect = gl.domElement.getBoundingClientRect()
      return [rect.left + ((v.x + 1) / 2) * rect.width, rect.top + ((1 - v.y) / 2) * rect.height, !hidden && v.z < 1]
    }
  }, [camera, gl, parts])

  useEffect(() => {
    void size
    const pick = (x: number, y: number, radius: number) => {
      if (view.scene !== 'space') return
      const screen = new Map<string, [number, number, boolean][]>()
      for (const p of parts.paths) {
        const pts: [number, number, boolean][] = []
        if (p.short) pts.push(project(p.pts[0]))
        else for (let i = 0; i <= PATH_N; i += 2) pts.push(project(p.pts[i]))
        screen.set(p.route.id, pts)
      }
      const id = hitRoutes(screen, x, y, radius)
      if (id) store.getState().selectRoute(id, 'globe')
    }
    let detach: (() => void) | null = null
    let el: HTMLElement | undefined
    const sync = () => {
      const next = store.getState().stages.globe
      if (next === el) return
      detach?.()
      detach = null
      el = next
      if (el) detach = attachGlobeInput(el, pick)
    }
    sync()
    const unsub = store.subscribe(sync)
    debug.three.globeYaw = () => st.yaw
    debug.three.routePoint = (id) => {
      const p = parts.paths.find((q) => q.route.id === id)
      if (!p || view.scene !== 'space') return null
      const [x, y, ok] = project(p.short ? p.pts[0] : p.pts[PATH_N >> 1])
      return ok ? { x, y } : null
    }
    return () => {
      unsub()
      detach?.()
      debug.three.globeYaw = undefined
      debug.three.routePoint = undefined
    }
  }, [parts, project, st, size])

  useEffect(() => {
    demand.invalidate(2)
  }, [])
  return null
}
