import type { Route } from './types'

/**
 * Globe routes (Content-owned). Seeded with v1's six; Content brings this to 12 (two per plane).
 * Coordinates are airport [latitude, longitude]. Routes under ~220 km are drawn as pins.
 */
export const ROUTES: Route[] = [
  {
    id: 'sin-jfk', plane: 'a350', airline: 'Singapore Airlines', flight: 'SQ24',
    from: { city: 'Singapore', code: 'SIN', at: [1.364, 103.991] },
    to: { city: 'New York', code: 'JFK', at: [40.641, -73.778] },
    distanceKm: 15349, distanceLabel: '15,349 km', durationMin: 1120, durationLabel: 'about 18 h 40 min',
    note: 'The longest scheduled flight in the world.', historic: false,
    sources: [{ label: 'Flightradar24', url: 'https://www.flightradar24.com/blog/longest-flights/' }],
  },
  {
    id: 'dxb-akl', plane: 'a380', airline: 'Emirates', flight: 'EK448',
    from: { city: 'Dubai', code: 'DXB', at: [25.253, 55.364] },
    to: { city: 'Auckland', code: 'AKL', at: [-37.008, 174.792] },
    distanceKm: 14200, distanceLabel: '14,200 km', durationMin: 950, durationLabel: 'about 15 h 50 min',
    note: "Emirates' longest nonstop route, flown by its biggest airplane.", historic: false,
    sources: [{ label: 'Emirates', url: 'https://www.emirates.com/english/destinations/dxb/akl/flights-from-dubai-to-auckland/' }],
  },
  {
    id: 'fra-lax', plane: 'b747', airline: 'Lufthansa', flight: 'LH456',
    from: { city: 'Frankfurt', code: 'FRA', at: [50.033, 8.57] },
    to: { city: 'Los Angeles', code: 'LAX', at: [33.942, -118.408] },
    distanceKm: 9300, distanceLabel: 'about 9,300 km', durationMin: 700, durationLabel: 'about 11 h 40 min',
    note: 'Over Greenland and Canada on the way west.', historic: false,
    sources: [{ label: 'FlightStats', url: 'https://www.flightstats.com/v2/flight-tracker/LH/456' }],
  },
  {
    id: 'lhr-jfk', plane: 'concorde', airline: 'British Airways', flight: 'BA001',
    from: { city: 'London', code: 'LHR', at: [51.47, -0.454] },
    to: { city: 'New York', code: 'JFK', at: [40.641, -73.778] },
    distanceKm: 5550, distanceLabel: 'about 5,550 km', durationMin: 210, durationLabel: 'about 3 h 30 min',
    note: "Concorde's most famous route. Most jets today take 7 to 8 hours.", historic: true,
    sources: [{ label: 'British Airways', url: 'https://www.britishairways.com/content/information/about-ba/history-and-heritage/celebrating-concorde' }],
  },
  {
    id: 'mle-baa', plane: 'twinotter', airline: 'Trans Maldivian Airways', flight: '',
    from: { city: 'Malé', code: 'MLE', at: [4.192, 73.529] },
    to: { city: 'Baa Atoll', code: 'Baa', at: [5.15, 73.05] },
    distanceKm: 115, distanceLabel: 'about 115 km', durationMin: 33, durationLabel: 'about 30–35 min',
    note: 'Take-off and landing happen on water.', historic: false,
    sources: [{ label: 'Maldives.com', url: 'https://www.maldives.com/blog/travelling-by-seaplane-in-maldives' }],
  },
  {
    id: 'wry-ppw', plane: 'islander', airline: 'Loganair', flight: '',
    from: { city: 'Westray', code: 'WRY', at: [59.35, -2.95] },
    to: { city: 'Papa Westray', code: 'PPW', at: [59.351, -2.9] },
    distanceKm: 2.7, distanceLabel: '2.7 km', durationMin: 1.5, durationLabel: 'about 1½ min',
    note: 'The shortest scheduled flight in the world.', historic: false,
    sources: [{ label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Westray_to_Papa_Westray_flight' }],
  },
]

export const ROUTE_BY_ID = Object.fromEntries(ROUTES.map((r) => [r.id, r])) as Record<string, Route>
