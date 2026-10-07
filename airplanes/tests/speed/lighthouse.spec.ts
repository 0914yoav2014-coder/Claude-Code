import { expect, test } from '@playwright/test'
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Lighthouse mobile (simulated throttling) against the preview build. Headless Chromium has only a
 * software GPU, so Lighthouse measures what a phone without a usable GPU gets (the lighter version).
 * Targets from the PRD: LCP < 2.5 s, CLS < 0.1, TBT < 300 ms; Accessibility, Best Practices, SEO ≥ 95.
 */
const APP = join(import.meta.dirname, '..', '..')

test('Lighthouse mobile meets the PRD targets', async ({ baseURL }) => {
  const r = spawnSync('node', ['qa/lighthouse.mjs', baseURL!, 'mobile'], { cwd: APP, encoding: 'utf8', timeout: 280_000, maxBuffer: 64 * 1024 * 1024 })
  expect(r.status, `lighthouse failed to run:\n${r.stderr.slice(-2000)}`).toBe(0)
  const s = JSON.parse(readFileSync(join(APP, 'test-results', 'lighthouse', 'mobile.summary.json'), 'utf8'))
  test.info().annotations.push({ type: 'lighthouse', description: JSON.stringify(s, null, 1) })
  expect.soft(s.lcpMs, 'LCP ms').toBeLessThan(2500)
  expect.soft(s.cls, 'CLS').toBeLessThan(0.1)
  expect.soft(s.tbtMs, 'TBT ms').toBeLessThan(300)
  expect.soft(s.accessibility, 'Accessibility score').toBeGreaterThanOrEqual(95)
  expect.soft(s.bestPractices, 'Best Practices score').toBeGreaterThanOrEqual(95)
  expect.soft(s.seo, 'SEO score').toBeGreaterThanOrEqual(95)
})
