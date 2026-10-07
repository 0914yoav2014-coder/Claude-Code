import { chromium } from '@playwright/test'
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
const p = await b.newPage({ viewport: { width: 1440, height: 900 } })
p.on('console', (m) => console.log('[console]', m.type(), m.text().slice(0, 300)))
p.on('pageerror', (e) => console.log('[pageerror]', String(e).slice(0, 500)))
await p.goto('http://localhost:4176/' + (process.argv[2] ?? '?test=1&perfcaveat=0&tier=medium&governor=off&loader=0'))
for (let i = 0; i < 8; i++) {
  await p.waitForTimeout(1000)
  console.log(await p.evaluate(() => JSON.stringify({ ...document.documentElement.dataset, aatw: !!window.__aatw, canvas: document.querySelectorAll('canvas').length, mode: window.__aatw?.store.getState().mode, ff: window.__aatw?.store.getState().boot })))
}
await b.close()
