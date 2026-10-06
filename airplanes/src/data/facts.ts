import type { Fact } from './types'

/** Fun facts (Content-owned): lead with the number, one line of explanation, one source. */
export const FACTS: Fact[] = [
  {
    id: 'longest', value: 15349, format: 'int', unit: 'km',
    text: 'Singapore to New York, the longest scheduled flight. It takes about 18 hours.',
    source: { label: 'Flightradar24', url: 'https://www.flightradar24.com/blog/longest-flights/' },
  },
  {
    id: 'shortest', value: 53, format: 'int', unit: 'seconds',
    text: "The fastest-ever hop from Westray to Papa Westray, the world's shortest flight.",
    source: { label: 'Guinness World Records', url: 'https://www.guinnessworldrecords.com/world-records/63191-shortest-domestic-scheduled-flight' },
  },
  {
    id: 'concorde', value: 2 * 3600 + 52 * 60 + 59, format: 'hms', unit: 'h:m:s',
    text: "Concorde's record New York to London crossing on 7 February 1996.",
    source: { label: 'Guinness World Records', url: 'https://www.guinnessworldrecords.com/world-records/fastest-flight-across-the-atlantic-in-a-commercial-aircraft' },
  },
  {
    id: 'a380', value: 853, format: 'int', unit: 'people',
    text: 'The most passengers an Airbus A380 is certified to carry at once.',
    source: { label: 'Airbus', url: 'https://aircraft.airbus.com/en/aircraft/a380' },
  },
]

/** Prints a fact value the way the page shows it (also used mid count-up). */
export function formatFact(value: number, format: Fact['format']): string {
  if (format === 'hms') {
    const v = Math.round(value)
    const h = Math.floor(v / 3600)
    const m = Math.floor((v % 3600) / 60)
    const s = v % 60
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  return Math.round(value).toLocaleString('en-US')
}
