import { expect, test } from '@playwright/test'
import { CAM_KEYS, type Markers } from '../../src/state/store'
import { assertMarkers, defaultMarkers, holdAt, progressBetween, segmentAt } from '../../src/state/timeline'

/** src/state/timeline.ts (Lead): pure scroll → camera mapping shared by Frontend and 3D (CONTRACTS §4). */
const vh = 1000
const m: Markers = defaultMarkers(vh)

test.describe('defaultMarkers', () => {
  test('all nine keys, strictly increasing, for several viewport heights', () => {
    for (const h of [568, 740, 844, 900, 1000, 1440]) {
      const d = defaultMarkers(h)
      expect(Object.keys(d).sort()).toEqual([...CAM_KEYS].sort())
      for (let i = 1; i < CAM_KEYS.length; i++) expect(d[CAM_KEYS[i]], `${CAM_KEYS[i]} > ${CAM_KEYS[i - 1]} at vh ${h}`).toBeGreaterThan(d[CAM_KEYS[i - 1]])
      expect(() => assertMarkers(d)).not.toThrow()
    }
  })

  test('match the section heights in the contract (vh = 1000)', () => {
    expect(m).toEqual({ hero: 0, climb: 300, clouds: 1800, earth: 2600, globe: 3000, globeOut: 4200, hangar: 5200, hangarOut: 6600, night: 7600 })
  })

  test('assertMarkers rejects equal or decreasing markers', () => {
    expect(() => assertMarkers({ ...m, globe: m.earth })).toThrow()
    expect(() => assertMarkers({ ...m, night: m.hangar })).toThrow()
  })
})

test.describe('segmentAt', () => {
  test('before and at the first marker: hero → climb at 0', () => {
    expect(segmentAt(-50, m)).toEqual({ from: 'hero', to: 'climb', f: 0 })
    expect(segmentAt(0, m)).toEqual({ from: 'hero', to: 'climb', f: 0 })
  })

  test('progress inside each segment', () => {
    expect(segmentAt(150, m)).toEqual({ from: 'hero', to: 'climb', f: 0.5 })
    const s = segmentAt(2200, m)
    expect(s.from).toBe('clouds')
    expect(s.to).toBe('earth')
    expect(s.f).toBeCloseTo(0.5, 6)
    expect(segmentAt(3600, m)).toEqual({ from: 'globe', to: 'globeOut', f: 0.5 })
  })

  test('on a marker the segment starts there', () => {
    for (let i = 1; i < CAM_KEYS.length - 1; i++) {
      const s = segmentAt(m[CAM_KEYS[i]], m)
      expect(s.from, `at ${CAM_KEYS[i]}`).toBe(CAM_KEYS[i])
      expect(s.f).toBe(0)
    }
  })

  test('at and after the last marker: hangarOut → night at 1', () => {
    expect(segmentAt(m.night, m)).toEqual({ from: 'hangarOut', to: 'night', f: 1 })
    expect(segmentAt(99_999, m)).toEqual({ from: 'hangarOut', to: 'night', f: 1 })
  })

  test('f is always within 0..1 and segments follow the key order', () => {
    for (let y = -100; y < 8000; y += 37) {
      const s = segmentAt(y, m)
      expect(s.f).toBeGreaterThanOrEqual(0)
      expect(s.f).toBeLessThanOrEqual(1)
      expect(CAM_KEYS.indexOf(s.to)).toBe(CAM_KEYS.indexOf(s.from) + 1)
    }
  })
})

test.describe('holdAt', () => {
  test('hero window until the climb marker', () => {
    expect(holdAt(0, m)).toBe('hero')
    expect(holdAt(m.climb - 1, m)).toBe('hero')
    expect(holdAt(m.climb, m)).toBeNull()
  })

  test('globe window from globe to globeOut (2 px tolerance)', () => {
    expect(holdAt(m.globe - 3, m)).toBeNull()
    expect(holdAt(m.globe - 2, m)).toBe('globe')
    expect(holdAt(m.globe, m)).toBe('globe')
    expect(holdAt((m.globe + m.globeOut) / 2, m)).toBe('globe')
    expect(holdAt(m.globeOut + 2, m)).toBe('globe')
    expect(holdAt(m.globeOut + 3, m)).toBeNull()
  })

  test('hangar window from hangar to hangarOut', () => {
    expect(holdAt(m.hangar, m)).toBe('hangar')
    expect(holdAt(m.hangarOut, m)).toBe('hangar')
    expect(holdAt(m.hangarOut + 10, m)).toBeNull()
    expect(holdAt(m.night, m)).toBeNull()
  })

  test('custom tolerance', () => {
    expect(holdAt(m.globe - 10, m, 10)).toBe('globe')
    expect(holdAt(m.globe - 10, m, 0)).toBeNull()
  })
})

test.describe('progressBetween', () => {
  test('clamped 0..1 between two markers', () => {
    expect(progressBetween(m.globe - 100, m, 'globe', 'globeOut')).toBe(0)
    expect(progressBetween(m.globe, m, 'globe', 'globeOut')).toBe(0)
    expect(progressBetween((m.globe + m.globeOut) / 2, m, 'globe', 'globeOut')).toBeCloseTo(0.5, 6)
    expect(progressBetween(m.globeOut, m, 'globe', 'globeOut')).toBe(1)
    expect(progressBetween(m.night + 500, m, 'globe', 'globeOut')).toBe(1)
  })

  test('across several segments', () => {
    expect(progressBetween(m.hero + (m.night - m.hero) / 4, m, 'hero', 'night')).toBeCloseTo(0.25, 6)
  })

  test('zero or negative span is a step at b', () => {
    const z = { ...m, globeOut: m.globe }
    expect(progressBetween(m.globe - 1, z, 'globe', 'globeOut')).toBe(0)
    expect(progressBetween(m.globe, z, 'globe', 'globeOut')).toBe(1)
  })
})
