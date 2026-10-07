// Turns dist-artifact/ (built with `vite build --mode artifact` and prerendered) into one page for the
// claude.ai Artifact. The host wraps the page in its own <head>, and its security policy only admits
// inline scripts/styles and data: fonts, so:
//   - CSS and the single JS file are inlined; fonts become data: URIs
//   - the boot script and the prerendered #root stay as they are (first paint is real HTML)
//   - privacy.html becomes a dialog (the preview has no second page to navigate to)
//   - textures/posters/video stay separate supporting files, loaded by relative URL
// Output: dist-artifact/page.html + dist-artifact/publish-files.json ({ "<published path>": "<source>" }).
import { readFile, readdir, stat, writeFile } from 'node:fs/promises'
import { dirname, join, relative, resolve } from 'node:path'

const root = resolve('dist-artifact')
const html = await readFile(join(root, 'index.html'), 'utf8')

// ---- styles: <link rel="stylesheet" href="./assets/x.css"> → inline <style>, fonts → data: URIs
const cssLinks = [...html.matchAll(/<link[^>]+rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g)]
let css = ''
for (const [, href] of cssLinks) {
  const file = join(root, href)
  let text = await readFile(file, 'utf8')
  const urls = [...new Set([...text.matchAll(/url\(([^)]+\.woff2)\)/g)].map((m) => m[1].replace(/["']/g, '')))]
  for (const u of urls) {
    const font = await readFile(resolve(dirname(file), u))
    text = text.split(u).join(`data:font/woff2;base64,${font.toString('base64')}`)
  }
  css += text
}

// ---- script: exactly one module chunk (codeSplitting: false)
const scripts = [...html.matchAll(/<script type="module"[^>]*src="([^"]+)"[^>]*><\/script>/g)]
if (scripts.length !== 1) throw new Error(`expected 1 module script, found ${scripts.length}`)
const assetFiles = await readdir(join(root, 'assets'))
const jsChunks = assetFiles.filter((f) => f.endsWith('.js'))
if (jsChunks.length !== 1) throw new Error(`expected a single JS chunk in dist-artifact/assets, found: ${jsChunks.join(', ')}`)
const js = (await readFile(join(root, scripts[0][1]), 'utf8')).replace(/<\/script/gi, '<\\/script')

// ---- body: boot script + prerendered root
const body = html.split(/<body[^>]*>/)[1].split('</body>')[0]
const bootScript = body.match(/<script>[\s\S]*?<\/script>/)?.[0]
// Vite puts the module script in <head>; #root is the last element of <body>.
const rootHtml = body.slice(body.indexOf('<div id="root">')).trim()
if (!bootScript || !rootHtml.startsWith('<div id="root">')) throw new Error('could not find the boot script or the prerendered #root')

// ---- privacy page → dialog
const privacy = await readFile(join(root, 'privacy.html'), 'utf8')
const privacyMain = privacy.match(/<main[^>]*>([\s\S]*?)<\/main>/)?.[1] ?? ''
const privacyBody = privacyMain.replace(/<p>\s*<a href="\.\/"[^>]*>[\s\S]*?<\/a>\s*<\/p>/, '').replace('<h1>', '<h2 id="privacy-title">').replace('</h1>', '</h2>')
const privacyDialog = `<dialog id="privacy-dialog" class="privacy-dialog" aria-labelledby="privacy-title"><button type="button" class="privacy-dialog__close" data-close aria-label="Close">×</button><div class="privacy-dialog__body">${privacyBody}</div></dialog>`
const privacyCss = `.privacy-dialog{max-width:min(680px,calc(100% - 32px));max-height:calc(100% - 32px);padding:0;border:1px solid rgba(245,248,252,.14);border-radius:20px;background:#0B1426;color:#F5F8FC}.privacy-dialog::backdrop{background:rgba(4,10,22,.7)}.privacy-dialog__body{padding:28px}.privacy-dialog__body p{color:#A9B8CF}.privacy-dialog__close{position:sticky;top:12px;float:right;margin:12px 12px 0 0;width:44px;height:44px;border-radius:999px;border:1px solid rgba(245,248,252,.14);background:#0B1426;color:#F5F8FC;font-size:22px;cursor:pointer}`
const privacyJs = `document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a[href$="privacy.html"]');if(!a)return;e.preventDefault();var d=document.getElementById('privacy-dialog');d.showModal?d.showModal():d.setAttribute('open','')});document.getElementById('privacy-dialog').addEventListener('click',function(e){if(e.target===this||e.target.closest('[data-close]'))this.close()});`

const page = `<title>Airplanes Around the World</title>
${bootScript}
<style>
${css}
${privacyCss}
</style>
${rootHtml}
${privacyDialog}
<script>${privacyJs}</script>
<script type="module">${js}</script>
`
await writeFile(join(root, 'page.html'), page)

// ---- supporting files (published next to the page under the same relative paths)
const files = {}
async function walk(dir) {
  for (const name of await readdir(dir)) {
    const p = join(dir, name)
    if ((await stat(p)).isDirectory()) await walk(p)
    else files[relative(root, p)] = relative(process.cwd(), p)
  }
}
for (const dir of ['textures', 'posters', 'video']) {
  try {
    await walk(join(root, dir))
  } catch {
    /* folder may not exist yet */
  }
}
await writeFile(join(root, 'publish-files.json'), JSON.stringify(files, null, 2))

const kb = (n) => `${(n / 1024).toFixed(0)} KB`
const assetsTotal = (await Promise.all(Object.values(files).map((f) => stat(f).then((s) => s.size)))).reduce((a, b) => a + b, 0)
console.log(`page.html ${kb(Buffer.byteLength(page))} (js ${kb(Buffer.byteLength(js))}, css+fonts ${kb(Buffer.byteLength(css))})`)
console.log(`${Object.keys(files).length} supporting files, ${kb(assetsTotal)} → publish-files.json`)
if (Buffer.byteLength(page) > 1.9 * 1024 * 1024) {
  console.error('page.html is over the 1.9 MB budget')
  process.exit(1)
}
