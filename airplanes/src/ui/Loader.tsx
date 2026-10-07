import { useEffect, useRef } from 'react'
import { COPY, fill } from '../data/copy'
import { addTick } from '../lib/loop'
import { KEYS, storage } from '../lib/storage'
import { MOTION } from '../lib/tokens'
import { store } from '../state/store'
import { whenBooted } from './boot-ready'

/**
 * Loading screen (PRD F1). A small jet taxis along the runway line that is the progress bar and
 * lifts off at 100 %. Shown % = max(real asset progress, a time floor); the floor speeds up after
 * 2.5 s so the jet always lifts off before 3 s. Skipped on repeat visits (aatw:visited). The
 * prerender paints it at 0 %; html[data-loader] hides it when skipped or done. Progress is written
 * straight to the DOM from the shared loop (no React re-render per frame).
 */

/** Time floor (0..1) at ms since navigation start: a steady taxi, then a sprint to 100 %. */
function loaderFloor(t: number): number {
  const TAXI_END = 2500
  const FULL = MOTION.loaderMax - 300 // 2.7 s: 100 %, lift-off; the page is revealed by 3 s
  if (t <= TAXI_END) return 0.86 * Math.max(0, t) / TAXI_END
  if (t >= FULL) return 1
  return 0.86 + 0.14 * ((t - TAXI_END) / (FULL - TAXI_END))
}

const LIFTOFF_REVEAL = 300

export default function Loader() {
  const rootRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLSpanElement>(null)

  useEffect(
    () =>
      whenBooted(() => {
        const root = rootRef.current
        const text = textRef.current
        const s0 = store.getState()
        if (s0.boot.loader === 'skip' || !root || !text) {
          store.getState().setBoot({ phase: 'done', introAt: performance.now() })
          return () => {}
        }
        let real = 0
        let lastPct = -1
        let liftAt = 0
        const finish = () => {
          off()
          storage.local.set(KEYS.visited, '1')
          store.getState().setBoot({ phase: 'done', introAt: performance.now() })
        }
        const off = addTick('ui', (now, dt) => {
          const s = store.getState()
          if (liftAt) {
            if (now - liftAt >= LIFTOFF_REVEAL) finish()
            return
          }
          // Real progress eases toward the asset count (the lighter version has nothing heavy to wait for).
          const target = s.mode === 'lite' ? 1 : s.boot.assets
          if (target > real) real = Math.min(target, real + Math.max(0.0008 * dt, (target - real) * (1 - Math.exp(-dt / 140))))
          const shown = Math.min(1, Math.max(real, loaderFloor(now)))
          const pct = shown >= 1 ? 100 : Math.min(99, Math.round(shown * 100))
          root.style.setProperty('--p', shown.toFixed(4))
          if (pct !== lastPct) {
            lastPct = pct
            text.textContent = fill(COPY.loader.progress, { n: pct })
            root.setAttribute('aria-valuenow', String(pct))
          }
          if (shown >= 1) {
            if (s.motion.reduced) return finish()
            liftAt = now
            root.dataset.phase = 'liftoff'
            store.getState().setBoot({ phase: 'liftoff' })
          }
        })
        return off
      }),
    [],
  )

  return (
    <div
      ref={rootRef}
      id="loader"
      className="loader"
      data-testid="loader"
      data-phase="loading"
      role="progressbar"
      aria-label="Loading"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={0}
    >
      <div className="loader__inner">
        <p className="loader__text">
          <span ref={textRef}>{fill(COPY.loader.progress, { n: 0 })}</span>
        </p>
        <div className="loader__runway" aria-hidden="true">
          <div className="loader__line">
            <div className="loader__fill" />
          </div>
          <ol className="loader__lights">
            {Array.from({ length: 11 }, (_, i) => (
              <li key={i} style={{ ['--at' as string]: i / 10 }} />
            ))}
          </ol>
          <div className="loader__jet-track">
            <svg className="loader__jet" viewBox="0 0 64 26" focusable="false">
              <path className="jet__fin" d="M7.5 12 L4 2.5 H9.5 L18 11.2 Z" />
              <path className="jet__body" d="M4 13.2 C4 11.4 5.4 10.2 7.6 10.2 H50 C55 10.2 59.2 11.6 61.6 13.6 C59.2 15.6 55 16.8 50 16.8 H8.4 C5.6 16.8 4 15.3 4 13.2 Z" />
              <path className="jet__wing" d="M25 14.2 H41 L31.5 21 H25.5 Z" />
              <rect className="jet__engine" x="31" y="16.4" width="9" height="3.2" rx="1.6" />
              <path className="jet__cockpit" d="M53.4 11.6 L57.6 12.5 L58.8 13.4 H54.4 Z" />
              <g className="jet__windows">
                {Array.from({ length: 11 }, (_, i) => (
                  <circle key={i} cx={16 + i * 3.2} cy={12.9} r={0.75} />
                ))}
              </g>
              <g className="jet__gear">
                <path d="M17 16.8 V20.6 M50 16.8 V20.4" />
                <circle cx="17" cy="21.6" r="1.5" />
                <circle cx="50" cy="21.4" r="1.3" />
              </g>
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}
