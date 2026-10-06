import { useEffect, useState } from 'react'
import { COPY, fill } from '../data/copy'
import { KEYS, storage } from '../lib/storage'
import { store, useApp } from '../state/store'

/**
 * Loading screen (PRD F1; Frontend-owned; Lead stub). A small jet taxis along the runway line
 * that is the progress bar and lifts off at 100 %. 3 s at most; skipped on repeat visits.
 * Shown percentage = max(real asset progress, time floor). Painted by the prerender at first paint;
 * html[data-loader] hides it when skipped or done.
 */
export default function Loader() {
  const assets = useApp((s) => s.boot.assets)
  const loader = useApp((s) => s.boot.loader)
  const [pct, setPct] = useState(0)

  useEffect(() => {
    if (loader === 'skip') {
      store.getState().setBoot({ phase: 'done', introAt: performance.now() })
      return
    }
    const t0 = performance.now()
    let raf = 0
    const step = () => {
      const t = performance.now() - t0
      const floor = Math.min(1, t / 3000)
      const shown = Math.max(store.getState().boot.assets, floor)
      setPct(Math.round(shown * 100))
      if (shown >= 1 || t >= 3000) {
        store.getState().setBoot({ phase: 'done', introAt: performance.now() })
        storage.local.set(KEYS.visited, '1')
        return
      }
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [loader])

  return (
    <div id="loader" className="loader" data-testid="loader" role="progressbar" aria-label="Loading" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.max(pct, Math.round(assets * 100))}>
      <p className="loader__text">{fill(COPY.loader.progress, { n: pct })}</p>
      <div className="loader__runway" aria-hidden="true">
        <div className="loader__bar" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
