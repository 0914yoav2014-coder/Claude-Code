import type { SiteConfig } from './types'

/** Site settings (Content-owned). */
export const SITE: SiteConfig = {
  signupEndpoint: null,
  contactEmail: '',
  social: [],
  defaultRoute: 'sin-jfk',
  credits: [
    { label: 'Earth imagery: NASA Visible Earth (Blue Marble, Black Marble)', url: 'https://visibleearth.nasa.gov/' },
    { label: 'Map data: Natural Earth', url: 'https://www.naturalearthdata.com/' },
    { label: 'Fonts: Space Grotesk and Inter (SIL Open Font License)', url: 'https://fonts.google.com/' },
  ],
}
