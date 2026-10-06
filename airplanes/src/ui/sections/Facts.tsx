import { COPY, fill } from '../../data/copy'
import { FACTS, formatFact } from '../../data/facts'

/** Fun facts (PRD F10; Frontend-owned; Lead stub). Numbers count up and a contrail draws under each. */
export default function Facts() {
  return (
    <section id="facts" className="section section--facts" data-section="facts" aria-labelledby="facts-title">
      <i className="cam" data-cam="night" style={{ top: 0 }} />
      <header className="section-head">
        <p className="eyebrow">{COPY.facts.eyebrow}</p>
        <h2 id="facts-title">{COPY.facts.title}</h2>
      </header>
      <ul className="facts">
        {FACTS.map((f) => (
          <li key={f.id} className="fact" data-testid="fact">
            <span className="fact__number" data-testid="fact-number" data-value={f.value}>
              {formatFact(f.value, f.format)}
            </span>
            <span className="fact__unit">{f.unit}</span>
            <p>{f.text}</p>
            <a className="fact__source" data-testid="fact-source" href={f.source.url} target="_blank" rel="noopener">
              {fill(COPY.facts.source, { label: f.source.label })}
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
