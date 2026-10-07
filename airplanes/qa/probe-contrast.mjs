// QA debugging helper: screenshot of the hero CTA with its text hidden the way contrast.spec does.
import { chromium } from '@playwright/test'
const b = await chromium.launch({ args: ['--disable-3d-apis'] })
const p = await b.newPage({ viewport: { width: 1440, height: 900 } })
await p.goto('http://localhost:4176/?test=1&loader=0')
await p.waitForTimeout(1500)
const blk = p.locator('[data-contrast-check]').filter({ has: p.getByTestId('cta-hero') }).first()
console.log(await blk.evaluate((el) => el.outerHTML.slice(0, 300)))
await blk.evaluate((el) => { el.setAttribute('data-qa', '1'); const s = document.createElement('style'); s.textContent = '[data-qa], [data-qa] * { color: transparent !important; -webkit-text-fill-color: transparent !important; transition: none !important }'; document.head.append(s) })
await p.waitForTimeout(100)
await p.getByTestId('cta-hero').screenshot({ path: process.argv[2] })
console.log(await p.getByTestId('cta-hero').evaluate((e) => getComputedStyle(e).background))
await b.close()
