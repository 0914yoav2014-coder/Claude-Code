import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { COPY, fill } from '../../data/copy'
import { PLANES } from '../../data/planes'
import type { Plane } from '../../data/types'
import { MOTION } from '../../lib/tokens'
import { track } from '../../lib/track'
import HangarLite from '../../lite/HangarLite'
import PlaneArt from '../../lite/PlaneArt'
import { scrollToKey } from '../../scroll/api'
import { store, useApp } from '../../state/store'
import CountUp from '../CountUp'
import { decimalsOf, formatNumber } from '../motion'

const SWIPE_MIN = 50

const fmtInt = (v: number) => formatNumber(Math.round(v))
const fmtDec = [0, 1, 2, 3].map((d) => (v: number) => formatNumber(v, d))

/**
 * The hangar (PRD F4). 240svh with a 100svh sticky frame. [data-stage=hangar] receives turntable
 * drags (3D); the glass panel switches planes (buttons, ←/→ anywhere inside #airplanes, a swipe on
 * the panel) and shows the stats, which count up as each plane rolls in. "Take a closer look"
 * opens a modal <dialog> whose [data-stage=closeup] drives the 3D close-up on the same canvas.
 */
export default function HangarSection() {
  const mode = useApp((s) => s.mode)
  const index = useApp((s) => s.hangar.index)
  const dir = useApp((s) => s.hangar.dir)
  const plane = PLANES[index] ?? PLANES[0]
  const dialogRef = useRef<HTMLDialogElement>(null)
  const openerRef = useRef<HTMLElement | null>(null)
  const swipe = useRef<{ x: number; y: number; id: number } | null>(null)
  const stageRef = useCallback((el: HTMLDivElement | null) => store.getState().registerStage('hangar', el), [])
  const closeupRef = useCallback((el: HTMLDivElement | null) => store.getState().registerStage('closeup', el), [])

  // Stats count up on each roll-in: when the panel first comes into view, then on every switch.
  const panelRef = useRef<HTMLDivElement>(null)
  const [run, setRun] = useState<number | null>(null)
  useEffect(() => {
    const el = panelRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((en) => en.isIntersecting)) return
        io.disconnect()
        setRun((r) => r ?? 1)
      },
      { threshold: 0.6 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  const lastIndex = useRef(index)
  useEffect(() => {
    if (index === lastIndex.current) return
    lastIndex.current = index
    setRun((r) => (r ?? 0) + 1)
  }, [index])

  const go = (d: 1 | -1, via: 'next' | 'prev' | 'keys' | 'swipe') => store.getState().setPlane(store.getState().hangar.index + d, via)

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return
    const t = e.target as HTMLElement
    if (t.closest('dialog, input, textarea, select, [contenteditable]')) return
    e.preventDefault()
    go(e.key === 'ArrowRight' ? 1 : -1, 'keys')
  }

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    swipe.current = { x: e.clientX, y: e.clientY, id: e.pointerId }
  }
  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    const s = swipe.current
    swipe.current = null
    if (!s || s.id !== e.pointerId) return
    const dx = e.clientX - s.x
    const dy = e.clientY - s.y
    if (Math.abs(dx) >= SWIPE_MIN && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1, 'swipe')
  }

  const openCloseup = () => {
    const dialog = dialogRef.current
    if (!dialog || dialog.open) return
    openerRef.current = document.activeElement as HTMLElement | null
    dialog.showModal()
    document.documentElement.classList.add('is-closeup')
    store.getState().setCloseup(true)
    track('closeup_open', { plane: plane.id })
  }
  const onDialogClose = () => {
    document.documentElement.classList.remove('is-closeup')
    store.getState().setCloseup(false)
    const opener = openerRef.current
    openerRef.current = null
    if (opener && document.contains(opener)) opener.focus({ preventScroll: true })
  }
  useEffect(() => () => document.documentElement.classList.remove('is-closeup'), [])

  const seeRoutes = () => {
    dialogRef.current?.close()
    const first = plane.routes[0]
    if (first) store.getState().selectRoute(first, 'card')
    scrollToKey('globe', document.getElementById('globe'))
  }

  return (
    <section id="airplanes" className="section section--hangar" data-section="airplanes" aria-labelledby="hangar-title" onKeyDown={onKeyDown}>
      <i className="cam cam--hangar" data-cam="hangar" />
      <i className="cam cam--hangarOut" data-cam="hangarOut" />
      <div className="sticky-frame hangar__frame">
        {mode === 'lite' ? (
          <HangarLite />
        ) : (
          <div ref={stageRef} className="stage-surface stage-surface--hangar" data-stage="hangar" data-testid="hangar-stage" tabIndex={0} aria-label={COPY.hangar.stageLabel} />
        )}

        <header className="section-head hangar__head" data-contrast-check>
          <p className="eyebrow">{COPY.hangar.eyebrow}</p>
          <h2 id="hangar-title">{COPY.hangar.title}</h2>
        </header>

        <div ref={panelRef} className="glass hangar-panel" data-testid="hangar-panel" onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerCancel={() => (swipe.current = null)}>
          <div className="hangar-panel__head" key={plane.id} data-dir={dir}>
            <p className="eyebrow">{plane.nickname}</p>
            <h3 data-testid="plane-name" aria-live="polite">
              {plane.name}
            </h3>
          </div>
          <Stats plane={plane} run={run} />
          <p className="hangar-panel__fact" key={`fact-${plane.id}`} data-dir={dir}>
            {plane.fact}
          </p>
          <div className="hangar-panel__nav">
            <button type="button" className="icon-btn" data-testid="plane-prev" aria-label={COPY.hangar.prev} onClick={() => go(-1, 'prev')}>
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M14.5 5.5 8 12l6.5 6.5" />
              </svg>
            </button>
            <span className="hangar-panel__count" data-testid="plane-count">
              {fill(COPY.hangar.count, { n: index + 1, total: PLANES.length })}
            </span>
            <button type="button" className="icon-btn" data-testid="plane-next" aria-label={COPY.hangar.next} onClick={() => go(1, 'next')}>
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M9.5 5.5 16 12l-6.5 6.5" />
              </svg>
            </button>
            <button type="button" className="btn btn--primary hangar-panel__closeup" data-testid="closeup-open" onClick={openCloseup}>
              {COPY.hangar.closeup}
            </button>
          </div>
        </div>

        <dialog ref={dialogRef} className="closeup" data-testid="closeup" aria-labelledby="closeup-title" onClose={onDialogClose}>
          <div ref={closeupRef} className="closeup__stage" data-stage="closeup" data-lenis-prevent>
            {mode === 'lite' && <PlaneArt id={plane.id} uid="closeup" className="closeup__art" />}
          </div>
          <div className="closeup__bar">
            <div>
              <p className="eyebrow">{plane.nickname}</p>
              <h2 id="closeup-title">{plane.name}</h2>
            </div>
            <button type="button" className="icon-btn closeup__close" data-testid="closeup-close" aria-label={COPY.hangar.closeupClose} onClick={() => dialogRef.current?.close()}>
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </div>
          <div className="closeup__story glass">
            <p>{plane.story}</p>
            <button type="button" className="text-link" onClick={seeRoutes}>
              {COPY.hangar.seeRoute}
            </button>
          </div>
        </dialog>
      </div>
    </section>
  )
}

function Stats({ plane, run }: { plane: Plane; run: number | null }) {
  const ms = MOTION.hangarSwitch
  const len = decimalsOf(plane.shape.lengthM)
  const span = decimalsOf(plane.shape.spanM)
  return (
    <dl className="stats">
      <div>
        <dt>{COPY.hangar.stats.speed}</dt>
        <dd data-testid="stat-speed" data-value={plane.cruiseKmh}>
          <CountUp value={plane.cruiseKmh} format={fmtInt} ms={ms} run={run} waitAtZero />
          <span className="stat__unit"> km/h</span>
        </dd>
      </div>
      <div>
        <dt>{COPY.hangar.stats.passengers}</dt>
        <dd data-testid="stat-passengers" data-value={plane.passengers}>
          <CountUp value={plane.passengers} format={fmtInt} ms={ms} run={run} waitAtZero />
          {plane.passengersNote && <span className="stat__note"> {plane.passengersNote}</span>}
        </dd>
      </div>
      <div>
        <dt>{COPY.hangar.stats.length}</dt>
        <dd data-testid="stat-length" data-value={plane.shape.lengthM}>
          <CountUp value={plane.shape.lengthM} format={fmtDec[len]} ms={ms} run={run} waitAtZero />
          <span className="stat__unit"> m</span>
        </dd>
      </div>
      <div>
        <dt>{COPY.hangar.stats.span}</dt>
        <dd data-testid="stat-span" data-value={plane.shape.spanM}>
          <CountUp value={plane.shape.spanM} format={fmtDec[span]} ms={ms} run={run} waitAtZero />
          <span className="stat__unit"> m</span>
        </dd>
      </div>
    </dl>
  )
}
