import type { PlaneId } from '../data/types'

/**
 * Side-view airplane illustrations in one flat style, ported from v1 (legacy/planes.js).
 * planeArt(id, uid) returns the inner markup of an <svg viewBox="0 0 320 140"> (nose to the right).
 * `uid` keeps clip-path ids unique when the same airplane appears twice on the page.
 * Generic paint schemes in the page colours (no airline liveries). Pure strings: server-safe.
 */
export const PLANE_ART_VIEWBOX = '0 0 320 140'

const C = {
  body: '#FFFFFF',
  belly: '#DCE6F2',
  wing: '#C3D2E4',
  wingDark: '#9DB1C9',
  engine: '#AFC0D4',
  intake: '#4E6684',
  window: '#24466E',
  gear: '#3B4B60',
  sky: '#4DA3FF',
  sunset: '#FF8A3D',
  navy: '#0B2545',
}

function windows(xFrom: number, xTo: number, y: number, gap: number, w: number, h: number): string {
  let s = ''
  for (let x = xFrom; x <= xTo; x += gap) s += `<rect x="${x.toFixed(1)}" y="${y}" width="${w}" height="${h}" rx="${(Math.min(w, h) / 2.4).toFixed(2)}"/>`
  return `<g fill="${C.window}">${s}</g>`
}

function engine(cx: number, cy: number, len: number, r: number): string {
  return (
    `<path d="M${cx - len * 0.3},${cy - r + 1} L${cx - len * 0.08},${cy - r - 6} L${cx + len * 0.12},${cy - r - 6} L${cx + len * 0.06},${cy - r + 1} Z" fill="${C.wingDark}"/>` +
    `<rect x="${cx - len / 2}" y="${cy - r}" width="${len}" height="${r * 2}" rx="${r}" fill="${C.engine}"/>` +
    `<rect x="${cx - len / 2 + r * 0.4}" y="${cy + r * 0.15}" width="${len * 0.6}" height="${r * 0.45}" rx="${r * 0.22}" fill="${C.wingDark}" opacity=".55"/>` +
    `<ellipse cx="${cx + len / 2 - r * 0.35}" cy="${cy}" rx="${r * 0.35}" ry="${r * 0.82}" fill="${C.intake}"/>`
  )
}

interface JetOptions {
  id: string
  accent: string
  x0?: number
  x1?: number
  yT?: number
  yB?: number
  nose?: number
  tail?: number
  finH?: number
  decks?: 1 | 2
  hump?: { x: number; h: number }
  mask?: boolean
  wingX?: number
  span?: number
  /** [fraction along the leading edge, length, radius] */
  engines?: [number, number, number][]
}

/** A twin-aisle jetliner: decks (1|2), hump (747 upper deck), engines, mask (A350 cockpit band). */
function jet(o: JetOptions, uid: string): string {
  const x0 = o.x0 ?? 14
  const x1 = o.x1 ?? 306
  const yT = o.yT ?? 50
  const yB = o.yB ?? 76
  const h = yB - yT
  const nose = o.nose ?? 34
  const tail = o.tail ?? 62
  const finH = o.finH ?? 42
  const id = `${o.id}-${uid}`
  const noseTop = o.hump ? yT - o.hump.h : yT
  let top = `M${x0},${yT + 2} `
  if (o.hump) {
    const hx = o.hump.x
    top +=
      `L${hx},${yT} C${hx + 22},${yT} ${hx + 24},${noseTop} ${hx + 48},${noseTop} L${x1 - nose * 1.25},${noseTop} ` +
      `C${x1 - nose * 0.45},${noseTop} ${x1},${yT + h * 0.3} ${x1},${yT + h * 0.62} `
  } else {
    top += `L${x1 - nose},${yT} C${x1 - nose * 0.35},${yT} ${x1},${yT + h * 0.3} ${x1},${yT + h * 0.62} `
  }
  const body =
    top +
    `C${x1},${yB - h * 0.08} ${x1 - nose * 0.45},${yB} ${x1 - nose},${yB} L${x0 + tail},${yB} ` +
    `C${x0 + tail * 0.55},${yB} ${x0 + tail * 0.22},${yT + h * 0.45} ${x0},${yT + h * 0.2} Z`

  const fin = `M${x0 + tail * 0.9},${yT + 1} L${x0 + tail * 0.3},${yT - finH} L${x0 + 5},${yT - finH} L${x0 + 1},${yT + 3} Z`
  const stab = `M${x0 + tail * 0.66},${yT + h * 0.42} L${x0 + tail * 0.2},${yT + h * 0.62 + 9} L${x0 + tail * 0.04},${yT + h * 0.62 + 9} L${x0 + tail * 0.12},${yT + h * 0.36} Z`
  const farStab = `M${x0 + tail * 0.6},${yT + h * 0.3} L${x0 + tail * 0.25},${yT - 6} L${x0 + tail * 0.12},${yT - 6} L${x0 + tail * 0.12},${yT + h * 0.3} Z`

  const wx = o.wingX ?? 196
  const span = o.span ?? 30
  const root: [number, number] = [wx, yT + h * 0.6]
  const tip: [number, number] = [wx - 96, yB + span]
  const wing = `M${root[0]},${root[1]} L${wx - 64},${yT + h * 0.74} L${tip[0] - 15},${tip[1] - 1} Q${tip[0] - 9},${tip[1] + 2} ${tip[0]},${tip[1]} Z`
  const along = (f: number): [number, number] => [root[0] + (tip[0] - root[0]) * f, root[1] + (tip[1] - root[1]) * f]

  let win = ''
  const wFrom = x0 + tail + 4
  const wTo = x1 - nose - 6
  if (o.decks === 2) {
    win = windows(wFrom, wTo + 2, yT + h * 0.2, 6.4, 3.4, 4.2) + windows(wFrom + 3, wTo, yT + h * 0.55, 6.4, 3.4, 4.2)
  } else {
    win = windows(wFrom, wTo, yT + h * 0.3, 6.4, 3.4, 4.4)
    if (o.hump) win += windows(o.hump.x + 34, x1 - nose * 1.2, noseTop + 6, 6.4, 3.4, 4.2)
  }
  const ckY = (o.hump ? noseTop : yT) + 4
  const cockpit = o.mask
    ? `<path d="M${x1 - nose * 0.78},${yT + h * 0.2} C${x1 - nose * 0.45},${yT + h * 0.12} ${x1 - nose * 0.2},${yT + h * 0.22} ${x1 - nose * 0.04},${yT + h * 0.42} L${x1 - nose * 0.2},${yT + h * 0.44} C${x1 - nose * 0.4},${yT + h * 0.36} ${x1 - nose * 0.6},${yT + h * 0.34} ${x1 - nose * 0.8},${yT + h * 0.38} Z" fill="#14243A"/>`
    : `<path d="M${x1 - nose * 0.62},${ckY + h * 0.08} L${x1 - nose * 0.3},${ckY + h * 0.06} L${x1 - nose * 0.16},${ckY + h * 0.2} L${x1 - nose * 0.58},${ckY + h * 0.22} Z" fill="${C.window}"/>`

  // Each engine hangs just under and ahead of the wing's leading edge.
  const engines = (o.engines ?? [])
    .map(([f, len, r]) => {
      const [px, py] = along(f)
      return engine(px + len * 0.12, py + r + 5, len, r)
    })
    .join('')

  return (
    `<defs><clipPath id="b-${id}"><path d="${body}"/></clipPath></defs>` +
    `<path d="${farStab}" fill="${C.wingDark}"/>` +
    `<path d="${fin}" fill="${o.accent}"/>` +
    `<path d="${body}" fill="${C.body}"/>` +
    `<g clip-path="url(#b-${id})"><rect x="0" y="${yT + h * 0.7}" width="320" height="${h}" fill="${C.belly}"/>` +
    `<rect x="0" y="${yT + h * 0.66}" width="320" height="2.2" fill="${o.accent}"/></g>` +
    win +
    cockpit +
    `<path d="${stab}" fill="${C.wing}"/>` +
    `<path d="${wing}" fill="${C.wing}"/>` +
    engines
  )
}

const ART: Record<PlaneId, (uid: string) => string> = {
  a380: (uid) =>
    jet({ id: 'a380', accent: C.sky, yT: 40, yB: 80, nose: 40, tail: 66, finH: 40, decks: 2, wingX: 200, span: 26, engines: [[0.3, 36, 8.5], [0.66, 30, 7]] }, uid),

  b747: (uid) =>
    jet(
      { id: 'b747', accent: '#2F6FD6', x0: 10, x1: 308, yT: 50, yB: 76, nose: 34, tail: 64, finH: 44, hump: { x: 196, h: 11 }, wingX: 194, span: 28, engines: [[0.3, 32, 7.5], [0.66, 28, 6.5]] },
      uid,
    ),

  a350: (uid) => jet({ id: 'a350', accent: C.navy, yT: 52, yB: 76, nose: 36, tail: 60, finH: 40, mask: true, wingX: 190, span: 30, engines: [[0.36, 40, 10]] }, uid),

  concorde: (uid) => {
    const id = `concorde-${uid}`
    const body = 'M20,60 L250,58 C276,57 296,61 312,66 C296,69 276,72 250,72 L72,73 C52,73 36,68 20,64 Z'
    return (
      `<defs><clipPath id="b-${id}"><path d="${body}"/></clipPath></defs>` +
      `<path d="M70,60 L36,20 L26,20 L24,61 Z" fill="${C.navy}"/>` +
      `<path d="${body}" fill="${C.body}"/>` +
      `<g clip-path="url(#b-${id})"><rect x="0" y="68" width="320" height="10" fill="${C.belly}"/>` +
      `<rect x="0" y="66.4" width="320" height="1.6" fill="${C.navy}"/></g>` +
      windows(84, 244, 62, 6.2, 2.6, 3.2) +
      `<path d="M276,59.2 L292,61 L294,63 L278,62.6 Z" fill="${C.window}"/>` +
      `<path d="M246,71 C200,73 150,80 112,96 L94,96 L60,73 Z" fill="${C.wing}"/>` +
      `<path d="M112,96 L94,96 L82,88 L120,90 Z" fill="${C.wingDark}" opacity=".6"/>` +
      `<rect x="74" y="76" width="64" height="10" rx="2.5" fill="${C.engine}"/>` +
      `<path d="M138,76 L146,79 L146,83 L138,86 Z" fill="${C.intake}"/>` +
      `<rect x="74" y="82" width="64" height="2" fill="${C.wingDark}" opacity=".6"/>`
    )
  },

  twinotter: (uid) => {
    const id = `otter-${uid}`
    const body = 'M44,52 L232,48 C250,48 262,54 266,64 C266,72 260,78 248,78 L120,80 C96,80 70,72 44,60 Z'
    return (
      `<defs><clipPath id="b-${id}"><path d="${body}"/></clipPath></defs>` +
      `<path d="M86,52 L58,18 C54,14 46,14 44,18 L42,56 Z" fill="${C.sunset}"/>` +
      `<path d="${body}" fill="${C.body}"/>` +
      `<g clip-path="url(#b-${id})"><rect x="0" y="70" width="320" height="12" fill="${C.belly}"/>` +
      `<rect x="0" y="66.5" width="320" height="2.2" fill="${C.sunset}"/></g>` +
      windows(116, 206, 56, 13, 7, 6.5) +
      `<path d="M232,52 L250,52 L258,60 L234,60 Z" fill="${C.window}"/>` +
      `<path d="M78,58 L44,52 L42,60 L82,64 Z" fill="${C.wing}"/>` +
      `<rect x="122" y="40" width="112" height="9" rx="4.5" fill="${C.wing}"/>` +
      `<rect x="198" y="36" width="40" height="15" rx="6" fill="${C.engine}"/>` +
      `<ellipse class="art__prop" cx="243" cy="43.5" rx="2.8" ry="24" fill="${C.wingDark}" opacity=".35"/>` +
      `<path d="M238,40 q8,3.5 0,7 Z" fill="${C.intake}"/>` +
      `<path d="M132,80 L140,102 M226,78 L222,102 M150,80 L162,102 M214,79 L206,102" stroke="${C.gear}" stroke-width="2.2"/>` +
      `<path d="M92,102 L258,102 C274,102 286,99 294,94 C292,106 280,114 262,114 L116,114 C104,114 96,110 92,102 Z" fill="${C.wing}"/>` +
      `<path d="M96,108 L280,108" stroke="${C.wingDark}" stroke-width="2"/>`
    )
  },

  islander: (uid) => {
    const id = `islander-${uid}`
    const body = 'M64,58 L226,52 C244,52 256,58 262,68 C262,76 254,82 242,82 L132,84 C108,84 86,76 64,64 Z'
    return (
      `<defs><clipPath id="b-${id}"><path d="${body}"/></clipPath></defs>` +
      `<path d="M104,58 L80,26 C76,22 68,22 66,26 L62,62 Z" fill="${C.sky}"/>` +
      `<path d="${body}" fill="${C.body}"/>` +
      `<g clip-path="url(#b-${id})"><rect x="0" y="74" width="320" height="12" fill="${C.belly}"/>` +
      `<rect x="0" y="70.5" width="320" height="2.2" fill="${C.sky}"/></g>` +
      windows(130, 204, 60, 15, 8, 7) +
      `<path d="M226,56 L244,56 L252,64 L228,64 Z" fill="${C.window}"/>` +
      `<path d="M96,64 L64,58 L62,66 L100,70 Z" fill="${C.wing}"/>` +
      `<rect x="132" y="44" width="104" height="8.5" rx="4.25" fill="${C.wing}"/>` +
      `<rect x="196" y="40" width="40" height="15" rx="6" fill="${C.engine}"/>` +
      `<ellipse class="art__prop" cx="241" cy="47.5" rx="2.8" ry="22" fill="${C.wingDark}" opacity=".35"/>` +
      `<path d="M236,44 q8,3.5 0,7 Z" fill="${C.intake}"/>` +
      `<path d="M212,55 L208,92 M246,80 L246,94" stroke="${C.gear}" stroke-width="3"/>` +
      `<circle cx="208" cy="96" r="7" fill="${C.gear}"/><circle cx="208" cy="96" r="2.6" fill="${C.belly}"/>` +
      `<circle cx="246" cy="97" r="5.5" fill="${C.gear}"/><circle cx="246" cy="97" r="2" fill="${C.belly}"/>`
    )
  },
}

/** Inner SVG markup for a plane (empty string for an unknown id). */
export function planeArt(id: PlaneId, uid: string): string {
  return ART[id]?.(uid) ?? ''
}
