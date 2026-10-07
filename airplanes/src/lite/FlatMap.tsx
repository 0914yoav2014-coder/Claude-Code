import { useMemo } from 'react'
import { ROUTES } from '../data/routes'
import { store, useApp } from '../state/store'
import { flatRoutes, landPoints, type FlatRoute } from './geo'

/**
 * Lighter version of the globe (PRD F7): v1's dotted equirectangular map (legacy/globe.js
 * flatMap) with every route as a great-circle line, split where it crosses the date line, and
 * pins for very short routes. Click or tap a route to select it; the route list and the panel
 * carry the same information (and are the keyboard path). Labels show the selected route's ends.
 */
const W = 720
const H = 360
/** Cropped to about 85°N … 60°S: no route goes further, and the map gets taller on phones. */
const VIEW = { y: 10, h: 290 }
const X = (lon: number) => ((lon + 180) / 360) * W
const Y = (lat: number) => ((90 - lat) / 180) * H

let landPath: string | null = null
function getLandPath(): string {
  if (landPath === null) {
    let d = ''
    for (const [lat, lon] of landPoints()) {
      const y = Y(lat)
      if (y < VIEW.y - 4 || y > VIEW.y + VIEW.h + 4) continue
      d += `M${X(lon).toFixed(1)} ${y.toFixed(1)}h0`
    }
    landPath = d
  }
  return landPath
}

function linePath(fr: FlatRoute): string {
  let d = ''
  let prev: number | null = null
  for (const [lat, lon] of fr.flat) {
    d += (prev === null || Math.abs(lon - prev) > 180 ? 'M' : 'L') + X(lon).toFixed(1) + ' ' + Y(lat).toFixed(1)
    prev = lon
  }
  return d
}

function Label({ at, text }: { at: [number, number]; text: string }) {
  const w = text.length * 7.2 + 16
  const x = Math.min(W - w - 4, Math.max(4, X(at[1]) - w / 2))
  const y = Math.max(VIEW.y + 4, Y(at[0]) - 30)
  return (
    <g className="flat-map__label">
      <rect x={x} y={y} width={w} height={20} rx={10} />
      <text x={x + w / 2} y={y + 14} textAnchor="middle">
        {text}
      </text>
    </g>
  )
}

export default function FlatMap() {
  const selected = useApp((s) => s.globe.route)
  const data = useMemo(() => ({ land: getLandPath(), routes: flatRoutes(ROUTES).map((fr) => ({ fr, d: fr.short ? '' : linePath(fr) })) }), [])
  const ordered = [...data.routes.filter((r) => r.fr.route.id !== selected), ...data.routes.filter((r) => r.fr.route.id === selected)]
  const sel = data.routes.find((r) => r.fr.route.id === selected)?.fr

  return (
    <svg
      className="flat-map"
      data-testid="flat-map"
      viewBox={`0 ${VIEW.y} ${W} ${VIEW.h}`}
      role="img"
      aria-label={`World map with ${ROUTES.length} airplane routes; the route list below has the same information.`}
    >
      <defs>
        <radialGradient id="flat-map-sea" cx="50%" cy="40%" r="75%">
          <stop offset="0" stopColor="#123563" />
          <stop offset="1" stopColor="#0A1C36" />
        </radialGradient>
      </defs>
      <rect className="flat-map__sea" x="0" y={VIEW.y} width={W} height={VIEW.h} rx="18" fill="url(#flat-map-sea)" />
      <path className="flat-map__land" d={data.land} />
      {ordered.map(({ fr, d }) => {
        const r = fr.route
        const on = r.id === selected
        const pick = () => store.getState().selectRoute(r.id, 'globe')
        if (fr.short) {
          const cx = X(r.from.at[1])
          const cy = Y(r.from.at[0])
          return (
            <g key={r.id} className={`flat-map__route flat-map__route--pin${on ? ' is-selected' : ''}`} data-route={r.id} onClick={pick}>
              <circle className="flat-map__hit" cx={cx} cy={cy} r="14" />
              <circle className="flat-map__pulse" cx={cx} cy={cy} r="5" />
              <circle className="flat-map__pin" cx={cx} cy={cy} r="4" />
            </g>
          )
        }
        return (
          <g key={r.id} className={`flat-map__route${on ? ' is-selected' : ''}`} data-route={r.id} onClick={pick}>
            <path className="flat-map__hit" d={d} />
            <path className="flat-map__line" d={d} />
            <circle className="flat-map__end" cx={X(r.from.at[1])} cy={Y(r.from.at[0])} r="3" />
            <circle className="flat-map__end" cx={X(r.to.at[1])} cy={Y(r.to.at[0])} r="3" />
          </g>
        )
      })}
      {sel &&
        (sel.short ? (
          <Label at={sel.route.from.at} text={`${sel.route.from.city} → ${sel.route.to.city}`} />
        ) : (
          <>
            <Label at={sel.route.from.at} text={sel.route.from.code} />
            <Label at={sel.route.to.at} text={sel.route.to.code} />
          </>
        ))}
    </svg>
  )
}
