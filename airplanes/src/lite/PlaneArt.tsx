import type { PlaneId } from '../data/types'
import { PLANE_ART_VIEWBOX, planeArt } from './planeArt'

/** A 2D side-view illustration of a plane (decorative unless a label is given). */
export default function PlaneArt({ id, uid, label, className }: { id: PlaneId; uid: string; label?: string; className?: string }) {
  return (
    <svg
      className={className}
      viewBox={PLANE_ART_VIEWBOX}
      xmlns="http://www.w3.org/2000/svg"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      dangerouslySetInnerHTML={{ __html: planeArt(id, uid) }}
    />
  )
}
