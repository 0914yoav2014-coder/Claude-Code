import { COPY } from '../data/copy'
import { ARTIFACT } from '../lib/env'
import { clearLiteFlag, useApp, type LiteReason } from '../state/store'

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
  if (mode !== 'lite' || reason === 'forced') return null
  const canRetry = !!reason && (RETRYABLE.includes(reason) || (reason === 'perf-caveat' && !ARTIFACT))
  return (
    <div className="lite-notice glass" data-testid="lite-notice" role="status">
      <p>{COPY.lite.notice}</p>
      {canRetry && (
        <button type="button" className="link-btn" onClick={() => tryFull(reason)}>
          {COPY.lite.tryFull}
        </button>
      )}
    </div>
  )
}
