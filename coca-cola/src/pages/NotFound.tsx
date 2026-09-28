import { usePageTitle } from '../hooks/usePageTitle'

// Placeholder: the page agent replaces this file.
export default function NotFound() {
  usePageTitle("Page not found")
  return (
    <section className="section container">
      <h1>Page not found</h1>
    </section>
  )
}
