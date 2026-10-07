// QA helper: turns test-results/results.json (Playwright JSON reporter) into Markdown for qa/REPORT.md.
//   node qa/summarize.mjs [results.json]  → prints a per-project pass/fail table and every failure
//   with its first error line and screenshot.
import { readFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'

const APP = resolve(import.meta.dirname, '..')
const file = process.argv[2] ?? join(APP, 'test-results', 'results.json')
const data = JSON.parse(readFileSync(file, 'utf8'))

const rows = new Map()
const failures = []
const strip = (s) => String(s ?? '').replace(/\u001b\[[0-9;]*m/g, '')

function walk(suite, path) {
  for (const s of suite.suites ?? []) walk(s, s.title && !s.title.endsWith('.ts') ? [...path, s.title] : path)
  for (const spec of suite.specs ?? []) {
    for (const t of spec.tests) {
      const r = t.results.at(-1)
      const status = t.status === 'skipped' ? 'skipped' : r?.status === 'passed' ? 'passed' : r?.status === 'skipped' ? 'skipped' : 'failed'
      const row = rows.get(t.projectName) ?? { passed: 0, failed: 0, skipped: 0 }
      row[status]++
      rows.set(t.projectName, row)
      if (status === 'failed') {
        const err = strip(r?.errors?.[0]?.message ?? r?.error?.message ?? '').split('\n').filter(Boolean)
        const shot = r?.attachments?.find((a) => a.name === 'screenshot' && a.path)?.path
        failures.push({
          project: t.projectName,
          where: `${spec.file}:${spec.line}`,
          title: [...path, spec.title].join(' › '),
          error: err.slice(0, 2).join(' / ').slice(0, 260),
          shot: shot ? relative(APP, shot) : '',
        })
      }
    }
  }
}
for (const s of data.suites) walk(s, [])

let out = '| Project | Passed | Failed | Skipped |\n|---|---:|---:|---:|\n'
const tot = { passed: 0, failed: 0, skipped: 0 }
for (const [p, r] of rows) {
  out += `| ${p} | ${r.passed} | ${r.failed} | ${r.skipped} |\n`
  for (const k of Object.keys(tot)) tot[k] += r[k]
}
out += `| **total** | **${tot.passed}** | **${tot.failed}** | **${tot.skipped}** |\n\n`
out += '| Project | Test | Error | Screenshot |\n|---|---|---|---|\n'
const cell = (s) => s.replace(/\|/g, '\\|')
for (const f of failures) out += `| ${f.project} | ${cell(f.title)} (\`${f.where}\`) | ${cell(f.error)} | ${f.shot} |\n`
console.log(out)
