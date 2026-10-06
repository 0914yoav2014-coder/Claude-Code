/* Airplanes Around the World — content.
 *
 * This is the one file to edit for copy and facts. Every figure carries a
 * `source`; each one still needs checking against the manufacturer or an
 * aviation authority before launch (see README → Launch checklist).
 */

window.CONFIG = {
  // POST endpoint for the email sign-up (Mailchimp, Buttondown, ConvertKit…).
  // While it is null the form validates and shows the success message, but sends nothing.
  signupEndpoint: null,
  // Route shown when the globe first loads (an id from ROUTES).
  defaultRoute: "sin-jfk",
  // Footer contact link; hidden while empty.
  contactEmail: "",
  // Footer social links, e.g. { label: "Instagram", url: "https://instagram.com/…" }; none shown while empty.
  social: [],
};

/* Six featured airplanes. `speed` is cruising speed (what airlines fly at),
 * not the absolute maximum. `route` links each airplane to its globe route. */
window.PLANES = [
  {
    id: "a350",
    name: "Airbus A350-900ULR",
    nickname: "The marathon flyer",
    maker: "Airbus",
    firstFlight: "2013 (ULR version: 2018)",
    speed: "903 km/h",
    passengers: "161",
    passengersNote: "on Singapore Airlines",
    fact: "No economy seats at all: just 67 in Business and 94 in Premium Economy.",
    story: "The \"ULR\" stands for Ultra Long Range. Extra fuel lets it fly nonstop for more than 18 hours, so Singapore Airlines uses it for the longest scheduled flight on Earth.",
    route: "sin-jfk",
    source: "https://thepointsguy.com/news/singapore-airlines-new-york-longest-flights",
  },
  {
    id: "a380",
    name: "Airbus A380",
    nickname: "The superjumbo",
    maker: "Airbus",
    firstFlight: "2005",
    speed: "903 km/h",
    passengers: "545",
    passengersNote: "typical, up to 853",
    fact: "Two full decks of passengers, nose to tail, under a 79.75 m wingspan.",
    story: "The biggest passenger airliner ever built. Airbus stopped making it in 2021, but airlines like Emirates still fly it on their longest routes.",
    route: "dxb-akl",
    source: "https://aircraft.airbus.com/en/aircraft/a380",
  },
  {
    id: "b747",
    name: "Boeing 747-8",
    nickname: "The jumbo jet",
    maker: "Boeing",
    firstFlight: "2011 (first 747: 1969)",
    speed: "917 km/h",
    passengers: "410",
    passengersNote: "in three classes",
    fact: "At 76.25 m from nose to tail, it is the longest airliner ever built.",
    story: "The famous hump holds an upper deck. The 747-8 is the last and longest version of the \"Queen of the Skies\"; the final one was delivered in 2023.",
    route: "fra-lax",
    source: "https://www.boeing.com/commercial/747",
  },
  {
    id: "concorde",
    name: "Concorde",
    nickname: "The supersonic jet",
    maker: "Aérospatiale / BAC",
    firstFlight: "1969 (in service 1976–2003)",
    speed: "2,179 km/h",
    passengers: "100",
    passengersNote: "",
    fact: "Cruising at 60,000 ft, passengers could see the curve of the Earth.",
    story: "Concorde flew at twice the speed of sound (Mach 2.04), so London to New York took about 3½ hours, half the time of other jets. It retired in 2003.",
    route: "lhr-jfk",
    source: "https://www.britishairways.com/content/information/about-ba/history-and-heritage/celebrating-concorde",
  },
  {
    id: "twinotter",
    name: "DHC-6 Twin Otter",
    nickname: "The seaplane",
    maker: "de Havilland Canada",
    firstFlight: "1965",
    speed: "337 km/h",
    passengersNote: "",
    passengers: "19",
    fact: "Floats instead of wheels: it takes off and lands on the lagoon.",
    story: "In the Maldives there is often no runway, just water. Trans Maldivian Airways flies a fleet of Twin Otters on floats, the largest seaplane fleet in the world, to island resorts.",
    route: "mle-baa",
    source: "https://hoteliermaldives.com/tma-expands-fleet-with-addition-of-60th-seaplane/",
  },
  {
    id: "islander",
    name: "Britten-Norman Islander",
    nickname: "The island hopper",
    maker: "Britten-Norman",
    firstFlight: "1965",
    speed: "~260 km/h",
    passengers: "8",
    passengersNote: "on Loganair",
    fact: "Loganair has flown it between two Scottish islands since 1967.",
    story: "The hop from Westray to Papa Westray in Orkney is the world's shortest scheduled flight: 2.7 km, about a minute and a half in the timetable.",
    route: "wry-ppw",
    source: "https://en.wikipedia.org/wiki/Westray_to_Papa_Westray_flight",
  },
];

/* Globe routes. Coordinates are [latitude, longitude] of each airport.
 * Routes shorter than ~250 km are drawn as a pin instead of an arc. */
window.ROUTES = [
  {
    id: "sin-jfk", plane: "a350", airline: "Singapore Airlines", flight: "SQ24",
    from: { city: "Singapore", code: "SIN", at: [1.364, 103.991] },
    to: { city: "New York", code: "JFK", at: [40.641, -73.778] },
    distance: "15,349 km", time: "about 18 h 40 min",
    note: "The longest scheduled flight in the world.",
  },
  {
    id: "dxb-akl", plane: "a380", airline: "Emirates", flight: "EK448",
    from: { city: "Dubai", code: "DXB", at: [25.253, 55.364] },
    to: { city: "Auckland", code: "AKL", at: [-37.008, 174.792] },
    distance: "14,200 km", time: "about 15 h 50 min",
    note: "Emirates' longest nonstop route, flown by its biggest airplane.",
  },
  {
    id: "fra-lax", plane: "b747", airline: "Lufthansa", flight: "LH456",
    from: { city: "Frankfurt", code: "FRA", at: [50.033, 8.57] },
    to: { city: "Los Angeles", code: "LAX", at: [33.942, -118.408] },
    distance: "about 9,300 km", time: "about 11 h 40 min",
    note: "Over Greenland and Canada on the way west.",
  },
  {
    id: "lhr-jfk", plane: "concorde", airline: "British Airways", flight: "BA001 (until 2003)",
    from: { city: "London", code: "LHR", at: [51.47, -0.454] },
    to: { city: "New York", code: "JFK", at: [40.641, -73.778] },
    distance: "about 5,550 km", time: "about 3 h 30 min",
    note: "Concorde's most famous route. Most jets today take 7 to 8 hours.",
  },
  {
    id: "mle-baa", plane: "twinotter", airline: "Trans Maldivian Airways", flight: "Resort transfer",
    from: { city: "Malé", code: "MLE", at: [4.192, 73.529] },
    to: { city: "Baa Atoll", code: "Baa", at: [5.15, 73.05] },
    distance: "about 115 km", time: "about 30–35 min",
    note: "Take-off and landing happen on water.",
  },
  {
    id: "wry-ppw", plane: "islander", airline: "Loganair", flight: "",
    from: { city: "Westray", code: "WRY", at: [59.35, -2.95] },
    to: { city: "Papa Westray", code: "PPW", at: [59.351, -2.9] },
    distance: "2.7 km", time: "about 1½ min",
    note: "The shortest scheduled flight in the world.",
  },
];

/* Fun facts: lead with the number, one line of explanation, one source. */
window.FACTS = [
  {
    number: "15,349", unit: "km",
    text: "Singapore to New York, the longest scheduled flight. It takes about 18 hours.",
    sourceLabel: "Flightradar24",
    source: "https://www.flightradar24.com/blog/longest-flights/",
  },
  {
    number: "53", unit: "seconds",
    text: "The fastest-ever hop from Westray to Papa Westray, the world's shortest flight.",
    sourceLabel: "Guinness World Records",
    source: "https://www.guinnessworldrecords.com/world-records/63191-shortest-domestic-scheduled-flight",
  },
  {
    number: "2:52:59", unit: "h:m:s",
    text: "Concorde's record New York to London crossing on 7 February 1996.",
    sourceLabel: "Guinness World Records",
    source: "https://www.guinnessworldrecords.com/world-records/fastest-flight-across-the-atlantic-in-a-commercial-aircraft",
  },
  {
    number: "853", unit: "people",
    text: "The most passengers an Airbus A380 is certified to carry at once.",
    sourceLabel: "Airbus",
    source: "https://aircraft.airbus.com/en/aircraft/a380",
  },
];
