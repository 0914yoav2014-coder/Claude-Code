/**
 * Every word on the page (Content-owned). Strings marked PRD are verbatim from the PRD's Copy
 * section and must not change without the PRD changing. Keep lines over 3D scenes short: at most
 * two short lines of text over any scene, one button per screen.
 */
export const COPY = {
  meta: {
    title: 'Airplanes Around the World: see where famous airplanes fly',
    description:
      'Fly through sunset clouds, spin a photo-real Earth with 12 famous routes, and meet 6 airplanes in a 3D hangar, from a 2-minute island hop to an 18-hour marathon.',
  },
  brand: { name: 'Airplanes Around the World', short: 'Airplanes', accent: 'Around the World' },
  nav: {
    globe: 'Globe',
    airplanes: 'Airplanes',
    facts: 'Fun facts',
    cta: 'Start exploring', // PRD
    menuOpen: 'Open menu',
    menuClose: 'Close menu',
  },
  hero: {
    headline: 'Every airplane has a story. See where they fly.', // PRD option A (recommended)
    sub: 'Fly through the clouds, spin the planet, and meet the airplanes that connect it.', // PRD
    cta: 'Start exploring', // PRD
    secondary: 'Meet the airplanes', // PRD
  },
  climb: {
    line: 'Up through the clouds. The whole world is waiting.',
  },
  globe: {
    eyebrow: '12 famous routes',
    title: 'One planet, 12 flights',
    hint: 'Drag to spin · Tap a route to fly there', // PRD
    listTitle: 'All routes',
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
    stageLabel: 'Interactive globe with 12 routes. Drag to spin it, use the arrow keys to turn it and the plus and minus keys to zoom. Every route is also in the list.',
    panel: {
      distance: 'Distance',
      time: 'Flight time',
      airline: 'Airline',
      close: 'Close route details',
      meet: 'Meet the {plane}',
      historic: 'No longer flown',
    },
  },
  hangar: {
    eyebrow: '6 airplanes',
    title: 'The hangar', // PRD
    closeup: 'Take a closer look', // PRD
    closeupClose: 'Return to the hangar',
    prev: 'Show the previous airplane',
    next: 'Show the next airplane',
    count: '{n} of {total}',
    stageLabel: 'Airplane on a turntable. Drag to turn it, and use the arrow keys or the buttons to switch airplanes.',
    stats: { speed: 'Cruising speed', passengers: 'Passengers', length: 'Length', span: 'Wingspan' },
    seeRoute: 'See its routes',
  },
  facts: {
    eyebrow: 'Fun facts',
    title: 'Numbers from 35,000 feet', // PRD
    source: 'Source: {label}',
  },
  signup: {
    title: 'A new airplane every week', // PRD
    sub: 'One short email: one airplane, one route, one fact you can tell your friends. Unsubscribe any time.',
    label: 'Email address',
    placeholder: 'you@example.com',
    button: 'Send me airplanes', // PRD
    age: "I'm 13 or older, or a parent or guardian said it's OK.",
    fine: 'We only keep your email address. Read the privacy policy.',
    sending: 'Sending…',
    success: "You're on board! Your first airplane lands in your inbox this week.", // PRD
    invalid: 'That email looks incomplete. Check for a missing @ or dot, then try again.', // PRD
    offline: 'We lost the signal. Check your internet connection and try again.', // PRD
    error: 'Something went wrong on our side. Please try again in a minute.',
    ageMissing: 'Please tick the box to confirm your age, or ask a parent first.',
    /** No email service connected yet: honest instead of the PRD success line. */
    disabled: "Test flight complete! Sign-ups aren't switched on yet, so your email wasn't saved.",
  },
  loader: {
    progress: 'Preparing for takeoff… {n}%', // PRD
  },
  motion: {
    pause: 'Pause animation', // PRD
    play: 'Play animation', // PRD
  },
  lite: {
    notice: 'Showing the lighter version so everything runs smoothly on this device.', // PRD
    tryFull: 'Try the full 3D version',
  },
  search: {
    noResults: 'No airplanes or cities match "{q}". Try a city like Tokyo.', // PRD (F13, not built)
  },
  footer: {
    about: 'A fun, visual place to see which airplanes fly where. Made for aviation fans, curious travelers, students and teachers.',
    links: { about: 'About', contact: 'Contact', privacy: 'Privacy policy' },
    copyright: '© {year} Airplanes Around the World.',
  },
} as const

/** Fills {name} placeholders: fill(COPY.loader.progress, { n: 64 }). */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => String(values[k] ?? `{${k}}`))
}
