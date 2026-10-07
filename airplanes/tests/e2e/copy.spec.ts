import { expect, test } from '../fixtures'
import { LOADER_RE, PRD_COPY } from '../lib/prd'

/** Exact PRD copy on the rendered page. State-only lines are checked where the state is reached
 *  (sign-up, Lite, motion specs) and in src/data/copy.ts (tests/static/copy.spec.ts). */
test('PRD copy appears verbatim on the page @common', async ({ app, page }) => {
  const mode = await app.ready()
  const checks: [string, import('@playwright/test').Locator, string][] = [
    ['headline', page.getByTestId('hero-title'), PRD_COPY.headline],
    ['sub', page.getByTestId('hero-sub'), PRD_COPY.sub],
    ['hero CTA', page.getByTestId('cta-hero'), PRD_COPY.cta],
    ['nav CTA', page.getByTestId('cta-nav'), PRD_COPY.cta],
    ['secondary', page.getByTestId('cta-planes'), PRD_COPY.secondary],
    ['hangar title', page.locator('#airplanes h2:not(dialog h2)'), PRD_COPY.hangar],
    ['close-up', page.getByTestId('closeup-open'), PRD_COPY.closeup],
    ['facts title', page.locator('#facts h2'), PRD_COPY.facts],
    ['sign-up title', page.locator('#signup h2'), PRD_COPY.signup],
    ['sign-up button', page.getByTestId('signup-submit'), PRD_COPY.signupButton],
    ['motion toggle', page.getByTestId('motion-toggle'), PRD_COPY.pause],
  ]
  if (mode === '3d') checks.push(['globe hint', page.getByTestId('globe-hint'), PRD_COPY.globeHint])
  for (const [what, loc, text] of checks) {
    await expect(loc, what).toHaveCount(1)
    await expect(loc, what).toHaveText(text)
  }
  if (mode === 'lite') await expect(page.getByTestId('globe-hint')).toHaveText(/\S/)
  const loader = (await page.getByTestId('loader').textContent())?.trim() ?? ''
  expect(loader, 'loader text').toMatch(LOADER_RE)
})

test('one h1, and every section has its heading @common', async ({ app, page }) => {
  await app.ready()
  await expect(page.locator('h1')).toHaveCount(1)
  for (const id of ['globe', 'airplanes', 'facts', 'signup']) await expect(page.locator(`#${id} h2:not(dialog h2)`), `#${id} h2 (outside dialogs)`).toHaveCount(1)
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
})
