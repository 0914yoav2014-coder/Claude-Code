import AxeBuilder from '@axe-core/playwright'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { ROUTES } from '../../src/data/routes'
import { expect, test, type App } from '../fixtures'

/** Accessibility (PRD, WCAG 2.1 AA; CONTRACTS §3.7): axe in each state and a keyboard walkthrough. */
async function axe(app: App, state: string) {
  const r = await new AxeBuilder({ page: app.page as any }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
  const out = join(dirname(app.info.config.configFile ?? process.cwd() + '/x'), 'test-results', 'axe', app.info.project.name, `${state}.json`)
  mkdirSync(dirname(out), { recursive: true })
  writeFileSync(out, JSON.stringify({ violations: r.violations, incomplete: r.incomplete.map((i) => ({ id: i.id, impact: i.impact, nodes: i.nodes.length })) }, null, 2))
  const fmt = (v: (typeof r.violations)[number]) => `${v.id} (${v.impact}): ${v.help} → ${v.nodes.slice(0, 4).map((n) => n.target.join(' ')).join(', ')}${v.nodes.length > 4 ? ` +${v.nodes.length - 4}` : ''}`
  const minor = r.violations.filter((v) => v.impact !== 'serious' && v.impact !== 'critical')
  if (minor.length) app.info.annotations.push({ type: `axe ${state} (moderate/minor)`, description: minor.map(fmt).join('\n') })
  const bad = r.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map(fmt)
  expect.soft(bad, `axe serious/critical violations — state "${state}" (details: test-results/axe/${app.info.project.name}/${state}.json)`).toEqual([])
}

test.describe('axe', () => {
  test('initial page @common', async ({ app }) => {
    await app.ready()
    await axe(app, 'initial')
  })

  test('globe with a route panel open @common', async ({ app, page }) => {
    await app.ready()
    await app.scrollToKey('globe', 10)
    await page.locator(`[data-testid=route-list] button[data-route="${ROUTES[1].id}"]`).click()
    await expect(page.getByTestId('route-panel')).toBeVisible()
    await axe(app, 'globe-panel')
  })

  test('hangar @common', async ({ app }) => {
    await app.ready()
    await app.scrollToKey('hangar', 10)
    await axe(app, 'hangar')
  })

  test('close-up open @common', async ({ app, page }) => {
    await app.ready()
    await app.scrollToKey('hangar', 10)
    await page.getByTestId('closeup-open').click()
    await expect(page.getByTestId('closeup')).toBeVisible()
    await axe(app, 'closeup')
  })

  test('sign-up error @common', async ({ app, page }) => {
    await app.ready()
    await page.getByTestId('signup-email').fill('pilot@example')
    await page.getByTestId('signup-submit').click()
    await expect(page.getByTestId('signup-status')).toHaveAttribute('data-state', 'invalid')
    await axe(app, 'signup-error')
  })
})

interface Stop {
  id: string
  label: string
  inView: boolean
  ring: boolean
  focusVisible: boolean
}

test('keyboard: Tab reaches every control in order, each with a visible focus ring @desktop', async ({ app, page }) => {
  test.setTimeout(90_000)
  await app.ready()
  const stops: Stop[] = []
  for (let i = 0; i < 110; i++) {
    await page.keyboard.press('Tab')
    await page.waitForTimeout(30)
    const s = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null
      if (!el || el === document.body) return null
      const cs = getComputedStyle(el)
      const r = el.getBoundingClientRect()
      const ring = (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) >= 2) || (cs.boxShadow !== 'none' && cs.boxShadow !== '')
      return {
        id: el.dataset.testid ?? (el.dataset.route ? `route:${el.dataset.route}` : el.id || `${el.tagName.toLowerCase()}[${el.getAttribute('href') ?? el.getAttribute('type') ?? ''}]`),
        label: (el.getAttribute('aria-label') ?? el.textContent ?? '').trim().slice(0, 40),
        inView: r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < window.innerHeight && r.right > 0 && r.left < window.innerWidth,
        ring,
        focusVisible: el.matches(':focus-visible'),
      }
    })
    if (!s) break
    if (stops.length && s.id === stops[0].id) break
    stops.push(s)
  }
  test.info().annotations.push({ type: 'tab order', description: stops.map((s) => s.id).join(' → ') })
  const order = stops.map((s) => s.id)
  const must = ['nav-logo', 'cta-nav', 'cta-hero', 'cta-planes', 'globe-stage', `route:${ROUTES[0].id}`, 'plane-prev', 'plane-next', 'closeup-open', 'fact-source', 'signup-email', 'signup-submit', 'motion-toggle']
  expect(must.filter((id) => !order.includes(id)), 'controls never reached by Tab').toEqual([])
  const idx = (id: string) => order.indexOf(id)
  expect(idx('cta-hero'), 'hero before the globe').toBeLessThan(idx('globe-stage'))
  expect(idx('globe-stage'), 'globe before the hangar').toBeLessThan(idx('plane-next'))
  expect(idx('plane-next'), 'hangar before the sign-up').toBeLessThan(idx('signup-email'))
  const invisible = stops.filter((s) => !s.inView).map((s) => s.id)
  expect(invisible, 'focused but off screen').toEqual([])
  const noRing = stops.filter((s) => !s.ring || !s.focusVisible).map((s) => `${s.id} (ring ${s.ring}, :focus-visible ${s.focusVisible})`)
  expect(noRing, 'focused without a visible focus indicator').toEqual([])
})

test('keyboard: skip link, routes, planes, close-up and the motion toggle work without a mouse @desktop', async ({ app, page }) => {
  await app.ready()
  await page.keyboard.press('Tab')
  const skip = page.locator('a[href="#main"]')
  await expect(skip, 'first Tab lands on the skip link').toBeFocused()
  await expect(skip).toBeInViewport()

  const route = page.locator(`[data-testid=route-list] button[data-route="${ROUTES[2].id}"]`)
  await route.focus()
  await page.keyboard.press('Enter')
  await expect(route).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByTestId('route-panel')).toHaveAttribute('data-route', ROUTES[2].id)

  await page.getByTestId('plane-next').focus()
  await page.keyboard.press('Enter')
  await expect(page.getByTestId('plane-count')).toHaveText(/^2 of /)

  const open = page.getByTestId('closeup-open')
  await open.focus()
  await page.keyboard.press('Enter')
  const dialog = page.getByTestId('closeup')
  await expect(dialog).toBeVisible()
  for (let i = 0; i < 4; i++) {
    await page.keyboard.press('Tab')
    // A modal <dialog> lets Tab leave to the browser's own UI (activeElement = body), never to the page behind it.
    const where = await page.evaluate(() => {
      const a = document.activeElement
      return !a || a === document.body ? 'browser' : a.closest('[data-testid=closeup]') ? 'dialog' : (a as HTMLElement).dataset.testid ?? a.tagName
    })
    expect(['dialog', 'browser'], `focus stays inside the close-up (went to ${where})`).toContain(where)
  }
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(open).toBeFocused()

  const toggle = page.getByTestId('motion-toggle')
  await toggle.focus()
  await page.keyboard.press('Space')
  await expect(toggle).toHaveAttribute('aria-pressed', 'true')
})
