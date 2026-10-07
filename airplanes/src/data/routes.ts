import type { Route } from './types'

/**
 * Globe routes (Content-owned): 12, two per plane, in plane order. Coordinates are airport
 * [latitude, longitude] from OurAirports (public domain). distanceKm is the great-circle distance
 * between them on the WGS-84 ellipsoid (airlines quote the same figure); durationMin is the
 * scheduled gate-to-gate time. Sources and check status: docs/FACTS.md. Routes under ~220 km are
 * drawn as pins.
 */
export const ROUTES: Route[] = [
  {
    id: 'sin-jfk', plane: 'a350', airline: 'Singapore Airlines', flight: 'SQ24',
    from: { city: 'Singapore', code: 'SIN', at: [1.3502, 103.994] },
    to: { city: 'New York', code: 'JFK', at: [40.6394, -73.7793] },
    distanceKm: 15349, distanceLabel: '15,349 km', durationMin: 1120, durationLabel: 'about 18 h 40 min',
    note: 'The longest scheduled flight in the world.', historic: false,
    sources: [
      { label: 'AeroCorner (2026)', url: 'https://aerocorner.com/news/singapore-sq24-changi-turnback/' },
      { label: 'AirConnect: SQ24 schedule', url: 'https://airconnect.live/en/flights/SQ24' },
    ],
  },
  {
    id: 'sin-lax', plane: 'a350', airline: 'Singapore Airlines', flight: 'SQ38',
    from: { city: 'Singapore', code: 'SIN', at: [1.3502, 103.994] },
    to: { city: 'Los Angeles', code: 'LAX', at: [33.9425, -118.408] },
    distanceKm: 14114, distanceLabel: '14,114 km', durationMin: 930, durationLabel: 'about 15 h 30 min',
    note: 'Opened by the ULR in 2018 across the whole Pacific; most days a regular A350-900 flies it now.', historic: false,
    sources: [
      { label: 'Singapore Airlines (2018)', url: 'https://www.singaporeair.com/fr_FR/fr/corporate/newsroom/press-release/2018/July-September/ne2218-180711/' },
      { label: 'FlightStats: SQ38', url: 'https://www.flightstats.com/v2/flight-tracker/SQ/38' },
      { label: 'AeroRoutes (Jul 2026): ULR on LAX only part-time', url: 'https://www.aeroroutes.com/eng/260722-sqapr27lax' },
    ],
  },
  {
    id: 'dxb-akl', plane: 'a380', airline: 'Emirates', flight: 'EK448',
    from: { city: 'Dubai', code: 'DXB', at: [25.2498, 55.371] },
    to: { city: 'Auckland', code: 'AKL', at: [-37.012, 174.7863] },
    distanceKm: 14200, distanceLabel: '14,200 km', durationMin: 960, durationLabel: 'about 16 h',
    note: 'The longest flight any A380 makes, over the Indian Ocean and Australia.', historic: false,
    sources: [
      { label: 'Trip.com: EK448', url: 'https://www.trip.com/flights/status-ek448/' },
      { label: 'Business Traveller', url: 'https://www.businesstraveller.com/news/emirates-announces-dubai-auckland-route/' },
    ],
  },
  {
    id: 'nrt-hnl', plane: 'a380', airline: 'ANA (All Nippon Airways)', flight: 'NH184',
    from: { city: 'Tokyo', code: 'NRT', at: [35.7686, 140.3887] },
    to: { city: 'Honolulu', code: 'HNL', at: [21.3184, -157.9257] },
    distanceKm: 6145, distanceLabel: '6,145 km', durationMin: 455, durationLabel: 'about 7 h 35 min',
    note: 'ANA paints its three A380s like Hawaiian sea turtles, called honu.', historic: false,
    sources: [{ label: 'ANA: Flying Honu', url: 'https://www.ana.co.jp/en/jp/international/promotions/a380/' }],
  },
  {
    id: 'fra-lax', plane: 'b747', airline: 'Lufthansa', flight: 'LH456',
    from: { city: 'Frankfurt', code: 'FRA', at: [50.0267, 8.5584] },
    to: { city: 'Los Angeles', code: 'LAX', at: [33.9425, -118.408] },
    distanceKm: 9344, distanceLabel: '9,344 km', durationMin: 700, durationLabel: 'about 11 h 40 min',
    note: 'Over Greenland and Canada on the way west.', historic: false,
    sources: [
      { label: 'FlightStats: LH456', url: 'https://www.flightstats.com/v2/flight-tracker/LH/456' },
      { label: 'Meilenoptimieren: Lufthansa 747-8 routes', url: 'https://meilenoptimieren.com/lufthansa-b747-8-strecken/' },
    ],
  },
  {
    id: 'fra-jnb', plane: 'b747', airline: 'Lufthansa', flight: 'LH572',
    from: { city: 'Frankfurt', code: 'FRA', at: [50.0267, 8.5584] },
    to: { city: 'Johannesburg', code: 'JNB', at: [-26.1401, 28.2468] },
    distanceKm: 8658, distanceLabel: '8,658 km', durationMin: 630, durationLabel: 'about 10 h 30 min',
    note: 'Overnight over the whole of Africa, with almost no time difference.', historic: false,
    sources: [
      { label: 'FlightStats: LH572', url: 'https://www.flightstats.com/v2/flight-tracker/LH/572' },
      { label: 'Meilenoptimieren: Lufthansa 747-8 routes', url: 'https://meilenoptimieren.com/lufthansa-b747-8-strecken/' },
    ],
  },
  {
    id: 'lhr-jfk', plane: 'concorde', airline: 'British Airways', flight: 'BA001',
    from: { city: 'London', code: 'LHR', at: [51.4707, -0.4599] },
    to: { city: 'New York', code: 'JFK', at: [40.6394, -73.7793] },
    distanceKm: 5555, distanceLabel: 'about 5,550 km', durationMin: 235, durationLabel: '3 h 55 min',
    note: 'Leave London at 10:30, land in New York at 9:25: before you left, by the clock!', historic: true,
    sources: [
      { label: 'British Airways', url: 'https://www.britishairways.com/content/information/about-ba/history-and-heritage/celebrating-concorde' },
      { label: 'Asia Travel Tips (2001 timetable)', url: 'https://www.asiatraveltips.com/travelnews2001/15October2001BA.htm' },
    ],
  },
  {
    id: 'cdg-gig', plane: 'concorde', airline: 'Air France', flight: 'AF085',
    from: { city: 'Paris', code: 'CDG', at: [49.009, 2.5541] },
    to: { city: 'Rio de Janeiro', code: 'GIG', at: [-22.81, -43.2506] },
    distanceKm: 9160, distanceLabel: 'about 9,160 km', durationMin: 446, durationLabel: 'about 7½ h, with a stop',
    note: 'Day one of supersonic passenger travel: 21 January 1976, with a stop in Dakar.', historic: true,
    sources: [{ label: 'This Day in Aviation', url: 'https://www.thisdayinaviation.com/21-january-1976/' }],
  },
  {
    id: 'mle-baa', plane: 'twinotter', airline: 'Trans Maldivian Airways', flight: '',
    from: { city: 'Malé', code: 'MLE', at: [4.1918, 73.5291] },
    to: { city: 'Baa Atoll', code: 'Baa', at: [5.15, 73.05] },
    distanceKm: 120, distanceLabel: 'about 120 km', durationMin: 33, durationLabel: 'about 30–35 min',
    note: 'No runway needed: it takes off and lands on the water.', historic: false,
    sources: [
      { label: 'Maldives.com', url: 'https://www.maldives.com/blog/travelling-by-seaplane-in-maldives' },
      { label: 'Trans Maldivian Airways', url: 'https://www.transmaldivian.com/66th-aircraft/' },
    ],
  },
  {
    id: 'sxm-sab', plane: 'twinotter', airline: 'Winair', flight: '',
    from: { city: 'Sint Maarten', code: 'SXM', at: [18.041, -63.1089] },
    to: { city: 'Saba', code: 'SAB', at: [17.6453, -63.2205] },
    distanceKm: 45, distanceLabel: 'about 45 km', durationMin: 15, durationLabel: 'about 15 min',
    note: "Saba's runway is only 400 m long, with cliffs at both ends.", historic: false,
    sources: [
      { label: 'Wikipedia: Juancho E. Yrausquin Airport', url: 'https://en.wikipedia.org/wiki/Juancho_E._Yrausquin_Airport' },
      { label: 'CNN Travel (via ABC 17)', url: 'https://abc17news.com/entertainment/cnn-style/2022/07/08/what-its-like-to-land-on-the-worlds-shortest-commercial-runway/' },
    ],
  },
  {
    id: 'wry-ppw', plane: 'islander', airline: 'Loganair', flight: '',
    from: { city: 'Westray', code: 'WRY', at: [59.3505, -2.9501] },
    to: { city: 'Papa Westray', code: 'PPW', at: [59.351, -2.9004] },
    distanceKm: 2.7, distanceLabel: '2.7 km', durationMin: 2, durationLabel: 'about 2 min',
    note: 'The shortest scheduled flight in the world.', historic: false,
    sources: [
      { label: 'Guinness World Records', url: 'https://www.guinnessworldrecords.com/world-records/63191-shortest-domestic-scheduled-flight' },
      { label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Westray_to_Papa_Westray_flight' },
    ],
  },
  {
    id: 'ivc-szs', plane: 'islander', airline: 'Stewart Island Flights', flight: '',
    from: { city: 'Invercargill', code: 'IVC', at: [-46.4124, 168.313] },
    to: { city: 'Stewart Island', code: 'SZS', at: [-46.8997, 168.101] },
    distanceKm: 56, distanceLabel: 'about 56 km', durationMin: 20, durationLabel: 'about 20 min',
    note: "Across Foveaux Strait to Stewart Island, New Zealand's third-biggest island.", historic: false,
    sources: [{ label: 'Wikipedia: Stewart Island Flights', url: 'https://en.wikipedia.org/wiki/Stewart_Island_Flights' }],
  },
]

export const ROUTE_BY_ID = Object.fromEntries(ROUTES.map((r) => [r.id, r])) as Record<string, Route>
