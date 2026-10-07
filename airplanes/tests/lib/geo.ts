/** Great-circle distance in km between two [lat, lon] points (haversine, mean Earth radius). */
export function greatCircleKm(a: readonly [number, number], b: readonly [number, number]): number {
  const R = 6371.0088
  const rad = Math.PI / 180
  const dLat = (b[0] - a[0]) * rad
  const dLon = (b[1] - a[1]) * rad
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * rad) * Math.cos(b[0] * rad) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)))
}

/** Minutes from a printed duration such as "about 18 h 40 min", "about 1½ min", "about 30–35 min", "53 s". */
export function parseDurationLabel(label: string): { min: number; max: number } | null {
  const l = label.replace(/½/g, '.5').replace(/¼/g, '.25').replace(/¾/g, '.75')
  const range = l.match(/(\d+(?:\.\d+)?)\s*[–-]\s*(\d+(?:\.\d+)?)\s*min/)
  if (range) return { min: +range[1], max: +range[2] }
  const h = l.match(/(\d+(?:\.\d+)?)\s*(?:h|hours?|hr)\b/)
  const m = l.match(/(\d+(?:\.\d+)?)\s*(?:min|minutes?)\b/)
  const s = l.match(/(\d+(?:\.\d+)?)\s*(?:s|sec|seconds?)\b/)
  if (!h && !m && !s) return null
  const v = (h ? +h[1] * 60 : 0) + (m ? +m[1] : 0) + (s ? +s[1] / 60 : 0)
  return { min: v, max: v }
}

/** The first number in a printed label such as "15,349 km" or "about 2.7 km". */
export function parseNumberLabel(label: string): number | null {
  const m = label.replace(/,(?=\d{3})/g, '').match(/\d+(?:\.\d+)?/)
  return m ? +m[0] : null
}
