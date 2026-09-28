import MakingAnimation from '../components/MakingAnimation'
import { usePageTitle } from '../hooks/usePageTitle'
import './HowItsMade.css'

type Stage = { title: string; body: string; extra?: string }

const STAGES: Stage[] = [
  {
    title: 'Filtered water',
    body:
      'Water is the main ingredient in a soft drink, so bottlers treat it first. Depending on the local supply, that can include filtration, carbon filters, and other steps so every batch starts from the same clean, consistent base, no matter which city it is made in.',
  },
  {
    title: 'Add the syrup',
    body:
      'The flavor starts as a concentrate supplied by the company. At the bottling plant it is blended with sweetener (sugar or high-fructose corn syrup, depending on the country, or no-calorie sweeteners for diet and zero-sugar drinks) and then mixed with the treated water in carefully metered ratios.',
  },
  {
    title: 'Carbonation',
    body:
      'The mixed drink is chilled and carbon dioxide (CO₂) is dissolved into it under pressure. Cold liquid holds more gas, which is why carbonation happens at low temperatures. The dissolved CO₂ is what fizzes out as bubbles when you open the can.',
  },
  {
    title: 'Empty can arrives',
    body:
      'Empty aluminum cans usually arrive from a can maker already printed, stacked open-end up on pallets. They are unloaded onto the line, turned upside down, and rinsed with clean water or air, then conveyed single-file to the filler.',
  },
  {
    title: 'Fill',
    body:
      'A rotary filler has dozens of valves arranged in a ring. Each valve seals onto a can, pressurizes it with CO₂, and fills it with cold drink so the fizz stays in. The whole thing spins continuously, so the line never has to stop for one can.',
  },
  {
    title: 'Seal & finish',
    body:
      'Right after filling, a seamer places the lid and rolls its edge together with the can’s flange into a tight double seam. The cans are then checked for fill level, printed with a date and batch code, and grouped into multipacks, trays, and pallets ready for delivery.',
  },
]

const FACTS = [
  {
    stat: '1,000+',
    text: 'Modern high-speed canning lines can fill well over 1,000 cans a minute. The fastest are rated for around 2,000.',
  },
  {
    stat: 'Secret',
    text: 'The original formula is famously guarded. Coca-Cola says its written recipe is kept in a vault in Atlanta.',
  },
  {
    stat: 'Local',
    text: 'Most Coca-Cola is bottled close to where it is sold, by a worldwide network of bottling partners.',
  },
]

export default function HowItsMade() {
  usePageTitle("How It's Made")

  return (
    <>
      <header className="page-hero">
        <div className="container">
          <span className="eyebrow">From syrup to sip</span>
          <h1>How a can of Coke is made</h1>
          <p className="lead">
            Follow a can down the line, from filtered water to a sealed, fizzy finish. This is a
            simplified illustration of a typical process, not a tour of a specific plant.
          </p>
        </div>
      </header>

      <section className="section how__animation-section" aria-labelledby="how-line">
        <div className="container">
          <div className="card how__animation-card">
            <h2 id="how-line" className="how__card-title">
              The line <span className="script">in motion</span>
            </h2>
            <MakingAnimation />
          </div>
        </div>
      </section>

      <section className="section how__steps-section" aria-labelledby="how-steps">
        <div className="container">
          <span className="eyebrow">Step by step</span>
          <h2 id="how-steps">What happens at each stage</h2>
          <ol className="how__steps">
            {STAGES.map((s, i) => (
              <li key={s.title} className="card how__step">
                <span className="how__step-num" aria-hidden="true">
                  {i + 1}
                </span>
                <h3 className="how__step-title">{s.title}</h3>
                <p className="how__step-body">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section how__facts-section" aria-labelledby="how-facts">
        <div className="container">
          <span className="eyebrow">Fun facts</span>
          <h2 id="how-facts">Did you know?</h2>
          <ul className="how__facts">
            {FACTS.map((f) => (
              <li key={f.stat} className="how__fact">
                <span className="how__fact-stat script">{f.stat}</span>
                <p>{f.text}</p>
              </li>
            ))}
          </ul>
          <p className="how__note">
            Figures are approximate and vary by plant, country, and product.
          </p>
        </div>
      </section>
    </>
  )
}
