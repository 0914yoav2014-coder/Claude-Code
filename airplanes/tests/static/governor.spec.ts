import { expect, test } from '@playwright/test'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Quality governor (3D-owned), frozen signature in docs/CONTRACTS.md §10:
 *   decide(stats: {p50, p90}, at: {tier, step}, slowWindows) → 'keep' | 'down' | 'lite'
 *   nextTier(at) → high-0 → medium-0 → medium-1 → null (Lite)
 * slowWindows = consecutive *previous* windows with p50 > 33.3 on medium step 1, so the current window
 * makes the third in a row when slowWindows ≥ 2.
 */
type TierAt = { tier: 'high' | 'medium'; step: 0 | 1 }
type Gov = {
  decide: (stats: { p50: number; p90: number }, at: TierAt, slowWindows: number) => 'keep' | 'down' | 'lite'
  nextTier: (at: TierAt) => TierAt | null
}

const FILE = join(import.meta.dirname, '../../src/three/quality/governor.ts')
const HIGH: TierAt = { tier: 'high', step: 0 }
const MED0: TierAt = { tier: 'medium', step: 0 }
const MED1: TierAt = { tier: 'medium', step: 1 }

let gov: Gov
test.beforeAll(async () => {
  test.skip(!existsSync(FILE), 'src/three/quality/governor.ts not delivered yet by 3D (CONTRACTS §10)')
  gov = (await import('../../src/three/quality/governor')) as unknown as Gov
})

test('governor.ts stays pure: no three.js import', () => {
  expect(readFileSync(FILE, 'utf8')).not.toMatch(/from\s+['"]three['"/]|from\s+['"]@react-three/)
})

test('exports decide() and nextTier()', () => {
  expect(typeof gov.decide).toBe('function')
  expect(typeof gov.nextTier).toBe('function')
})

test.describe('decide() on high', () => {
  test('keeps a smooth tier', () => {
    expect(gov.decide({ p50: 10, p90: 14 }, HIGH, 0)).toBe('keep')
    expect(gov.decide({ p50: 18.5, p90: 28 }, HIGH, 0)).toBe('keep') // limits are strict ">"
  })
  test('steps down when p50 > 18.5', () => {
    expect(gov.decide({ p50: 18.6, p90: 20 }, HIGH, 0)).toBe('down')
    expect(gov.decide({ p50: 30, p90: 40 }, HIGH, 0)).toBe('down')
  })
  test('steps down when p90 > 28 even with a good median', () => {
    expect(gov.decide({ p50: 12, p90: 28.1 }, HIGH, 0)).toBe('down')
  })
  test('never goes to Lite straight from high', () => {
    expect(gov.decide({ p50: 80, p90: 120 }, HIGH, 5)).toBe('down')
  })
})

test.describe('decide() on medium step 0', () => {
  test('keeps up to p50 = 24 (p90 alone does not step down)', () => {
    expect(gov.decide({ p50: 20, p90: 26 }, MED0, 0)).toBe('keep')
    expect(gov.decide({ p50: 24, p90: 60 }, MED0, 0)).toBe('keep')
  })
  test('steps down to step 1 when p50 > 24', () => {
    expect(gov.decide({ p50: 24.1, p90: 30 }, MED0, 0)).toBe('down')
  })
  test('never goes to Lite straight from medium step 0', () => {
    expect(gov.decide({ p50: 80, p90: 120 }, MED0, 5)).toBe('down')
  })
})

test.describe('decide() on medium step 1', () => {
  test('keeps while p50 ≤ 33.3', () => {
    expect(gov.decide({ p50: 33.3, p90: 60 }, MED1, 2)).toBe('keep')
    expect(gov.decide({ p50: 25, p90: 40 }, MED1, 0)).toBe('keep')
  })
  test('keeps the first and second slow windows', () => {
    expect(gov.decide({ p50: 40, p90: 50 }, MED1, 0)).toBe('keep')
    expect(gov.decide({ p50: 40, p90: 50 }, MED1, 1)).toBe('keep')
  })
  test('goes to Lite on the third slow window in a row', () => {
    expect(gov.decide({ p50: 40, p90: 50 }, MED1, 2)).toBe('lite')
    expect(gov.decide({ p50: 33.4, p90: 34 }, MED1, 3)).toBe('lite')
  })
  test('a fast window on step 1 keeps', () => {
    expect(gov.decide({ p50: 16, p90: 20 }, MED1, 2)).toBe('keep')
  })
  test('never returns down on the lowest 3D tier', () => {
    for (const p50 of [10, 25, 34, 60]) for (const n of [0, 1, 2, 3]) expect(gov.decide({ p50, p90: p50 * 1.5 }, MED1, n)).not.toBe('down')
  })
})

test('nextTier(): high-0 → medium-0 → medium-1 → null', () => {
  expect(gov.nextTier(HIGH)).toEqual(MED0)
  expect(gov.nextTier(MED0)).toEqual(MED1)
  expect(gov.nextTier(MED1)).toBeNull()
})

test('decide() is pure (same input, same output; inputs untouched)', () => {
  const stats = Object.freeze({ p50: 20, p90: 30 })
  const at = Object.freeze({ ...HIGH })
  const a = gov.decide(stats, at, 0)
  expect(gov.decide(stats, at, 0)).toBe(a)
})
