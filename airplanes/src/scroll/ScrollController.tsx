import { useEffect } from 'react'
import { addTick } from '../lib/loop'
import { frame } from '../state/frame'
import { CAM_KEYS, store, type CamKey, type Markers, type SectionId } from '../state/store'
import { holdAt } from '../state/timeline'

/**
 * Scroll controller (Frontend-owned; Lead stub using native scroll). Frontend replaces this with
 * Lenis (autoRaf off, driven from the loop's 'scroll' phase). Responsibilities that must stay:
 *  - write frame.y / vy / dir / vw / vh / px / py every tick
 *  - measure [data-cam] markers (document-y of each) → store.setMarkers, on resize and fonts.ready
 *  - store.setSection(section under the viewport centre, holdAt(y))
 */
let sections: { id: SectionId; top: number; bottom: number }[] = []

function measure() {
  frame.vw = window.innerWidth
  frame.vh = window.innerHeight
  const y = window.scrollY
  const m: Partial<Markers> = {}
  document.querySelectorAll<HTMLElement>('[data-cam]').forEach((el) => {
    m[el.dataset.cam as CamKey] = el.getBoundingClientRect().top + y
  })
  if (CAM_KEYS.every((k) => typeof m[k] === 'number')) store.getState().setMarkers(m as Markers)
  sections = [...document.querySelectorAll<HTMLElement>('[data-section]')].map((el) => {
    const r = el.getBoundingClientRect()
    return { id: el.dataset.section as SectionId, top: r.top + y, bottom: r.bottom + y }
  })
}

export default function ScrollController() {
  useEffect(() => {
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(document.body)
    document.fonts?.ready.then(measure)

    const offScroll = addTick('scroll', () => {
      const y = window.scrollY
      frame.vy = y - frame.y
      frame.dir = y > frame.y ? 1 : y < frame.y ? -1 : frame.dir
      frame.y = y
    })
    const offUi = addTick('ui', () => {
      const m = store.getState().markers
      if (!m) return
      const mid = frame.y + frame.vh / 2
      const current = sections.find((s) => mid >= s.top && mid < s.bottom)
      store.getState().setSection(current?.id ?? store.getState().section, holdAt(frame.y, m))
    })
    const onPointer = (e: PointerEvent) => {
      frame.px = (e.clientX / window.innerWidth) * 2 - 1
      frame.py = (e.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener('pointermove', onPointer, { passive: true })
    return () => {
      ro.disconnect()
      offScroll()
      offUi()
      window.removeEventListener('pointermove', onPointer)
    }
  }, [])
  return null
}
