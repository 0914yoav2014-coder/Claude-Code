import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  Float32BufferAttribute,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  ShaderMaterial,
  SphereGeometry,
  Vector3,
} from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { COLORS } from '../../lib/tokens'
import { OUT } from '../core/glsl'
import { cross, dot, norm, PATH_N, pathPoint, type RoutePath, type Vec } from './geo'

/**
 * Flight paths: one merged tube mesh for every long route (one draw call), clipped per route by
 * uDraw[i] and widened/tinted for the selected one; one mesh of surface-tangent quads for the
 * short routes (pins with a ripple); one InstancedMesh of tiny planes (~400 triangles each) that
 * fly along the paths and bank from the path's curvature.
 */
export const MAX_ROUTES = 16
const RING = 6
const TUBE_R = 0.0038

export function routeTubes(paths: RoutePath[]): Mesh<BufferGeometry, ShaderMaterial> {
  const long = paths.filter((p) => !p.short)
  const verts = long.length * (PATH_N + 1) * RING
  const pos = new Float32Array(verts * 3)
  const off = new Float32Array(verts * 3)
  const along = new Float32Array(verts * 2)
  const idx: number[] = []
  let v = 0
  for (const p of long) {
    const base = v
    for (let i = 0; i <= PATH_N; i++) {
      const c = p.pts[i]
      const prev = p.pts[Math.max(0, i - 1)]
      const next = p.pts[Math.min(PATH_N, i + 1)]
      const t = norm([next[0] - prev[0], next[1] - prev[1], next[2] - prev[2]])
      const up = norm(c)
      const side = norm(cross(t, up))
      const up2 = cross(side, t)
      for (let k = 0; k < RING; k++) {
        const a = (k / RING) * Math.PI * 2
        const ca = Math.cos(a)
        const sa = Math.sin(a)
        pos.set(c, v * 3)
        off.set([side[0] * ca + up2[0] * sa, side[1] * ca + up2[1] * sa, side[2] * ca + up2[2] * sa], v * 3)
        along.set([i / PATH_N, p.index], v * 2)
        v++
      }
    }
    for (let i = 0; i < PATH_N; i++)
      for (let k = 0; k < RING; k++) {
        const a = base + i * RING + k
        const b = base + i * RING + ((k + 1) % RING)
        idx.push(a, a + RING, b, b, a + RING, b + RING)
      }
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new BufferAttribute(pos, 3))
  g.setAttribute('aOff', new BufferAttribute(off, 3))
  g.setAttribute('aAlong', new BufferAttribute(along, 2))
  g.setIndex(idx)
  const m = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uDraw: { value: new Float32Array(MAX_ROUTES) },
      uSel: { value: -1 },
      uTime: { value: 0 },
      uR: { value: TUBE_R },
      uBase: { value: new Color(COLORS.sky) },
      uHot: { value: new Color(COLORS.sunset) },
    },
    vertexShader: /* glsl */ `
      #define MAX_ROUTES ${MAX_ROUTES}
      attribute vec3 aOff; attribute vec2 aAlong;
      uniform float uDraw[MAX_ROUTES]; uniform float uSel, uR;
      varying float vT; varying float vDraw; varying float vSel; varying vec3 vN; varying vec3 vWP;
      void main(){
        int i = int(aAlong.y + 0.5);
        vT = aAlong.x;
        vDraw = uDraw[i];
        vSel = abs(aAlong.y - uSel) < 0.5 ? 1.0 : 0.0;
        // thinner toward the airports, wider when selected
        float taper = 0.55 + 0.45 * sin(3.14159 * vT);
        vec3 p = position + aOff * uR * taper * (1.0 + vSel * 0.9);
        vN = normalize(mat3(modelMatrix) * aOff);
        vec4 wp = modelMatrix * vec4(p, 1.0);
        vWP = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uTime; uniform vec3 uBase, uHot;
      varying float vT; varying float vDraw; varying float vSel; varying vec3 vN; varying vec3 vWP;
      void main(){
        if (vT > vDraw) discard;
        vec3 V = normalize(cameraPosition - vWP);
        float core = pow(max(dot(normalize(vN), V), 0.0), 0.6);
        // a soft light pulse travelling along each drawn path
        float pulse = smoothstep(0.08, 0.0, abs(fract(vT * 1.5 - uTime * 0.11) - 0.5) - 0.42);
        // the freshly drawn tip glows
        float tip = smoothstep(0.06, 0.0, vDraw - vT) * step(vDraw, 0.999);
        vec3 c = mix(uBase, uHot, vSel);
        c = c * (0.75 + 0.6 * core) + vec3(1.0) * (pulse * 0.35 + tip * 0.8);
        float a = (0.55 + 0.45 * core) * (0.8 + 0.2 * vSel);
        gl_FragColor = vec4(c * (1.25 + vSel * 0.6), a);
        ${OUT}
      }`,
  })
  m.toneMapped = false
  const mesh = new Mesh(g, m)
  mesh.renderOrder = 5
  mesh.frustumCulled = false
  mesh.name = 'routes'
  return mesh
}

/** Pins with a ripple for routes under ~220 km: flat quads tangent to the surface. */
export function routePins(paths: RoutePath[]): Mesh<BufferGeometry, ShaderMaterial> {
  const pins = paths.filter((p) => p.short)
  const S = 0.035
  const pos: number[] = []
  const uv: number[] = []
  const id: number[] = []
  const idx: number[] = []
  pins.forEach((p, n) => {
    const c: Vec = [p.mid[0] * 1.0035, p.mid[1] * 1.0035, p.mid[2] * 1.0035]
    const up = norm(p.mid)
    const e = norm(Math.abs(up[1]) > 0.99 ? [1, 0, 0] : [up[2], 0, -up[0]])
    const nn = cross(up, e)
    const corners: [number, number][] = [[-1, -1], [1, -1], [1, 1], [-1, 1]]
    for (const [x, y] of corners) {
      pos.push(c[0] + (e[0] * x + nn[0] * y) * S, c[1] + (e[1] * x + nn[1] * y) * S, c[2] + (e[2] * x + nn[2] * y) * S)
      uv.push(x, y)
      id.push(p.index)
    }
    idx.push(n * 4, n * 4 + 1, n * 4 + 2, n * 4, n * 4 + 2, n * 4 + 3)
  })
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(pos, 3))
  g.setAttribute('uv', new Float32BufferAttribute(uv, 2))
  g.setAttribute('aRoute', new Float32BufferAttribute(id, 1))
  g.setIndex(idx)
  const m = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms: {
      uDraw: { value: new Float32Array(MAX_ROUTES) },
      uSel: { value: -1 },
      uTime: { value: 0 },
      uBase: { value: new Color(COLORS.sky) },
      uHot: { value: new Color(COLORS.sunset) },
    },
    vertexShader: /* glsl */ `
      #define MAX_ROUTES ${MAX_ROUTES}
      attribute float aRoute;
      uniform float uDraw[MAX_ROUTES]; uniform float uSel;
      varying vec2 vUv; varying float vDraw; varying float vSel; varying float vId;
      void main(){
        int i = int(aRoute + 0.5);
        vDraw = uDraw[i];
        vSel = abs(aRoute - uSel) < 0.5 ? 1.0 : 0.0;
        vUv = uv; vId = aRoute;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform float uTime; uniform vec3 uBase, uHot;
      varying vec2 vUv; varying float vDraw; varying float vSel; varying float vId;
      void main(){
        float r = length(vUv);
        float k = clamp(vDraw, 0.0, 1.0);
        float dotA = smoothstep(0.2, 0.12, r) * k;
        float glow = exp(-r * r * 22.0) * 0.6 * k;
        float ring = 0.0;
        for (int j = 0; j < 2; j++) {
          float ph = fract(uTime * 0.45 + float(j) * 0.5 + vId * 0.17);
          float rr = 0.18 + ph * 0.8;
          ring += smoothstep(0.05, 0.0, abs(r - rr)) * (1.0 - ph) * 0.8;
        }
        ring *= k;
        vec3 c = mix(uBase, uHot, vSel);
        float a = dotA + glow + ring;
        gl_FragColor = vec4(c * a * (1.3 + vSel), 1.0);
        ${OUT}
      }`,
  })
  m.toneMapped = false
  const mesh = new Mesh(g, m)
  mesh.renderOrder = 6
  mesh.frustumCulled = false
  mesh.name = 'pins'
  return mesh
}

/** A generic tiny airliner, nose toward −Z, length 1 (≈400 triangles). */
export function tinyPlaneGeometry(): BufferGeometry {
  const parts: BufferGeometry[] = []
  const body = new CylinderGeometry(0.06, 0.06, 0.72, 10, 1, false)
  body.rotateX(Math.PI / 2)
  parts.push(body)
  const nose = new SphereGeometry(0.06, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2)
  nose.rotateX(-Math.PI / 2)
  nose.scale(1, 1, 2.2)
  nose.translate(0, 0, -0.36)
  parts.push(nose)
  const tail = new ConeGeometry(0.06, 0.26, 10, 1, true)
  tail.rotateX(Math.PI / 2)
  tail.translate(0, 0.012, 0.49)
  parts.push(tail)
  const wing = new BufferGeometry()
  // swept wing: two triangles per side (top + bottom), slight dihedral
  const W = [
    [0.0, 0, -0.1], [0.0, 0, 0.12], [0.5, 0.04, 0.2], [0.5, 0.04, 0.28],
    [0.0, 0, -0.1], [0.0, 0, 0.12], [-0.5, 0.04, 0.2], [-0.5, 0.04, 0.28],
  ]
  const wp: number[] = []
  const tri = (a: number[], b: number[], c: number[]) => wp.push(...a, ...b, ...c, ...a, ...c, ...b)
  tri(W[0], W[1], W[3]); tri(W[0], W[3], W[2])
  tri(W[4], W[7], W[5]); tri(W[4], W[6], W[7])
  // tailplane and fin
  tri([0, 0.02, 0.42], [0, 0.02, 0.56], [0.2, 0.03, 0.62]); tri([0, 0.02, 0.42], [-0.2, 0.03, 0.62], [0, 0.02, 0.56])
  tri([0, 0.04, 0.4], [0, 0.04, 0.58], [0, 0.24, 0.62]); tri([0, 0.24, 0.62], [0, 0.04, 0.58], [0, 0.24, 0.7])
  wing.setAttribute('position', new Float32BufferAttribute(wp, 3))
  wing.computeVertexNormals()
  for (const p of parts) {
    p.deleteAttribute('uv')
  }
  // engines under the wings
  for (const x of [-0.2, 0.2]) {
    const e = new CylinderGeometry(0.03, 0.026, 0.12, 8, 1, false)
    e.rotateX(Math.PI / 2)
    e.translate(x, -0.035, 0.04)
    e.deleteAttribute('uv')
    parts.push(e)
  }
  const merged = mergeGeometries([...parts.map((p) => p.toNonIndexed()), wing])
  for (const p of parts) p.dispose()
  wing.dispose()
  return merged
}

export function tinyPlanes(count: number): InstancedMesh {
  const mat = new MeshStandardMaterial({ color: '#f5f8fc', roughness: 0.4, metalness: 0.1, emissive: new Color('#c8dcff'), emissiveIntensity: 0.55 })
  const mesh = new InstancedMesh(tinyPlaneGeometry(), mat, count)
  mesh.renderOrder = 7
  mesh.frustumCulled = false
  mesh.name = 'route-planes'
  return mesh
}

/** Plane pose on a path at t: position, forward, up, plus roll from the path's curvature. */
const _m = new Matrix4()
const _x = new Vector3()
const _y = new Vector3()
const _z = new Vector3()
const _p = new Vector3()

export function planeMatrix(p: RoutePath, t: number, scale: number, out: Matrix4 = _m): Matrix4 {
  let pos: Vec
  let fwd: Vec
  let roll = 0
  if (p.short) {
    // circle above the pin, banked into the turn
    const up = norm(p.mid)
    const e = norm(Math.abs(up[1]) > 0.99 ? [1, 0, 0] : [up[2], 0, -up[0]])
    const n = cross(up, e)
    const a = t * Math.PI * 2
    const R = 0.028
    const h = 1.012
    pos = [up[0] * h + (e[0] * Math.cos(a) + n[0] * Math.sin(a)) * R, up[1] * h + (e[1] * Math.cos(a) + n[1] * Math.sin(a)) * R, up[2] * h + (e[2] * Math.cos(a) + n[2] * Math.sin(a)) * R]
    fwd = norm([-e[0] * Math.sin(a) + n[0] * Math.cos(a), -e[1] * Math.sin(a) + n[1] * Math.cos(a), -e[2] * Math.sin(a) + n[2] * Math.cos(a)])
    roll = -0.5
  } else {
    const d = 0.004
    const a = pathPoint(p.a, p.b, p.angle, Math.max(0, t - d))
    const b = pathPoint(p.a, p.b, p.angle, Math.min(1, t + d))
    pos = pathPoint(p.a, p.b, p.angle, t)
    fwd = norm([b[0] - a[0], b[1] - a[1], b[2] - a[2]])
    // curvature: how fast the heading turns around the local up axis
    const a2 = pathPoint(p.a, p.b, p.angle, Math.max(0, t - 0.03))
    const b2 = pathPoint(p.a, p.b, p.angle, Math.min(1, t + 0.03))
    const f1 = norm([pos[0] - a2[0], pos[1] - a2[1], pos[2] - a2[2]])
    const f2 = norm([b2[0] - pos[0], b2[1] - pos[1], b2[2] - pos[2]])
    const turn = dot(cross(f1, f2), norm(pos))
    roll = Math.max(-0.7, Math.min(0.7, -turn * 9))
  }
  const up = norm(pos)
  _z.set(-fwd[0], -fwd[1], -fwd[2])
  _x.set(up[0], up[1], up[2]).cross(_z).normalize()
  _y.copy(_z).cross(_x)
  // roll around the forward axis
  if (roll) {
    const c = Math.cos(roll)
    const s = Math.sin(roll)
    const xx = _x.clone()
    _x.multiplyScalar(c).addScaledVector(_y, s)
    _y.multiplyScalar(c).addScaledVector(xx, -s)
  }
  _p.set(pos[0], pos[1], pos[2])
  out.makeBasis(_x.multiplyScalar(scale), _y.multiplyScalar(scale), _z.multiplyScalar(scale))
  out.setPosition(_p)
  return out
}
