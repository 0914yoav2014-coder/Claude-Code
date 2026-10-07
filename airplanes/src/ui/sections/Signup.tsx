import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { COPY } from '../../data/copy'
import { SITE } from '../../data/site'
import { ARTIFACT, env } from '../../lib/env'
import { MOTION } from '../../lib/tokens'
import { track } from '../../lib/track'
import { motionReduced, tween } from '../motion'

type Status = 'idle' | 'sending' | 'success' | 'invalid' | 'age' | 'offline' | 'error' | 'disabled'
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const TIMEOUT_MS = 15000
const MESSAGE: Record<Status, string> = {
  idle: '',
  sending: COPY.signup.sending,
  success: COPY.signup.success,
  invalid: COPY.signup.invalid,
  age: COPY.signup.ageMissing,
  offline: COPY.signup.offline,
  error: COPY.signup.error,
  disabled: COPY.signup.disabled,
}

/**
 * Sign-up (PRD F8). With no endpoint connected (always in the Artifact) it says so honestly
 * instead of showing the PRD success line. ?signup=mock posts to /__mock/signup (tests intercept it).
 * A network failure (or navigator.onLine false) is "offline"; an HTTP error is "error". On success
 * and on the honest "disabled" state a paper airplane folds and flies away (1.2 s).
 */
export default function Signup() {
  const [status, setStatus] = useState<Status>('idle')
  const [flight, setFlight] = useState(0)
  const emailRef = useRef<HTMLInputElement>(null)
  const ageRef = useRef<HTMLInputElement>(null)

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (status === 'sending') return
    const form = e.currentTarget
    const email = (emailRef.current?.value ?? '').trim()
    if (!EMAIL.test(email)) {
      setStatus('invalid')
      emailRef.current?.focus()
      return
    }
    if (!ageRef.current?.checked) {
      setStatus('age')
      ageRef.current?.focus()
      return
    }
    track('signup_submit')
    const endpoint = env.signupMock ? '/__mock/signup' : ARTIFACT ? null : SITE.signupEndpoint
    if (!endpoint) {
      form.reset()
      setStatus('disabled')
      setFlight((f) => f + 1)
      return
    }
    if (!navigator.onLine) {
      setStatus('offline')
      track('signup_error', { reason: 'offline' })
      return
    }
    setStatus('sending')
    const ctrl = new AbortController()
    const timer = window.setTimeout(() => ctrl.abort(), TIMEOUT_MS)
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, ageConfirmed: true, consentText: COPY.signup.age }),
        signal: ctrl.signal,
      })
      if (!res.ok) {
        setStatus('error')
        track('signup_error', { reason: `http-${res.status}` })
        return
      }
      form.reset()
      setStatus('success')
      setFlight((f) => f + 1)
      track('signup_success')
    } catch {
      // fetch only rejects when the request never got an answer: no signal (or it timed out).
      setStatus('offline')
      track('signup_error', { reason: ctrl.signal.aborted ? 'timeout' : 'network' })
    } finally {
      window.clearTimeout(timer)
    }
  }

  const onEmail = (e: ChangeEvent<HTMLInputElement>) => {
    if (status === 'invalid' && EMAIL.test(e.target.value.trim())) setStatus('idle')
  }
  const onAge = (e: ChangeEvent<HTMLInputElement>) => {
    if (status === 'age' && e.target.checked) setStatus('idle')
  }

  const fine = splitPrivacy(COPY.signup.fine)
  const tone = status === 'success' || status === 'disabled' ? 'ok' : status === 'idle' || status === 'sending' ? 'info' : 'warn'

  return (
    <section id="signup" className="section section--signup night" data-section="signup" aria-labelledby="signup-title">
      <div className="night__sky" aria-hidden="true" />
      <div className="glass signup">
        <PaperPlane flight={flight} />
        <h2 id="signup-title">{COPY.signup.title}</h2>
        <p className="signup__sub">{COPY.signup.sub}</p>
        <form data-testid="signup-form" noValidate onSubmit={submit}>
          <label className="signup__label" htmlFor="signup-email">
            {COPY.signup.label}
          </label>
          <div className="signup__row">
            <input
              ref={emailRef}
              id="signup-email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder={COPY.signup.placeholder}
              data-testid="signup-email"
              aria-invalid={status === 'invalid'}
              aria-describedby="signup-status"
              onChange={onEmail}
            />
            <button type="submit" className="btn btn--primary" data-testid="signup-submit" aria-disabled={status === 'sending'}>
              {COPY.signup.button}
            </button>
          </div>
          <label className="check" htmlFor="signup-age">
            <input ref={ageRef} id="signup-age" name="age" type="checkbox" aria-invalid={status === 'age'} aria-describedby="signup-status" onChange={onAge} />
            <span>{COPY.signup.age}</span>
          </label>
          <p id="signup-status" className="signup__status" data-testid="signup-status" data-state={status} data-tone={tone} role="status">
            {MESSAGE[status]}
          </p>
          <p className="signup__fine">
            {fine.before}
            <a href="privacy.html" data-privacy>
              {fine.link}
            </a>
            {fine.after}
          </p>
        </form>
      </div>
    </section>
  )
}

/** "… Read the privacy policy." → the words "privacy policy" become the link. */
function splitPrivacy(text: string): { before: string; link: string; after: string } {
  const m = /privacy policy/i.exec(text)
  if (!m) return { before: `${text} `, link: COPY.footer.links.privacy, after: '' }
  return { before: text.slice(0, m.index), link: m[0], after: text.slice(m.index + m[0].length) }
}

type Pt = [number, number]
/** Sheet of paper (flat) → folded paper airplane, as three polygons with matching point counts. */
const SHEET: Pt[][] = [
  [[34, 24], [60, 24], [60, 66], [34, 66]],
  [[60, 24], [86, 24], [86, 66], [60, 66]],
  [[60, 24], [60, 24], [60, 66], [60, 66]],
]
const FOLDED: Pt[][] = [
  [[112, 16], [112, 16], [14, 38], [60, 47]],
  [[112, 16], [60, 47], [42, 70], [112, 16]],
  [[112, 16], [60, 47], [64, 58], [112, 16]],
]
const FOLD_MS = 420

function points(k: number, i: number): string {
  return SHEET[i].map(([x, y], j) => `${(x + (FOLDED[i][j][0] - x) * k).toFixed(1)},${(y + (FOLDED[i][j][1] - y) * k).toFixed(1)}`).join(' ')
}

/** svg[data-testid=paper-plane]: folds (0.42 s) and flies away (0.78 s) on each successful send. */
function PaperPlane({ flight }: { flight: number }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const polys = useRef<(SVGPolygonElement | null)[]>([])

  useEffect(() => {
    const svg = svgRef.current
    if (!svg || flight === 0) return
    const shape = (k: number) => polys.current.forEach((p, i) => p?.setAttribute('points', points(k, i)))
    if (motionReduced()) {
      shape(1)
      svg.dataset.flight = 'rest'
      return
    }
    svg.dataset.flight = 'fold'
    shape(0)
    const stop = tween(FOLD_MS, shape)
    const t = window.setTimeout(() => (svg.dataset.flight = 'fly'), FOLD_MS)
    const t2 = window.setTimeout(() => (svg.dataset.flight = 'gone'), MOTION.paperPlane + 60)
    return () => {
      stop()
      window.clearTimeout(t)
      window.clearTimeout(t2)
    }
  }, [flight])

  return (
    <svg ref={svgRef} className="paper-plane" data-testid="paper-plane" data-flight="idle" viewBox="0 0 120 90" aria-hidden="true" focusable="false">
      <polygon ref={(el) => void (polys.current[1] = el)} className="paper-plane__under" points={points(0, 1)} />
      <polygon ref={(el) => void (polys.current[2] = el)} className="paper-plane__keel" points={points(0, 2)} />
      <polygon ref={(el) => void (polys.current[0] = el)} className="paper-plane__top" points={points(0, 0)} />
    </svg>
  )
}
