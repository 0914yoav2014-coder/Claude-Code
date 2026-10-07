import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { COPY, fill } from '../../src/data/copy'
import { PRD_COPY } from '../lib/prd'

/** The PRD's exact copy lives in src/data/copy.ts (lines marked // PRD must match it word for word). */
test('every PRD line is in copy.ts, verbatim', () => {
  const flat: string[] = []
  const walk = (o: unknown) => {
    if (typeof o === 'string') flat.push(o)
    else if (o && typeof o === 'object') Object.values(o).forEach(walk)
  }
  walk(COPY)
  const missing = Object.entries(PRD_COPY)
    .filter(([, line]) => !flat.some((s) => s === line || (line.includes('N%') && s === line.replace('N%', '{n}%'))))
    .map(([k, line]) => `${k}: "${line}"`)
  expect(missing, 'PRD lines missing from src/data/copy.ts').toEqual([])
})

test('PRD lines sit at the keys the UI reads', () => {
  expect(COPY.hero.headline).toBe(PRD_COPY.headline)
  expect(COPY.hero.sub).toBe(PRD_COPY.sub)
  expect(COPY.hero.cta).toBe(PRD_COPY.cta)
  expect(COPY.nav.cta).toBe(PRD_COPY.cta)
  expect(COPY.hero.secondary).toBe(PRD_COPY.secondary)
  expect(COPY.globe.hint).toBe(PRD_COPY.globeHint)
  expect(COPY.hangar.title).toBe(PRD_COPY.hangar)
  expect(COPY.hangar.closeup).toBe(PRD_COPY.closeup)
  expect(COPY.facts.title).toBe(PRD_COPY.facts)
  expect(COPY.signup.title).toBe(PRD_COPY.signup)
  expect(COPY.signup.button).toBe(PRD_COPY.signupButton)
  expect(COPY.motion.pause).toBe(PRD_COPY.pause)
  expect(COPY.motion.play).toBe(PRD_COPY.play)
  expect(fill(COPY.loader.progress, { n: 42 })).toBe('Preparing for takeoff… 42%')
  expect(COPY.signup.success).toBe(PRD_COPY.success)
  expect(COPY.signup.invalid).toBe(PRD_COPY.invalid)
  expect(COPY.signup.offline).toBe(PRD_COPY.offline)
  expect(COPY.lite.notice).toBe(PRD_COPY.lite)
})

test('lines marked // PRD in copy.ts are PRD lines', () => {
  const src = readFileSync(join(import.meta.dirname, '../../src/data/copy.ts'), 'utf8')
  const prd = new Set(Object.values(PRD_COPY).map((l) => l.replace('N%', '{n}%')))
  const marked = src
    .split('\n')
    .filter((l) => /\/\/\s*PRD\b(?!\s*\(F13)/.test(l))
    .map((l) => l.match(/:\s*(['"])(.*)\1,?\s*\/\//)?.[2]?.replace(/\\'/g, "'"))
    .filter((s): s is string => !!s)
  const unknown = marked.filter((s) => !prd.has(s))
  expect(unknown, 'lines marked // PRD that are not in the QA copy list (PRD changed, or a typo)').toEqual([])
})
