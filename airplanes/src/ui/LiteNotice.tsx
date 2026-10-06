import { COPY } from '../data/copy'
import { useApp } from '../state/store'

/** Shown when the lighter version runs (PRD message, exact copy). Frontend-owned; Lead stub. */
export default function LiteNotice() {
  const mode = useApp((s) => s.mode)
  const reason = useApp((s) => s.quality.lite)
  if (mode !== 'lite' || reason === 'forced') return null
  return (
    <p className="lite-notice" data-testid="lite-notice" role="status">
      {COPY.lite.notice}
    </p>
  )
}
