import { COPY } from '../../src/data/copy'
import { FACTS, formatFact } from '../../src/data/facts'
import { expect, test } from '../fixtures'
import { PRD_COPY } from '../lib/prd'

/** Fun facts (PRD F10) and the sign-up (PRD F8; CONTRACTS §6, §12). */
async function scrollToId(app: import('../fixtures').App, id: string, offset = -80) {
  const y = await app.page.evaluate((i) => document.getElementById(i)!.getBoundingClientRect().top + window.scrollY, id)
  await app.scrollTo(Math.max(0, y + offset))
}

test.describe('facts', () => {
  test('four facts count up to their final values, with https sources @common', async ({ app, page }) => {
    await app.ready()
    await scrollToId(app, 'facts')
    const items = page.getByTestId('fact')
    await expect(items).toHaveCount(FACTS.length)
    for (const [i, f] of FACTS.entries()) {
      const n = items.nth(i).getByTestId('fact-number')
      await expect(n, `fact ${f.id} data-value`).toHaveAttribute('data-value', String(f.value))
      await expect(n, `fact ${f.id} ends at ${formatFact(f.value, f.format)}`).toHaveText(formatFact(f.value, f.format), { timeout: 6_000 })
      const a = items.nth(i).getByTestId('fact-source')
      await expect(a).toHaveAttribute('href', f.source.url)
      expect(new URL((await a.getAttribute('href'))!).protocol).toBe('https:')
      if ((await a.getAttribute('target')) === '_blank') await expect(a).toHaveAttribute('rel', /noopener/)
    }
  })

  test('the count-up starts below the final value when motion is on @desktop', async ({ app, page }) => {
    await app.ready()
    const firstSeen = await page.evaluate(async () => {
      const el = document.getElementById('facts')!
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: 'instant' as ScrollBehavior })
      await new Promise((r) => setTimeout(r, 150))
      return [...document.querySelectorAll('[data-testid=fact-number]')].map((n) => ({ text: n.textContent ?? '', value: Number(n.getAttribute('data-value')) }))
    })
    const parse = (t: string) => (t.includes(':') ? t.split(':').reduce((s, v) => s * 60 + Number(v), 0) : Number(t.replace(/,/g, '')))
    const below = firstSeen.filter((f) => parse(f.text) < f.value)
    expect(below.length, `numbers 150 ms after the facts came into view: ${firstSeen.map((f) => f.text).join(', ')}`).toBeGreaterThan(0)
  })
})

test.describe('sign-up', () => {
  const email = (page: import('@playwright/test').Page) => page.getByTestId('signup-email')
  const status = (page: import('@playwright/test').Page) => page.getByTestId('signup-status')
  const age = (page: import('@playwright/test').Page) => page.getByTestId('signup-form').getByRole('checkbox')
  const submit = (page: import('@playwright/test').Page) => page.getByTestId('signup-submit')

  async function openSignup(app: import('../fixtures').App, set: Record<string, string | null> = {}) {
    await app.open({ set })
    await scrollToId(app, 'signup')
    await expect(submit(app.page)).toHaveText(PRD_COPY.signupButton)
    await expect(status(app.page)).toHaveAttribute('role', 'status')
    await expect(status(app.page)).toHaveAttribute('data-state', 'idle')
  }

  test('an email with a typo gets the PRD message @desktop', async ({ app, page }) => {
    await openSignup(app)
    for (const typo of ['pilot@example', 'pilot.example.com', 'pilot@@example.com']) {
      await email(page).fill(typo)
      await age(page).check()
      await submit(page).click()
      await expect(status(page), typo).toHaveAttribute('data-state', 'invalid')
      await expect(status(page)).toHaveText(PRD_COPY.invalid)
      await expect(email(page)).toHaveAttribute('aria-invalid', 'true')
    }
    await app.shot('signup-invalid', { locator: page.locator('#signup') })
  })

  test('a missing age confirmation gets its message @desktop', async ({ app, page }) => {
    await openSignup(app)
    await email(page).fill('pilot@example.com')
    await submit(page).click()
    await expect(status(page)).toHaveAttribute('data-state', 'age')
    await expect(status(page)).toHaveText(COPY.signup.ageMissing)
  })

  test('with no endpoint it says sign-ups are not switched on, and sends nothing @desktop', async ({ app, page }) => {
    const posts: string[] = []
    page.on('request', (r) => {
      if (r.method() !== 'GET') posts.push(`${r.method()} ${r.url()}`)
    })
    await openSignup(app)
    await email(page).fill('pilot@example.com')
    await age(page).check()
    await email(page).press('Enter')
    await expect(status(page)).toHaveAttribute('data-state', 'disabled')
    await expect(status(page)).toHaveText(COPY.signup.disabled)
    expect(posts, 'no request leaves the page').toEqual([])
    // The folded paper plane may rest on the page; it must not take off without a real sign-up.
    await page.waitForTimeout(500)
    await expect(page.getByTestId('paper-plane'), 'paper plane stays put').not.toHaveAttribute('data-flight', /fold|fly|gone/)
  })

  test('mock endpoint: success message and the paper plane @desktop', async ({ app, page }) => {
    let body: unknown = null
    await page.route('**/__mock/signup', async (route) => {
      body = route.request().postDataJSON()
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' })
    })
    await openSignup(app, { signup: 'mock' })
    await email(page).fill('pilot@example.com')
    await age(page).check()
    await submit(page).click()
    await expect(status(page)).toHaveAttribute('data-state', 'success')
    await expect(status(page)).toHaveText(PRD_COPY.success)
    await expect(page.getByTestId('paper-plane')).toBeVisible()
    await expect(page.getByTestId('paper-plane'), 'paper plane takes off').toHaveAttribute('data-flight', /fold|fly|gone/)
    expect(body).toMatchObject({ email: 'pilot@example.com' })
    const tracks = (await app.tracks()).map((t) => t.event)
    expect(tracks).toContain('signup_submit')
    expect(tracks).toContain('signup_success')
    await app.shot('signup-success', { locator: page.locator('#signup') })
  })

  test('mock endpoint failing: the error message @desktop', async ({ app, page, consoleWatch }) => {
    consoleWatch.allow(/status of 500|__mock\/signup/)
    await page.route('**/__mock/signup', (route) => route.fulfill({ status: 500, body: 'nope' }))
    await openSignup(app, { signup: 'mock' })
    await email(page).fill('pilot@example.com')
    await age(page).check()
    await submit(page).click()
    await expect(status(page)).toHaveAttribute('data-state', 'error')
    await expect(status(page)).toHaveText(COPY.signup.error)
  })

  test('offline: the lost-signal message @desktop', async ({ app, page, context, consoleWatch }) => {
    consoleWatch.allow(/ERR_INTERNET_DISCONNECTED|Failed to fetch|__mock\/signup/)
    await openSignup(app, { signup: 'mock' })
    await context.setOffline(true)
    await email(page).fill('pilot@example.com')
    await age(page).check()
    await submit(page).click()
    await expect(status(page)).toHaveAttribute('data-state', 'offline')
    await expect(status(page)).toHaveText(PRD_COPY.offline)
    await context.setOffline(false)
  })
})
