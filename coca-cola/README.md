# Coca-Cola Fan Site

An **unofficial** fan and educational website about Coca-Cola, built with Vite, React, and TypeScript.

> Not affiliated with, endorsed by, or sponsored by The Coca-Cola Company. All brand names are trademarks of their
> respective owners. The site uses no official logos or product photography: every can, bottle, and illustration is
> a generic SVG drawn in code, and the wordmark is set in the free *Leckerli One* script font.

## Pages

| Route | What it shows |
|---|---|
| `#/` | Home: a 3D wheel of the top 5 flavors, brand/company teasers, and a making-animation teaser |
| `#/flavors/:slug` | One page per flavor (`original`, `zero-sugar`, `diet-coke`, `cherry`, `vanilla`) with nutrition facts per 330 ml can |
| `#/brands` | Other drinks in the Coca-Cola family (Sprite, Fanta, Schweppes, …) with a category filter |
| `#/about` | General information about the company: key facts, the business model, and a history timeline |
| `#/how-its-made` | An animated, simplified cola → can production line |

## Run

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # outputs dist/ (relative base, so it works on any static host or sub-folder)
npm run preview
npm run lint
```

Routing uses `HashRouter`, so the static build needs no server rewrites.

## Structure

```
src/
  data/        flavors.ts · brands.ts · company.ts   (all site content lives here)
  components/  Can (shared parametric SVG can) · FlavorWheel · NutritionLabel · MakingAnimation · BrandCard · Timeline · Layout/Nav/Footer
  pages/       Home · Flavor · Brands · About · HowItsMade · NotFound
  styles/      tokens.css (design tokens) · global.css (base + utilities)
public/fonts/  self-hosted woff2 fonts with their OFL licenses (Leckerli One, Archivo, Inter)
```

## Content notes

- Nutrition values are **approximate, per 330 ml can**, taken from UK/EU on-pack labels. Recipes differ between countries.
- Brand ownership differs by country (e.g. Schweppes).
- All animations respect `prefers-reduced-motion`.
