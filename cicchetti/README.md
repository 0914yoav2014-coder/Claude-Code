# Cicchetti — website (preview build)

Single-page, bilingual (EN/HE) site for Cicchetti, 58 Yehuda HaLevi Street, Tel Aviv, built to the Master Creative & Technical Brief.

**Status: preview.** Structure, design system, motion, i18n and interactions are production-ready. **Content is not**: photography, menu, hours, reviews and the booking URL still need to come from the venue. A green banner and "Sample" tags make that obvious on screen. Both disappear once `CONFIG.draft` is set to `false`.

## Run it

It's plain static files with no build step and no dependencies:

```bash
cd cicchetti && python3 -m http.server 8000   # → http://localhost:8000  (?lang=he for Hebrew)
```

To deploy, upload the folder to any static CDN host (Cloudflare Pages, Netlify, Vercel).

## Files

| File | What it is |
|---|---|
| `index.html` | Semantic markup. English copy inline for SEO and no-JS. `Restaurant` JSON-LD, OG/Twitter meta |
| `content.js` | **The only file staff need to edit**: config, hours, menu, drinks, gallery, reviews, EN + HE strings |
| `styles.css` | Palette tokens, type scale, layout (logical properties → Hebrew mirrors the grid), motion |
| `main.js` | Nav, tabs, lightbox, carousel, parallax, reveals, form, language toggle (~10 KB, vanilla) |
| `fonts/` | Self-hosted variable fonts: Fraunces, Inter, Frank Ruhl Libre, Assistant (SIL OFL, licences included) |

## Launch checklist (brief §13, and what this build still needs)

**Facts. Verify each with the venue or its live Google Business Profile on launch day.**
- [ ] `CONFIG.bookingUrl`: Ontopo is confirmed, but the button points at the Ontopo home page (`https://ontopo.com/`) until the restaurant's own Ontopo page URL is supplied
- [ ] `hours.rows`: approximate ranges from research, **not confirmed**. Then set `hours.verify: false`
- [x] Dine-in, self-pickup and delivery: client-confirmed, shown in the location card with the ₪100–200 price range
- [ ] Accessibility: the Google listing says wheelchair accessible, but the earlier brief said there is **no wheelchair-accessible restroom** (heritage building). The copy says "wheelchair accessible" and asks guests with specific needs to call ahead. Confirm the restroom situation with the venue and state it plainly
- [ ] Add confirmed hours to the JSON-LD (`openingHoursSpecification`) in `index.html`

**Content. None of this may be invented (brief §2).**
- [ ] Menu: replace all sample dishes in `content.js → menu` (all tagged `sample: true`). The dinner tab now features focaccia, gnocchi, carbonara, shrimp, crudo, wood-fired pizza and tiramisù as asked; confirm each against the current menu at cicchettitlv.com
- [ ] Signature drinks: get Avi Kashi's real list (`drinks`, all samples)
- [ ] Chef quote: source a real line from Michael Gartofsky (`chef.quote`, currently "coming soon")
- [ ] Reviews: add 4–6 real, permissioned excerpts to `reviews` (empty on purpose. The section shows a holding line until then)
- [ ] Rating: `CONFIG.rating` holds the client-supplied Google figures (4.5★, 4,409 reviews). Re-check on launch day, and ideally feed it from a deploy-time job. `AggregateRating` stays out of JSON-LD (Google ignores self-published ratings)
- [ ] Photography: replace every placeholder frame. Each slot is captioned with its shot-list brief. Add `src`/`alt` in `content.js` (gallery, dishes). The concept image and portraits are in `index.html`
- [ ] Hero loop: set `CONFIG.heroVideo` (8–14 s, muted, < 6 MB, with poster). Shoot a vertical crop for mobile too
- [ ] `media/og-image.jpg`: a real hero frame for WhatsApp/Instagram previews
- [ ] Hebrew copy: written natively (not machine-translated), but **needs sign-off from a native Hebrew copywriter**
- [ ] Spelling check: "Kashi" (per venue materials) vs. "Kashy"

**Integrations**
- [ ] `CONFIG.amiciEndpoint`: connect Klaviyo/Mailchimp (the form POSTs JSON including consent text, timestamp and language, for consent logging). Double opt-in recommended
- [ ] Privacy policy page, then link it from the footer "Privacy" link. The consent box is unchecked by default and required (Israeli anti-spam law)
- [ ] Optional: `CONFIG.googleMapsApiKey` → palette-styled Google map (geocodes the address). Without a key, the designed location card renders

**QA**
- [ ] Set `CONFIG.draft = false`
- [ ] Lighthouse mobile ≥ 90 perf / ≥ 95 a11y. Real Safari iOS test. End-to-end booking click-through

## Headline alternates (brief §4: three per headline, client picks)

| Slot | Current | Alt 1 | Alt 2 | Alt 3 |
|---|---|---|---|---|
| Hero | Small plates. Big appetite. | A glass, a bite, another. | Venice by way of Yehuda HaLevi. | Come for one. Stay for the table. |
| Concept | Not exactly a restaurant. Nor a wine bar. | A Venetian habit, Tel Aviv hours. | We kept the habit and lost the rules. | Somewhere between the bar and the table. |
| Menu | A little at a time. | Whatever the sea gave us this morning. | Order a few. Then a few more. | Small plates, seasonal minds. |
| Chef & Bar | Two people, one table. | The kitchen and the bar. | Simple, precise, and a bit of booze. | Who's cooking, who's pouring. |
| Gallery | Warm light, low hum. | The five minutes before dinner. | Stone walls, loud tables. | An old house, a new evening. |
| Reviews | What people say on the way out. | Overheard at the door. | In our guests' words. | The table talks. |
| Amici | The table's always a little warmer for friends. | First to know, first to sit. | A small club for regulars-to-be. | Friends of the house. |

## Where this build departs from the brief, and why

- **No Astro/Next, GSAP or Lenis.** For one page, vanilla HTML/CSS/JS gives the lowest possible load cost (no framework runtime, ~10 KB of script, ~260 KB of fonts split by language). The motion spec (expo-out reveals with 60–100 ms stagger, 0.9× hero parallax, 1.04 hover scale, reduced-motion fallbacks) is implemented natively. If the venue wants a CMS, `content.js` maps 1:1 onto a Sanity schema or an Astro content collection.
- **Terracotta contrast.** Terracotta on cream measures **4.24:1**, which fails AA for body text. Buttons use 19 px semibold labels (WCAG "large text", 3:1 threshold), and small terracotta text uses a darker `#9A4424` (5.70:1). Brass is decorative only (2.8:1).
- **Fraunces tuning.** The brief suggests a tight display optical size. At light weights Fraunces' maximum optical size turns the "e" crossbar into a hairline ("platcs"), so display type is set at weight ~380–400 with a moderate optical size.
- **Map.** A default-styled iframe is out per the brief. Without an API key, an abstract, palette-matched location card renders (it is not a street-accurate map). With a key, a styled Google map loads.
