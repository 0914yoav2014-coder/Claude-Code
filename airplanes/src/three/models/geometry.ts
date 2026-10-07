import { BufferGeometry, Float32BufferAttribute, LatheGeometry, Vector2, Vector3 } from 'three'
import type { FuselageSpec } from './specs'

/**
 * Geometry builders for the procedural airplanes (pure three, no materials): a lofted fuselage
 * (super-ellipse sections along a centre line), airfoil surfaces from spanwise stations, lathed
 * nacelles. Every builder returns an indexed geometry with position, normal and uv, so parts that
 * share a material can be merged into one draw call.
 */

const sgnPow = (v: number, p: number): number => Math.sign(v) * Math.pow(Math.abs(v), p)
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t
const smooth = (a: number, b: number, x: number): number => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

export interface Section {
  /** Centre height, half height, half width (metres). */
  yc: number
  ry: number
  rx: number
}

/** Cross-section of a fuselage at s (0 nose … 1 tail end). R = half width, L = length. */
export function fuselageSection(f: FuselageSpec, R: number, L: number, s: number): Section {
  let top = R * f.aspect
  let bot = -R * f.aspect
  let hw = R
  if (f.hump > 0) top += R * f.hump * smooth(0.0, 0.1, s) * (1 - smooth(f.humpEnd - 0.16, f.humpEnd, s))
  if (s < f.nose) {
    const x = s / f.nose
    const tip = f.noseY * R
    const base = 1 - (1 - x) * (1 - x)
    const kTop = Math.pow(base, f.nosePow * 0.92)
    const kBot = Math.pow(base, f.nosePow * 1.12)
    top = tip + (top - tip) * kTop
    bot = tip + (bot - tip) * kBot
    hw *= Math.pow(base, f.nosePow)
  }
  if (s > f.tail) {
    const x = (s - f.tail) / (1 - f.tail)
    const endTop = (f.tailY + f.tailR) * R
    const endBot = (f.tailY - f.tailR) * R
    top = lerp(top, endTop, Math.pow(x, 2.1))
    bot = lerp(bot, endBot, Math.pow(x, 1.25))
    hw = lerp(hw, f.tailR * R, Math.pow(x, 1.5))
  }
  let yOff = 0
  if (f.droop > 0 && s < f.droopAt) yOff = -(f.droopAt - s) * L * Math.tan((f.droop * Math.PI) / 180)
  return { yc: (top + bot) / 2 + yOff, ry: Math.max(1e-4, (top - bot) / 2), rx: Math.max(1e-4, hw) }
}

/** Flip triangle winding in place when the normals point inward (checked at one known vertex). */
function orient(g: BufferGeometry, vertex: number, outward: Vector3): void {
  g.computeVertexNormals()
  const n = g.getAttribute('normal')
  const d = n.getX(vertex) * outward.x + n.getY(vertex) * outward.y + n.getZ(vertex) * outward.z
  if (d >= 0) return
  const idx = g.getIndex()!
  for (let i = 0; i < idx.count; i += 3) {
    const a = idx.getX(i + 1)
    idx.setX(i + 1, idx.getX(i + 2))
    idx.setX(i + 2, a)
  }
  idx.needsUpdate = true
  g.computeVertexNormals()
}

/** Average the normals of the seam columns (first and last vertex of each ring). */
function weldSeam(g: BufferGeometry, rings: number, ringLen: number): void {
  const n = g.getAttribute('normal')
  const v = new Vector3()
  for (let r = 0; r < rings; r++) {
    const a = r * ringLen
    const b = a + ringLen - 1
    v.set(n.getX(a) + n.getX(b), n.getY(a) + n.getY(b), n.getZ(a) + n.getZ(b)).normalize()
    n.setXYZ(a, v.x, v.y, v.z)
    n.setXYZ(b, v.x, v.y, v.z)
  }
  n.needsUpdate = true
}

/** Lofted fuselage, nose at z = −L/2. uv = (s along the length, φ/2π around: 0 bottom, .25 right, .5 top). */
export function loftFuselage(f: FuselageSpec, R: number, L: number, nS: number, nT: number, n = f.n): BufferGeometry {
  const pos: number[] = []
  const uv: number[] = []
  const idx: number[] = []
  const ringLen = nT + 1
  for (let i = 0; i <= nS; i++) {
    const t = i / nS
    // denser toward the nose and the tail
    const s = 0.45 * t + 0.55 * (1 - Math.cos(Math.PI * t)) * 0.5
    const sec = fuselageSection(f, R, L, s)
    const z = -L / 2 + s * L
    for (let j = 0; j <= nT; j++) {
      const ph = (j / nT) * Math.PI * 2
      pos.push(sec.rx * sgnPow(Math.sin(ph), 2 / n), sec.yc - sec.ry * sgnPow(Math.cos(ph), 2 / n), z)
      uv.push(s, j / nT)
    }
  }
  for (let i = 0; i < nS; i++)
    for (let j = 0; j < nT; j++) {
      const a = i * ringLen + j
      idx.push(a, a + 1, a + ringLen, a + 1, a + ringLen + 1, a + ringLen)
    }
  // tail cap
  const last = nS * ringLen
  const end = fuselageSection(f, R, L, 1)
  const c = pos.length / 3
  pos.push(0, end.yc, L / 2)
  uv.push(1, 0.5)
  for (let j = 0; j < nT; j++) idx.push(last + j, last + j + 1, c)
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(pos, 3))
  g.setAttribute('uv', new Float32BufferAttribute(uv, 2))
  g.setIndex(idx)
  const mid = Math.round(nS / 2) * ringLen + Math.round(nT / 4)
  orient(g, mid, new Vector3(1, 0, 0))
  weldSeam(g, nS + 1, ringLen)
  return g
}

export interface Station {
  /** Leading-edge point. */
  le: Vector3
  chord: number
  /** Thickness / chord. */
  thick: number
  /** Spanwise coordinate 0..1 (uv.y). */
  eta: number
}

/** NACA 4-digit thickness (and optional camber) at x (0..1). */
function airfoil(x: number, t: number, camber: number): [number, number] {
  const yt = 5 * t * (0.2969 * Math.sqrt(x) - 0.126 * x - 0.3516 * x * x + 0.2843 * x ** 3 - 0.1036 * x ** 4)
  const p = 0.4
  const yc = camber > 0 ? (x < p ? (camber / (p * p)) * (2 * p * x - x * x) : (camber / ((1 - p) ** 2)) * (1 - 2 * p + 2 * p * x - x * x)) : 0
  return [yc + yt, yc - yt]
}

/**
 * A lifting surface through stations (chord along +Z). The thickness axis is Z × span direction,
 * so the same code builds wings (span +X → thickness +Y) and fins (span +Y → thickness −X).
 * uv = (u around the airfoil: 0 upper trailing edge, .5 leading edge, 1 lower trailing edge; eta).
 */
export function surface(st: Station[], K: number, camber = 0, capTip = true): BufferGeometry {
  const pos: number[] = []
  const uv: number[] = []
  const idx: number[] = []
  const ringLen = 2 * K + 1
  const Z = new Vector3(0, 0, 1)
  const d = new Vector3()
  const t = new Vector3()
  const xs: number[] = []
  for (let i = 0; i <= K; i++) xs.push(0.5 * (1 + Math.cos((i / K) * Math.PI))) // 1 → 0
  st.forEach((s, i) => {
    const a = st[Math.max(0, i - 1)].le
    const b = st[Math.min(st.length - 1, i + 1)].le
    d.subVectors(b, a).normalize()
    t.crossVectors(Z, d).normalize()
    for (let k = 0; k < ringLen; k++) {
      const upper = k <= K
      const x = upper ? xs[k] : xs[2 * K - k]
      const [yu, yl] = airfoil(Math.max(0, x), s.thick, camber)
      const y = upper ? yu : yl
      pos.push(s.le.x + t.x * y * s.chord, s.le.y + t.y * y * s.chord, s.le.z + x * s.chord + t.z * y * s.chord)
      uv.push(k / (ringLen - 1), s.eta)
    }
  })
  for (let i = 0; i < st.length - 1; i++)
    for (let k = 0; k < ringLen - 1; k++) {
      const a = i * ringLen + k
      idx.push(a, a + ringLen, a + 1, a + 1, a + ringLen, a + ringLen + 1)
    }
  if (capTip) {
    const base = (st.length - 1) * ringLen
    const c = pos.length / 3
    let cx = 0
    let cy = 0
    let cz = 0
    for (let k = 0; k < ringLen; k++) {
      cx += pos[(base + k) * 3]
      cy += pos[(base + k) * 3 + 1]
      cz += pos[(base + k) * 3 + 2]
    }
    pos.push(cx / ringLen, cy / ringLen, cz / ringLen)
    uv.push(0.5, 1)
    for (let k = 0; k < ringLen - 1; k++) idx.push(base + k, c, base + k + 1)
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(pos, 3))
  g.setAttribute('uv', new Float32BufferAttribute(uv, 2))
  g.setIndex(idx)
  // outward check: the upper surface at mid chord of the middle station points along +t
  const mi = Math.floor(st.length / 2)
  const a = st[Math.max(0, mi - 1)].le
  const b = st[Math.min(st.length - 1, mi + 1)].le
  d.subVectors(b, a).normalize()
  t.crossVectors(Z, d).normalize()
  orient(g, mi * ringLen + Math.round(K / 2), t.clone())
  return g
}

/** Mirror a geometry across x = 0 (left wing from the right), fixing the winding. */
export function mirrorX(g: BufferGeometry): BufferGeometry {
  const m = g.clone()
  m.scale(-1, 1, 1)
  const idx = m.getIndex()
  if (idx) {
    for (let i = 0; i < idx.count; i += 3) {
      const a = idx.getX(i + 1)
      idx.setX(i + 1, idx.getX(i + 2))
      idx.setX(i + 2, a)
    }
  }
  m.computeVertexNormals()
  return m
}

/** Lathe along +Z (profile points are [z, r]); the first point faces −Z. */
export function latheZ(profile: [number, number][], segments: number): BufferGeometry {
  const pts = profile.map(([z, r]) => new Vector2(Math.max(r, 1e-4), z))
  const g = new LatheGeometry(pts, segments)
  g.rotateX(Math.PI / 2)
  // LatheGeometry runs around +Y; after the rotation it runs around +Z with the profile along +Z
  g.computeVertexNormals()
  return g
}

export { lerp, smooth }
