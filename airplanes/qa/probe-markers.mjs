// QA debugging helper: prints store.markers and the measured document-y of every <i data-cam>.
import { chromium } from '@playwright/test'
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
const p = await b.newPage({ viewport: { width: 1440, height: 900 } })
p.on('console', (m) => m.type() !== 'log' && console.log('[console]', m.type(), m.text().slice(0, 300)))
await p.goto('http://localhost:4176/' + (process.argv[2] ?? '?test=1&perfcaveat=0&tier=medium&governor=off&loader=0'))
await p.waitForTimeout(3000)
console.log(await p.evaluate(() => JSON.stringify({
  markers: window.__aatw?.store.getState().markers,
  cams: [...document.querySelectorAll('[data-cam]')].map((e) => [e.dataset.cam, Math.round(e.getBoundingClientRect().top + scrollY)]),
  sections: [...document.querySelectorAll('section, footer')].map((e) => [e.id, Math.round(e.getBoundingClientRect().top + scrollY), Math.round(e.getBoundingClientRect().height)]),
  h: document.documentElement.scrollHeight,
}, null, 1)))
await b.close()
