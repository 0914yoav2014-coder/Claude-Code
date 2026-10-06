# Airplanes Around the World: landing page

A single, fast, mobile-friendly page where visitors spin a globe, follow six famous routes and meet the airplanes that fly them. Built to the PRD "Airplanes Around the World Landing Page" (Claude Docs).

**Status: preview.** All seven sections, the globe and the sign-up form work. Before launch, the facts need checking against their sources, and the email endpoint, contact address and privacy policy need filling in (checklist below).

## Run it

Plain static files, no build step, no dependencies:

```bash
cd airplanes && python3 -m http.server 8000   # → http://localhost:8000
```

To deploy, upload the folder to any static host (Cloudflare Pages, Netlify, Vercel, GitHub Pages). Serve it with gzip/brotli and long cache headers on `fonts/`; Lighthouse flags both when run against the bare Python server.

## Files

| File | What it is |
|---|---|
| `index.html` | The seven sections in order: nav, hero, globe, featured airplanes, fun facts, sign-up, footer. Meta description, Open Graph and Twitter tags |
| `data.js` | **The file to edit**: settings (`CONFIG`), the 6 airplanes, 6 routes and 4 fun facts, each with its source link |
| `styles.css` | Colour tokens (light and dark), type, layout from 360 px up, reduced-motion rules |
| `planes.js` | The six airplane illustrations, drawn as SVG in one flat style |
| `globe.js` | The interactive globe (canvas) and the flat-map fallback (SVG) |
| `main.js` | Nav, theme switch, cards, route panel, details dialog, sign-up form, analytics hook |
| `land.js` | Land outline as a 4.9 KB dot grid, generated from Natural Earth (public domain) |
| `privacy.html` | Plain-language **draft** privacy policy |
| `og-image.png` | 1200×630 share image for social posts |
| `fonts/` | Self-hosted Fredoka (headlines) and Inter (body), SIL Open Font License |

## How the globe works

- An orthographic projection drawn on `<canvas>`. Land is a grid of about 9,750 dots, so the far side is hidden by skipping dots that face away. It needs no WebGL and no map library.
- Routes are great-circle arcs, raised off the surface, with a small plane gliding along each one. Routes under ~220 km (Malé to Baa Atoll, Westray to Papa Westray) are drawn as pulsing pins.
- Drag (mouse or touch) or the arrow keys spin it. Tapping a route, or a button in the route list, shows that route's airplane, distance and flight time. The list carries the same information for keyboard and screen-reader users.
- With reduced motion turned on, or without canvas support, a static world map with the same routes replaces the globe (PRD F3).
- The globe starts only once its section is near the screen, after the hero has painted. It pauses when off screen or in a background tab.

## Analytics (F8)

`main.js` sends these events: `start_exploring_click` (with `location`: hero or nav), `globe_interact` (`drag`, `keys`, `route`, `list`, `card`), `plane_details_open`, `signup_success` and `signup_error`. Each one is pushed to `window.dataLayer` when it exists (Google Tag Manager) and fired as an `aatw:track` DOM event, so any analytics tool can pick them up. No analytics script is included yet.

## PRD coverage

| ID | Requirement | Priority | Status |
|---|---|---|---|
| F1 | Start exploring in hero and nav, both going to the globe | Must | Done |
| F2 | Globe auto-rotates, drag to spin, tap a route for airplane, distance, time | Must | Done |
| F3 | Static map when the globe can't run (no canvas, reduced motion) | Must | Done |
| F4 | 6 airplane cards; tapping opens more details | Must | Done (details dialog, plus "See its route") |
| F5 | Email sign-up with checking and clear success/error messages | Must | Done on the page. Until `CONFIG.signupEndpoint` is set, it checks the address and then tells the visitor sign-ups aren't switched on yet |
| F6 | Layout from 360 px phones to wide desktops | Must | Done, checked at 360, 768 and 1440 px |
| F7 | Fun facts with a source link under each stat | Should | Done |
| F8 | Track Start exploring, globe use, sign-ups | Should | Events wired up; no analytics tool connected |
| F9 | Search an airplane or city | Could | Not built |
| F10 | Light and dark mode switch | Could | Done (follows the device setting until switched) |
| F11 | Optional jet sound | Could | Not built |

Checked in Chromium on 2026-10-06. Lighthouse (mobile, simulated throttling) scored Performance 99, Accessibility 100, Best Practices 100, SEO 100: LCP 2.0 s, total blocking time 20 ms, CLS 0. The first load is about 169 KB including fonts, against a 1.5 MB budget.

## Assumptions (answers to the PRD's open questions)

- **Website, not a game or app.** Start exploring scrolls to the globe, as F1 describes.
- **No logo or palette existed**, so this uses the PRD's colours: sky blue, sunset orange, white and light grey. The wordmark is a globe with a small orange plane.
- **The six airplanes** were chosen to cover the extremes: A350-900ULR (longest flight), A380 (biggest), 747-8 (longest airliner), Concorde (fastest), Twin Otter (seaplane) and Islander (shortest flight). Swap any of them in `data.js`. `planes.js` would need a new drawing for a new type.
- **Visitors may be under 13**, so the form asks people to confirm they're 13+ or have a parent's OK, and the privacy draft covers deletion on a parent's request. Have this checked against COPPA before collecting emails from children.
- **"Top speed" on the cards is cruising speed**, the figure airlines publish and fly at. Absolute maximum speeds are rarely published and vary by version.

## Launch checklist

**Facts.** The build environment could not open the source pages; the figures came from search results. Check each one against its source before launch (PRD: "every stat … is checked before launch").

| Figure | Where it appears | Check against |
|---|---|---|
| SIN to JFK 15,349 km, ~18 h 40 min, SQ24, A350-900ULR with 161 seats (67 Business, 94 Premium Economy) | route, card, fact | [Flightradar24](https://www.flightradar24.com/blog/longest-flights/), Singapore Airlines |
| Westray to Papa Westray 2.7 km, ~1½ min scheduled, 53 s record, Islander with 8 seats, since 1967 | route, card, fact | [Guinness World Records](https://www.guinnessworldrecords.com/world-records/63191-shortest-domestic-scheduled-flight), Loganair |
| Concorde record 2 h 52 min 59 s (7 Feb 1996), Mach 2.04 / 2,179 km/h, 60,000 ft, 100 passengers | card, fact, dialog | [Guinness World Records](https://www.guinnessworldrecords.com/world-records/fastest-flight-across-the-atlantic-in-a-commercial-aircraft), British Airways |
| A380: 545 typical / 853 maximum passengers, 79.75 m wingspan, 903 km/h, production ended 2021 | card, fact, dialog | [Airbus](https://aircraft.airbus.com/en/aircraft/a380) |
| DXB to AKL 14,200 km, ~15 h 50 min, EK448 | route | Emirates |
| 747-8: 76.25 m long, ~410 seats in 3 classes, 917 km/h, last delivery 2023; FRA to LAX ~9,300 km, ~11 h 40 min, LH456 | card, route, dialog | Boeing, Lufthansa |
| Twin Otter: 19 passengers, 337 km/h (182 kt, Series 400 on wheels); Trans Maldivian has the largest seaplane fleet; Malé to Baa ~115 km, 30–35 min | card, route, dialog | de Havilland Canada, Trans Maldivian Airways |
| Islander ~260 km/h cruise (depends on version) | card | Britten-Norman |

**Integrations**
- [ ] `CONFIG.signupEndpoint` in `data.js`: connect the email tool. The form POSTs JSON with `email`, `ageConfirmed`, `consentText` and a timestamp. Double opt-in is recommended.
- [ ] `CONFIG.contactEmail`: the footer Contact link stays hidden until this is set.
- [ ] `CONFIG.social`: add social links; none show until then.
- [ ] Connect an analytics tool (see Analytics above).

**Legal**
- [ ] Have `privacy.html` reviewed; add the operator's name and a contact address.
- [ ] Confirm the under-13 approach (COPPA) before collecting children's emails.

**QA**
- [ ] Test on a real iPhone (Safari) and an Android phone: drag the globe, open a card, sign up.
- [ ] Re-run Lighthouse on the live host (target: 90+ on mobile).
