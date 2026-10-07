// Lighthouse mobile run against the preview (QA-owned). Usage: node qa/lighthouse.mjs [url] [name]
// Writes test-results/lighthouse/<name>.report.{json,html} and <name>.summary.json; prints a table.
// Targets (PRD): LCP < 2.5 s, CLS < 0.1, TBT < 300 ms; Accessibility, Best Practices, SEO ≥ 95.
import { spawnSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const url = process.argv[2] ?? 'http://localhost:4176/'
const name = process.argv[3] ?? 'mobile'
const out = resolve(import.meta.dirname, '..', 'test-results', 'lighthouse')
mkdirSync(out, { recursive: true })
const CHROME_PATH = process.env.CHROME_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'

const r = spawnSync(
  'npx',
  ['-y', 'lighthouse@12', url, '--output=json', '--output=html', `--output-path=${join(out, name)}`, '--chrome-flags=--headless=new --no-sandbox', '--quiet'],
  { encoding: 'utf8', env: { ...process.env, CHROME_PATH, npm_config_prefer_offline: 'true' }, maxBuffer: 64 * 1024 * 1024, timeout: 240_000 },
)
if (r.status !== 0) {
  console.error(r.stdout, r.stderr)
  process.exit(1)
}
const lhr = JSON.parse(readFileSync(join(out, `${name}.report.json`), 'utf8'))
const a = lhr.audits
const summary = {
  url,
  lcpMs: a['largest-contentful-paint']?.numericValue,
  cls: a['cumulative-layout-shift']?.numericValue,
  tbtMs: a['total-blocking-time']?.numericValue,
  fcpMs: a['first-contentful-paint']?.numericValue,
  performance: Math.round((lhr.categories.performance?.score ?? 0) * 100),
  accessibility: Math.round((lhr.categories.accessibility?.score ?? 0) * 100),
  bestPractices: Math.round((lhr.categories['best-practices']?.score ?? 0) * 100),
  seo: Math.round((lhr.categories.seo?.score ?? 0) * 100),
  lcpElement: a['largest-contentful-paint-element']?.details?.items?.[0]?.items?.[0]?.node?.snippet ?? null,
  failedAudits: Object.values(a)
    .filter((x) => x.score !== null && x.score < 0.9 && x.scoreDisplayMode !== 'informative' && x.scoreDisplayMode !== 'manual' && x.scoreDisplayMode !== 'notApplicable')
    .map((x) => `${x.id}: ${x.title}${x.displayValue ? ` (${x.displayValue})` : ''}`),
}
writeFileSync(join(out, `${name}.summary.json`), JSON.stringify(summary, null, 2))
console.log(JSON.stringify(summary, null, 2))
