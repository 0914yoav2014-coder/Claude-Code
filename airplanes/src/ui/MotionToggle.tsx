import { COPY } from '../data/copy'
import { store, useApp } from '../state/store'

/**
 * Pause animation / Play animation (PRD F7, WCAG 2.2.2). Fixed and always visible. Pausing stops
 * every loop: frame.loopT freezes (3D), CSS loops stop under html[data-paused=true], the Lite video
 * pauses. On narrow screens the label is visually hidden (still the button's name).
 */
export default function MotionToggle() {
  const paused = useApp((s) => s.motion.paused)
  return (
    <button className="motion-toggle" type="button" data-testid="motion-toggle" aria-pressed={paused} onClick={() => store.getState().setPaused(!paused)}>
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        {paused ? <path d="M8 5.5v13l10.5-6.5z" /> : <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" />}
      </svg>
      <span className="motion-toggle__label">{paused ? COPY.motion.play : COPY.motion.pause}</span>
    </button>
  )
}
