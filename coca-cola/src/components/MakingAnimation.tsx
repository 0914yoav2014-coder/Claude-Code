import { useEffect, useRef, useState } from 'react'
import { motion, useInView, useReducedMotion, type Transition } from 'framer-motion'
import Can from './Can'
import './MakingAnimation.css'

export type MakingAnimationProps = {
  /** Smaller version for the home-page teaser */
  compact?: boolean
}

type Step = { short: string; title: string; text: string }

const STEPS: Step[] = [
  { short: 'Water', title: 'Filtered water', text: 'Local water is treated and filtered so every batch starts from the same clean base.' },
  { short: 'Syrup', title: 'Add the syrup', text: 'Dark cola concentrate and sweetener are blended into the water, turning it cola brown.' },
  { short: 'Fizz', title: 'Carbonation', text: 'Chilled cola takes in CO₂ under pressure, which becomes the bubbles you taste.' },
  { short: 'Can', title: 'Empty can arrives', text: 'A clean, empty aluminum can rides the conveyor to the filler.' },
  { short: 'Fill', title: 'Fill', text: 'A filling valve drops onto the can and fills it with cold cola in a fraction of a second.' },
  { short: 'Seal', title: 'Seal & finish', text: 'The lid is seamed on tight, and the finished can is ready to be coded and packed.' },
]

const STEP_MS = 2000
const COLA = '#3b1a0e'
const WATER = '#bfe3f2'
const RED = '#f40009'
const STEEL = '#c9ccd1'
const STEEL_DARK = '#8b9097'
const INK = '#4a4f56'

const BUBBLES = [
  { cx: 212, delay: 0, y: -30 },
  { cx: 232, delay: 0.5, y: -70 },
  { cx: 250, delay: 0.2, y: -15 },
  { cx: 268, delay: 0.8, y: -90 },
  { cx: 284, delay: 0.35, y: -50 },
  { cx: 298, delay: 1.0, y: -80 },
  { cx: 222, delay: 1.2, y: -100 },
]

const SPARKLES = [
  { x: 506, y: 206, s: 1 },
  { x: 596, y: 222, s: 0.8 },
  { x: 500, y: 268, s: 0.7 },
  { x: 602, y: 280, s: 1.1 },
]

export default function MakingAnimation({ compact = false }: MakingAnimationProps) {
  const reduced = useReducedMotion() ?? false
  const rootRef = useRef<HTMLDivElement>(null)
  const inView = useInView(rootRef, { amount: 0.3 })
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(true)

  const autoplay = playing && !reduced
  const running = autoplay && inView

  // Step timer: advance every STEP_MS while playing and visible. Re-armed on every step change,
  // so jumping to a step restarts its full duration.
  useEffect(() => {
    if (!running) return
    const id = window.setTimeout(() => setStep((s) => (s + 1) % STEPS.length), STEP_MS)
    return () => window.clearTimeout(id)
  }, [running, step])

  // Instant transitions when the user prefers reduced motion.
  const t = (tr: Transition): Transition => (reduced ? { duration: 0 } : tr)
  const loop = (tr: Transition): Transition => ({ ...tr, repeat: Infinity })

  const current = STEPS[step]
  const canHere = step >= 3

  return (
    <div
      ref={rootRef}
      className={compact ? 'making making--compact' : 'making'}
    >
      <div className="making__stage">
        <svg
          className="making__svg"
          viewBox="0 0 800 360"
          role="img"
          aria-label="Illustrated factory line: water is filtered, cola syrup is mixed in, the cola is carbonated, and an empty can is filled and sealed into a finished can of Coca-Cola."
        >
          <defs>
            <linearGradient id="mk-metal" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" stopColor="#8b9097" />
              <stop offset="0.3" stopColor="#f1f2f4" />
              <stop offset="0.6" stopColor="#bcc1c7" />
              <stop offset="1" stopColor="#7d838b" />
            </linearGradient>
          </defs>

          {/* floor */}
          <rect x="0" y="336" width="800" height="24" fill="#efe6da" />

          {/* ---------- 1. water: tap, filter, tank ---------- */}
          <g className={step === 0 ? 'making__zone is-active' : 'making__zone'}>
            <rect x="0" y="34" width="92" height="12" rx="3" fill={STEEL_DARK} />
            <rect x="74" y="40" width="12" height="22" rx="3" fill={STEEL_DARK} />
            {step === 0 &&
              (running ? (
                [0, 0.33, 0.66].map((d) => (
                  <motion.circle
                    key={d}
                    cx="80"
                    cy="66"
                    r="3.5"
                    fill="#6fbfe0"
                    initial={{ y: 0, opacity: 0 }}
                    animate={{ y: [0, 30], opacity: [1, 0.2] }}
                    transition={loop({ duration: 1, delay: d, ease: 'easeIn' })}
                  />
                ))
              ) : (
                <rect x="78" y="62" width="4" height="36" fill="#6fbfe0" />
              ))}
            {/* filter cartridge */}
            <rect x="54" y="98" width="52" height="32" rx="6" fill="#fff" stroke={STEEL_DARK} strokeWidth="2" />
            <path d="M60 106 H100 M60 114 H100 M60 122 H100" stroke="#9fd3ea" strokeWidth="3" />
            <motion.rect
              x="77"
              y="130"
              width="6"
              height="44"
              fill="#6fbfe0"
              style={{ originY: 0 }}
              initial={false}
              animate={{ scaleY: step === 0 ? 1 : 0, opacity: step === 0 ? 1 : 0 }}
              transition={t({ duration: 0.4 })}
            />
            {/* tank */}
            <rect x="30" y="150" width="100" height="150" rx="10" fill="#fff" stroke={STEEL_DARK} strokeWidth="3" />
            <motion.rect
              x="36"
              y="156"
              width="88"
              height="138"
              rx="6"
              fill={WATER}
              style={{ originY: 1 }}
              initial={false}
              animate={{ scaleY: step === 0 ? [0.15, 0.8] : 0.8 }}
              transition={t({ duration: 1.6, ease: 'easeOut' })}
            />
            <text x="80" y="322" className="making__label">WATER</text>
          </g>

          {/* pipe water → mixer */}
          <rect x="130" y="270" width="60" height="12" fill={STEEL} />
          <motion.rect
            x="130"
            y="273"
            width="60"
            height="6"
            initial={false}
            animate={{ fill: step <= 1 ? '#6fbfe0' : STEEL }}
            transition={t({ duration: 0.4 })}
          />

          {/* ---------- 2 & 3. syrup hopper, mixing tank, CO2 ---------- */}
          <g className={step === 1 ? 'making__zone is-active' : 'making__zone'}>
            <path d="M222 34 H288 L270 84 H240 Z" fill={COLA} />
            <rect x="248" y="84" width="14" height="12" fill={STEEL_DARK} />
            <text x="255" y="24" className="making__label">SYRUP</text>
            <motion.rect
              x="251"
              y="96"
              width="8"
              height="96"
              fill={COLA}
              style={{ originY: 0 }}
              initial={false}
              animate={{ scaleY: step === 1 ? 1 : 0, opacity: step === 1 ? 1 : 0 }}
              transition={t({ duration: 0.5, ease: 'easeOut' })}
            />
          </g>

          {/* chilled halo while carbonating */}
          <motion.rect
            x="182"
            y="142"
            width="136"
            height="166"
            rx="18"
            fill="#9fd3ea"
            initial={false}
            animate={{ opacity: step === 2 ? 1 : 0 }}
            transition={t({ duration: 0.3 })}
          />
          <motion.text
            x="234"
            y="136"
            className="making__label making__label--cold"
            initial={false}
            animate={{ opacity: step === 2 ? 1 : 0 }}
            transition={t({ duration: 0.3 })}
          >
            CHILLED
          </motion.text>
          <rect x="190" y="150" width="120" height="150" rx="12" fill="#fff" stroke={STEEL_DARK} strokeWidth="3" />
          <motion.rect
            x="196"
            y="156"
            width="108"
            height="138"
            rx="8"
            style={{ originY: 1 }}
            initial={false}
            animate={{ scaleY: step === 0 ? 0.55 : 0.85, fill: step === 0 ? WATER : COLA }}
            transition={t({ duration: 1.4, ease: 'easeInOut' })}
          />
          {step === 2 &&
            BUBBLES.map((b, i) =>
              running ? (
                <motion.circle
                  key={i}
                  cx={b.cx}
                  cy="284"
                  r={i % 2 ? 3 : 4.5}
                  fill="none"
                  stroke="#fff"
                  strokeWidth="2"
                  initial={{ y: 0, opacity: 0 }}
                  animate={{ y: [0, -96], opacity: [0, 1, 0] }}
                  transition={loop({ duration: 1.3, delay: b.delay, ease: 'easeOut' })}
                />
              ) : (
                <circle key={i} cx={b.cx} cy={284 + b.y} r={i % 2 ? 3 : 4.5} fill="none" stroke="#fff" strokeWidth="2" />
              ),
            )}
          <text x="250" y="322" className={step === 1 ? 'making__label is-active' : 'making__label'}>MIXER</text>

          <g className={step === 2 ? 'making__zone is-active' : 'making__zone'}>
            <rect x="310" y="264" width="24" height="10" fill={STEEL} />
            <rect x="334" y="186" width="38" height="114" rx="16" fill="#9aa7a0" />
            <rect x="344" y="176" width="18" height="14" rx="3" fill={STEEL_DARK} />
            <text x="353" y="250" className="making__label making__label--light">CO₂</text>
          </g>

          {/* pipe mixer → filler */}
          <path d="M290 150 V112 H550 V120" fill="none" stroke={STEEL} strokeWidth="12" strokeLinejoin="round" />

          {/* ---------- 4. conveyor ---------- */}
          <g>
            <rect x="350" y="300" width="440" height="18" rx="9" fill={INK} />
            <motion.line
              x1="362"
              y1="309"
              x2="778"
              y2="309"
              stroke={STEEL_DARK}
              strokeWidth="4"
              strokeDasharray="10 12"
              initial={false}
              animate={running && step === 3 ? { strokeDashoffset: [0, -44] } : { strokeDashoffset: 0 }}
              transition={running && step === 3 ? loop({ duration: 0.5, ease: 'linear' }) : { duration: 0 }}
            />
            {[372, 460, 550, 640, 730, 768].map((x) => (
              <line key={x} x1={x} y1="318" x2={x} y2="336" stroke={STEEL_DARK} strokeWidth="4" />
            ))}
            <text x="700" y="290" className={step === 3 ? 'making__label is-active' : 'making__label'}>CONVEYOR</text>
          </g>

          {/* ---------- 5. filler + nozzle ---------- */}
          <rect x="526" y="120" width="48" height="30" rx="6" fill={RED} />
          <text x="550" y="140" className="making__label making__label--light making__label--sm">FILLER</text>
          <motion.g
            initial={false}
            animate={{ y: step === 4 ? 12 : 0, opacity: step === 5 ? 0 : 1 }}
            transition={t({ duration: 0.4, ease: 'easeOut' })}
          >
            <rect x="543" y="150" width="14" height="22" fill={STEEL_DARK} />
            <path d="M540 172 H560 L554 182 H546 Z" fill={INK} />
          </motion.g>
          <motion.rect
            x="547"
            y="194"
            width="6"
            height="92"
            fill={COLA}
            style={{ originY: 0 }}
            initial={false}
            animate={{ scaleY: step === 4 ? 1 : 0, opacity: step === 4 ? 1 : 0 }}
            transition={t({ duration: 0.3 })}
          />

          {/* ---------- the plain can ---------- */}
          <motion.g
            initial={false}
            animate={{
              x: canHere ? 0 : -170,
              opacity: canHere ? (step === 5 ? 0 : 1) : 0,
            }}
            transition={t(
              step === 3
                ? { duration: 1.3, ease: [0.22, 1, 0.36, 1] }
                : step === 5
                  ? { opacity: { delay: 1.05, duration: 0.15 } }
                  : { duration: 0 },
            )}
          >
            <rect x="520" y="196" width="60" height="104" rx="7" fill="url(#mk-metal)" />
            <rect x="530" y="206" width="40" height="86" rx="4" fill="#5a5f66" />
            <motion.rect
              x="530"
              y="206"
              width="40"
              height="86"
              rx="4"
              fill={COLA}
              style={{ originY: 1 }}
              initial={false}
              animate={{ scaleY: step === 4 ? [0, 0.92] : step === 5 ? 0.92 : 0 }}
              transition={t(step === 4 ? { duration: 1.5, ease: 'easeOut', delay: 0.2 } : { duration: 0 })}
            />
            <rect x="524" y="292" width="52" height="8" rx="3" fill="#7d838b" />
          </motion.g>

          {/* ---------- 6. seamer head + lid ---------- */}
          <motion.g
            initial={false}
            animate={step === 5 ? { y: [-70, 0, -60], opacity: [1, 1, 0] } : { y: -70, opacity: 0 }}
            transition={t(step === 5 ? { duration: 1.1, times: [0, 0.55, 1], ease: 'easeInOut' } : { duration: 0 })}
          >
            <rect x="532" y="160" width="36" height="26" rx="4" fill={INK} />
          </motion.g>
          <motion.g
            initial={false}
            animate={step === 5 ? { y: [-70, 0, 0], opacity: [1, 1, 0] } : { y: -70, opacity: 0 }}
            transition={t(step === 5 ? { duration: 1.2, times: [0, 0.5, 1], ease: 'easeIn' } : { duration: 0 })}
          >
            <ellipse cx="550" cy="194" rx="30" ry="5" fill="#d7dade" stroke={STEEL_DARK} strokeWidth="1.5" />
          </motion.g>

          {step === 5 &&
            SPARKLES.map((s, i) => (
              <motion.path
                key={i}
                d={`M${s.x} ${s.y - 10} L${s.x + 3} ${s.y - 3} L${s.x + 10} ${s.y} L${s.x + 3} ${s.y + 3} L${s.x} ${s.y + 10} L${s.x - 3} ${s.y + 3} L${s.x - 10} ${s.y} L${s.x - 3} ${s.y - 3} Z`}
                fill="#ffc83d"
                style={{ originX: 0.5, originY: 0.5 }}
                initial={reduced ? false : { scale: 0, opacity: 0 }}
                animate={{ scale: s.s, opacity: 1 }}
                transition={t({ delay: 1.15 + i * 0.08, type: 'spring', stiffness: 400, damping: 12 })}
              />
            ))}
        </svg>

        {/* finished branded can overlay, positioned in viewBox percentages */}
        <motion.div
          className="making__finished"
          aria-hidden="true"
          initial={false}
          animate={step === 5 ? { opacity: 1, scale: reduced ? 1 : [0.7, 1.14, 1] } : { opacity: 0, scale: 0.7 }}
          transition={t(step === 5 ? { delay: 1.05, duration: 0.45, ease: 'easeOut' } : { duration: 0 })}
        >
          <Can bodyColor="#F40009" accentColor="#FFFFFF" textColor="#FFFFFF" width="100%" />
        </motion.div>
      </div>

      <div className="making__ui">
        <div className="making__caption" aria-live="polite">
          <p className="making__caption-title">
            <span className="making__caption-num">Step {step + 1} of {STEPS.length}</span>
            {current.title}
          </p>
          {!compact && <p className="making__caption-text">{current.text}</p>}
        </div>

        <ol className="making__steps">
          {STEPS.map((s, i) => (
            <li key={s.title}>
              <button
                type="button"
                className={i === step ? 'making__step is-active' : 'making__step'}
                aria-current={i === step ? 'step' : undefined}
                aria-label={`Step ${i + 1}: ${s.title}`}
                onClick={() => setStep(i)}
              >
                <span className="making__step-num">{i + 1}</span>
                {!compact && <span className="making__step-label">{s.short}</span>}
              </button>
            </li>
          ))}
        </ol>

        <div className="making__controls">
          {reduced ? (
            <>
              <button
                type="button"
                className="making__btn"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={step === 0}
              >
                ← Prev
              </button>
              <button
                type="button"
                className="making__btn"
                onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
                disabled={step === STEPS.length - 1}
              >
                Next →
              </button>
            </>
          ) : (
            <button
              type="button"
              className="making__btn"
              aria-pressed={playing}
              onClick={() => setPlaying((p) => !p)}
            >
              <span className="making__btn-icon" aria-hidden="true">
                {playing ? '❚❚' : '▶'}
              </span>
              Autoplay
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
