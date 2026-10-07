import { expect, test } from '@playwright/test'
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { groupByOwner } from '../lib/owners'

/**
 * Build health for the progress board: the typecheck and bundle results recorded by qa/serve.mjs,
 * oxlint over the whole app, and the size budgets (CONTRACTS §13, scripts/check-budget.mjs).
 */
const APP = join(import.meta.dirname, '..', '..')
const OUT = join(APP, 'test-results', 'build')
const run = (cmd: string, args: string[]) => spawnSync(cmd, args, { cwd: APP, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 })
const fresh = (f: string) => existsSync(f) && Date.now() - statSync(f).mtimeMs < 15 * 60_000

test('typecheck (tsc -b) passes', async () => {
  test.setTimeout(180_000)
  let status: { ok: boolean; errors: string[] }
  if (fresh(join(OUT, 'typecheck.json'))) status = JSON.parse(readFileSync(join(OUT, 'typecheck.json'), 'utf8'))
  else {
    const r = run('npx', ['tsc', '-b'])
    status = { ok: r.status === 0, errors: `${r.stdout}${r.stderr}`.split('\n').filter((l) => /error TS\d+/.test(l)) }
  }
  const byOwner = groupByOwner(status.errors)
  expect(status.ok ? {} : byOwner, 'TypeScript errors by owner').toEqual({})
})

test('the site build is fresh (not a stale dist/)', () => {
  const f = join(OUT, 'site.json')
  test.skip(!existsSync(f), 'no build recorded (server was reused without qa/serve.mjs)')
  const s = JSON.parse(readFileSync(f, 'utf8'))
  expect(s.ok, `vite build failed; the preview served the previous dist/ (see test-results/build/site.log)`).toBe(true)
})

test('oxlint passes for the whole app', () => {
  const r = run('npx', ['oxlint', '--format', 'unix'])
  const lines = `${r.stdout}${r.stderr}`.split('\n').filter((l) => /:\d+:\d+:/.test(l))
  expect(r.status === 0 ? {} : groupByOwner(lines), 'oxlint errors by owner').toEqual({})
})

test('size budgets (scripts/check-budget.mjs)', () => {
  const r = run('node', ['scripts/check-budget.mjs'])
  test.info().annotations.push({ type: 'budget', description: `${r.stdout}${r.stderr}`.trim() })
  expect(r.status, `${r.stdout}${r.stderr}`).toBe(0)
})

test('the 3D code is a lazy chunk, not in the entry', () => {
  const html = readFileSync(join(APP, 'dist', 'index.html'), 'utf8')
  const entry = [...html.matchAll(/<script type="module"[^>]*src="\.?\/?([^"]+)"/g)].map((m) => m[1])
  expect(entry.length, 'one module entry script').toBe(1)
  const js = readFileSync(join(APP, 'dist', entry[0]), 'utf8')
  expect(js, 'three.js must not be bundled into the entry chunk').not.toMatch(/WebGLRenderer|THREE\.WebGLRenderer|ShaderChunk/)
  expect(/\bimport\(/.test(js) || /__vitePreload|import\s*\(/.test(js), 'the entry loads the Stage chunk dynamically').toBe(true)
})
