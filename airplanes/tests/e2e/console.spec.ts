import { CAM_KEYS, expect, test } from '../fixtures'

/**
 * Console hygiene (CONTRACTS §1): zero errors (the consoleWatch fixture checks that in every test) and no
 * warnings outside the allow-list (THREE.Clock deprecation, GL Driver Message). Scrolls through every
 * camera key so each scene mounts once.
 */
test('no console warnings outside the allow-list across the whole page @common @caveat', async ({ app, page, consoleWatch }) => {
  await app.open()
  await app.ready()
  for (const key of CAM_KEYS) {
    const m = await app.markers()
    await app.scrollTo(Math.round(m[key]))
    await app.settle()
  }
  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' as ScrollBehavior }))
  await page.waitForTimeout(300)
  const warnings = consoleWatch.warnings()
  expect(warnings, `unexpected console warnings:\n${warnings.join('\n')}`).toEqual([])
})
