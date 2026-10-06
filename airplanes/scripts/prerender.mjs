// Writes the server-rendered page into <dist>/index.html so every word is real HTML at first paint.
// Usage: node scripts/prerender.mjs <distDir>   (after `vite build` and `vite build --ssr src/entry-server.tsx --outDir dist-ssr`)
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const dist = resolve(process.argv[2] ?? 'dist')
const htmlPath = resolve(dist, 'index.html')
const html = await readFile(htmlPath, 'utf8')
if (!html.includes('<!--app-html-->')) throw new Error(`${htmlPath} has no <!--app-html--> placeholder`)

const { render } = await import(pathToFileURL(resolve('dist-ssr/entry-server.js')).href)
const app = render()
await writeFile(htmlPath, html.replace('<!--app-html-->', app))
console.log(`prerendered ${htmlPath} (${(app.length / 1024).toFixed(1)} KB of HTML)`)
