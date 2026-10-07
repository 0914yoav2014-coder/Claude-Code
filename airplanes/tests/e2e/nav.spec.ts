import { expect, isTouchProject, test } from '../fixtures'
import { centerOf, touchScroll } from '../lib/input'

/** Start exploring (PRD F2), the hide-on-scroll nav and the mobile menu (CONTRACTS §6). */
async function endsInGlobeWindow(page: import('@playwright/test').Page) {
  await page.waitForFunction(() => {
    const a = (window as any).__aatw
    return document.documentElement.dataset.hold === 'globe' && (!a || !a.frame.flying)
  }, null, { timeout: 8_000 })
  await page.waitForTimeout(400)
  await expect(page.locator('html'), 'still in the globe window after the flight').toHaveAttribute('data-hold', 'globe')
}

test('hero "Start exploring" flies into the globe window and tracks start_exploring_click @common', async ({ app, page }) => {
  await app.ready()
  await page.getByTestId('cta-hero').click()
  await endsInGlobeWindow(page)
  const m = await app.markers()
  const y = await page.evaluate(() => window.scrollY)
  expect(y, 'landed inside [globe, globeOut]').toBeGreaterThanOrEqual(m.globe - 2)
  expect(y).toBeLessThanOrEqual(m.globeOut + 2)
  expect(await app.tracks()).toContainEqual(expect.objectContaining({ event: 'start_exploring_click', location: 'hero' }))
})

test('nav "Start exploring" flies into the globe window and tracks start_exploring_click @desktop', async ({ app, page }) => {
  await app.ready()
  await expect(page.getByTestId('cta-nav')).toBeVisible()
  await page.getByTestId('cta-nav').click()
  await endsInGlobeWindow(page)
  expect(await app.tracks()).toContainEqual(expect.objectContaining({ event: 'start_exploring_click', location: 'nav' }))
})

test('"Meet the airplanes" goes to the hangar window @common', async ({ app, page }) => {
  await app.ready()
  await page.getByTestId('cta-planes').click()
  await page.waitForFunction(() => document.documentElement.dataset.hold === 'hangar' && !(window as any).__aatw?.frame.flying, null, { timeout: 8_000 })
})

test('nav hides on scroll down and returns on scroll up @common', async ({ app, page }, info) => {
  await app.ready()
  const nav = page.getByTestId('nav')
  await expect(nav).toHaveAttribute('data-hidden', 'false')
  const at = { x: (page.viewportSize()?.width ?? 400) / 2, y: 120 }
  const scroll = async (dy: number) => {
    if (isTouchProject(info)) await touchScroll(page, at, dy)
    else {
      await page.mouse.move(at.x, at.y)
      for (let i = 0; i < 4; i++) {
        await page.mouse.wheel(0, dy / 4)
        await page.waitForTimeout(60)
      }
    }
    await page.waitForTimeout(700)
  }
  await scroll(900)
  expect(await page.evaluate(() => window.scrollY), 'the page scrolled down').toBeGreaterThan(300)
  await expect(nav).toHaveAttribute('data-hidden', 'true')
  await scroll(-300)
  await expect(nav).toHaveAttribute('data-hidden', 'false')
})

test.describe('mobile menu', () => {
  test('opens from the toggle, shows the links, closes after a choice @touch @narrow', async ({ app, page }) => {
    await app.ready()
    const toggle = page.locator('#nav button[aria-controls]')
    await expect(toggle).toBeVisible()
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await expect(toggle).toHaveAccessibleName(/menu/i)
    await expect(page.getByTestId('nav-globe')).toBeHidden()
    const box = await toggle.boundingBox()
    expect(Math.min(box!.width, box!.height), 'toggle is at least 44 px').toBeGreaterThanOrEqual(44)
    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')
    for (const id of ['nav-globe', 'nav-airplanes', 'nav-facts']) await expect(page.getByTestId(id)).toBeVisible()
    await app.shot('menu-open')
    await page.getByTestId('nav-airplanes').click()
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await page.waitForFunction(() => document.documentElement.dataset.hold === 'hangar', null, { timeout: 8_000 })
  })

  test('desktop shows the links and no menu toggle @desktop', async ({ app, page }) => {
    await app.ready()
    for (const id of ['nav-logo', 'nav-globe', 'nav-airplanes', 'nav-facts', 'cta-nav']) await expect(page.getByTestId(id)).toBeVisible()
    await expect(page.locator('#nav button[aria-controls]')).toBeHidden()
  })

  test('nav links point at the section anchors @common', async ({ app, page }) => {
    await app.ready()
    const hrefs = { 'nav-logo': '#hero', 'nav-globe': '#globe', 'nav-airplanes': '#airplanes', 'nav-facts': '#facts', 'cta-nav': '#globe', 'cta-hero': '#globe', 'cta-planes': '#airplanes' }
    for (const [id, href] of Object.entries(hrefs)) await expect(page.getByTestId(id), id).toHaveAttribute('href', href)
    expect(await centerOf(page.getByTestId('cta-hero'))).toBeTruthy()
  })
})
