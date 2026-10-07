import type { SiteConfig } from './types'

/** Site settings (Content-owned). Credits are explained in docs/CREDITS.md. */
export const SITE: SiteConfig = {
  signupEndpoint: null,
  contactEmail: '',
  social: [],
  defaultRoute: 'sin-jfk',
  credits: [
    { label: 'Earth imagery: NASA Visible Earth (Blue Marble, Black Marble), public domain', url: 'https://visibleearth.nasa.gov/' },
    { label: 'Earth texture files: three-globe examples (MIT)', url: 'https://github.com/vasturiano/three-globe' },
    { label: 'Map data: Natural Earth, public domain', url: 'https://www.naturalearthdata.com/' },
    { label: 'Airport locations: OurAirports, public domain', url: 'https://ourairports.com/data/' },
    { label: 'Fonts: Space Grotesk and Inter (SIL Open Font License)', url: 'https://fonts.google.com/' },
  ],
}
