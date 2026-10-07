import { useEffect, useRef } from 'react'
import { COPY } from '../../data/copy'
import { clamp01 } from '../../state/timeline'
import { addTick } from '../../lib/loop'
import { frame } from '../../state/frame'
import { store } from '../../state/store'
import { whenBooted } from '../boot-ready'

/**
 * Climb to space (PRD step 4). 200svh with a 100svh sticky frame holding one line, scrubbed by
 * scroll: its words light up as the frame arrives and the line fades as the Earth comes into view.
 * Markers: clouds 80svh down, earth 40svh above the end. Compact layout / reduced motion: static.
 */
export default function Climb() {
  const sectionRef = useRef<HTMLElement>(null)
  const lineRef = useRef<HTMLParagraphElement>(null)
  const words = COPY.climb.line.split(' ')

  useEffect(
    () =>
      whenBooted(() => {
        const section = sectionRef.current
        const line = lineRef.current
        if (!section || !line) return () => {}
        let lastP = -1
        let lastQ = -1
        const off = addTick('ui', () => {
          const s = store.getState()
          const scrub = s.layout === 'cinematic' && !s.motion.reduced
          let p = 1
          let q = 0
          if (scrub) {
            const vh = frame.vh || window.innerHeight
            // u: 0 when the section's top meets the viewport top, 1 one screen later (frame pinned).
            const u = -section.getBoundingClientRect().top / vh
            if (u < -1.3 || u > 2.3) return
            p = clamp01((u + 0.45) / 0.8)
            q = clamp01((u - 0.72) / 0.45)
          }
          if (Math.abs(p - lastP) > 0.002) {
            lastP = p
            line.style.setProperty('--p', p.toFixed(3))
          }
          if (Math.abs(q - lastQ) > 0.002) {
            lastQ = q
            line.style.setProperty('--q', q.toFixed(3))
          }
        })
        return off
      }),
    [],
  )

  return (
    <section ref={sectionRef} id="climb" className="section section--climb" data-section="climb" aria-label="Climb to space">
      <i className="cam cam--clouds" data-cam="clouds" />
      <i className="cam cam--earth" data-cam="earth" />
      <div className="sticky-frame climb__frame">
        <p ref={lineRef} className="climb__line" data-testid="climb-line" data-contrast-check style={{ ['--n' as string]: words.length }}>
          {words.map((w, i) => (
            <span key={i}>
              {i > 0 && ' '}
              <span className="cw" style={{ ['--i' as string]: i }}>
                {w}
              </span>
            </span>
          ))}
        </p>
      </div>
    </section>
  )
}
