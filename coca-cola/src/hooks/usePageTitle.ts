import { useEffect } from 'react'

const SITE = 'Coca-Cola Fan Site'

/** Sets document.title as "<title> · Coca-Cola Fan Site" (or just the site name). */
export function usePageTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} · ${SITE}` : SITE
  }, [title])
}
