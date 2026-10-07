import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react'
import { COPY, fill } from '../../data/copy'
import { PLANE_BY_ID, PLANES } from '../../data/planes'
import { ROUTE_BY_ID, ROUTES } from '../../data/routes'
import { SITE } from '../../data/site'
import type { Route } from '../../data/types'
import { clamp } from '../../lib/ease'
import FlatMap from '../../lite/FlatMap'
import PlaneArt from '../../lite/PlaneArt'
import { scrollToKey } from '../../scroll/api'
import { store, useApp } from '../../state/store'

const ZOOM_STEP = 0.25
/** The route list fades in after the paths have drawn; this is the longest it waits. */
const LIST_FALLBACK_MS = 1800

/**
 * Globe window (PRD F3). 220svh tall with a 100svh sticky frame. [data-stage=globe] receives
 * drags, pinches and keys for the 3D globe (live only inside the window); the route list and the
 * glass route panel carry the same information as text and drive the globe too. The lighter
 * version swaps only the visual slot for the flat map.
 */
export default function GlobeSection() {
  const mode = useApp((s) => s.mode)
  const route = useApp((s) => s.globe.route)
  const zoom = useApp((s) => s.globe.zoom)
  const drawn = useApp((s) => s.globe.drawn)
  const inWindow = useApp((s) => s.hold === 'globe')
  const reduced = useApp((s) => s.motion.reduced)
  const [listShown, setListShown] = useState(false)
  const defaultDone = useRef(false)
  const stageRef = useCallback((el: HTMLDivElement | null) => store.getState().registerStage('globe', el), [])
  const selected = route ? ROUTE_BY_ID[route] : null

  // The default route is picked when the globe first appears (not a visitor's pick: via null, no event).
  useEffect(() => {
    if (!inWindow || defaultDone.current) return
    defaultDone.current = true
    const s = store.getState()
    if (!s.globe.route && ROUTE_BY_ID[SITE.defaultRoute]) store.setState({ globe: { ...s.globe, route: SITE.defaultRoute, via: null } })
  }, [inWindow])

  // Reveal the list once the 3D paths have drawn (at once in the lighter version / reduced motion).
  const listReady = listShown || drawn || mode === 'lite' || reduced
  useEffect(() => {
    if (listReady || !inWindow) return
    const t = window.setTimeout(() => setListShown(true), LIST_FALLBACK_MS)
    return () => window.clearTimeout(t)
  }, [listReady, inWindow])

  const zoomBy = (d: number) => store.getState().setGlobe({ zoom: clamp(store.getState().globe.zoom + d, 0, 1) })

  return (
    <section id="globe" className="section section--globe" data-section="globe" aria-labelledby="globe-title">
      <i className="cam cam--globe" data-cam="globe" />
      <i className="cam cam--globeOut" data-cam="globeOut" />
      <div className="sticky-frame globe__frame">
        {mode === 'lite' ? (
          <div className="globe__map">
            <FlatMap />
          </div>
        ) : (
          <div ref={stageRef} className="stage-surface stage-surface--globe" data-stage="globe" data-testid="globe-stage" tabIndex={0} aria-label={COPY.globe.stageLabel} />
        )}

        <header className="section-head globe__head" data-contrast-check>
          <p className="eyebrow">{COPY.globe.eyebrow}</p>
          <h2 id="globe-title">{COPY.globe.title}</h2>
          <p className="globe__hint" data-testid="globe-hint">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V11m0-1.5a1.5 1.5 0 0 1 3 0V11m0-.5a1.5 1.5 0 0 1 3 0v4.5a6 6 0 0 1-6 6h-.6a6 6 0 0 1-4.8-2.4L4.4 15a1.5 1.5 0 0 1 2.3-1.9L9 15.5" />
            </svg>
            {COPY.globe.hint}
          </p>
        </header>

        {mode !== 'lite' && (
          <div className="globe__zoom" role="group" aria-label={`${COPY.globe.zoomIn} / ${COPY.globe.zoomOut}`}>
            <button type="button" className="icon-btn" data-testid="zoom-in" aria-label={COPY.globe.zoomIn} aria-disabled={zoom >= 1} onClick={() => zoomBy(ZOOM_STEP)}>
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
            <button type="button" className="icon-btn" data-testid="zoom-out" aria-label={COPY.globe.zoomOut} aria-disabled={zoom <= 0} onClick={() => zoomBy(-ZOOM_STEP)}>
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M5 12h14" />
              </svg>
            </button>
          </div>
        )}

        {selected && <RoutePanel key="panel" route={selected} />}

        <div className="route-rail" data-shown={listReady ? 'true' : 'false'}>
          <h3 className="route-rail__title">{COPY.globe.listTitle}</h3>
          <ul className="route-list" data-testid="route-list">
            {ROUTES.map((r, i) => (
              <li key={r.id} style={{ ['--i' as string]: i }}>
                <button type="button" className="route-chip" data-route={r.id} aria-pressed={route === r.id} onClick={() => store.getState().selectRoute(r.id, 'list')}>
                  <span className="route-chip__cities">
                    {r.from.city} <span aria-hidden="true">→</span>
                    <span className="visually-hidden"> to </span> {r.to.city}
                  </span>
                  <span className="route-chip__plane">{PLANE_BY_ID[r.plane].shortName}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

function RoutePanel({ route }: { route: Route }) {
  const plane = PLANE_BY_ID[route.plane]
  const meet = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    const index = PLANES.findIndex((p) => p.id === plane.id)
    if (index >= 0) store.getState().setPlane(index, 'route')
    scrollToKey('hangar', document.getElementById('airplanes'))
  }
  return (
    <aside className="glass route-panel" data-testid="route-panel" data-route={route.id} aria-labelledby="route-panel-title">
      <button type="button" className="icon-btn icon-btn--quiet route-panel__close" data-testid="route-panel-close" aria-label={COPY.globe.panel.close} onClick={() => store.getState().selectRoute(null, 'list')}>
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      </button>
      <div className="route-panel__body" key={route.id} aria-live="polite">
        <div className="route-panel__plane">
          <PlaneArt id={plane.id} uid={`panel-${route.id}`} className="route-panel__art" />
          <p className="eyebrow">{plane.name}</p>
        </div>
        <h3 id="route-panel-title" className="route-panel__title">
          <span>
            {route.from.city} <small>{route.from.code}</small>
          </span>
          <span className="route-panel__arrow" aria-hidden="true">
            →
          </span>
          <span className="visually-hidden"> to </span>
          <span>
            {route.to.city} <small>{route.to.code}</small>
          </span>
        </h3>
        <dl className="route-panel__facts">
          <div>
            <dt>{COPY.globe.panel.distance}</dt>
            <dd>{route.distanceLabel}</dd>
          </div>
          <div>
            <dt>{COPY.globe.panel.time}</dt>
            <dd>{route.durationLabel}</dd>
          </div>
          <div>
            <dt>{COPY.globe.panel.airline}</dt>
            <dd>
              {route.airline}
              {route.flight ? ` · ${route.flight}` : ''}
            </dd>
          </div>
        </dl>
        <p className="route-panel__note">
          {route.historic && <span className="badge">{COPY.globe.panel.historic}</span>} {route.note}
        </p>
        <a className="btn btn--ghost btn--sm route-panel__meet" href="#airplanes" onClick={meet}>
          {fill(COPY.globe.panel.meet, { plane: plane.shortName })}
          <svg className="btn__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M5 12h13m-5-5.5 5.5 5.5-5.5 5.5" />
          </svg>
        </a>
      </div>
    </aside>
  )
}
