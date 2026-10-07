import { defineConfig, devices } from '@playwright/test'
import type { QAOptions } from './tests/fixtures'

/**
 * QA suite for Airplanes Around the World v2 (QA-owned). Runs against the production build served by
 * `vite preview` on port 4176 (qa/serve.mjs builds first; see docs/CONTRACTS.md §13–14).
 *
 *   npx playwright test --project=static            data + unit tests, no browser, no build
 *   npx playwright test --project=desktop-3d        behaviour on a 1440×900 desktop with live 3D
 *   QA_NO_BUILD=1 npx playwright test …             serve the existing dist/ without rebuilding
 *
 * Screenshots for the Lead land in test-results/screens/<project>/<name>.png (kept between runs);
 * Playwright's own per-test output goes to test-results/artifacts (wiped every run).
 */
const PORT = 4176
export const BASE_URL = `http://localhost:${PORT}/`

/** WebGL2 through SwiftShader in headless Chromium (frame rates under it mean nothing). */
const GPU_ARGS = ['--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
/** Live 3D on a software GPU, medium tier, governor off, loader skipped. */
export const Q3D = 'test=1&perfcaveat=0&tier=medium&governor=off&loader=0'

const desktop = { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 }
const phone = (width: number, height: number) => ({
  ...devices['Desktop Chrome'],
  viewport: { width, height },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  userAgent: devices['Pixel 7'].userAgent,
})

// The static project needs neither a build nor a server: skip the webServer when only it is asked for.
const argv = process.argv.slice(2)
const requested = argv.flatMap((a, i) => (a.startsWith('--project=') ? [a.slice(10)] : a === '--project' ? [argv[i + 1]] : []))
const serverless = process.env.QA_NO_SERVER === '1' || (requested.length > 0 && requested.every((p) => p === 'static'))

export default defineConfig<QAOptions>({
  testDir: 'tests',
  outputDir: 'test-results/artifacts',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  // One worker by default: two SwiftShader 3D pages starve each other and time out (QA_WORKERS=2 to override).
  workers: Number(process.env.QA_WORKERS ?? 1),
  retries: 0,
  reporter: [['list'], ['json', { outputFile: 'test-results/results.json' }]],
  use: {
    baseURL: BASE_URL,
    trace: 'off',
    screenshot: 'only-on-failure',
    query: Q3D,
  },
  webServer: serverless
    ? undefined
    : {
        command: 'node qa/serve.mjs',
        url: BASE_URL,
        reuseExistingServer: true,
        timeout: 420_000,
        stdout: 'pipe',
        stderr: 'pipe',
      },
  projects: [
    { name: 'static', testDir: 'tests/static' },
    { name: 'build', testDir: 'tests/build', use: { ...desktop, launchOptions: { args: GPU_ARGS } } },
    {
      name: 'desktop-3d',
      testDir: 'tests/e2e',
      grep: /@common|@3d|@desktop/,
      use: { ...desktop, launchOptions: { args: GPU_ARGS }, query: Q3D },
    },
    {
      name: 'phone-3d',
      testDir: 'tests/e2e',
      grep: /@common|@3d|@touch/,
      use: { ...phone(390, 844), launchOptions: { args: GPU_ARGS }, query: Q3D },
    },
    {
      name: 'phone-360',
      testDir: 'tests/e2e',
      grep: /@common|@narrow/,
      use: { ...phone(360, 740), launchOptions: { args: GPU_ARGS }, query: Q3D },
    },
    {
      name: 'reduced',
      testDir: 'tests/e2e',
      grep: /@common|@reduced/,
      use: { ...desktop, contextOptions: { reducedMotion: 'reduce' }, launchOptions: { args: GPU_ARGS }, query: Q3D },
    },
    {
      name: 'no-webgl',
      testDir: 'tests/e2e',
      grep: /@common|@lite/,
      use: { ...desktop, launchOptions: { args: ['--disable-3d-apis'] }, query: 'test=1&loader=0' },
    },
    {
      // No flags at all: a software GPU must get the lighter version (reason perf-caveat).
      name: 'swiftshader-default',
      testDir: 'tests/e2e',
      grep: /@caveat/,
      use: { ...desktop, launchOptions: { args: GPU_ARGS }, query: 'test=1&loader=0' },
    },
    {
      name: 'artifact-csp',
      testDir: 'tests/artifact',
      timeout: 240_000,
      use: { ...desktop, launchOptions: { args: GPU_ARGS } },
    },
    { name: 'speed', testDir: 'tests/speed', timeout: 300_000 },
  ],
})
