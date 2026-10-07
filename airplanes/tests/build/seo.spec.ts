import { expect, test } from '@playwright/test'
import { COPY } from '../../src/data/copy'
import { FACTS, formatFact } from '../../src/data/facts'
import { PLANES } from '../../src/data/planes'
import { ROUTES } from '../../src/data/routes'

/**
 * SEO and no-JS: the prerendered HTML alone (JavaScript off) carries every word that matters
 * (CONTRACTS §13: index.html is prerendered).
 */
test.use({ javaScriptEnabled: false })

test('raw HTML has one h1, the section headings, every plane, route and fact number', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('h1')).toHaveCount(1)
  await expect(page.locator('h1')).toHaveText(COPY.hero.headline)
  const h2 = (await page.locator('h2').allTextContents()).map((t) => t.trim())
  for (const t of [COPY.globe.title, COPY.hangar.title, COPY.facts.title, COPY.signup.title]) expect(h2, `h2 "${t}"`).toContain(t)
  const text = ((await page.locator('body').textContent()) ?? '').replace(/\s+/g, ' ')
  const missing = [
    ...PLANES.map((p) => [`plane ${p.id}`, p.name]),
    ...ROUTES.flatMap((r) => [
      [`route ${r.id} from`, r.from.city],
      [`route ${r.id} to`, r.to.city],
    ]),
    ...FACTS.map((f) => [`fact ${f.id}`, formatFact(f.value, f.format)]),
    ['hero sub', COPY.hero.sub],
  ].filter(([, s]) => !text.includes(s))
  expect(missing.map(([k, s]) => `${k}: "${s}"`), 'words missing from the prerendered HTML').toEqual([])
})

test('lang, title, meta description and social tags', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(page).toHaveTitle(COPY.meta.title)
  const desc = await page.locator('meta[name=description]').getAttribute('content')
  expect(desc?.length ?? 0, 'meta description length').toBeGreaterThan(50)
  // Not a contract rule: search engines truncate after ~160 characters, so only note it.
  if (desc!.length > 160) test.info().annotations.push({ type: 'warning', description: `meta description is ${desc!.length} characters (search results cut at ~160)` })
  await expect(page.locator('meta[name=viewport]')).toHaveAttribute('content', /width=device-width/)
  await expect(page.locator('meta[property="og:title"]')).toHaveCount(1)
  await expect(page.locator('meta[property="og:image"]')).toHaveCount(1)
})

test('anchors work without JS and nothing covers the content', async ({ page }) => {
  await page.goto('/')
  for (const id of ['hero', 'climb', 'globe', 'airplanes', 'facts', 'signup', 'footer']) await expect(page.locator(`#${id}`), `#${id}`).toHaveCount(1)
  for (const id of ['cta-hero', 'cta-planes', 'nav-globe', 'nav-airplanes', 'nav-facts']) {
    const href = await page.getByTestId(id).getAttribute('href')
    expect(href, id).toMatch(/^#/)
    await expect(page.locator(href!), `${id} → ${href}`).toHaveCount(1)
  }
  await expect(page.getByTestId('loader'), 'without JS the loader must not cover the page').toBeHidden()
  await expect(page.getByTestId('hero-title')).toBeVisible()
})
