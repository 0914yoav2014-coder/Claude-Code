import { PLANES } from '../data/planes'
import { useApp } from '../state/store'
import PlaneArt from './PlaneArt'

/**
 * Lighter version of the hangar (PRD F7): v1's 2D side-view illustration of the current plane on a
 * lit hangar floor. It rolls in from the side of the switch (0.8 s, ease-out; none under reduced
 * motion). The stats, buttons and swipe are the shared hangar panel's.
 */
export default function HangarLite() {
  const index = useApp((s) => s.hangar.index)
  const dir = useApp((s) => s.hangar.dir)
  const plane = PLANES[index] ?? PLANES[0]
  return (
    <div className="hangar-lite" data-testid="hangar-lite">
      <div className="hangar-lite__light" aria-hidden="true" />
      <div className="hangar-lite__floor" aria-hidden="true" />
      <div className="hangar-lite__plane" key={plane.id} data-dir={dir}>
        <PlaneArt id={plane.id} uid="hangar" label={plane.name} className="hangar-lite__art" />
        <div className="hangar-lite__shadow" aria-hidden="true" />
      </div>
    </div>
  )
}
