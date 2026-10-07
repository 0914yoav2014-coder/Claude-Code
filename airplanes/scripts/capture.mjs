#!/usr/bin/env node
/**
 * Renders the hero posters and the 8 s hero loop from the real 3D stage (CONTRACTS §11):
 *   public/posters/hero-16x9.webp, public/posters/hero-9x16.webp  (80–120 KB, first 3D frame)
 *   public/video/hero-loop.mp4 (H.264, yuv420p, faststart) + hero-loop.webm (VP9), 960×540, 8 s
 *
 * Usage: start the dev server (npm run dev -- --port 5174), then
 *   node scripts/capture.mjs [--base http://localhost:5174] [--only posters|video] [--fps 30]
 *
 * It loads the 3D harness with ?capture=hero (deterministic: the loop clock only moves by
 * debug.tick(), seeded clouds, no parallax), so every run produces the same frames. The poster is
 * loop time 0 (the start of the intro = the first frame the page draws); the video is loop time
 * 8 s → 16 s (after the intro), which is seamless because every hero motion has a period dividing 8 s.
 * Software GL is slow: the video takes several minutes.
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const arg = (name, def) => {
  const i = process.argv.indexOf(`--${name}`)
  return i > 0 ? process.argv[i + 1] : def
}
const BASE = arg('base', 'http://localhost:5174')
const ONLY = arg('only', 'all')
const FPS = Number(arg('fps', '30'))
const SECONDS = 8

const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })

async function open(width, height) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 })
  const page = await ctx.newPage()
  page.on('pageerror', (e) => console.error('page error:', e.message))
  await page.goto(`${BASE}/src/three/dev/harness.html?test=1&perfcaveat=0&ui=0&capture=hero&tier=high&governor=off&key=hero`)
  await page.waitForFunction(() => window.__aatw?.store.getState().boot.firstFrame === true, null, { timeout: 120000 })
  // let idle-time texture uploads land, then force a fresh frame
  await page.waitForTimeout(2500)
  return { ctx, page }
}

async function frameAt(page, ms) {
  await page.evaluate(async (target) => {
    const a = window.__aatw
    const cur = a.frame.loopT * 1000
    a.debug.tick(target - cur)
    const f0 = a.debug.three.frames
    // wait until the stage has rendered the new loop time
    for (let i = 0; i < 400 && a.debug.three.frames === f0; i++) await new Promise((r) => setTimeout(r, 10))
  }, ms)
  return page.locator('canvas').first().screenshot({ type: 'png' })
}

function webp(png, out, targetKB) {
  const tmp = mkdtempSync(join(tmpdir(), 'aatw-'))
  const src = join(tmp, 'f.png')
  writeFileSync(src, png)
  let q = 82
  for (let i = 0; i < 8; i++) {
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', src, '-c:v', 'libwebp', '-quality', String(q), '-compression_level', '6', out])
    const kb = statSync(out).size / 1024
    if (kb > targetKB[1]) q -= 8
    else if (kb < targetKB[0] && q < 95) q += 4
    else break
  }
  rmSync(tmp, { recursive: true, force: true })
  console.log(`${out}: ${(statSync(out).size / 1024).toFixed(1)} KB (q ${q})`)
}

if (ONLY === 'all' || ONLY === 'posters') {
  mkdirSync(join(root, 'public/posters'), { recursive: true })
  for (const [w, h, name] of [
    [1600, 900, 'hero-16x9.webp'],
    [720, 1280, 'hero-9x16.webp'],
  ]) {
    const { ctx, page } = await open(w, h)
    const png = await frameAt(page, 0)
    webp(png, join(root, 'public/posters', name), [80, 120])
    await ctx.close()
  }
}

if (ONLY === 'all' || ONLY === 'video') {
  mkdirSync(join(root, 'public/video'), { recursive: true })
  const tmp = mkdtempSync(join(tmpdir(), 'aatw-frames-'))
  const { ctx, page } = await open(960, 540)
  const n = SECONDS * FPS
  for (let i = 0; i < n; i++) {
    const png = await frameAt(page, SECONDS * 1000 + (i * 1000) / FPS)
    writeFileSync(join(tmp, `f${String(i).padStart(4, '0')}.png`), png)
    if (i % 30 === 0) console.log(`frame ${i}/${n}`)
  }
  await ctx.close()
  const input = ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', join(tmp, 'f%04d.png')]
  const mp4 = join(root, 'public/video/hero-loop.mp4')
  const webm = join(root, 'public/video/hero-loop.webm')
  execFileSync('ffmpeg', [...input, '-c:v', 'libx264', '-preset', 'slow', '-crf', '27', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', mp4])
  execFileSync('ffmpeg', [...input, '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '40', '-row-mt', '1', '-pix_fmt', 'yuv420p', '-an', webm])
  for (const f of [mp4, webm]) console.log(`${f}: ${(statSync(f).size / 1024).toFixed(1)} KB`)
  rmSync(tmp, { recursive: true, force: true })
}

await browser.close()
