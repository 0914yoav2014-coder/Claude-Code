/** The little logo: a globe outline with a jet crossing it (decorative; the link carries the name). */
export default function BrandMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <circle cx="16" cy="16" r="12.5" fill="none" stroke="currentColor" strokeOpacity="0.5" strokeWidth="1.6" />
      <path d="M5 19.5c6.5 2.2 15.5 2.2 22 0M5 12.5c6.5-2.2 15.5-2.2 22 0M16 3.5c-4.4 6.8-4.4 18.2 0 25" fill="none" stroke="currentColor" strokeOpacity="0.35" strokeWidth="1.2" />
      <path
        className="brand-mark__jet"
        d="M25.6 6.4c.9-.9.9-2 .3-2.6-.6-.6-1.7-.6-2.6.3l-3.2 3.2-8.6-2.4-1.7 1.7 6.9 4-3.4 3.4-2.6-.6-1.3 1.3 3.3 1.8 1.8 3.3 1.3-1.3-.6-2.6 3.4-3.4 4 6.9 1.7-1.7-2.4-8.6z"
      />
    </svg>
  )
}
