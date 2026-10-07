import { useThree } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import {
  BackSide,
  CanvasTexture,
  CircleGeometry,
  Color,
  CylinderGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  RingGeometry,
  ShaderMaterial,
  SphereGeometry,
} from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { PLANES } from '../../data/planes'
import { easeOutCubic } from '../../lib/ease'
import { MOTION } from '../../lib/tokens'
import { frame } from '../../state/frame'
import { store } from '../../state/store'
import { clamp01 } from '../../state/timeline'
import { demand } from '../core/demand'
import { hangarEnv } from '../core/env'
import { OUT } from '../core/glsl'
import { quality } from '../core/quality'
import { stage } from '../core/stage'
import { useSceneRoot } from '../core/useSceneRoot'
import { buildPlane, type PlaneModel } from '../models/build'
import { closeupPose } from '../rig/overrides'
import { attachTurntableInput, turntable } from './input'

/**
 * The hangar: a dark interior with a glossy floor, a turntable under cool spotlights and a rim
 * light, one plane at a time (built lazily for the current index ±1, cached, disposed when far).
 * Switching rolls the next plane in from `hangar.dir` over 0.8 s; dragging the stage spins the
 * turntable with inertia; the close-up binds OrbitControls (on a proxy camera) to the close-up stage
 * and the rig blends to it. Real-time shadows on high, a baked contact shadow otherwise.
 */
const SIZE = 17 // longest side (length or span) in scene units
const DECK_Y = 0.32
const SPIN = 0.09 // rad per loop second
const ROLL_X = 34

interface Slot {
  model: PlaneModel
  holder: Group
  shadow: Mesh<PlaneGeometry, MeshBasicMaterial>
  k: number
}

function contactShadow(model: PlaneModel, k: number): Mesh<PlaneGeometry, MeshBasicMaterial> {
  const s = model.spec
  const S = 256
  const c = document.createElement('canvas')
  c.width = S
  c.height = S
  const g = c.getContext('2d')!
  const ext = Math.max(s.length, s.span) * 1.25
  const px = (m: number) => (m / ext) * S
  g.translate(S / 2, S / 2)
  g.filter = 'blur(10px)'
  g.fillStyle = 'rgba(0,0,0,0.85)'
  g.beginPath()
  g.ellipse(0, 0, px(s.width * 0.55), px(s.length * 0.5), 0, 0, Math.PI * 2)
  g.fill()
  g.filter = 'blur(14px)'
  g.fillStyle = 'rgba(0,0,0,0.5)'
  const wz = px((s.wing.at - 0.5) * s.length)
  g.beginPath()
  g.moveTo(-px(s.span / 2), wz + px(s.wing.rootChord * 0.8))
  g.lineTo(0, wz)
  g.lineTo(px(s.span / 2), wz + px(s.wing.rootChord * 0.8))
  g.lineTo(px(s.span / 2), wz + px(s.wing.rootChord))
  g.lineTo(0, wz + px(s.wing.rootChord))
  g.lineTo(-px(s.span / 2), wz + px(s.wing.rootChord))
  g.closePath()
  g.fill()
  const tex = new CanvasTexture(c)
  const m = new Mesh(new PlaneGeometry(ext * k, ext * k), new MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0.9, color: '#000000' }))
  m.material.alphaMap = tex
  m.rotation.x = -Math.PI / 2
  m.position.y = DECK_Y + 0.02
  m.renderOrder = 1
  return m
}

export default function HangarScene() {
  const gl = useThree((s) => s.gl)
  const camera = useThree((s) => s.camera) as PerspectiveCamera
  const size = useThree((s) => s.size)

  const parts = useMemo(() => {
    const envRT = hangarEnv(gl)
    const env = envRT.texture
    const floor = new Mesh(new CircleGeometry(160, 64), new MeshStandardMaterial({ color: '#0d121c', roughness: 0.72, metalness: 0.2, envMap: env, envMapIntensity: 0.2 }))
    floor.rotation.x = -Math.PI / 2
    floor.receiveShadow = true
    floor.name = 'floor'
    const deckMat = new MeshStandardMaterial({ color: '#161c29', roughness: 0.78, metalness: 0.25, envMap: env, envMapIntensity: 0.3 })
    const deck = new Mesh(new CylinderGeometry(12.5, 12.8, DECK_Y, 96, 1), deckMat)
    deck.position.y = DECK_Y / 2
    deck.receiveShadow = true
    const ring = new Mesh(new RingGeometry(12.55, 12.75, 128), new MeshBasicMaterial({ color: new Color('#4da3ff').multiplyScalar(1.6), toneMapped: false }))
    ring.rotation.x = -Math.PI / 2
    ring.position.y = DECK_Y + 0.005
    // a soft backdrop: dark, with a faint cool glow behind the plane and light strips high up
    const back = new Mesh(
      new SphereGeometry(140, 48, 24),
      new ShaderMaterial({
        side: BackSide,
        depthWrite: false,
        uniforms: {},
        vertexShader: /* glsl */ `varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: /* glsl */ `
          varying vec3 vP;
          void main(){
            vec3 d = normalize(vP);
            vec3 c = vec3(0.003, 0.005, 0.01);
            c += vec3(0.008, 0.014, 0.03) * exp(-pow(d.y * 4.0, 2.0)) * smoothstep(0.0, -0.95, d.z);
            float strips = smoothstep(0.995, 1.0, sin(atan(d.x, d.z) * 18.0)) * smoothstep(0.32, 0.4, d.y) * smoothstep(0.62, 0.5, d.y);
            c += vec3(0.5, 0.65, 0.9) * strips * 0.5;
            gl_FragColor = vec4(c, 1.0);
            ${OUT}
          }`,
      }),
    )
    back.renderOrder = -100
    const table = new Group()
    table.name = 'turntable'
    const scene = new Group()
    scene.add(back, floor, deck, ring, table)
    const proxy = new PerspectiveCamera(30, 1, 0.5, 700)
    return { envRT, env, scene, table, deck, proxy, slots: new Map<number, Slot>() }
  }, [gl])

  const st = useMemo(
    () => ({
      index: store.getState().hangar.index,
      prev: -1,
      dir: 1 as 1 | -1,
      t0: -1e9,
      spin: 0,
      lastLoopT: frame.loopT,
      lastNow: 0,
      controls: null as OrbitControls | null,
    }),
    [],
  )

  const slot = (i: number): Slot | null => {
    const hit = parts.slots.get(i)
    if (hit) return hit
    const plane = PLANES[i]
    if (!plane) return null
    const model = buildPlane(plane, quality.settings.detail === 'rich' ? 'rich' : 'medium', parts.env, true)
    const k = SIZE / Math.max(plane.shape.lengthM, plane.shape.spanM)
    const holder = new Group()
    model.group.scale.setScalar(k)
    model.group.position.y = DECK_Y - model.bottom * k
    holder.add(model.group)
    const shadow = contactShadow(model, k)
    holder.add(shadow)
    const s = { model, holder, shadow, k }
    parts.slots.set(i, s)
    return s
  }

  const root = useSceneRoot('hangar', (visible) => {
    if (!visible) return
    const now = frame.now || performance.now()
    const s = store.getState()
    const reduced = s.motion.reduced
    const dt = Math.min(100, st.lastNow ? now - st.lastNow : 16)
    st.lastNow = now

    // switching: roll the next plane in from hangar.dir, the old one out the other side
    if (s.hangar.index !== st.index) {
      st.prev = st.index
      st.index = s.hangar.index
      st.dir = s.hangar.dir
      st.t0 = now
    }
    const k = reduced ? 1 : clamp01((now - st.t0) / MOTION.hangarSwitch)
    const e = easeOutCubic(k)
    if (k < 1) demand.keep(40)
    const cur = slot(st.index)
    for (const [i, sl] of parts.slots) {
      const on = i === st.index || (i === st.prev && k < 1)
      if (on && !sl.holder.parent) parts.table.add(sl.holder)
      if (!on && sl.holder.parent) sl.holder.parent.remove(sl.holder)
    }
    if (cur) {
      cur.holder.position.x = st.dir * ROLL_X * (1 - e)
      cur.holder.rotation.y = st.dir * 0.5 * (1 - e)
    }
    const old = k < 1 ? parts.slots.get(st.prev) : undefined
    if (old) {
      old.holder.position.x = -st.dir * ROLL_X * e
      old.holder.rotation.y = -st.dir * 0.5 * e
    }

    // turntable: drag + inertia, then a slow spin on loop time
    const tt = turntable
    st.spin += tt.d
    tt.d = 0
    if (!tt.dragging && Math.abs(tt.v) > 1e-6) {
      st.spin += tt.v * dt
      tt.v *= Math.exp(-dt / 500)
      if (Math.abs(tt.v) < 2e-6) tt.v = 0
      demand.keep(40)
    }
    const dLoop = frame.loopT - st.lastLoopT
    st.lastLoopT = frame.loopT
    if (!s.hangar.closeup && !tt.dragging && dLoop > 0 && dLoop < 0.5) st.spin += dLoop * SPIN
    parts.table.rotation.y = -0.55 + st.spin

    // nav lights
    const pxPerUnit = (size.height / 2 / Math.tan((camera.fov * Math.PI) / 360)) * gl.getPixelRatio()
    for (const sl of parts.slots.values()) if (sl.holder.parent) sl.model.lights.update(frame.loopT, pxPerUnit * sl.k, 0, 0.8)

    // close-up: OrbitControls on the proxy camera → closeupPose (the rig blends to it)
    const c = st.controls
    if (c && s.hangar.closeup) {
      if (c.update()) demand.keep(60)
      closeupPose.pos.copy(parts.proxy.position)
      closeupPose.target.copy(c.target)
      closeupPose.fov = parts.proxy.fov
    }

    // shadows: real-time on high (the turntable moves), baked contact shadow otherwise
    const live = quality.settings.shadows
    for (const sl of parts.slots.values()) sl.shadow.visible = !live
    if (live) gl.shadowMap.needsUpdate = true

    if (stage.bloom) {
      stage.bloom.threshold = 4
      stage.bloom.strength = 0.15
      stage.bloom.radius = 0.4
    }
    if (stage.lights) {
      const L = stage.lights
      L.hemi.color.set('#9fb6e0')
      L.hemi.groundColor.set('#0b0f18')
      L.hemi.intensity = 0.35
      L.key.color.set('#e6efff')
      L.key.intensity = 2.6
      L.key.angle = 0.42
      L.key.penumbra = 0.85
      L.key.position.set(14, 32, -6)
      L.key.target.position.set(0, 1.5, 0)
      L.fill.color.set('#bcd2ff')
      L.fill.intensity = 2.2
      L.fill.angle = 0.6
      L.fill.penumbra = 1
      L.fill.position.set(-22, 13, 32)
      L.fill.target.position.set(0, 2, 0)
      L.rim.color.set('#6fa8ff')
      L.rim.intensity = 1.2
      L.rim.angle = 0.5
      L.rim.penumbra = 1
      L.rim.position.set(-10, 26, -30)
      L.rim.target.position.set(0, 3, 0)
      for (const l of [L.key, L.fill, L.rim]) l.target.updateMatrixWorld()
    }
  })

  // build the current plane now and its neighbours in idle time; dispose far ones
  useEffect(() => {
    const keep = (i: number) => {
      const n = PLANES.length
      return [i, (i + 1) % n, (i - 1 + n) % n]
    }
    let timers: number[] = []
    const plan = (i: number) => {
      for (const t of timers) window.clearTimeout(t)
      timers = []
      slot(i)
      demand.invalidate(2)
      keep(i)
        .slice(1)
        .forEach((j, n) => {
          timers.push(window.setTimeout(() => slot(j), 300 + n * 300))
        })
      for (const [j, sl] of parts.slots) {
        if (keep(i).includes(j) || j === st.prev) continue
        sl.holder.parent?.remove(sl.holder)
        sl.model.dispose()
        sl.shadow.geometry.dispose()
        sl.shadow.material.map?.dispose()
        sl.shadow.material.dispose()
        parts.slots.delete(j)
      }
    }
    plan(store.getState().hangar.index)
    let last = store.getState().hangar.index
    const unsub = store.subscribe((s) => {
      if (s.hangar.index === last) return
      last = s.hangar.index
      plan(last)
    })
    return () => {
      unsub()
      for (const t of timers) window.clearTimeout(t)
    }
  }, [parts, st])

  // input: turntable drag on the hangar stage; OrbitControls on the close-up stage
  useEffect(() => {
    let detachT: (() => void) | null = null
    let elT: HTMLElement | undefined
    let elC: HTMLElement | undefined
    const sync = () => {
      const s = store.getState()
      if (s.stages.hangar !== elT) {
        detachT?.()
        detachT = null
        elT = s.stages.hangar
        if (elT) detachT = attachTurntableInput(elT)
      }
      const want = s.hangar.closeup ? s.stages.closeup : undefined
      if (want !== elC) {
        st.controls?.dispose()
        st.controls = null
        elC = want
        if (elC) {
          // start from the current rig pose, so the blend starts where we are
          const p = parts.proxy
          p.position.set(-13, 5.5, -15)
          p.fov = 30
          p.aspect = size.width / Math.max(1, size.height)
          p.updateProjectionMatrix()
          const c = new OrbitControls(p, elC)
          c.target.set(0, 3, 0)
          c.enablePan = false
          c.enableDamping = true
          c.dampingFactor = 0.08
          c.minDistance = 9
          c.maxDistance = 34
          c.maxPolarAngle = Math.PI * 0.49
          c.addEventListener('change', () => demand.keep(120))
          c.addEventListener('start', () => demand.inputStart())
          c.addEventListener('end', () => demand.inputEnd())
          c.update()
          closeupPose.pos.copy(p.position)
          closeupPose.target.copy(c.target)
          closeupPose.fov = p.fov
          st.controls = c
          demand.keep(700)
        }
      }
    }
    sync()
    const unsub = store.subscribe(sync)
    return () => {
      unsub()
      detachT?.()
      st.controls?.dispose()
      st.controls = null
    }
  }, [parts, st, size])

  useEffect(() => {
    root.add(parts.scene)
    return () => {
      root.remove(parts.scene)
      for (const sl of parts.slots.values()) {
        sl.model.dispose()
        sl.shadow.geometry.dispose()
        sl.shadow.material.map?.dispose()
        sl.shadow.material.dispose()
      }
      parts.slots.clear()
      parts.scene.traverse((o) => {
        const m = o as Mesh
        if (m.geometry) m.geometry.dispose()
        if (m.material) (m.material as { dispose(): void }).dispose()
      })
      parts.envRT.dispose()
    }
  }, [parts, root])

  return null
}
