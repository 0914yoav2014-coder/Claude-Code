import {
  BoxGeometry,
  type BufferGeometry,
  CylinderGeometry,
  Group,
  type Material,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Quaternion,
  type Texture,
  Vector3,
} from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import type { Plane } from '../../data/types'
import { fuselageSection, latheZ, lerp, loftFuselage, mirrorX, surface, type Station } from './geometry'
import { makeLivery } from './livery'
import { NavLights, type LightSpot } from './navlights'
import { modelSpec, type ModelSpec, type SurfaceSpec } from './specs'

/**
 * Builds one procedural airplane from its data (`PLANES[i].shape` + specs): fuselage, wings with
 * tips, tail, engines (turbofan pylons, Concorde's paired nacelles, turboprop/piston props), gear
 * or floats, painted materials and blinking navigation lights. Parts that share a material are
 * merged, so a whole plane is ~8 draw calls plus its lights. Units: metres, nose toward −Z.
 */
export type Lod = 'hero' | 'rich' | 'medium'

export interface PlaneModel {
  group: Group
  lights: NavLights
  spec: ModelSpec
  /** Lowest point (wheels/floats) and highest point (fin tip), metres. */
  bottom: number
  top: number
  dispose(): void
}

const RAD = Math.PI / 180

interface Parts {
  [key: string]: BufferGeometry[]
}

export function buildPlane(plane: Plane, lod: Lod, envMap: Texture | null, gearDown: boolean): PlaneModel {
  const spec = modelSpec(plane)
  const rich = lod !== 'medium'
  const L = spec.length
  const R = spec.width / 2
  const f = spec.fuselage
  const zAt = (s: number) => -L / 2 + s * L
  const parts: Parts = { paint: [], wing: [], fin: [], white: [], metal: [], dark: [], rubber: [], prop: [] }
  const spots: LightSpot[] = []

  // ── fuselage ──
  parts.paint.push(loftFuselage(f, R, L, rich ? 120 : 72, rich ? 64 : 40))

  // ── main wing ──
  const K = rich ? 18 : 11
  const w = spec.wing
  const wingZ = zAt(w.at)
  const sec = fuselageSection(f, R, L, w.at + 0.05)
  const wingY = w.mount === 'high' ? sec.yc + sec.ry * 0.93 : sec.yc + sec.ry * w.y
  const S = w.span
  const wingSt: Station[] = []
  const nW = rich ? 16 : 10
  const leAt = (eta: number): Vector3 => {
    const y = eta * S
    if (w.ogee) {
      const z = wingZ + w.rootChord * 0.86 * (1 - Math.pow(1 - eta, 1.55))
      return new Vector3(y, wingY + y * Math.tan(w.dihedral * RAD), z)
    }
    return new Vector3(y, wingY + y * Math.tan(w.dihedral * RAD), wingZ + y * Math.tan(w.sweep * RAD))
  }
  const chordAt = (eta: number): number => {
    if (w.ogee) {
      const te = wingZ + w.rootChord * (1 - 0.05 * eta)
      return Math.max(w.tipChord * 0.6, te - leAt(eta).z)
    }
    if (w.rootChord === w.tipChord) return w.rootChord
    // airliner planform: an almost straight inboard trailing edge out to the kink, then a taper
    const kink = 0.32
    const teRoot = wingZ + w.rootChord
    const teKink = teRoot + kink * S * Math.tan(w.sweep * 0.25 * RAD)
    const teTip = leAt(1).z + w.tipChord
    const te = eta < kink ? lerp(teRoot, teKink, eta / kink) : lerp(teKink, teTip, (eta - kink) / (1 - kink))
    return te - leAt(eta).z
  }
  for (let i = 0; i <= nW; i++) {
    const eta = Math.pow(i / nW, 0.9)
    wingSt.push({ le: leAt(eta), chord: chordAt(eta), thick: lerp(w.thick, w.thick * 0.72, eta), eta })
  }
  // wing tips
  const tip = wingSt[wingSt.length - 1]
  const tipStations = (): Station[] => {
    const out: Station[] = []
    const base = tip.le.clone()
    if (spec.tips === 'sharklet' || spec.tips === 'winglet') {
      const hgt = spec.tips === 'sharklet' ? 0.11 * S : 0.04 * S
      const n = rich ? 6 : 4
      const p = base.clone()
      for (let k = 1; k <= n; k++) {
        const a = (w.dihedral + (78 - w.dihedral) * Math.pow(k / n, 0.8)) * RAD
        const step = hgt / n / Math.max(0.4, Math.sin(a) + 0.15)
        p.x += Math.cos(a) * step * 0.6
        p.y += Math.sin(a) * step
        p.z += step * Math.tan((spec.tips === 'sharklet' ? 48 : 55) * RAD)
        const c = tip.chord * lerp(1, spec.tips === 'sharklet' ? 0.42 : 0.5, k / n)
        out.push({ le: p.clone(), chord: c, thick: tip.thick * 0.9, eta: 1 })
      }
    } else if (spec.tips === 'raked') {
      const n = 3
      for (let k = 1; k <= n; k++) {
        const d = (0.075 * S * k) / n
        out.push({ le: new Vector3(base.x + d, base.y + d * Math.tan(w.dihedral * RAD), base.z + d * Math.tan(60 * RAD)), chord: tip.chord * lerp(1, 0.32, k / n), thick: tip.thick, eta: 1 })
      }
    } else if (!w.ogee) {
      out.push({ le: new Vector3(base.x + tip.chord * 0.05, base.y, base.z + tip.chord * 0.06), chord: tip.chord * 0.88, thick: tip.thick * 0.8, eta: 1 })
    }
    return out
  }
  const fullWing = [...wingSt, ...tipStations()]
  const rightWing = surface(fullWing, K, w.ogee ? 0 : 0.02)
  parts.wing.push(rightWing, mirrorX(rightWing))
  const tipEnd = fullWing[fullWing.length - 1]
  const tipLight = new Vector3(tipEnd.le.x, tipEnd.le.y, tipEnd.le.z + tipEnd.chord * 0.25)
  spots.push({ pos: new Vector3(-tipLight.x, tipLight.y, tipLight.z), kind: 'red' }, { pos: tipLight.clone(), kind: 'green' })
  spots.push({ pos: new Vector3(-tipLight.x, tipLight.y, tipLight.z + tipEnd.chord * 0.6), kind: 'strobe' }, { pos: new Vector3(tipLight.x, tipLight.y, tipLight.z + tipEnd.chord * 0.6), kind: 'strobe' })

  // wing-to-body fairing for low-wing airliners
  if (w.mount === 'low' && L > 40) {
    const fair = latheZ(
      [
        [0, 0.02],
        [0.12, 0.6],
        [0.4, 1],
        [0.75, 0.95],
        [1, 0.05],
      ].map(([z, r]) => [z * w.rootChord * 1.45, r] as [number, number]),
      rich ? 24 : 16,
    )
    fair.scale(R * 0.92, R * 0.5, 1)
    fair.translate(0, sec.yc - sec.ry * 0.62, wingZ - w.rootChord * 0.22)
    parts.paint.push(fair)
  }

  // ── tail ──
  const tailSurface = (t: SurfaceSpec, vertical: boolean): BufferGeometry => {
    const z0 = zAt(t.at)
    const s0 = fuselageSection(f, R, L, Math.min(0.99, t.at + 0.04))
    const y0 = vertical ? s0.yc + s0.ry * 0.85 : s0.yc + s0.ry * t.y
    const n = rich ? 8 : 5
    const st: Station[] = []
    for (let i = 0; i <= n; i++) {
      const e = i / n
      const d = e * t.span
      const le = vertical
        ? new Vector3(0, y0 + d, z0 + d * Math.tan(t.sweep * RAD))
        : new Vector3(d, y0 + d * Math.tan(t.dihedral * RAD), z0 + d * Math.tan(t.sweep * RAD))
      st.push({ le, chord: lerp(t.rootChord, t.tipChord, e), thick: t.thick, eta: e })
    }
    return surface(st, rich ? 12 : 8, 0)
  }
  const fin = tailSurface(spec.fin, true)
  parts.fin.push(fin)
  {
    const t = spec.fin
    const top = fuselageSection(f, R, L, t.at + 0.04)
    const y = top.yc + top.ry * 0.85 + t.span
    spots.push({ pos: new Vector3(0, y - 0.15, zAt(t.at) + t.span * Math.tan(t.sweep * RAD) + t.tipChord * 0.9), kind: 'strobe' })
  }
  if (spec.stab) {
    const st = tailSurface(spec.stab, false)
    parts.wing.push(st, mirrorX(st))
  }
  // beacons (red, top and bottom of the fuselage)
  {
    const s1 = fuselageSection(f, R, L, 0.42)
    spots.push({ pos: new Vector3(0, s1.yc + s1.ry + 0.08, zAt(0.42)), kind: 'beacon' }, { pos: new Vector3(0, s1.yc - s1.ry - 0.08, zAt(0.5)), kind: 'beacon' })
  }
  // tail light
  {
    const e = fuselageSection(f, R, L, 1)
    spots.push({ pos: new Vector3(0, e.yc, L / 2 + 0.1), kind: 'tail' })
  }

  // ── engines ──
  const E = spec.engines
  const exhausts: Vector3[] = []
  const wingUnder = (eta: number) => {
    const le = leAt(eta)
    const c = chordAt(eta)
    return { le, c, y: le.y - c * w.thick * 0.5 }
  }
  if (spec.engineType === 'turbofan') {
    const D = E.diameter
    const r = D / 2
    const Ln = E.length
    const seg = rich ? 40 : 24
    const cowl: [number, number][] = [
      [0.035, 0.97], [0.08, 0.995], [0.2, 1], [0.42, 0.98], [0.6, 0.9], [0.7, 0.8],
    ].map(([z, rr]) => [z * Ln, rr * r])
    const lip: [number, number][] = [[0.0, 0.8], [0.004, 0.88], [0.015, 0.94], [0.035, 0.97]].map(([z, rr]) => [z * Ln, rr * r])
    const inner: [number, number][] = [[0.0, 0.8], [0.09, 0.78]].map(([z, rr]) => [z * Ln, rr * r])
    const core: [number, number][] = [[0.7, 0.68], [0.82, 0.6], [0.95, 0.45], [0.98, 0.42]].map(([z, rr]) => [z * Ln, rr * r])
    const plug: [number, number][] = [[0.96, 0.3], [1.04, 0.18], [1.12, 0.02]].map(([z, rr]) => [z * Ln, rr * r])
    const spinner: [number, number][] = [[0.04, 0.0], [0.07, 0.14], [0.1, 0.22]].map(([z, rr]) => [z * Ln, rr * r])
    for (const eta of E.eta) {
      const u = wingUnder(eta)
      const cx = u.le.x
      const cy = u.y - E.drop - r
      const cz = u.le.z - Ln * E.ahead
      const place = (g: BufferGeometry) => {
        g.translate(cx, cy, cz)
        return g
      }
      for (const side of [1, -1]) {
        const add = (key: string, g: BufferGeometry) => parts[key].push(side === 1 ? g : mirrorX(g))
        add('white', place(latheZ(cowl, seg)))
        add('metal', place(latheZ(lip, seg)))
        add('dark', place(latheZ(inner, seg)))
        add('metal', place(latheZ(core, seg)))
        add('dark', place(latheZ(plug, seg >> 1)))
        add('metal', place(latheZ(spinner, seg >> 1)))
        // fan face
        const fan = new CylinderGeometry(r * 0.78, r * 0.78, 0.02, seg, 1)
        fan.rotateX(Math.PI / 2)
        add('dark', place(fan.translate(0, 0, Ln * 0.09)))
        // pylon (a slim vertical airfoil from the nacelle to the wing)
        const pyl: Station[] = [
          { le: new Vector3(cx, cy + r * 0.8, cz + Ln * 0.25), chord: Ln * 0.75, thick: 0.12, eta: 0 },
          { le: new Vector3(cx, u.y + 0.2, u.le.z - 0.4), chord: Math.min(u.c * 0.85, Ln * 0.8), thick: 0.12, eta: 1 },
        ]
        add('white', surface(pyl, 6, 0, false))
        if (side === 1) exhausts.push(new Vector3(cx, cy, cz + Ln * 1.05), new Vector3(-cx, cy, cz + Ln * 1.05))
      }
    }
  } else if (spec.engineType === 'turbojet') {
    // Concorde: two paired, boxy nacelles under the wings with rectangular inlets
    const eta = (E.eta[0] + E.eta[1]) / 2
    const u = wingUnder(eta)
    const wdt = E.diameter * 2.15
    const hgt = E.diameter * 1.25
    const len = E.length
    const z0 = zAt(0.615)
    const cy = u.y - hgt / 2 + 0.25
    for (const side of [1, -1]) {
      const add = (key: string, g: BufferGeometry) => parts[key].push(side === 1 ? g : mirrorX(g))
      const box = new BoxGeometry(wdt, hgt, len, 2, 2, 6)
      // taper the front (inlet ramp) a little
      const p = box.getAttribute('position')
      for (let i = 0; i < p.count; i++) if (p.getZ(i) < 0) p.setY(i, p.getY(i) * 0.92 + 0.05)
      box.computeVertexNormals()
      add('white', box.translate(u.le.x, cy, z0 + len / 2))
      const inlet = new BoxGeometry(wdt * 0.92, hgt * 0.7, 0.06)
      add('dark', inlet.translate(u.le.x, cy + 0.05, z0 - 0.01))
      for (const dx of [-wdt / 4, wdt / 4]) {
        const nz = latheZ([[0, E.diameter * 0.46], [0.9, E.diameter * 0.44], [1.4, E.diameter * 0.38]], rich ? 20 : 14)
        add('metal', nz.translate(u.le.x + dx, cy, z0 + len - 0.2))
        if (side === 1) exhausts.push(new Vector3(u.le.x + dx, cy, z0 + len + 1.3), new Vector3(-(u.le.x + dx), cy, z0 + len + 1.3))
      }
    }
  } else {
    // turboprop / piston: cowlings on the wing with spinners and 3 or 2 blades
    const blades = spec.engineType === 'turboprop' ? 3 : 2
    const propR = spec.engineType === 'turboprop' ? 1.3 : 1.0
    for (const eta of E.eta) {
      const u = wingUnder(eta)
      const r = E.diameter / 2
      const Ln = E.length
      const cx = u.le.x
      const cy = u.le.y - r * 0.35 + (spec.wing.mount === 'high' ? -r * 0.1 : 0)
      const cz = u.le.z - Ln * E.ahead
      for (const side of [1, -1]) {
        const add = (key: string, g: BufferGeometry) => parts[key].push(side === 1 ? g : mirrorX(g))
        const cowl = latheZ([[0, r * 0.62], [0.06 * Ln, r * 0.9], [0.25 * Ln, r], [0.75 * Ln, r * 0.92], [Ln, r * 0.35]], rich ? 28 : 18)
        cowl.scale(1, 1.12, 1)
        add('white', cowl.translate(cx, cy, cz))
        const spin = latheZ([[-0.42, 0.0], [-0.3, r * 0.3], [-0.08, r * 0.55], [0, r * 0.6]], rich ? 20 : 12)
        add('metal', spin.translate(cx, cy, cz))
        for (let b = 0; b < blades; b++) {
          const a = (b / blades) * Math.PI * 2 + 0.4
          const bl = new BoxGeometry(0.2, propR, 0.04)
          bl.translate(0, propR / 2 + r * 0.25, 0)
          bl.rotateY(0.35)
          bl.rotateZ(a)
          add('prop', bl.translate(cx, cy, cz - 0.12))
        }
      }
    }
  }

  // ── gear / floats / struts ──
  const fuseBottom = fuselageSection(f, R, L, 0.5)
  const ground = fuseBottom.yc - fuseBottom.ry - spec.clearance
  let bottom = ground
  const wheel = (x: number, z: number, rad: number, wid: number) => {
    const t = new CylinderGeometry(rad, rad, wid, rich ? 22 : 14, 1)
    t.rotateZ(Math.PI / 2)
    parts.rubber.push(t.translate(x, ground + rad, z))
    const hub = new CylinderGeometry(rad * 0.55, rad * 0.55, wid * 1.04, rich ? 16 : 10, 1)
    hub.rotateZ(Math.PI / 2)
    parts.metal.push(hub.translate(x, ground + rad, z))
  }
  const strut = (x: number, y0: number, y1: number, z: number, r: number, x1 = x, z1 = z) => {
    const a = new Vector3(x, y0, z)
    const b = new Vector3(x1, y1, z1)
    const len = a.distanceTo(b)
    const g = new CylinderGeometry(r, r, len, 10, 1)
    const mid = a.clone().add(b).multiplyScalar(0.5)
    const dir = b.clone().sub(a).normalize()
    // rotate +Y onto dir
    const axis = new Vector3(0, 1, 0).cross(dir)
    const ang = Math.acos(Math.max(-1, Math.min(1, dir.y)))
    if (axis.lengthSq() > 1e-8) {
      axis.normalize()
      g.applyQuaternion(new Quaternion().setFromAxisAngle(axis, ang))
    }
    parts.metal.push(g.translate(mid.x, mid.y, mid.z))
  }
  if (spec.gear === 'floats') {
    const fl = { aspect: 1.0, n: 2.4, nose: 0.28, nosePow: 0.62, noseY: 0.55, tail: 0.62, tailY: 0.3, tailR: 0.12, hump: 0, humpEnd: 0, droopAt: 0, droop: 0 }
    const fLen = L * 0.86
    const fR = 0.34
    const fx = 1.5
    const fy = fuseBottom.yc - fuseBottom.ry - 1.05
    for (const side of [1, -1]) {
      const g = loftFuselage(fl, fR, fLen, rich ? 48 : 28, rich ? 24 : 16)
      g.translate(fx * side, fy, -L * 0.04)
      parts.white.push(g)
      for (const sz of [-0.18, 0.12]) strut(fx * side, fy + fR * 0.8, fuseBottom.yc - fuseBottom.ry * 0.8, sz * L, 0.06, R * 0.8 * side, sz * L)
    }
    bottom = fy - fR
  } else if (gearDown) {
    if (spec.gear === 'fixed') {
      // Islander: main legs from the engine nacelles, nose leg under the nose
      const u = wingUnder(E.eta[0])
      for (const side of [1, -1]) {
        strut(u.le.x * side * 0.8, u.y - 0.3, ground + 0.32, u.le.z + 0.3, 0.06)
        wheel(u.le.x * side * 0.8, u.le.z + 0.3, 0.32, 0.18)
      }
      const nz = zAt(0.13)
      strut(0, fuselageSection(f, R, L, 0.13).yc - 0.3, ground + 0.22, nz, 0.05)
      wheel(0, nz, 0.22, 0.12)
    } else {
      const big = L > 40
      const wr = big ? 0.64 : 0.45
      const ww = big ? 0.48 : 0.3
      // nose gear (two wheels)
      const nzs = spec.id === 'concorde' ? 0.21 : 0.085
      const nz = zAt(nzs)
      const ns = fuselageSection(f, R, L, nzs)
      strut(0, ns.yc - ns.ry * 0.7, ground + wr * 0.9, nz, big ? 0.13 : 0.1)
      wheel(-ww * 0.6, nz, wr * 0.86, ww)
      wheel(ww * 0.6, nz, wr * 0.86, ww)
      // main bogies: under the wings (+ body gears on the four-engine jets)
      const mz = wingZ + w.rootChord * (w.ogee ? 0.62 : 0.68)
      const track = spec.id === 'concorde' ? 3.8 : R * 1.75
      const bogies: [number, number][] = [[track, mz]]
      if (spec.engines.eta.length === 2 && spec.engineType === 'turbofan') bogies.push([R * 0.62, mz + 2.4])
      for (const [bx, bz] of bogies)
        for (const side of [1, -1]) {
          const x = bx * side
          const top = spec.id === 'concorde' ? wingUnder(0.25).y : fuseBottom.yc - fuseBottom.ry * 0.5
          strut(x, top, ground + wr * 1.2, bz, big ? 0.17 : 0.13)
          const axle = new BoxGeometry(ww * 2.6, 0.14, big ? 3.2 : 2.2)
          parts.metal.push(axle.translate(x, ground + wr, bz))
          for (const dz of big ? [-0.75, 0.75] : [-0.55, 0.55])
            for (const dx of [-ww * 0.75, ww * 0.75]) wheel(x + dx, bz + dz, wr, ww)
        }
    }
  }
  if (spec.id === 'twinotter') {
    // wing struts
    for (const side of [1, -1]) {
      const u = wingUnder(0.42)
      strut(R * 0.95 * side, fuseBottom.yc - fuseBottom.ry * 0.55, u.y, wingZ + w.rootChord * 0.35, 0.055, u.le.x * side, wingZ + w.rootChord * 0.35)
    }
  }

  // ── materials ──
  const liv = makeLivery(spec, rich)
  const env = { envMap, envMapIntensity: 1 }
  const mats: Record<string, Material> = {
    paint: new MeshPhysicalMaterial({ map: liv.map, roughnessMap: liv.orm, metalnessMap: liv.orm, normalMap: liv.normal, roughness: 1, metalness: 1, clearcoat: 0.5, clearcoatRoughness: 0.24, ...env }),
    wing: new MeshPhysicalMaterial({ map: liv.wing, metalness: 0.35, roughness: 0.42, clearcoat: 0.35, clearcoatRoughness: 0.3, ...env }),
    fin: new MeshPhysicalMaterial({ map: liv.fin, metalness: 0.2, roughness: 0.35, clearcoat: 0.5, clearcoatRoughness: 0.24, ...env }),
    white: new MeshPhysicalMaterial({ color: '#eef1f5', metalness: 0.2, roughness: 0.35, clearcoat: 0.5, clearcoatRoughness: 0.24, ...env }),
    metal: new MeshStandardMaterial({ color: '#c9cdd4', metalness: 1, roughness: 0.24, ...env }),
    dark: new MeshStandardMaterial({ color: '#23272e', metalness: 0.75, roughness: 0.42, ...env }),
    rubber: new MeshStandardMaterial({ color: '#141518', metalness: 0, roughness: 0.88, ...env }),
    prop: new MeshStandardMaterial({ color: '#22252b', metalness: 0.4, roughness: 0.5, ...env }),
  }

  const group = new Group()
  group.name = `plane-${spec.id}`
  let top = -Infinity
  for (const [key, list] of Object.entries(parts)) {
    if (!list.length) continue
    for (const g of list) if (!g.getAttribute('uv')) throw new Error(`no uv in ${key}`)
    const merged = list.length === 1 ? list[0] : mergeGeometries(list, false)
    if (list.length > 1) for (const g of list) g.dispose()
    if (!merged) continue
    merged.computeBoundingBox()
    top = Math.max(top, merged.boundingBox!.max.y)
    const mesh = new Mesh(merged, mats[key])
    mesh.name = key
    mesh.castShadow = true
    mesh.receiveShadow = key === 'paint' || key === 'wing'
    group.add(mesh)
  }
  const lights = new NavLights(spots, exhausts, Math.max(0.5, L / 70))
  group.add(lights)

  return {
    group,
    lights,
    spec,
    bottom,
    top,
    dispose() {
      group.traverse((o) => {
        const m = o as Mesh
        if (m.geometry) m.geometry.dispose()
      })
      for (const m of Object.values(mats)) m.dispose()
      for (const t of [liv.map, liv.orm, liv.normal, liv.fin, liv.wing]) t?.dispose()
      lights.dispose()
    },
  }
}
