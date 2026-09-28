import { useCallback, useEffect, useRef, useState } from 'react'
import type { CSSProperties, KeyboardEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from 'framer-motion'
import type { AnimationPlaybackControls, MotionValue, PanInfo } from 'framer-motion'
import Can from './Can'
import { flavors } from '../data/flavors'
import type { Flavor } from '../data/flavors'
import './FlavorWheel.css'

const COUNT = flavors.length
const STEP = 360 / COUNT
const AUTO_MS = 4000
/** Degrees of ring rotation per pixel dragged */
const DRAG_DEG_PER_PX = 0.35
const SPRING = { type: 'spring', stiffness: 70, damping: 16, mass: 1 } as const

const mod = (n: number, m: number) => ((n % m) + m) % m

function canProps(f: Flavor) {
  const isDiet = f.slug === 'diet-coke'
  return {
    bodyColor: f.colors.body,
    accentColor: f.colors.accent,
    textColor: f.colors.text,
    label: isDiet ? 'Diet Coke' : 'Coca-Cola',
    sublabel: isDiet || f.slug === 'original' ? undefined : f.shortName,
  }
}

type ItemProps = {
  flavor: Flavor
  index: number
  rot: MotionValue<number>
  active: boolean
  onSelect: (index: number) => void
}

/** One can on the ring. It counter-rotates so it always faces the viewer, and dims with depth. */
function WheelItem({ flavor, index, rot, active, onSelect }: ItemProps) {
  const angle = index * STEP
  // 1 = front, 0 = back
  const depth = useTransform(rot, (r) => (Math.cos(((angle + r) * Math.PI) / 180) + 1) / 2)
  const counter = useTransform(rot, (r) => -(angle + r))
  const scale = useTransform(depth, (d) => 0.5 + 0.4 * d * d)
  const opacity = useTransform(depth, (d) => 0.35 + 0.65 * d * d)
  const filter = useTransform(depth, (d) => `brightness(${(0.55 + 0.45 * d).toFixed(3)}) saturate(${(0.6 + 0.4 * d).toFixed(3)})`)

  return (
    <div className="wheel__item" style={{ transform: `rotateY(${angle}deg) translateZ(var(--wheel-r))` }}>
      <motion.button
        type="button"
        tabIndex={-1}
        className={`wheel__can${active ? ' is-active' : ''}`}
        style={{ rotateY: counter, scale, opacity, filter }}
        onClick={() => onSelect(index)}
      >
        <Can {...canProps(flavor)} width="100%" />
      </motion.button>
    </div>
  )
}

export default function FlavorWheel() {
  const reduced = useReducedMotion() ?? false
  const [pos, setPos] = useState(0) // unbounded, so the ring always takes the short way round
  const active = mod(pos, COUNT)
  const flavor = flavors[active]

  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [userPaused, setUserPaused] = useState(false)
  const autoplay = !reduced && !userPaused && !hovered && !focused && !dragging

  const rot = useMotionValue(0)
  const posRef = useRef(0)
  const anim = useRef<AnimationPlaybackControls | null>(null)
  const dragStart = useRef(0)
  const justDragged = useRef(false)

  const goTo = useCallback(
    (next: number) => {
      posRef.current = next
      setPos(next)
      anim.current?.stop()
      if (reduced) rot.set(-next * STEP)
      else anim.current = animate(rot, -next * STEP, SPRING)
    },
    [reduced, rot],
  )

  const step = useCallback((dir: number) => goTo(posRef.current + dir), [goTo])

  /** Rotate to flavor `index` by the shortest route. */
  const select = useCallback(
    (index: number) => {
      if (justDragged.current) return
      let delta = mod(index - posRef.current, COUNT)
      if (delta > COUNT / 2) delta -= COUNT
      goTo(posRef.current + delta)
    },
    [goTo],
  )

  // Auto-advance. `pos` is a dependency so any manual move restarts the countdown.
  useEffect(() => {
    if (!autoplay) return
    const id = window.setTimeout(() => {
      if (!document.hidden) step(1)
    }, AUTO_MS)
    return () => window.clearTimeout(id)
  }, [autoplay, pos, step])

  useEffect(() => () => anim.current?.stop(), [])

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      step(1)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      step(-1)
    }
  }

  const onPanStart = () => {
    anim.current?.stop()
    dragStart.current = rot.get()
    justDragged.current = true
    setDragging(true)
  }
  const onPan = (_: PointerEvent, info: PanInfo) => {
    rot.set(dragStart.current + info.offset.x * DRAG_DEG_PER_PX)
  }
  const onPanEnd = (_: PointerEvent, info: PanInfo) => {
    setDragging(false)
    // Project a little along the fling velocity, then snap to the nearest can.
    const projected = rot.get() + info.velocity.x * DRAG_DEG_PER_PX * 0.2
    goTo(Math.round(-projected / STEP))
    // Swallow the click that follows a drag.
    window.setTimeout(() => {
      justDragged.current = false
    }, 0)
  }

  return (
    <motion.section
      className="wheel section"
      aria-labelledby="wheel-heading"
      initial={false}
      animate={{ backgroundColor: flavor.colors.bg }}
      transition={{ duration: reduced ? 0 : 0.8, ease: 'easeOut' }}
    >
      <div className="container wheel__inner">
        <header className="wheel__header">
          <span className="eyebrow">The flavor wheel</span>
          <h2 id="wheel-heading">Spin the top five</h2>
          <p className="lead">Drag, swipe, or use the arrows to meet each flavor.</p>
        </header>

        <div
          className={`wheel__region${reduced ? ' wheel__region--flat' : ''}`}
          role="region"
          aria-roledescription="carousel"
          aria-label="Top five Coca-Cola flavors"
          tabIndex={0}
          onKeyDown={onKeyDown}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onFocus={() => setFocused(true)}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false)
          }}
        >
          {reduced ? (
            <div className="wheel__flat" aria-hidden="true">
              <Can {...canProps(flavor)} width="100%" className="wheel__flat-can" />
            </div>
          ) : (
            <motion.div
              className="wheel__stage"
              aria-hidden="true"
              onPanStart={onPanStart}
              onPan={onPan}
              onPanEnd={onPanEnd}
            >
              <div className="wheel__glow" style={{ background: flavor.colors.body }} />
              <motion.div className="wheel__ring" style={{ rotateY: rot }}>
                {flavors.map((f, i) => (
                  <WheelItem key={f.slug} flavor={f} index={i} rot={rot} active={i === active} onSelect={select} />
                ))}
              </motion.div>
            </motion.div>
          )}

          <div className="wheel__controls">
            <button type="button" className="wheel__arrow" onClick={() => step(-1)} aria-label="Previous flavor">
              <span aria-hidden="true">←</span>
            </button>
            <div className="wheel__dots">
              {flavors.map((f, i) => (
                <button
                  key={f.slug}
                  type="button"
                  className={`wheel__dot${i === active ? ' is-active' : ''}`}
                  style={{ '--dot': f.colors.body } as CSSProperties}
                  aria-label={`Show ${f.name}`}
                  aria-current={i === active ? 'true' : undefined}
                  onClick={() => select(i)}
                />
              ))}
            </div>
            <button type="button" className="wheel__arrow" onClick={() => step(1)} aria-label="Next flavor">
              <span aria-hidden="true">→</span>
            </button>
            {!reduced && (
              <button
                type="button"
                className="wheel__pause"
                onClick={() => setUserPaused((p) => !p)}
                aria-pressed={userPaused}
                aria-label={userPaused ? 'Resume auto-rotation' : 'Pause auto-rotation'}
              >
                <span aria-hidden="true">{userPaused ? '▶' : '❚❚'}</span>
              </button>
            )}
          </div>

          <div className="wheel__info" aria-live={autoplay ? 'off' : 'polite'} aria-atomic="true">
            <p className="wheel__count">
              {active + 1} / {COUNT}
            </p>
            <motion.div
              key={flavor.slug}
              initial={reduced ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <h3 className="wheel__name">{flavor.name}</h3>
              <p className="wheel__tagline">{flavor.tagline}</p>
              <Link
                to={`/flavors/${flavor.slug}`}
                className="btn wheel__cta"
                style={{ background: flavor.colors.body, color: flavor.colors.text, borderColor: flavor.colors.accent }}
              >
                View flavor<span className="visually-hidden">: {flavor.name}</span> <span aria-hidden="true">→</span>
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.section>
  )
}
