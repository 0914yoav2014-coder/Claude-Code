import { PLANES } from '../data/planes'
import { useApp } from '../state/store'

/**
 * Lighter version of the hangar: 2D illustration of the current plane (Frontend-owned; Lead stub).
 * Frontend ports v1's SVG illustrations from legacy/planes.js (or uses rendered stills).
 */
export default function HangarLite() {
  const index = useApp((s) => s.hangar.index)
  return (
    <div className="hangar-lite" data-testid="hangar-lite">
      <p>{PLANES[index].name}</p>
    </div>
  )
}
