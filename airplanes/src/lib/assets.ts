/**
 * Every streamed asset path, final from day one (files live in public/, so they are served next to
 * index.html in both builds and are published as supporting files of the Artifact).
 * Owners: textures/earth → Content (pipeline + credits); textures/fx, posters, video → 3D.
 * A file may be a small placeholder until its owner delivers it, but the path never changes.
 */
export const ASSETS = {
  earth: {
    day2k: 'textures/earth/day-2k.webp',
    day4k: 'textures/earth/day-4k.webp',
    night2k: 'textures/earth/night-2k.webp',
    night4k: 'textures/earth/night-4k.webp',
    normal2k: 'textures/earth/normal-2k.webp',
    water1k: 'textures/earth/water-1k.webp',
    clouds2k: 'textures/earth/clouds-2k.webp',
  },
  fx: {
    /** Soft cloud-puff sprite atlas (2×2 variants) for the hero cloud flight. */
    cloudPuffs: 'textures/fx/cloud-puffs.webp',
  },
  posters: {
    /** First hero frame, shown before the canvas draws and in the lighter version. */
    hero16x9: 'posters/hero-16x9.webp',
    hero9x16: 'posters/hero-9x16.webp',
  },
  video: {
    /** 8 s seamless hero loop for the lighter version. */
    heroMp4: 'video/hero-loop.mp4',
    heroWebm: 'video/hero-loop.webm',
  },
} as const

/** URL for a public asset, relative to the page (works from any host path and in the Artifact). */
export function assetUrl(path: string): string {
  return import.meta.env.BASE_URL + path
}
