import { useEffect, useRef, useState } from 'react'
import { COPY, fill } from '../../data/copy'
import { FACTS, formatFact } from '../../data/facts'
import type { Fact } from '../../data/types'
import { MOTION } from '../../lib/tokens'
import { track } from '../../lib/track'
import CountUp from '../CountUp'
import { useTilt } from '../useTilt'

const formatters = {
  int: (v: number) => formatFact(v, 'int'),
  hms: (v: number) => formatFact(v, 'hms'),
}

/**
 * Fun facts (PRD F10). The canvas has faded to navy here (camera key `night`); a CSS night sky
 * sits behind. Each number counts up and a contrail draws under it when its card comes into view
 * (1.5 s). Reduced motion: final values at once. Cards tilt toward a mouse cursor (F11).
 */
export default function Facts() {
  return (
    <section id="facts" className="section section--facts night" data-section="facts" aria-labelledby="facts-title">
      <i className="cam cam--night" data-cam="night" />
      <div className="night__sky" aria-hidden="true" />
      <header className="section-head section-head--center" data-contrast-check>
        <p className="eyebrow">{COPY.facts.eyebrow}</p>
        <h2 id="facts-title">{COPY.facts.title}</h2>
      </header>
      <ul className="facts">
        {FACTS.map((f, i) => (
          <FactCard key={f.id} fact={f} order={i} />
        ))}
      </ul>
    </section>
  )
}

function FactCard({ fact, order }: { fact: Fact; order: number }) {
  const ref = useRef<HTMLLIElement>(null)
  const tilt = useTilt<HTMLLIElement>(4)
  const [run, setRun] = useState<number | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return
        io.disconnect()
        setRun(1)
      },
      { threshold: 0.45 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <li
      ref={(el) => {
        ref.current = el
        tilt(el)
      }}
      className="fact glass tilt"
      data-testid="fact"
      data-on={run !== null ? 'true' : 'false'}
      style={{ ['--order' as string]: order }}
    >
      <span className="fact__number" data-testid="fact-number" data-value={fact.value}>
        <CountUp value={fact.value} format={formatters[fact.format]} ms={MOTION.countUp} run={run} waitAtZero />
      </span>
      <span className="fact__unit">{fact.unit}</span>
      <svg className="fact__contrail" viewBox="0 0 240 24" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <path className="fact__trail" d="M2 18 C 60 18, 120 14, 186 8" pathLength={1} />
        <path className="fact__jet" d="M186 8 l9 -3.2 -2.4 3.6 2.4 3.2 z" />
      </svg>
      <p className="fact__text">{fact.text}</p>
      <a className="fact__source" data-testid="fact-source" href={fact.source.url} target="_blank" rel="noopener" onClick={() => track('fact_source', { fact: fact.id })}>
        {fill(COPY.facts.source, { label: fact.source.label })}
      </a>
    </li>
  )
}
