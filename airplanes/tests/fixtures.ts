import { test as base, expect, type Locator, type Page, type TestInfo } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'

/**
 * Shared fixtures for the browser projects (QA-owned).
 *   app          open the page with the project's query, read window.__aatw, scroll to camera keys, screenshots
 *   consoleWatch zero console errors per test (auto); warnings outside the contract's allow-list are annotated
 *                (tests/e2e/console.spec.ts fails on them)
 * Every page also gets an init script (window.__qa) that records aatw:track events, CSP violations and
 * the canvases that got a WebGL context, and can fake a hidden tab.
 */
export interface QAOptions {
  /** Default query string (without "?") for this project, e.g. test=1&perfcaveat=0&tier=medium&governor=off&loader=0 */
  query: string
}

/** Allowed console warnings (docs/CONTRACTS.md §1). */
export const ALLOWED_WARNINGS = [/THREE\.Clock: This module has been deprecated/, /GL Driver Message/]

export type CamKey = 'hero' | 'climb' | 'clouds' | 'earth' | 'globe' | 'globeOut' | 'hangar' | 'hangarOut' | 'night'
export const CAM_KEYS: CamKey[] = ['hero', 'climb', 'clouds', 'earth', 'globe', 'globeOut', 'hangar', 'hangarOut', 'night']

export interface StateView {
  mode: 'boot' | '3d' | 'lite'
  layout: 'cinematic' | 'compact'
  boot: { loader: string; phase: string; assets: number; firstFrame: boolean; introAt: number | null }
  quality: { tier: string; step: number; locked: boolean; reason: string; lite?: string }
  motion: { reduced: boolean; paused: boolean; hidden: boolean }
  markers: Record<CamKey, number> | null
  section: string
  hold: string | null
  stages: string[]
  globe: { route: string | null; via: string | null; drawn: boolean; zoom: number }
  hangar: { index: number; dir: number; closeup: boolean }
}

export interface Track {
  event: string
  [k: string]: unknown
}

const INIT_SCRIPT = `(() => {
  if (window.__qa) return;
  const qa = { tracks: [], gl: [], csp: [] };
  Object.defineProperty(window, '__qa', { value: qa });
  document.addEventListener('aatw:track', (e) => qa.tracks.push(e.detail));
  document.addEventListener('securitypolicyviolation', (e) => qa.csp.push(e.violatedDirective + ' ' + e.blockedURI));
  const orig = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
    const ctx = orig.call(this, type, ...rest);
    if (ctx && /webgl/.test(String(type)) && !qa.gl.includes(this)) qa.gl.push(this);
    return ctx;
  };
  let hidden = null;
  const vs = Object.getOwnPropertyDescriptor(Document.prototype, 'visibilityState');
  const hd = Object.getOwnPropertyDescriptor(Document.prototype, 'hidden');
  Object.defineProperty(document, 'visibilityState', { configurable: true, get() { return hidden === null ? vs.get.call(this) : hidden ? 'hidden' : 'visible'; } });
  Object.defineProperty(document, 'hidden', { configurable: true, get() { return hidden === null ? hd.get.call(this) : hidden; } });
  qa.setHidden = (h) => { hidden = h; document.dispatchEvent(new Event('visibilitychange')); };
})();`

export class ConsoleWatch {
  readonly entries: { type: string; text: string }[] = []
  private allowed: RegExp[] = []
  add(type: string, text: string) {
    this.entries.push({ type, text })
  }
  /** Accept console errors/warnings matching re in this test (e.g. a deliberate offline fetch). */
  allow(re: RegExp) {
    this.allowed.push(re)
  }
  errors(): string[] {
    return this.entries.filter((e) => (e.type === 'error' || e.type === 'pageerror') && !this.allowed.some((r) => r.test(e.text))).map((e) => `[${e.type}] ${e.text}`)
  }
  warnings(): string[] {
    return this.entries
      .filter((e) => e.type === 'warning' && !ALLOWED_WARNINGS.some((r) => r.test(e.text)) && !this.allowed.some((r) => r.test(e.text)))
      .map((e) => e.text)
  }
}

export interface OpenOptions {
  /** Replace the project's query entirely. */
  query?: string
  /** Set (string) or remove (null) single flags on top of the query. */
  set?: Record<string, string | null>
  hash?: string
  /** Wait for bootstrap (html[data-mode] = 3d|lite). Default true. */
  wait?: boolean
}

export class App {
  constructor(
    readonly page: Page,
    readonly info: TestInfo,
    readonly query: string,
  ) {}

  url(opts: OpenOptions = {}): string {
    const q = new URLSearchParams(opts.query ?? this.query)
    for (const [k, v] of Object.entries(opts.set ?? {})) {
      if (v === null) q.delete(k)
      else q.set(k, v)
    }
    const s = q.toString()
    return '/' + (s ? '?' + s : '') + (opts.hash ? '#' + opts.hash : '')
  }

  async open(opts: OpenOptions = {}): Promise<void> {
    await this.page.goto(this.url(opts), { waitUntil: 'domcontentloaded' })
    if (opts.wait !== false) await this.booted()
  }

  /** Waits until bootstrap() has picked 3D or the lighter version. */
  async booted(): Promise<void> {
    await this.page.waitForFunction(() => ['3d', 'lite'].includes(document.documentElement.dataset.mode ?? ''), null, { timeout: 20_000 })
  }

  html(attr: string): Promise<string | undefined> {
    return this.page.evaluate((a) => document.documentElement.dataset[a], attr)
  }

  async mode(): Promise<string | undefined> {
    return this.html('mode')
  }

  async hasDebug(): Promise<boolean> {
    return this.page.evaluate(() => !!(window as any).__aatw)
  }

  async state(): Promise<StateView> {
    return this.page.evaluate(() => {
      const a = (window as any).__aatw
      if (!a) throw new Error('window.__aatw is missing (needs ?test=1)')
      const s = a.store.getState()
      return {
        mode: s.mode,
        layout: s.layout,
        boot: { ...s.boot },
        quality: { ...s.quality },
        motion: { ...s.motion },
        markers: s.markers ? { ...s.markers } : null,
        section: s.section,
        hold: s.hold,
        stages: Object.keys(s.stages ?? {}),
        globe: { ...s.globe },
        hangar: { ...s.hangar },
      }
    })
  }

  /** Skips the test unless the page runs live 3D (e.g. 3D tests in a project that fell back to Lite). */
  async require3d(): Promise<void> {
    const mode = await this.mode()
    expect(mode, 'expected live 3D (html[data-mode=3d]); the page fell back to the lighter version').toBe('3d')
  }

  /** Waits for the canvas and its first real frame (boot.firstFrame). */
  async ready3d(timeout = 30_000): Promise<void> {
    await this.require3d()
    await this.page.locator('[data-testid=stage] canvas').waitFor({ state: 'attached', timeout })
    await this.page.waitForFunction(() => (window as any).__aatw?.store.getState().boot.firstFrame === true, null, { timeout })
  }

  /** Waits (softly) for the 3D assets to finish streaming (boot.assets = 1). */
  async assetsLoaded(timeout = 20_000): Promise<boolean> {
    try {
      await this.page.waitForFunction(() => ((window as any).__aatw?.store.getState().boot.assets ?? 1) >= 1, null, { timeout })
      return true
    } catch {
      this.info.annotations.push({ type: 'warning', description: `boot.assets did not reach 1 within ${timeout} ms` })
      return false
    }
  }

  frames(): Promise<number | null> {
    return this.page.evaluate(() => {
      const f = (window as any).__aatw?.debug?.three?.frames
      return typeof f === 'number' ? f : null
    })
  }

  info3d(): Promise<{ calls: number; triangles: number } | null> {
    return this.page.evaluate(() => (window as any).__aatw?.debug?.three?.info?.() ?? null)
  }

  globeYaw(): Promise<number | null> {
    return this.page.evaluate(() => {
      const f = (window as any).__aatw?.debug?.three?.globeYaw
      return typeof f === 'function' ? f() : null
    })
  }

  routePoint(id: string): Promise<{ x: number; y: number } | null | undefined> {
    return this.page.evaluate((rid) => {
      const f = (window as any).__aatw?.debug?.three?.routePoint
      return typeof f === 'function' ? f(rid) : undefined
    }, id)
  }

  async markers(): Promise<Record<CamKey, number>> {
    await this.page.waitForFunction(() => !!(window as any).__aatw?.store.getState().markers, null, { timeout: 10_000 })
    return (await this.state()).markers!
  }

  /** Instant scroll to a document y; waits for the page (and Lenis / frame.y) to get there. */
  async scrollTo(y: number): Promise<void> {
    await this.page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' as ScrollBehavior }), y)
    await this.page.waitForFunction(
      (top) => {
        const max = document.documentElement.scrollHeight - window.innerHeight
        const want = Math.max(0, Math.min(top, max))
        const a = (window as any).__aatw
        return Math.abs(window.scrollY - want) < 2 && (!a || Math.abs(a.frame.y - window.scrollY) < 2)
      },
      y,
      { timeout: 5_000 },
    )
  }

  /** Scroll to a camera key (plus an offset in px) and wait for html[data-hold] to update. */
  async scrollToKey(key: CamKey, offset = 0): Promise<void> {
    const m = await this.markers()
    await this.scrollTo(Math.round(m[key] + offset))
    const hold = key === 'globe' || key === 'globeOut' ? 'globe' : key === 'hangar' || key === 'hangarOut' ? 'hangar' : null
    if (hold) await expect(this.page.locator('html')).toHaveAttribute('data-hold', hold, { timeout: 5_000 })
    await this.page.waitForTimeout(50)
  }

  /** Lets the canvas catch up: returns once 3 more frames rendered or the counter was still for `quiet` ms. */
  async settle(quiet = 300, max = 5_000): Promise<void> {
    const start = await this.frames()
    if (start === null) {
      await this.page.waitForTimeout(quiet)
      return
    }
    const t0 = Date.now()
    let last = start
    let since = Date.now()
    while (Date.now() - t0 < max) {
      await this.page.waitForTimeout(60)
      const f = (await this.frames()) ?? last
      if (f - start >= 3) break
      if (f !== last) {
        last = f
        since = Date.now()
      } else if (Date.now() - since >= quiet) break
    }
    await this.page.waitForTimeout(60)
  }

  tracks(): Promise<Track[]> {
    return this.page.evaluate(() => (window as any).__qa?.tracks ?? [])
  }

  /** Canvases with a WebGL context that are still in the document. */
  liveGlCanvases(): Promise<number> {
    return this.page.evaluate(() => ((window as any).__qa?.gl ?? []).filter((c: HTMLCanvasElement) => c.isConnected).length)
  }

  setHidden(hidden: boolean): Promise<void> {
    return this.page.evaluate((h) => (window as any).__qa.setHidden(h), hidden)
  }

  /** Screenshot for the Lead: test-results/screens/<project>/<name>.png. */
  async shot(name: string, opts: { fullPage?: boolean; locator?: Locator } = {}): Promise<string> {
    const path = join(dirname(this.info.config.configFile ?? process.cwd() + '/x'), 'test-results', 'screens', this.info.project.name, `${name}.png`)
    mkdirSync(dirname(path), { recursive: true })
    if (opts.locator) await opts.locator.screenshot({ path })
    else await this.page.screenshot({ path, fullPage: opts.fullPage ?? false })
    this.info.annotations.push({ type: 'screenshot', description: path.slice(path.indexOf('test-results')) })
    return path
  }
}

export const test = base.extend<QAOptions & { app: App; consoleWatch: ConsoleWatch }>({
  query: ['', { option: true }],

  context: async ({ context }, provide) => {
    await context.addInitScript(INIT_SCRIPT)
    await provide(context)
  },

  consoleWatch: [
    async ({ context }, provide, testInfo) => {
      const watch = new ConsoleWatch()
      context.on('console', (msg) => watch.add(msg.type(), msg.text()))
      context.on('weberror', (err) => watch.add('pageerror', String(err.error()?.stack ?? err.error())))
      await provide(watch)
      for (const w of watch.warnings()) testInfo.annotations.push({ type: 'console-warning', description: w.slice(0, 300) })
      const errors = watch.errors()
      expect(errors, `console errors during the test:\n${errors.join('\n')}`).toEqual([])
    },
    { auto: true },
  ],

  app: async ({ page, query }, provide, testInfo) => {
    await provide(new App(page, testInfo, query))
  },
})

export { expect }

/** Projects whose page runs live 3D. */
export const is3dProject = (info: TestInfo) => ['desktop-3d', 'phone-3d', 'phone-360', 'reduced'].includes(info.project.name)
export const isTouchProject = (info: TestInfo) => ['phone-3d', 'phone-360'].includes(info.project.name)
