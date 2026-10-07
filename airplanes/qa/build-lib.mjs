// Build helpers for the QA suite (QA-owned). Other agents edit the same checkout while QA runs, so a
// typecheck error in someone's half-finished file must not stop the test run: the typecheck runs on
// its own (its result is recorded for the board), then the bundle builds without it. If even the
// bundle fails, the last good dist/ is served and marked stale.
//
// Results go to test-results/build/<name>.json and .log (tests/build/build.spec.ts reports them).
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

export const APP = resolve(import.meta.dirname, '..')
export const OUT = join(APP, 'test-results', 'build')

function run(cmd, args) {
  const t0 = Date.now()
  const r = spawnSync(cmd, args, { cwd: APP, encoding: 'utf8', env: process.env, maxBuffer: 64 * 1024 * 1024 })
  const out = `$ ${cmd} ${args.join(' ')}\n${r.stdout ?? ''}${r.stderr ?? ''}`
  return { ok: r.status === 0, out, ms: Date.now() - t0 }
}

function save(name, status, log) {
  mkdirSync(OUT, { recursive: true })
  writeFileSync(join(OUT, `${name}.json`), JSON.stringify({ ...status, at: new Date().toISOString() }, null, 2))
  writeFileSync(join(OUT, `${name}.log`), log)
}

/** `tsc -b` on its own. Returns the error lines (path(line,col): error TSxxxx: …). */
export function typecheck() {
  const r = run('npx', ['tsc', '-b'])
  const errors = r.out.split('\n').filter((l) => /error TS\d+/.test(l))
  save('typecheck', { ok: r.ok, errors }, r.out)
  return { ok: r.ok, errors }
}

function steps(list) {
  let log = ''
  for (const [cmd, args] of list) {
    const r = run(cmd, args)
    log += r.out + '\n'
    if (!r.ok) return { ok: false, log }
  }
  return { ok: true, log }
}

/** The full `npm run build` (typecheck recorded separately, so a foreign type error never blocks QA). */
export function buildSite() {
  const tc = typecheck()
  const b = steps([
    ['npx', ['vite', 'build']],
    ['npx', ['vite', 'build', '--ssr', 'src/entry-server.tsx', '--outDir', 'dist-ssr']],
    ['node', ['scripts/prerender.mjs', 'dist']],
  ])
  const stale = !b.ok && existsSync(join(APP, 'dist', 'index.html'))
  save('site', { ok: b.ok, typecheck: tc.ok, stale }, b.log)
  return { ok: b.ok, typecheck: tc.ok, stale }
}

/** `npm run build:artifact` (Lead's pipeline) with the same typecheck split. */
export function buildArtifact() {
  const tc = typecheck()
  const b = steps([
    ['npx', ['vite', 'build', '--mode', 'artifact', '--outDir', 'dist-artifact']],
    ['npx', ['vite', 'build', '--ssr', 'src/entry-server.tsx', '--outDir', 'dist-ssr']],
    ['node', ['scripts/prerender.mjs', 'dist-artifact']],
    ['node', ['scripts/inline-artifact.mjs']],
  ])
  const stale = !b.ok && existsSync(join(APP, 'dist-artifact', 'page.html'))
  save('artifact', { ok: b.ok, typecheck: tc.ok, stale }, b.log)
  return { ok: b.ok, typecheck: tc.ok, stale }
}
