/**
 * Content contract (Lead-owned). Content fills src/data/*.ts with values of these types; UI and 3D
 * read them. Numbers are numbers (count-ups animate them); labels are what the page prints.
 * Every figure needs a source the README can list for checking before launch.
 */

export type PlaneId = 'a350' | 'a380' | 'b747' | 'concorde' | 'twinotter' | 'islander'

export interface Source {
  label: string
  url: string
}

/** Shape hints the 3D models are built from (real proportions; Content verifies the numbers). */
export interface PlaneShape {
  lengthM: number
  spanM: number
  heightM: number
  /** Fuselage diameter (widest), metres. */
  fuselageM: number
  engines: 2 | 4
  engineType: 'turbofan' | 'turboprop' | 'piston' | 'turbojet'
  wing: 'low' | 'high' | 'delta'
  gear: 'retractable' | 'fixed' | 'floats'
  /** Full-length passenger decks. */
  decks: 1 | 2
  /** 747-style upper-deck hump over the front of the fuselage. */
  hump: boolean
  /** Wingtip style. */
  tips: 'sharklet' | 'raked' | 'winglet' | 'plain'
}

export interface Plane {
  id: PlaneId
  /** Full name, e.g. "Airbus A350-900ULR". */
  name: string
  /** Name without the maker for buttons, e.g. "A350-900ULR" ("Meet the A350-900ULR"). */
  shortName: string
  /** e.g. "The marathon flyer". */
  nickname: string
  maker: string
  firstFlight: string
  /** Cruising speed in km/h (what airlines fly at, not the absolute maximum). */
  cruiseKmh: number
  /** Passengers in the configuration named by passengersNote. */
  passengers: number
  passengersNote: string
  /** One line, leads with a number where possible. */
  fact: string
  /** Two or three short sentences for the close-up / details. */
  story: string
  /** Ids of this plane's routes on the globe (two per plane). */
  routes: string[]
  shape: PlaneShape
  sources: Source[]
}

export interface Airport {
  city: string
  /** IATA code (or a short label when there is none). */
  code: string
  /** [latitude, longitude] in degrees. */
  at: [number, number]
}

export interface Route {
  id: string
  plane: PlaneId
  airline: string
  /** Flight number, or '' when none applies. */
  flight: string
  from: Airport
  to: Airport
  distanceKm: number
  /** As printed, e.g. "15,349 km" or "about 115 km". */
  distanceLabel: string
  durationMin: number
  /** As printed, e.g. "about 18 h 40 min". */
  durationLabel: string
  /** One short line shown in the info panel. */
  note: string
  /** True for routes no longer flown (e.g. Concorde). */
  historic: boolean
  sources: Source[]
}

export interface Fact {
  id: string
  /** Final number the count-up lands on. For 'hms' it is total seconds. */
  value: number
  /** 'int' prints 15,349; 'hms' prints 2:52:59. */
  format: 'int' | 'hms'
  unit: string
  text: string
  source: Source
}

export interface SiteConfig {
  /** POST endpoint for the email sign-up; null = not connected yet (the form says so honestly). */
  signupEndpoint: string | null
  /** Footer contact address; the link is hidden while empty. */
  contactEmail: string
  social: { label: string; url: string }[]
  /** Route selected when the globe first appears. */
  defaultRoute: string
  /** Credits printed in the footer (textures, map data, fonts). */
  credits: Source[]
}
