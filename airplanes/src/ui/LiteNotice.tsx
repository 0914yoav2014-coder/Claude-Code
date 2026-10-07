import { useState } from 'react'
import { COPY } from '../data/copy'
import { ARTIFACT } from '../lib/env'
import { clearLiteFlag, useApp, type LiteReason } from '../state/store'

const DISMISS = COPY.lite.dismiss

/** Lite reasons a reload can fix (the device itself is not the problem). */
const RETRYABLE: LiteReason[] = ['session', 'context-failed', 'context-lost', 'slow-fps']

function tryFull(reason: LiteReason | undefined) {
  clearLiteFlag()
  const url = new URL(window.location.href)
  url.searchParams.delete('lite')
  // A software GPU is sent to Lite on purpose; the visitor asked for 3D anyway.
  if (reason === 'perf-caveat') url.searchParams.set('perfcaveat', '0')
  window.location.assign(url.toString())
}

/**
 * Shown while the lighter version runs (exact PRD copy). Not shown when ?lite=1 forced it.
 * "Try the full 3D version" clears the session flag and reloads, when a reload can help.
 */
export default function LiteNotice() {
  const mode = useApp((s) => s.mode)
  const reason = useApp((s) => s.quality.lite)
  const [dismissed, setDismissed] = useState(false)
  if (mode !== 'lite' || reason === 'forced' || dismissed) return null
  const canRetry = !!reason && (RETRYABLE.includes(reason) || (reason === 'perf-caveat' && !ARTIFACT))
  return (
    <div className="lite-notice glass" data-testid="lite-notice" role="status">
      <p>{COPY.lite.notice}</p>
      {canRetry && (
        <button type="button" className="link-btn" onClick={() => tryFull(reason)}>
          {COPY.lite.tryFull}
        </button>
      )}
      <button type="button" className="icon-btn icon-btn--quiet lite-notice__close" aria-label={DISMISS} onClick={() => setDismissed(true)}>
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      </button>
    </div>
  )
}
