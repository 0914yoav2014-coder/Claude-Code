import { Link } from 'react-router-dom'
import { flavors } from '../data/flavors'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div>
          <p className="footer__logo script">Coca-Cola</p>
          <p className="footer__tag">An unofficial fan site.</p>
        </div>
        <nav aria-label="Flavors">
          <p className="footer__heading">Flavors</p>
          <ul>
            {flavors.map((f) => (
              <li key={f.slug}><Link to={`/flavors/${f.slug}`}>{f.name}</Link></li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Explore">
          <p className="footer__heading">Explore</p>
          <ul>
            <li><Link to="/brands">Our Brands</Link></li>
            <li><Link to="/how-its-made">How It's Made</Link></li>
            <li><Link to="/about">About the Company</Link></li>
          </ul>
        </nav>
      </div>
      <div className="container footer__legal">
        <p>
          Unofficial fan and educational project. Not affiliated with, endorsed by, or sponsored by The Coca-Cola
          Company. Coca-Cola and all related brand names are trademarks of their respective owners. Nutrition values
          are approximate. Always check the label on the product.
        </p>
      </div>
    </footer>
  )
}
