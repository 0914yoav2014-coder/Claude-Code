import type { Plane } from './types'

/**
 * The six hangar airplanes (Content-owned). Every figure is listed with its source and check status
 * in docs/FACTS.md. `shape` holds real proportions (metres) for the 3D models; the hangar also prints
 * shape.lengthM and shape.spanM as stats.
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
    fact: '161 seats and not one in economy: 67 in Business and 94 in Premium Economy.',
    story:
      'ULR stands for Ultra Long Range. It carries so much extra fuel that it can fly for more than 18 hours without stopping. That is long enough to watch nine movies in a row!',
    routes: ['sin-jfk', 'sin-lax'],
    // A350 wingtips are curved, blended winglets: 'sharklet' is the closest style.
    shape: { lengthM: 66.8, spanM: 64.75, heightM: 17.05, fuselageM: 5.96, engines: 2, engineType: 'turbofan', wing: 'low', gear: 'retractable', decks: 1, hump: false, tips: 'sharklet' },
    sources: [
      { label: 'AeroCorner (2026)', url: 'https://aerocorner.com/news/singapore-sq24-changi-turnback/' },
      { label: 'AIN Online', url: 'https://www.ainonline.com/aviation-news/air-transport/2018-04-24/airbus-a350-900-ulr-flies-first-time' },
      { label: 'Lufthansa Group: A350-900', url: 'https://www.lufthansagroup.com/en/company/fleet/lufthansa-and-regional-partners/airbus-a350-900.html' },
    ],
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
    fact: '2 full-length passenger decks: no other jet airliner has that.',
    story:
      'The biggest passenger airliner ever built, with wings almost 80 m across. Airbus finished the last one in 2021, but A380s still fly every day, from Dubai to Auckland and from Tokyo to Hawaii.',
    routes: ['dxb-akl', 'nrt-hnl'],
    // The A380 has small wingtip fences; 'winglet' is the closest style.
    shape: { lengthM: 72.72, spanM: 79.75, heightM: 24.09, fuselageM: 7.14, engines: 4, engineType: 'turbofan', wing: 'low', gear: 'retractable', decks: 2, hump: false, tips: 'winglet' },
    sources: [
      { label: 'Airbus', url: 'https://aircraft.airbus.com/en/aircraft/a380' },
      { label: 'GlobalAir: A380 specifications', url: 'https://www.globalair.com/aircraft-specifications/airbus/airbus-a380-specifications/1545' },
    ],
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
    passengersNote: 'typical, in three classes',
    fact: '1,574 jumbo jets were built before the last one left the factory in 2023.',
    story:
      'That famous hump holds an upper deck, and the pilots sit up there too. On the cargo version, the whole nose swings up so freight can slide straight in. The 747-8 is the last and longest "Queen of the Skies".',
    routes: ['fra-lax', 'fra-jnb'],
    shape: { lengthM: 76.25, spanM: 68.4, heightM: 19.4, fuselageM: 6.5, engines: 4, engineType: 'turbofan', wing: 'low', gear: 'retractable', decks: 1, hump: true, tips: 'raked' },
    sources: [
      { label: 'Boeing', url: 'https://boeing.mediaroom.com/2023-01-31-Boeing,-Atlas-Air-Celebrate-Delivery-of-Final-747,-an-Airplane-that-Transformed-Aviation-and-Global-Air-Travel' },
      { label: 'PlaneFYI: 747-8 Intercontinental', url: 'https://planefyi.com/de/aircraft/boeing-747-8i/cathay-pacific/' },
    ],
  },
  {
    id: 'concorde',
    name: 'Concorde',
    shortName: 'Concorde',
    nickname: 'The supersonic jet',
    maker: 'Aérospatiale / BAC',
    firstFlight: '1969 (in service 1976–2003)',
    cruiseKmh: 2158,
    passengers: 100,
    passengersNote: 'typical',
    fact: '60,000 ft up: so high that passengers could see the curve of the Earth.',
    story:
      'Concorde flew at twice the speed of sound, so London to New York took under 4 hours. By the clock, you landed before you took off! Only 20 were ever built, and the last ones retired in 2003.',
    routes: ['lhr-jfk', 'cdg-gig'],
    shape: { lengthM: 61.66, spanM: 25.6, heightM: 12.2, fuselageM: 2.88, engines: 4, engineType: 'turbojet', wing: 'delta', gear: 'retractable', decks: 1, hump: false, tips: 'plain' },
    sources: [
      { label: 'British Airways', url: 'https://www.britishairways.com/content/information/about-ba/history-and-heritage/celebrating-concorde' },
      { label: 'Wikipedia: Concorde', url: 'https://en.wikipedia.org/wiki/Concorde' },
    ],
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
    passengersNote: 'at most',
    fact: '66 Twin Otters on floats fly for one Maldives airline: the biggest seaplane fleet on Earth.',
    story:
      'In the Maldives there is often no runway, just turquoise water, so Twin Otters on floats take off from the lagoon. Swap the floats for wheels and it can land on Saba, the shortest airline runway in the world.',
    routes: ['mle-baa', 'sxm-sab'],
    shape: { lengthM: 15.77, spanM: 19.8, heightM: 5.94, fuselageM: 1.6, engines: 2, engineType: 'turboprop', wing: 'high', gear: 'floats', decks: 1, hump: false, tips: 'plain' },
    sources: [
      { label: 'Trans Maldivian Airways', url: 'https://www.transmaldivian.com/66th-aircraft/' },
      { label: 'GlobalAir: Twin Otter DHC-6-400', url: 'https://www.globalair.com/aircraft-specifications/viking-air-ltd/twin-otter-dhc-6-400-specifications/1566' },
    ],
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
    fact: '2.7 km: the length of its most famous trip, the shortest scheduled flight on Earth.',
    story:
      'The Islander is built for short, bumpy island airstrips. In Scotland, Loganair has flown it from Westray to Papa Westray since 1967, and the record is 53 seconds. In New Zealand, it carries visitors to Stewart Island in 20 minutes.',
    routes: ['wry-ppw', 'ivc-szs'],
    shape: { lengthM: 10.86, spanM: 14.94, heightM: 4.18, fuselageM: 1.2, engines: 2, engineType: 'piston', wing: 'high', gear: 'fixed', decks: 1, hump: false, tips: 'plain' },
    sources: [
      { label: 'Guinness World Records', url: 'https://www.guinnessworldrecords.com/world-records/63191-shortest-domestic-scheduled-flight' },
      { label: 'Wikipedia: Britten-Norman Islander', url: 'https://en.wikipedia.org/wiki/Britten-Norman_Islander' },
    ],
  },
]

export const PLANE_BY_ID = Object.fromEntries(PLANES.map((p) => [p.id, p])) as Record<Plane['id'], Plane>
