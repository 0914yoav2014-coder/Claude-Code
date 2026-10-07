import { CanvasTexture, NoColorSpace, RepeatWrapping, SRGBColorSpace } from 'three'
import { COLORS } from '../../lib/tokens'
import type { ModelSpec } from './specs'

/**
 * Generated paint for each plane (no real airline livery): white body, navy belly and tail,
 * a sky-blue cheatline with a small sunset-orange accent, dark windows, door outlines and cockpit
 * glass, plus a roughness/metalness map (glossy glass) and a panel-line normal map.
 * Fuselage uv: x = s along the length (nose → tail), y = φ/2π around (0 bottom, .25 right, .5 top).
 */
export interface Livery {
  map: CanvasTexture
  orm: CanvasTexture
  normal: CanvasTexture | null
  fin: CanvasTexture
  wing: CanvasTexture
}

const NAVY = COLORS.navy
const SKY = COLORS.sky
const ORANGE = COLORS.sunset
const WHITE = '#f4f6f9'
const GLASS = '#10161f'

function canvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return [c, c.getContext('2d')!]
}

function rrect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  g.beginPath()
  g.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2))
}

export function makeLivery(spec: ModelSpec, rich: boolean): Livery {
  const W = rich ? 2048 : 1024
  const H = rich ? 512 : 256
  const L = spec.length
  const circ = Math.PI * spec.width * (1 + (spec.fuselage.aspect - 1) * 0.5)
  const X = (s: number) => s * W
  /** canvas y for v on the right side (left side mirrors around v = .5); CanvasTexture flips y. */
  const Y = (v: number) => (1 - v) * H
  const both = (fn: (v: (x: number) => number) => void) => {
    fn((v) => v)
    fn((v) => 1 - v)
  }

  const [mc, m] = canvas(W, H) // colour
  const [oc, o] = canvas(W, H) // G roughness, B metalness
  const [hc, h] = canvas(W, H) // height for panel lines (rich only)

  m.fillStyle = WHITE
  m.fillRect(0, 0, W, H)
  o.fillStyle = 'rgb(0, 92, 46)' // roughness .36, metalness .18
  o.fillRect(0, 0, W, H)
  h.fillStyle = '#808080'
  h.fillRect(0, 0, W, H)

  // navy belly (soft-edged), from just behind the nose to the tail cone
  const belly = 0.175
  const g1 = m.createLinearGradient(0, Y(belly + 0.012), 0, Y(belly - 0.004))
  g1.addColorStop(0, WHITE)
  g1.addColorStop(1, NAVY)
  const bw = X(0.97) - X(0.02)
  m.fillStyle = NAVY
  m.fillRect(X(0.02), Y(belly), bw, H - Y(belly))
  m.fillRect(X(0.02), 0, bw, Y(1 - belly))
  m.fillStyle = g1
  m.fillRect(X(0.02), Y(belly + 0.012), bw, Y(belly - 0.004) - Y(belly + 0.012))
  m.save()
  m.translate(0, H)
  m.scale(1, -1)
  m.fillRect(X(0.02), Y(belly + 0.012), bw, Y(belly - 0.004) - Y(belly + 0.012))
  m.restore()

  // sky-blue cheatline under the windows, sweeping up into the tail; thin orange accent near the nose
  const wv = spec.windows.v[0]
  const cl = wv - (spec.windows.h / circ) * 0.9 - 0.012
  both((v) => {
    m.fillStyle = SKY
    m.beginPath()
    const y0 = Y(v(cl + 0.009))
    const y1 = Y(v(cl - 0.009))
    m.moveTo(X(0.06), (y0 + y1) / 2)
    m.lineTo(X(0.1), y0)
    m.lineTo(X(0.78), y0)
    m.quadraticCurveTo(X(0.9), y0, X(0.97), Y(v(0.42)))
    m.lineTo(X(0.97), Y(v(0.38)))
    m.quadraticCurveTo(X(0.88), y1, X(0.78), y1)
    m.lineTo(X(0.1), y1)
    m.closePath()
    m.fill()
    m.fillStyle = ORANGE
    rrect(m, X(0.075), Y(v(cl - 0.014)), X(0.1), Math.abs(Y(v(cl - 0.019)) - Y(v(cl - 0.014))), 2)
    m.fill()
  })

  // windows
  const win = (v: number, from: number, to: number) => {
    const pitch = spec.windows.pitch / L
    const ww = (spec.windows.w / L) * W
    const wh = (spec.windows.h / circ) * H
    for (let s = from; s <= to; s += pitch) {
      // skip where the doors are
      if (spec.doors.some((d) => Math.abs(s - d) < (1.4 / L))) continue
      both((vv) => {
        const y = Y(vv(v)) - wh / 2
        m.fillStyle = GLASS
        rrect(m, X(s) - ww / 2, y, ww, wh, ww * 0.45)
        m.fill()
        o.fillStyle = 'rgb(0, 18, 0)'
        rrect(o, X(s) - ww / 2, y, ww, wh, ww * 0.45)
        o.fill()
        h.fillStyle = '#6a6a6a'
        rrect(h, X(s) - ww / 2, y, ww, wh, ww * 0.45)
        h.fill()
      })
    }
  }
  for (const v of spec.windows.v) win(v, spec.windows.from, spec.windows.to)
  if (spec.windows.upper) win(spec.windows.upper.v, spec.windows.upper.from, spec.windows.upper.to)

  // doors: outlines (paint and panel lines)
  for (const d of spec.doors) {
    const dw = (1.05 / L) * W * (spec.length < 20 ? 1.2 : 1)
    const dh = (Math.min(1.9, spec.width * 0.55) / circ) * H
    both((vv) => {
      const y = Y(vv(wv)) - dh * 0.6
      m.strokeStyle = 'rgba(70, 82, 100, 0.55)'
      m.lineWidth = rich ? 2 : 1
      rrect(m, X(d) - dw / 2, y, dw, dh, dw * 0.2)
      m.stroke()
      h.strokeStyle = '#3c3c3c'
      h.lineWidth = rich ? 3 : 2
      rrect(h, X(d) - dw / 2, y, dw, dh, dw * 0.2)
      h.stroke()
    })
  }

  // cockpit glass (+ the A350's dark "raccoon mask"); four panes a side at the front of the top
  const c0 = spec.cockpit
  const cw = (1.0 / L) * W * (spec.length < 20 ? 1.4 : 1)
  if (spec.mask) {
    both((vv) => {
      m.fillStyle = '#121a26'
      m.beginPath()
      m.moveTo(X(c0 - 0.004), Y(vv(0.36)))
      m.lineTo(X(c0 + 0.038), Y(vv(0.345)))
      m.lineTo(X(c0 + 0.03), Y(vv(0.47)))
      m.lineTo(X(c0 - 0.006), Y(vv(0.5)))
      m.closePath()
      m.fill()
    })
  }
  both((vv) => {
    const panes: [number, number, number, number][] = [
      [c0, 0.462, c0 + 0.0065, 0.5],
      [c0 + 0.002, 0.42, c0 + 0.009, 0.458],
      [c0 + 0.006, 0.385, c0 + 0.014, 0.415],
      [c0 + 0.013, 0.37, c0 + 0.019, 0.39],
    ]
    for (const [s0, v0, s1, v1] of panes) {
      const x0 = X(s0)
      const x1 = Math.max(X(s1), x0 + cw * 0.5)
      m.fillStyle = GLASS
      m.beginPath()
      m.moveTo(x0, Y(vv(v1)))
      m.lineTo(x1, Y(vv(v1)))
      m.lineTo(x1 + (x1 - x0) * 0.15, Y(vv(v0)))
      m.lineTo(x0 + (x1 - x0) * 0.1, Y(vv(v0)))
      m.closePath()
      m.fill()
      o.fillStyle = 'rgb(0, 12, 0)'
      o.fillRect(x0, Y(vv(v1)), x1 - x0, Y(vv(v0)) - Y(vv(v1)))
    }
  })

  // panel lines: frames every ~3 m, two lap joints, and the wing-root fairing
  if (rich) {
    h.strokeStyle = '#6e6e6e'
    h.lineWidth = 1.5
    for (let s = 0.08; s < 0.95; s += 3 / L) {
      h.beginPath()
      h.moveTo(X(s), 0)
      h.lineTo(X(s), H)
      h.stroke()
    }
    for (const v of [0.12, 0.38, 0.62, 0.88]) {
      h.beginPath()
      h.moveTo(X(0.05), Y(v))
      h.lineTo(X(0.95), Y(v))
      h.stroke()
    }
  }

  const map = new CanvasTexture(mc)
  map.colorSpace = SRGBColorSpace
  map.anisotropy = 8
  const orm = new CanvasTexture(oc)
  orm.colorSpace = NoColorSpace
  const normal = rich ? heightToNormal(hc, h, 2.2) : null
  return { map, orm, normal, fin: finTexture(), wing: wingTexture() }
}

/** Sobel → tangent-space normal map. */
function heightToNormal(c: HTMLCanvasElement, g: CanvasRenderingContext2D, strength: number): CanvasTexture {
  const { width: w, height: hh } = c
  const src = g.getImageData(0, 0, w, hh).data
  const out = g.createImageData(w, hh)
  const d = out.data
  const at = (x: number, y: number) => src[((Math.min(hh - 1, Math.max(0, y)) * w + ((x + w) % w)) * 4)] / 255
  for (let y = 0; y < hh; y++)
    for (let x = 0; x < w; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * strength
      const dy = (at(x, y + 1) - at(x, y - 1)) * strength
      const l = Math.hypot(dx, dy, 1)
      const i = (y * w + x) * 4
      d[i] = (-dx / l) * 127.5 + 127.5
      d[i + 1] = (dy / l) * 127.5 + 127.5
      d[i + 2] = (1 / l) * 127.5 + 127.5
      d[i + 3] = 255
    }
  g.putImageData(out, 0, 0)
  const t = new CanvasTexture(c)
  t.colorSpace = NoColorSpace
  return t
}

/** Fin: navy with a sky-blue sweep and a small orange accent. uv.x around the airfoil (LE at .5), uv.y root → tip. */
function finTexture(): CanvasTexture {
  const S = 256
  const [c, g] = canvas(S, S)
  const img = g.createImageData(S, S)
  const hex = (s: string) => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)]
  const navy = hex(NAVY)
  const sky = hex(SKY)
  const orange = hex(ORANGE)
  const white = hex(WHITE)
  for (let y = 0; y < S; y++)
    for (let x = 0; x < S; x++) {
      const eta = 1 - y / S
      const ch = Math.abs(x / S - 0.5) * 2 // 0 leading edge … 1 trailing edge
      let col = navy
      const line = ch - (1.05 - eta * 1.15)
      if (eta < 0.08) col = white
      else if (Math.abs(line) < 0.07) col = sky
      else if (line > 0.07 && line < 0.11 && eta > 0.2 && eta < 0.62) col = orange
      const i = (y * S + x) * 4
      img.data[i] = col[0]
      img.data[i + 1] = col[1]
      img.data[i + 2] = col[2]
      img.data[i + 3] = 255
    }
  g.putImageData(img, 0, 0)
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  return t
}

/** Wing: light grey paint, bare-metal leading edge, flap and aileron lines. */
function wingTexture(): CanvasTexture {
  const [c, g] = canvas(256, 64)
  g.fillStyle = '#c4c9d1'
  g.fillRect(0, 0, 256, 64)
  const le = g.createLinearGradient(0, 0, 256, 0)
  le.addColorStop(0.38, 'rgba(232,236,242,0)')
  le.addColorStop(0.45, 'rgba(232,236,242,1)')
  le.addColorStop(0.55, 'rgba(232,236,242,1)')
  le.addColorStop(0.62, 'rgba(232,236,242,0)')
  g.fillStyle = le
  g.fillRect(0, 0, 256, 64)
  g.fillStyle = 'rgba(80, 90, 105, 0.6)'
  for (const x of [0.11, 0.89]) g.fillRect(x * 256 - 1, 0, 2, 64)
  for (const y of [20, 44]) {
    g.fillRect(0, y, 30, 1.5)
    g.fillRect(226, y, 30, 1.5)
  }
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  t.wrapS = RepeatWrapping
  return t
}
