/**
 * Exact copy from the PRD ("PRD: Airplanes Around the World Landing Page", rev 25), as listed in the QA
 * brief. The page (or src/data/copy.ts for state-only messages) must contain each line verbatim.
 * N% stands for the live percentage.
 */
export const PRD_COPY = {
  headline: 'Every airplane has a story. See where they fly.',
  sub: 'Fly through the clouds, spin the planet, and meet the airplanes that connect it.',
  cta: 'Start exploring',
  secondary: 'Meet the airplanes',
  globeHint: 'Drag to spin · Tap a route to fly there',
  hangar: 'The hangar',
  closeup: 'Take a closer look',
  facts: 'Numbers from 35,000 feet',
  signup: 'A new airplane every week',
  signupButton: 'Send me airplanes',
  pause: 'Pause animation',
  play: 'Play animation',
  loader: 'Preparing for takeoff… N%',
  success: "You're on board! Your first airplane lands in your inbox this week.",
  invalid: 'That email looks incomplete. Check for a missing @ or dot, then try again.',
  offline: 'We lost the signal. Check your internet connection and try again.',
  lite: 'Showing the lighter version so everything runs smoothly on this device.',
} as const

/** "Preparing for takeoff… 42%" (Unicode ellipsis, no space before %). */
export const LOADER_RE = /^Preparing for takeoff… (\d{1,3})%$/
