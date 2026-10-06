import { useCallback, useRef } from 'react'
import { COPY, fill } from '../../data/copy'
import { PLANES } from '../../data/planes'
import HangarLite from '../../lite/HangarLite'
import { track } from '../../lib/track'
import { store, useApp } from '../../state/store'

/**
 * The hangar (PRD F4; Frontend-owned; Lead stub). 240svh tall with a 100svh sticky frame.
 * [data-stage=hangar] receives turntable drags; the panel switches planes (buttons, arrow keys,
 * swipe) and shows the stats as text. "Take a closer look" opens a dialog whose
 * [data-stage=closeup] element drives the 3D close-up on the same canvas.
 */
export default function HangarSection() {
  const mode = useApp((s) => s.mode)
  const index = useApp((s) => s.hangar.index)
  const plane = PLANES[index]
  const dialogRef = useRef<HTMLDialogElement>(null)
  const stageRef = useCallback((el: HTMLDivElement | null) => store.getState().registerStage('hangar', el), [])
  const closeupRef = useCallback((el: HTMLDivElement | null) => store.getState().registerStage('closeup', el), [])
  const go = (d: 1 | -1) => store.getState().setPlane(index + d, d === 1 ? 'next' : 'prev')

  const openCloseup = () => {
    dialogRef.current?.showModal()
    store.getState().setCloseup(true)
    track('closeup_open', { plane: plane.id })
  }

  return (
    <section id="airplanes" className="section section--hangar" data-section="airplanes" aria-labelledby="hangar-title">
      <i className="cam" data-cam="hangar" style={{ top: 0 }} />
      <i className="cam" data-cam="hangarOut" style={{ bottom: '100svh' }} />
      <div className="sticky-frame">
        <header className="section-head" data-contrast-check>
          <p className="eyebrow">{COPY.hangar.eyebrow}</p>
          <h2 id="hangar-title">{COPY.hangar.title}</h2>
        </header>

        {mode === 'lite' ? (
          <HangarLite />
        ) : (
          <div ref={stageRef} className="stage-surface" data-stage="hangar" data-testid="hangar-stage" tabIndex={0} aria-label={COPY.hangar.stageLabel} />
        )}

        <div className="glass hangar-panel" data-testid="hangar-panel">
          <p className="eyebrow">{plane.nickname}</p>
          <h3 data-testid="plane-name">{plane.name}</h3>
          <dl className="stats">
            <div>
              <dt>{COPY.hangar.stats.speed}</dt>
              <dd data-testid="stat-speed" data-value={plane.cruiseKmh}>
                {plane.cruiseKmh.toLocaleString('en-US')} km/h
              </dd>
            </div>
            <div>
              <dt>{COPY.hangar.stats.passengers}</dt>
              <dd data-testid="stat-passengers" data-value={plane.passengers}>
                {plane.passengers.toLocaleString('en-US')}
              </dd>
            </div>
            <div>
              <dt>{COPY.hangar.stats.length}</dt>
              <dd data-testid="stat-length" data-value={plane.shape.lengthM}>
                {plane.shape.lengthM} m
              </dd>
            </div>
            <div>
              <dt>{COPY.hangar.stats.span}</dt>
              <dd data-testid="stat-span" data-value={plane.shape.spanM}>
                {plane.shape.spanM} m
              </dd>
            </div>
          </dl>
          <p className="hangar-panel__fact">{plane.fact}</p>
          <div className="hangar-panel__nav">
            <button type="button" data-testid="plane-prev" aria-label={COPY.hangar.prev} onClick={() => go(-1)}>
              ‹
            </button>
            <span data-testid="plane-count">{fill(COPY.hangar.count, { n: index + 1, total: PLANES.length })}</span>
            <button type="button" data-testid="plane-next" aria-label={COPY.hangar.next} onClick={() => go(1)}>
              ›
            </button>
          </div>
          <button type="button" className="btn btn--primary" data-testid="closeup-open" onClick={openCloseup}>
            {COPY.hangar.closeup}
          </button>
        </div>

        <dialog ref={dialogRef} className="closeup" data-testid="closeup" aria-label={plane.name} onClose={() => store.getState().setCloseup(false)}>
          <div ref={closeupRef} className="stage-surface stage-surface--closeup" data-stage="closeup" data-lenis-prevent />
          <button type="button" className="closeup__close" data-testid="closeup-close" aria-label={COPY.hangar.closeupClose} onClick={() => dialogRef.current?.close()}>
            ×
          </button>
        </dialog>
      </div>
    </section>
  )
}
