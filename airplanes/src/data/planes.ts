import type { Plane } from './types'

/**
 * The six hangar airplanes (Content-owned). Seeded from v1 by the Lead; Content verifies every
 * number, adds the second route per plane and fills in sources.
 */
export const PLANES: Plane[] = [
  {
    id: 'a350',
    name: 'Airbus A350-900ULR',
    shortName: 'A350-900ULR',
    nickname: 'The marathon flyer',
    maker: 'Airbus',
    firstFlight: '2013 (ULR version: 2018)',
    cruiseKmh: 903,
    passengers: 161,
    passengersNote: 'on Singapore Airlines',
    fact: 'No economy seats at all: just 67 in Business and 94 in Premium Economy.',
    story:
      'The "ULR" stands for Ultra Long Range. Extra fuel lets it fly nonstop for more than 18 hours, so Singapore Airlines uses it for the longest scheduled flight on Earth.',
    routes: ['sin-jfk'],
    shape: { lengthM: 66.8, spanM: 64.75, heightM: 17.05, fuselageM: 5.96, engines: 2, engineType: 'turbofan', wing: 'low', gear: 'retractable', decks: 1, hump: false, tips: 'sharklet' },
    sources: [{ label: 'The Points Guy', url: 'https://thepointsguy.com/news/singapore-airlines-new-york-longest-flights' }],
  },
  {
    id: 'a380',
    name: 'Airbus A380',
    shortName: 'A380',
    nickname: 'The superjumbo',
    maker: 'Airbus',
    firstFlight: '2005',
    cruiseKmh: 903,
    passengers: 545,
    passengersNote: 'typical, up to 853',
    fact: 'Two full decks of passengers, nose to tail, under a 79.75 m wingspan.',
    story:
      'The biggest passenger airliner ever built. Airbus stopped making it in 2021, but airlines like Emirates still fly it on their longest routes.',
    routes: ['dxb-akl'],
    shape: { lengthM: 72.72, spanM: 79.75, heightM: 24.09, fuselageM: 7.14, engines: 4, engineType: 'turbofan', wing: 'low', gear: 'retractable', decks: 2, hump: false, tips: 'winglet' },
    sources: [{ label: 'Airbus', url: 'https://aircraft.airbus.com/en/aircraft/a380' }],
  },
  {
    id: 'b747',
    name: 'Boeing 747-8',
    shortName: '747-8',
    nickname: 'The jumbo jet',
    maker: 'Boeing',
    firstFlight: '2011 (first 747: 1969)',
    cruiseKmh: 917,
    passengers: 410,
    passengersNote: 'in three classes',
    fact: 'At 76.25 m from nose to tail, it is the longest airliner ever built.',
    story:
      'The famous hump holds an upper deck. The 747-8 is the last and longest version of the "Queen of the Skies"; the final one was delivered in 2023.',
    routes: ['fra-lax'],
    shape: { lengthM: 76.25, spanM: 68.4, heightM: 19.4, fuselageM: 6.5, engines: 4, engineType: 'turbofan', wing: 'low', gear: 'retractable', decks: 1, hump: true, tips: 'raked' },
    sources: [{ label: 'Boeing', url: 'https://www.boeing.com/commercial/747' }],
  },
  {
    id: 'concorde',
    name: 'Concorde',
    shortName: 'Concorde',
    nickname: 'The supersonic jet',
    maker: 'Aérospatiale / BAC',
    firstFlight: '1969 (in service 1976–2003)',
    cruiseKmh: 2179,
    passengers: 100,
    passengersNote: '',
    fact: 'Cruising at 60,000 ft, passengers could see the curve of the Earth.',
    story:
      'Concorde flew at twice the speed of sound (Mach 2.04), so London to New York took about 3½ hours, half the time of other jets. It retired in 2003.',
    routes: ['lhr-jfk'],
    shape: { lengthM: 61.66, spanM: 25.6, heightM: 12.2, fuselageM: 2.88, engines: 4, engineType: 'turbojet', wing: 'delta', gear: 'retractable', decks: 1, hump: false, tips: 'plain' },
    sources: [{ label: 'British Airways', url: 'https://www.britishairways.com/content/information/about-ba/history-and-heritage/celebrating-concorde' }],
  },
  {
    id: 'twinotter',
    name: 'DHC-6 Twin Otter',
    shortName: 'Twin Otter',
    nickname: 'The seaplane',
    maker: 'de Havilland Canada',
    firstFlight: '1965',
    cruiseKmh: 337,
    passengers: 19,
    passengersNote: '',
    fact: 'Floats instead of wheels: it takes off and lands on the lagoon.',
    story:
      'In the Maldives there is often no runway, just water. Trans Maldivian Airways flies a fleet of Twin Otters on floats, the largest seaplane fleet in the world, to island resorts.',
    routes: ['mle-baa'],
    shape: { lengthM: 15.77, spanM: 19.8, heightM: 5.94, fuselageM: 1.6, engines: 2, engineType: 'turboprop', wing: 'high', gear: 'floats', decks: 1, hump: false, tips: 'plain' },
    sources: [{ label: 'Hotelier Maldives', url: 'https://hoteliermaldives.com/tma-expands-fleet-with-addition-of-60th-seaplane/' }],
  },
  {
    id: 'islander',
    name: 'Britten-Norman Islander',
    shortName: 'Islander',
    nickname: 'The island hopper',
    maker: 'Britten-Norman',
    firstFlight: '1965',
    cruiseKmh: 260,
    passengers: 8,
    passengersNote: 'on Loganair',
    fact: 'Loganair has flown it between two Scottish islands since 1967.',
    story:
      "The hop from Westray to Papa Westray in Orkney is the world's shortest scheduled flight: 2.7 km, about a minute and a half in the timetable.",
    routes: ['wry-ppw'],
    shape: { lengthM: 10.86, spanM: 14.94, heightM: 4.18, fuselageM: 1.2, engines: 2, engineType: 'piston', wing: 'high', gear: 'fixed', decks: 1, hump: false, tips: 'plain' },
    sources: [{ label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Westray_to_Papa_Westray_flight' }],
  },
]

export const PLANE_BY_ID = Object.fromEntries(PLANES.map((p) => [p.id, p])) as Record<Plane['id'], Plane>
