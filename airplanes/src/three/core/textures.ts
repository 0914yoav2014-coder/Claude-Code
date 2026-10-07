import {
  ClampToEdgeWrapping,
  DataTexture,
  LinearFilter,
  LinearMipmapLinearFilter,
  NoColorSpace,
  RepeatWrapping,
  RGBAFormat,
  SRGBColorSpace,
  Texture,
  UnsignedByteType,
  type WebGLRenderer,
} from 'three'
import { assetUrl } from '../../lib/assets'
import { demand } from './demand'

/**
 * Texture loading for our own shaders: fetch → createImageBitmap (decoded off the main thread),
 * uploaded with flipY = false, so every shader samples with v flipped (row 0 = north / top).
 * Uploads happen in idle time (gl.initTexture), one per idle slot, so nothing hitches mid-scroll.
 */
export interface LoadOptions {
  srgb?: boolean
  repeat?: boolean
  anisotropy?: number
}

async function decode(blob: Blob): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(blob, { imageOrientation: 'none', premultiplyAlpha: 'none', colorSpaceConversion: 'none' })
    } catch {
      try {
        return await createImageBitmap(blob)
      } catch {
        /* fall through to an <img> */
      }
    }
  }
  const url = URL.createObjectURL(blob)
  const img = new Image()
  img.src = url
  await img.decode()
  URL.revokeObjectURL(url)
  return img
}

/** Loads a texture; resolves to null when the file is missing or only a tiny placeholder. */
export async function loadTexture(path: string, opts: LoadOptions = {}): Promise<Texture | null> {
  try {
    const res = await fetch(assetUrl(path))
    if (!res.ok) return null
    const image = await decode(await res.blob())
    if (image.width <= 4 || image.height <= 4) {
      if ('close' in image) image.close()
      return null
    }
    const tex = new Texture(image as unknown as HTMLImageElement)
    tex.flipY = false
    tex.colorSpace = opts.srgb ? SRGBColorSpace : NoColorSpace
    tex.wrapS = opts.repeat ? RepeatWrapping : ClampToEdgeWrapping
    tex.wrapT = opts.repeat ? RepeatWrapping : ClampToEdgeWrapping
    tex.minFilter = LinearMipmapLinearFilter
    tex.magFilter = LinearFilter
    tex.anisotropy = opts.anisotropy ?? 4
    tex.needsUpdate = true
    return tex
  } catch {
    return null
  }
}

/** A 1×1 texture of one colour (stands in until the real file arrives). */
export function solidTexture(r: number, g: number, b: number, a = 255): DataTexture {
  const t = new DataTexture(new Uint8Array([r, g, b, a]), 1, 1, RGBAFormat, UnsignedByteType)
  t.needsUpdate = true
  return t
}

const idle: (cb: () => void) => void =
  typeof window !== 'undefined' && 'requestIdleCallback' in window
    ? (cb) => window.requestIdleCallback(cb, { timeout: 600 })
    : (cb) => setTimeout(cb, 16)

const queue: { tex: Texture; done?: () => void }[] = []
let pumping = false
let onUpload: (() => void) | null = null

/** Called after every upload (the governor skips its warm-up window). */
export function setUploadListener(fn: (() => void) | null): void {
  onUpload = fn
}

/** Upload textures to the GPU one per idle slot. */
export function uploadInIdle(gl: WebGLRenderer, tex: Texture, done?: () => void): void {
  queue.push({ tex, done })
  if (pumping) return
  pumping = true
  const pump = () => {
    const job = queue.shift()
    if (!job) {
      pumping = false
      return
    }
    try {
      gl.initTexture(job.tex)
    } catch {
      /* context lost: the texture uploads on first use instead */
    }
    onUpload?.()
    job.done?.()
    demand.invalidate()
    idle(pump)
  }
  idle(pump)
}
