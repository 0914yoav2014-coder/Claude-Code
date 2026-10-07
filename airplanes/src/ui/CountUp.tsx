import { useEffect, useRef } from 'react'
import { motionReduced, setText, tween } from './motion'

interface Props {
  value: number
  /** Formats a value (also mid count-up). */
  format: (v: number) => string
  /** Count-up length in ms. */
  ms: number
  /** Changing this replays the count-up (e.g. each plane roll-in). null = hold the final value. */
  run: number | null
  /** Show 0 until the first run (used when the count-up waits for the element to come into view). */
  waitAtZero?: boolean
  className?: string
}

/**
 * A number that counts up from 0. The server render (and no-JS) shows the final value; the
 * animation writes text straight into the DOM from the shared loop. Reduced motion: final at once.
 */
export default function CountUp({ value, format, ms, run, waitAtZero = false, className }: Props) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (run === null) {
      setText(el, waitAtZero && !motionReduced() ? format(0) : format(value))
      return
    }
    if (motionReduced()) {
      setText(el, format(value))
      return
    }
    setText(el, format(0))
    return tween(ms, (k) => setText(el, format(value * k)))
  }, [value, run, ms, format, waitAtZero])

  return (
    <span ref={ref} className={className}>
      {format(value)}
    </span>
  )
}
