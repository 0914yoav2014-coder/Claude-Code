import { ROUTES } from '../data/routes'
import { store, useApp } from '../state/store'

/**
 * Lighter version of the globe: a flat map with the same 12 routes (Frontend-owned; Lead stub).
 * Frontend ports v1's dotted equirectangular map from legacy/globe.js (flatMap) and legacy/land.js.
 */
export default function FlatMap() {
  const route = useApp((s) => s.globe.route)
  const X = (lon: number) => ((lon + 180) / 360) * 720
  const Y = (lat: number) => ((90 - lat) / 180) * 360
  return (
    <svg className="flat-map" data-testid="flat-map" viewBox="0 0 720 360" role="img" aria-label="World map with the twelve routes; the route list has the same information.">
      <rect width="720" height="360" rx="16" fill="#0D2547" />
      {ROUTES.map((r) => (
        <g key={r.id} data-route={r.id} className={route === r.id ? 'is-selected' : undefined} onClick={() => store.getState().selectRoute(r.id, 'globe')}>
          <line x1={X(r.from.at[1])} y1={Y(r.from.at[0])} x2={X(r.to.at[1])} y2={Y(r.to.at[0])} stroke={route === r.id ? '#FF8A3D' : '#A9D3FF'} strokeWidth="2" />
          <circle cx={X(r.from.at[1])} cy={Y(r.from.at[0])} r="4" fill="#F5F8FC" />
        </g>
      ))}
    </svg>
  )
}
