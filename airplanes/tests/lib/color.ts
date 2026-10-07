import type { RGBAImage } from './png'

/** WCAG relative luminance of an sRGB colour (0..255 channels). */
export function luminance(r: number, g: number, b: number): number {
  const lin = (c: number) => {
    const s = c / 255
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

export function contrastRatio(l1: number, l2: number): number {
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1]
  return (hi + 0.05) / (lo + 0.05)
}

/** Parses a computed CSS colour: rgb(), rgba() or color(srgb …). Returns 0..255 channels + alpha. */
export function parseCssColor(css: string): { r: number; g: number; b: number; a: number } | null {
  let m = css.match(/rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+%?))?\s*\)/)
  if (m) {
    const a = m[4] === undefined ? 1 : m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4])
    return { r: +m[1], g: +m[2], b: +m[3], a }
  }
  m = css.match(/color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+%?))?\s*\)/)
  if (m) {
    const a = m[4] === undefined ? 1 : m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4])
    return { r: +m[1] * 255, g: +m[2] * 255, b: +m[3] * 255, a }
  }
  return null
}

/** Luminance values of the pixels inside a CSS-px rect of a screenshot taken at `dpr`. */
export function regionLuminances(img: RGBAImage, rect: { x: number; y: number; width: number; height: number }, dpr: number): number[] {
  const x0 = Math.max(0, Math.floor(rect.x * dpr))
  const y0 = Math.max(0, Math.floor(rect.y * dpr))
  const x1 = Math.min(img.width, Math.ceil((rect.x + rect.width) * dpr))
  const y1 = Math.min(img.height, Math.ceil((rect.y + rect.height) * dpr))
  const out: number[] = []
  // Sample at most ~40k pixels to stay fast on big blocks.
  const step = Math.max(1, Math.floor(Math.sqrt(((x1 - x0) * (y1 - y0)) / 40_000)))
  for (let y = y0; y < y1; y += step)
    for (let x = x0; x < x1; x += step) {
      const i = (y * img.width + x) * 4
      out.push(luminance(img.data[i], img.data[i + 1], img.data[i + 2]))
    }
  return out
}

export function percentile(values: number[], p: number): number {
  if (!values.length) return NaN
  const s = [...values].sort((a, b) => a - b)
  return s[Math.min(s.length - 1, Math.max(0, Math.round((p / 100) * (s.length - 1))))]
}
