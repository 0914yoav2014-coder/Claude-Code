// Size budgets (docs/CONTRACTS.md §13). Run after `npm run build` (and `npm run build:artifact` for the
// Artifact line). Exits 1 if any budget is exceeded.
//   first screen (HTML + CSS + fonts + entry JS + hero poster), gzip  ≤ 400 KB
//   lazy 3D chunk(s), gzip                                            ≤ 320 KB
//   streamed assets (textures, posters, video), raw                   ≤ 6 MB
//   Artifact page.html, raw                                           ≤ 1.9 MB
import { existsSync } from 'node:fs'
import { readFile, readdir, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'

const dist = 'dist'
const gz = async (f) => gzipSync(await readFile(f)).length
const raw = async (f) => (await stat(f)).size
const KB = 1024

async function walk(dir) {
  if (!existsSync(dir)) return []
  const out = []
  for (const name of await readdir(dir)) {
    const p = join(dir, name)
    if ((await stat(p)).isDirectory()) out.push(...(await walk(p)))
    else out.push(p)
  }
  return out
}

const html = await readFile(join(dist, 'index.html'), 'utf8')
const entry = [...html.matchAll(/<script type="module"[^>]*src="\.\/([^"]+)"/g)].map((m) => join(dist, m[1]))
const cssFiles = [...html.matchAll(/<link[^>]+rel="stylesheet"[^>]*href="\.\/([^"]+)"/g)].map((m) => join(dist, m[1]))
const fonts = (await walk(join(dist, 'fonts'))).filter((f) => f.endsWith('.woff2'))
const poster = join(dist, 'posters/hero-16x9.webp')
const allJs = (await walk(join(dist, 'assets'))).filter((f) => f.endsWith('.js'))
const lazy = allJs.filter((f) => !entry.includes(f))

let first = gzipSync(html).length
for (const f of [...entry, ...cssFiles]) first += await gz(f)
for (const f of fonts) first += await raw(f) // woff2 is already compressed
if (existsSync(poster)) first += await raw(poster)

let lazyGz = 0
for (const f of lazy) lazyGz += await gz(f)

let streamed = 0
for (const d of ['textures', 'posters', 'video']) for (const f of await walk(join(dist, d))) streamed += await raw(f)

const rows = [
  ['first screen (gzip)', first, 400 * KB],
  ['lazy 3D chunks (gzip)', lazyGz, 320 * KB],
  ['streamed assets (raw)', streamed, 6 * 1024 * KB],
]
const page = 'dist-artifact/page.html'
if (existsSync(page)) rows.push(['Artifact page.html (raw)', await raw(page), 1.9 * 1024 * KB])

let failed = false
for (const [name, size, limit] of rows) {
  const ok = size <= limit
  failed ||= !ok
  console.log(`${ok ? 'ok  ' : 'OVER'} ${name.padEnd(26)} ${(size / KB).toFixed(0).padStart(6)} KB / ${(limit / KB).toFixed(0)} KB`)
}
console.log(`entry: ${entry.map((f) => f.replace(dist + '/', '')).join(', ')} · lazy: ${lazy.map((f) => f.replace(dist + '/', '')).join(', ') || 'none'}`)
process.exit(failed ? 1 : 0)
