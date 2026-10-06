import { COPY } from '../data/copy'
import { store, useApp } from '../state/store'

/** Pause animation / Play animation (PRD F7, WCAG 2.2.2). Always visible (Frontend-owned; Lead stub). */
export default function MotionToggle() {
  const paused = useApp((s) => s.motion.paused)
  return (
    <button
      className="motion-toggle"
      type="button"
      data-testid="motion-toggle"
      aria-pressed={paused}
      onClick={() => store.getState().setPaused(!paused)}
    >
      {paused ? COPY.motion.play : COPY.motion.pause}
    </button>
  )
}
