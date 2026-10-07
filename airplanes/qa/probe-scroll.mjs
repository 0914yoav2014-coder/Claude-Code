// QA debugging helper: instant scroll and compare window.scrollY with frame.y over time.
import { chromium } from '@playwright/test'
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
const p = await b.newPage({ viewport: { width: 1440, height: 900 } })
p.on('pageerror', (e) => console.log('[pageerror]', String(e).slice(0, 300)))
await p.goto('http://localhost:4176/' + (process.argv[2] ?? '?test=1&perfcaveat=0&tier=medium&governor=off&loader=0'))
await p.waitForTimeout(3000)
for (const top of [3000, 5000, 7200]) {
  await p.evaluate((t) => window.scrollTo({ top: t, behavior: 'instant' }), top)
  for (let i = 0; i < 5; i++) {
    await p.waitForTimeout(400)
    console.log(top, await p.evaluate(() => JSON.stringify({ sy: Math.round(scrollY), fy: Math.round(window.__aatw.frame.y), max: document.documentElement.scrollHeight - innerHeight, hold: document.documentElement.dataset.hold })))
  }
}
await b.close()
