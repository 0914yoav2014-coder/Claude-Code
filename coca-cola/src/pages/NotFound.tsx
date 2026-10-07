import { Link } from 'react-router-dom'
import Can from '../components/Can'
import { usePageTitle } from '../hooks/usePageTitle'
import './NotFound.css'

export default function NotFound() {
  usePageTitle('Page not found')
  return (
    <section className="section container not-found">
      <Can bodyColor="#8B9097" label="Oops!" className="not-found__can" width={110} />
      <div>
        <p className="eyebrow">Error 404</p>
        <h1>This can is empty.</h1>
        <p className="lead">We couldn't find the page you were looking for. It may have moved, or it never existed.</p>
        <Link to="/" className="btn btn--primary">Back to home</Link>
      </div>
    </section>
  )
}
