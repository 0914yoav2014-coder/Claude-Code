import { useState, type FormEvent } from 'react'
import { COPY } from '../../data/copy'
import { SITE } from '../../data/site'
import { ARTIFACT, env } from '../../lib/env'
import { track } from '../../lib/track'

type Status = 'idle' | 'sending' | 'success' | 'invalid' | 'offline' | 'error' | 'disabled' | 'age'
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/**
 * Sign-up (PRD F8; Frontend-owned; Lead stub). With no endpoint connected (always in the Artifact)
 * it says so honestly instead of showing the PRD success line. ?signup=mock posts to a mock URL.
 */
export default function Signup() {
  const [status, setStatus] = useState<Status>('idle')
  const message: Record<Status, string> = {
    idle: '',
    sending: COPY.signup.sending,
    success: COPY.signup.success,
    invalid: COPY.signup.invalid,
    offline: COPY.signup.offline,
    error: COPY.signup.error,
    disabled: COPY.signup.disabled,
    age: COPY.signup.ageMissing,
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const email = String(new FormData(form).get('email') ?? '').trim()
    const age = (form.elements.namedItem('age') as HTMLInputElement).checked
    if (!EMAIL.test(email)) return setStatus('invalid')
    if (!age) return setStatus('age')
    track('signup_submit')
    const endpoint = env.signupMock ? '/__mock/signup' : ARTIFACT ? null : SITE.signupEndpoint
    if (!endpoint) {
      form.reset()
      return setStatus('disabled')
    }
    if (!navigator.onLine) return setStatus('offline')
    setStatus('sending')
    try {
      const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, ageConfirmed: true }) })
      if (!res.ok) throw new Error(String(res.status))
      form.reset()
      setStatus('success')
      track('signup_success')
    } catch (err) {
      setStatus(navigator.onLine ? 'error' : 'offline')
      track('signup_error', { reason: String(err) })
    }
  }

  return (
    <section id="signup" className="section section--signup" data-section="signup" aria-labelledby="signup-title">
      <div className="glass signup">
        <h2 id="signup-title">{COPY.signup.title}</h2>
        <p>{COPY.signup.sub}</p>
        <form data-testid="signup-form" noValidate onSubmit={submit}>
          <label htmlFor="signup-email">{COPY.signup.label}</label>
          <div className="signup__row">
            <input id="signup-email" name="email" type="email" autoComplete="email" placeholder={COPY.signup.placeholder} data-testid="signup-email" aria-invalid={status === 'invalid'} aria-describedby="signup-status" />
            <button type="submit" className="btn btn--primary" data-testid="signup-submit" disabled={status === 'sending'}>
              {COPY.signup.button}
            </button>
          </div>
          <label className="check" htmlFor="signup-age">
            <input id="signup-age" name="age" type="checkbox" />
            <span>{COPY.signup.age}</span>
          </label>
          <p id="signup-status" className="signup__status" data-testid="signup-status" data-state={status} role="status">
            {message[status]}
          </p>
          <p className="signup__fine">
            We only keep your email address. Read the{' '}
            <a href="privacy.html" data-privacy>
              privacy policy
            </a>
            .
          </p>
        </form>
      </div>
    </section>
  )
}
