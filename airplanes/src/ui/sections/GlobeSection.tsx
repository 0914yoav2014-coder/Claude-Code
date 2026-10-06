import { useCallback } from 'react'
import { COPY, fill } from '../../data/copy'
import { PLANE_BY_ID } from '../../data/planes'
import { ROUTE_BY_ID, ROUTES } from '../../data/routes'
import { clamp } from '../../lib/ease'
import FlatMap from '../../lite/FlatMap'
import { store, useApp } from '../../state/store'

/**
 * Globe window (PRD F3; Frontend-owned; Lead stub). 220svh tall with a 100svh sticky frame.
 * The [data-stage=globe] element receives drags/pinches/keys for the 3D globe; the route list and
 * panel carry the same information as text (and drive the globe too).
 */
export default function GlobeSection() {
  const mode = useApp((s) => s.mode)
  const route = useApp((s) => s.globe.route)
  const zoom = useApp((s) => s.globe.zoom)
  const stageRef = useCallback((el: HTMLDivElement | null) => store.getState().registerStage('globe', el), [])
  const selected = route ? ROUTE_BY_ID[route] : null
  const plane = selected ? PLANE_BY_ID[selected.plane] : null

  return (
    <section id="globe" className="section section--globe" data-section="globe" aria-labelledby="globe-title">
      <i className="cam" data-cam="globe" style={{ top: 0 }} />
      <i className="cam" data-cam="globeOut" style={{ bottom: '100svh' }} />
      <div className="sticky-frame">
        <header className="section-head" data-contrast-check>
          <p className="eyebrow">{COPY.globe.eyebrow}</p>
          <h2 id="globe-title">{COPY.globe.title}</h2>
          <p data-testid="globe-hint">{COPY.globe.hint}</p>
        </header>

        {mode === 'lite' ? (
          <FlatMap />
        ) : (
          <div ref={stageRef} className="stage-surface" data-stage="globe" data-testid="globe-stage" tabIndex={0} aria-label={COPY.globe.stageLabel} />
        )}

        <div className="globe__zoom">
          <button type="button" data-testid="zoom-in" aria-label={COPY.globe.zoomIn} onClick={() => store.getState().setGlobe({ zoom: clamp(zoom + 0.25, 0, 1) })}>
            +
          </button>
          <button type="button" data-testid="zoom-out" aria-label={COPY.globe.zoomOut} onClick={() => store.getState().setGlobe({ zoom: clamp(zoom - 0.25, 0, 1) })}>
            −
          </button>
        </div>

        {selected && plane && (
          <aside className="glass route-panel" data-testid="route-panel" data-route={selected.id} aria-live="polite">
            <button type="button" className="route-panel__close" data-testid="route-panel-close" aria-label={COPY.globe.panel.close} onClick={() => store.getState().selectRoute(null, 'list')}>
              ×
            </button>
            <p className="eyebrow">{plane.name}</p>
            <h3>
              {selected.from.city} → {selected.to.city}
            </h3>
            <dl>
              <div>
                <dt>{COPY.globe.panel.distance}</dt>
                <dd>{selected.distanceLabel}</dd>
              </div>
              <div>
                <dt>{COPY.globe.panel.time}</dt>
                <dd>{selected.durationLabel}</dd>
              </div>
              <div>
                <dt>{COPY.globe.panel.airline}</dt>
                <dd>{selected.airline}</dd>
              </div>
            </dl>
            <p>{selected.note}</p>
            <a href="#airplanes" className="btn btn--ghost">
              {fill(COPY.globe.panel.meet, { plane: plane.shortName })}
            </a>
          </aside>
        )}

        <div className="route-list-wrap">
          <h3 className="route-list__title">{COPY.globe.listTitle}</h3>
          <ul className="route-list" data-testid="route-list">
            {ROUTES.map((r) => (
              <li key={r.id}>
                <button type="button" data-route={r.id} aria-pressed={route === r.id} onClick={() => store.getState().selectRoute(r.id, 'list')}>
                  <strong>
                    {r.from.city} → {r.to.city}
                  </strong>
                  <span>{PLANE_BY_ID[r.plane].name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
