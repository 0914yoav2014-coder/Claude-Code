import { inflateSync } from 'node:zlib'

/** Decoded image, always RGBA 8-bit. */
export interface RGBAImage {
  width: number
  height: number
  data: Uint8Array
}

const CHANNELS: Record<number, number> = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }

function paeth(a: number, b: number, c: number): number {
  const p = a + b - c
  const pa = Math.abs(p - a)
  const pb = Math.abs(p - b)
  const pc = Math.abs(p - c)
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c
}

/** Minimal PNG decoder (8-bit, non-interlaced): enough for Chromium screenshots. */
export function decodePng(buf: Buffer): RGBAImage {
  let off = 8
  let width = 0
  let height = 0
  let depth = 0
  let type = 0
  let interlace = 0
  let palette: Buffer | null = null
  const idat: Buffer[] = []
  while (off < buf.length) {
    const len = buf.readUInt32BE(off)
    const kind = buf.toString('ascii', off + 4, off + 8)
    const data = buf.subarray(off + 8, off + 8 + len)
    if (kind === 'IHDR') {
      width = data.readUInt32BE(0)
      height = data.readUInt32BE(4)
      depth = data[8]
      type = data[9]
      interlace = data[12]
    } else if (kind === 'PLTE') palette = data
    else if (kind === 'IDAT') idat.push(data)
    else if (kind === 'IEND') break
    off += 12 + len
  }
  if (depth !== 8 || interlace !== 0 || !(type in CHANNELS)) throw new Error(`unsupported PNG (depth ${depth}, type ${type}, interlace ${interlace})`)
  const ch = CHANNELS[type]
  const raw = inflateSync(Buffer.concat(idat))
  const stride = width * ch
  const out = new Uint8Array(width * height * 4)
  let prev = new Uint8Array(stride)
  let cur = new Uint8Array(stride)
  let p = 0
  for (let y = 0; y < height; y++) {
    const filter = raw[p++]
    for (let x = 0; x < stride; x++) {
      const a = x >= ch ? cur[x - ch] : 0
      const b = prev[x]
      const c = x >= ch ? prev[x - ch] : 0
      let v = raw[p++]
      if (filter === 1) v += a
      else if (filter === 2) v += b
      else if (filter === 3) v += (a + b) >> 1
      else if (filter === 4) v += paeth(a, b, c)
      cur[x] = v & 255
    }
    for (let x = 0; x < width; x++) {
      const o = (y * width + x) * 4
      const i = x * ch
      if (type === 6) out.set(cur.subarray(i, i + 4), o)
      else if (type === 2) {
        out[o] = cur[i]
        out[o + 1] = cur[i + 1]
        out[o + 2] = cur[i + 2]
        out[o + 3] = 255
      } else if (type === 0 || type === 4) {
        out[o] = out[o + 1] = out[o + 2] = cur[i]
        out[o + 3] = type === 4 ? cur[i + 1] : 255
      } else if (type === 3 && palette) {
        const k = cur[i] * 3
        out[o] = palette[k]
        out[o + 1] = palette[k + 1]
        out[o + 2] = palette[k + 2]
        out[o + 3] = 255
      }
    }
    const t = prev
    prev = cur
    cur = t
  }
  return { width, height, data: out }
}

/** Fraction of pixels (0..1) whose RGB differs by more than `tolerance` on any channel. */
export function diffFraction(a: RGBAImage, b: RGBAImage, tolerance = 8): number {
  if (a.width !== b.width || a.height !== b.height) return 1
  let n = 0
  for (let i = 0; i < a.data.length; i += 4) {
    if (
      Math.abs(a.data[i] - b.data[i]) > tolerance ||
      Math.abs(a.data[i + 1] - b.data[i + 1]) > tolerance ||
      Math.abs(a.data[i + 2] - b.data[i + 2]) > tolerance
    )
      n++
  }
  return n / (a.width * a.height)
}
