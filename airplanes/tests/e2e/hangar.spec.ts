import { PLANES } from '../../src/data/planes'
import { expect, test } from '../fixtures'
import { mouseDrag, touchDrag } from '../lib/input'
import { decodePng, diffFraction } from '../lib/png'

/** The hangar (PRD F4, CONTRACTS §6–7). */
const num = (text: string) => Number((text.replace(/,(?=\d{3})/g, '').match(/\d+(?:\.\d+)?/) ?? ['NaN'])[0])

async function expectPlane(page: import('@playwright/test').Page, i: number) {
  await expect(page.getByTestId('plane-name')).toContainText(PLANES[i].shortName)
  await expect(page.getByTestId('plane-count')).toHaveText(`${i + 1} of ${PLANES.length}`)
}

test.describe('hangar', () => {
  test.beforeEach(async ({ app }) => {
    await app.ready()
    await app.scrollToKey('hangar', 10)
  })

  test('next and prev cycle through all six planes @common', async ({ app, page }) => {
    await expectPlane(page, 0)
    for (let i = 1; i <= PLANES.length; i++) {
      await page.getByTestId('plane-next').click()
      await expectPlane(page, i % PLANES.length)
    }
    await page.getByTestId('plane-prev').click()
    await expectPlane(page, PLANES.length - 1)
    await page.getByTestId('plane-prev').click()
    await expectPlane(page, PLANES.length - 2)
    expect((await app.state()).hangar.dir, 'dir = -1 after prev').toBe(-1)
    expect(await app.tracks()).toContainEqual(expect.objectContaining({ event: 'hangar_view' }))
    await expect(page.getByTestId('plane-prev')).toHaveAccessibleName(/\S/)
    await expect(page.getByTestId('plane-next')).toHaveAccessibleName(/\S/)
  })

  test('← and → switch planes while focus is inside #airplanes @desktop', async ({ page }) => {
    await page.getByTestId('plane-next').focus()
    await page.keyboard.press('ArrowRight')
    await expectPlane(page, 1)
    await page.keyboard.press('ArrowLeft')
    await expectPlane(page, 0)
    await page.keyboard.press('ArrowLeft')
    await expectPlane(page, PLANES.length - 1)
    const stage = page.getByTestId('hangar-stage')
    if (await stage.count()) {
      await stage.focus()
      await page.keyboard.press('ArrowRight')
      await expectPlane(page, 0)
    }
  })

  test('a horizontal swipe on the panel switches planes, all six in a cycle @touch', async ({ page }) => {
    const panel = await page.getByTestId('hangar-panel').boundingBox()
    const name = await page.getByTestId('plane-name').boundingBox()
    expect(panel && name, 'hangar panel and plane name are on screen').toBeTruthy()
    const y = name!.y + name!.height / 2
    const left = { x: panel!.x + panel!.width / 2 - 75, y }
    const right = { x: panel!.x + panel!.width / 2 + 75, y }
    for (let i = 1; i <= PLANES.length; i++) {
      await touchDrag(page, right, left) // finger moves right → left: next
      await expectPlane(page, i % PLANES.length)
    }
    await touchDrag(page, left, right) // left → right: previous
    await expectPlane(page, PLANES.length - 1)
  })

  test('stats count up and end exactly at data-value @common', async ({ page }) => {
    let cur = 0
    for (const i of [0, 1, 3]) {
      while (cur < i) {
        await page.getByTestId('plane-next').click()
        cur++
        await expectPlane(page, cur)
      }
      const p = PLANES[i]
      const want = { 'stat-speed': p.cruiseKmh, 'stat-passengers': p.passengers, 'stat-length': p.shape.lengthM, 'stat-span': p.shape.spanM }
      for (const [id, value] of Object.entries(want)) {
        const dd = page.getByTestId(id)
        await expect(dd, `${p.id} ${id} data-value`).toHaveAttribute('data-value', String(value))
        await expect.poll(async () => num((await dd.textContent()) ?? ''), { message: `${p.id} ${id} ends at ${value}`, timeout: 5_000 }).toBe(value)
      }
    }
  })

  test('close-up opens as a modal, Esc closes it and focus returns @common', async ({ app, page }) => {
    const open = page.getByTestId('closeup-open')
    await expect(open).toHaveText('Take a closer look')
    await open.click()
    const dialog = page.getByTestId('closeup')
    await expect(dialog).toBeVisible()
    expect(await dialog.evaluate((d: HTMLDialogElement) => d.open && d.matches(':modal')), 'opened with showModal()').toBe(true)
    expect((await app.state()).hangar.closeup).toBe(true)
    expect(await app.tracks()).toContainEqual(expect.objectContaining({ event: 'closeup_open' }))
    await app.shot('closeup-open')
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    expect((await app.state()).hangar.closeup).toBe(false)
    await expect(open, 'focus returns to "Take a closer look"').toBeFocused()

    await open.click()
    await expect(dialog).toBeVisible()
    await page.getByTestId('closeup-close').click()
    await expect(dialog).toBeHidden()
    await expect(open).toBeFocused()
  })

  test('the close-up stage is registered for 3D input @3d', async ({ app, page }) => {
    await page.getByTestId('closeup-open').click()
    const stage = page.locator('[data-testid=closeup] [data-stage=closeup]')
    await expect(stage).toBeVisible()
    await expect(stage).toHaveAttribute('data-lenis-prevent', /.*/)
    expect((await app.state()).stages).toContain('closeup')
    await page.keyboard.press('Escape')
  })
})

test('dragging the hangar stage turns the turntable (canvas changes) @3d', async ({ app, page }, info) => {
  await app.open()
  await app.ready3d()
  await app.scrollToKey('hangar', 10)
  await page.waitForTimeout(1000)
  await app.settle()
  expect((await app.state()).stages).toContain('hangar')
  const before = decodePng(await app.canvasShot())
  const seg = await app.hitSegment('hangar-stage', 240, 'x')
  if (info.project.name.startsWith('phone')) await touchDrag(page, seg.from, seg.to)
  else await mouseDrag(page, seg.from, seg.to)
  await page.waitForTimeout(400)
  await app.settle()
  const after = decodePng(await app.canvasShot())
  expect(diffFraction(before, after), 'share of canvas pixels that changed').toBeGreaterThan(0.005)
})
