/**
 * Design tokens shared by CSS (src/styles/tokens.css mirrors these) and the 3D code.
 * From the PRD: night navy for space and the footer, sky blue for links and highlights,
 * sunset orange for buttons only, cloud white for text on dark scenes.
 */
export const COLORS = {
  navy: '#0B1426',
  sky: '#4DA3FF',
  sunset: '#FF8A3D',
  cloud: '#F5F8FC',
  /** Muted text on navy (about 9:1 on #0B1426). */
  mist: '#A9B8CF',
  /** City-light tint on the globe's night side. */
  cityLight: '#FFB36B',
} as const

/** Contrast notes: navy on sunset ≈ 7.8:1 (button labels are navy); white on sunset ≈ 2.2:1 (never). */
export const TYPE = {
  display: '"Space Grotesk", "Segoe UI", system-ui, sans-serif',
  body: '"Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  /** Hero headline: 72 px desktop, 40 px phones. */
  heroMin: 40,
  heroMax: 72,
} as const

/** Motion timings from the PRD's animation list (ms). All motion eases out. */
export const MOTION = {
  loaderMax: 3000,
  heroIntro: 2500,
  heroLoop: 8000,
  parallaxFollow: 600,
  routeDraw: 1200,
  routeStagger: 150,
  routeFly: 1000,
  hangarSwitch: 800,
  cardHover: 300,
  countUp: 1500,
  paperPlane: 1200,
  buttonHover: 200,
  reducedFade: 250,
} as const
