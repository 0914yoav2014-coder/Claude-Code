import { COPY } from '../../data/copy'

/** Climb to space (PRD step 4; Frontend-owned; Lead stub). Markers: clouds 80svh down, earth 40svh above the end. */
export default function Climb() {
  return (
    <section id="climb" className="section section--climb" data-section="climb" aria-label="Climb to space">
      <i className="cam" data-cam="clouds" style={{ top: '80svh' }} />
      <i className="cam" data-cam="earth" style={{ bottom: '40svh' }} />
      <div className="sticky-frame">
        <p className="climb__line" data-testid="climb-line" data-contrast-check>
          {COPY.climb.line}
        </p>
      </div>
    </section>
  )
}
