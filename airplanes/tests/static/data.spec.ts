import { expect, test } from '@playwright/test'
import { FACTS, formatFact } from '../../src/data/facts'
import { PLANE_BY_ID, PLANES } from '../../src/data/planes'
import { ROUTE_BY_ID, ROUTES } from '../../src/data/routes'
import { SITE } from '../../src/data/site'
import { greatCircleKm, parseDurationLabel, parseNumberLabel } from '../lib/geo'

/**
 * Data rules from docs/CONTRACTS.md §12 (Content-owned data in src/data/*). No browser, no build.
 * Tests that need the 12-route upgrade fail until Content delivers it.
 */
const PLANE_IDS = ['a350', 'a380', 'b747', 'concorde', 'twinotter', 'islander']

/** A note can excuse a distance that differs from the great circle (e.g. the flown track is longer). */
const DISTANCE_EXCUSE = /great[- ]circle|flown (?:track|distance|route)|routing|detour|winds?|not (?:a )?direct|via\b/i

const allSources = () => [
  ...PLANES.flatMap((p) => p.sources.map((s) => ({ where: `plane ${p.id}`, ...s }))),
  ...ROUTES.flatMap((r) => r.sources.map((s) => ({ where: `route ${r.id}`, ...s }))),
  ...FACTS.map((f) => ({ where: `fact ${f.id}`, ...f.source })),
  ...SITE.credits.map((c) => ({ where: 'site credit', ...c })),
]

test.describe('planes', () => {
  test('six planes with the contract ids, in order', () => {
    expect(PLANES.map((p) => p.id)).toEqual(PLANE_IDS)
    expect(Object.keys(PLANE_BY_ID).sort()).toEqual([...PLANE_IDS].sort())
  })

  test('numeric stats and real proportions', () => {
    for (const p of PLANES) {
      const where = `plane ${p.id}`
      expect(typeof p.cruiseKmh, where).toBe('number')
      expect(p.cruiseKmh, `${where} cruiseKmh`).toBeGreaterThan(100)
      expect(p.cruiseKmh, `${where} cruiseKmh`).toBeLessThan(2500)
      expect(Number.isInteger(p.passengers), `${where} passengers is an integer`).toBe(true)
      expect(p.passengers, `${where} passengers`).toBeGreaterThan(0)
      expect(p.passengers, `${where} passengers`).toBeLessThanOrEqual(853)
      const s = p.shape
      for (const k of ['lengthM', 'spanM', 'heightM', 'fuselageM'] as const) {
        expect(Number.isFinite(s[k]) && s[k] > 0, `${where} shape.${k} = ${s[k]}`).toBe(true)
      }
      expect(s.lengthM, `${where} length < 80 m`).toBeLessThan(80)
      expect(s.heightM, `${where} height < length`).toBeLessThan(s.lengthM)
      expect(s.fuselageM, `${where} fuselage < height`).toBeLessThan(s.heightM)
      expect([2, 4], `${where} engines`).toContain(s.engines)
      for (const k of ['name', 'shortName', 'nickname', 'maker', 'firstFlight', 'fact', 'story'] as const) {
        expect(p[k].trim().length, `${where} ${k} is filled`).toBeGreaterThan(0)
      }
    }
  })

  test('every plane lists exactly two existing route ids, and they are its own', () => {
    for (const p of PLANES) {
      expect(p.routes, `plane ${p.id} routes`).toHaveLength(2)
      expect(new Set(p.routes).size, `plane ${p.id} routes are distinct`).toBe(2)
      for (const id of p.routes) {
        expect(ROUTE_BY_ID[id], `plane ${p.id} lists route ${id}, which does not exist`).toBeTruthy()
        expect(ROUTE_BY_ID[id]?.plane, `route ${id} is listed by ${p.id}`).toBe(p.id)
      }
    }
  })

  test('every plane has at least one https source', () => {
    for (const p of PLANES) expect(p.sources.length, `plane ${p.id} sources`).toBeGreaterThan(0)
  })
})

test.describe('routes', () => {
  test('twelve routes with unique ids', () => {
    expect(ROUTES.map((r) => r.id)).toHaveLength(12)
    expect(new Set(ROUTES.map((r) => r.id)).size).toBe(ROUTES.length)
    expect(Object.keys(ROUTE_BY_ID)).toHaveLength(ROUTES.length)
  })

  test('two routes per plane, and every route.plane exists', () => {
    for (const r of ROUTES) expect(PLANE_IDS, `route ${r.id} plane`).toContain(r.plane)
    for (const id of PLANE_IDS) {
      const mine = ROUTES.filter((r) => r.plane === id).map((r) => r.id)
      expect(mine, `routes flown by ${id}`).toHaveLength(2)
      expect([...mine].sort(), `${id}.routes matches the routes that name it`).toEqual([...PLANE_BY_ID[id as keyof typeof PLANE_BY_ID].routes].sort())
    }
  })

  test('coordinates are valid [lat, lon] and from ≠ to', () => {
    for (const r of ROUTES) {
      for (const end of [r.from, r.to]) {
        const [lat, lon] = end.at
        expect(end.at, `route ${r.id} ${end.code}`).toHaveLength(2)
        expect(lat >= -90 && lat <= 90, `route ${r.id} ${end.code} latitude ${lat}`).toBe(true)
        expect(lon >= -180 && lon <= 180, `route ${r.id} ${end.code} longitude ${lon}`).toBe(true)
        expect(end.city.trim(), `route ${r.id} city`).not.toBe('')
        expect(end.code.trim(), `route ${r.id} code`).not.toBe('')
      }
      expect(r.from.at, `route ${r.id} from and to differ`).not.toEqual(r.to.at)
    }
  })

  test('distanceKm is within ±5 % of the great-circle distance', () => {
    const rows: string[] = []
    const bad: string[] = []
    for (const r of ROUTES) {
      const gc = greatCircleKm(r.from.at, r.to.at)
      const diff = (r.distanceKm - gc) / gc
      const excused = DISTANCE_EXCUSE.test(r.note)
      rows.push(`${r.id}: listed ${r.distanceKm} km, great circle ${gc.toFixed(1)} km (${(diff * 100).toFixed(1)} %)${excused ? ' [note excuses]' : ''}`)
      if (Math.abs(diff) > 0.05 && !excused) bad.push(rows[rows.length - 1])
    }
    test.info().annotations.push({ type: 'distances', description: rows.join('\n') })
    expect(bad, `distances off by more than 5 %:\n${bad.join('\n')}`).toEqual([])
  })

  test('numeric distance and duration agree with the printed labels', () => {
    for (const r of ROUTES) {
      expect(typeof r.distanceKm === 'number' && r.distanceKm > 0, `route ${r.id} distanceKm`).toBe(true)
      expect(typeof r.durationMin === 'number' && r.durationMin > 0, `route ${r.id} durationMin`).toBe(true)
      const d = parseNumberLabel(r.distanceLabel)
      expect(d, `route ${r.id} distanceLabel "${r.distanceLabel}" has a number`).not.toBeNull()
      expect(/km|mi/.test(r.distanceLabel), `route ${r.id} distanceLabel "${r.distanceLabel}" has a unit`).toBe(true)
      if (/km/.test(r.distanceLabel)) expect(Math.abs(d! - r.distanceKm) / r.distanceKm, `route ${r.id}: label "${r.distanceLabel}" vs ${r.distanceKm} km`).toBeLessThanOrEqual(0.02)
      const t = parseDurationLabel(r.durationLabel)
      expect(t, `route ${r.id} durationLabel "${r.durationLabel}" parses`).not.toBeNull()
      const lo = t!.min * 0.95
      const hi = t!.max * 1.05
      expect(r.durationMin >= lo && r.durationMin <= hi, `route ${r.id}: label "${r.durationLabel}" vs ${r.durationMin} min`).toBe(true)
    }
  })

  test('average speeds are physically plausible for the plane', () => {
    for (const r of ROUTES) {
      const kmh = r.distanceKm / (r.durationMin / 60)
      const cruise = PLANE_BY_ID[r.plane].cruiseKmh
      // Block times include taxi and climb, so the average sits below cruise; it can never beat it by much.
      expect(kmh, `route ${r.id}: ${kmh.toFixed(0)} km/h average vs ${cruise} km/h cruise`).toBeLessThan(cruise * 1.15)
    }
  })

  test('each route has flags, text and at least one source', () => {
    for (const r of ROUTES) {
      expect(typeof r.historic, `route ${r.id} historic`).toBe('boolean')
      expect(r.airline.trim(), `route ${r.id} airline`).not.toBe('')
      expect(r.note.trim(), `route ${r.id} note`).not.toBe('')
      expect(r.sources.length, `route ${r.id} sources`).toBeGreaterThan(0)
    }
    expect(ROUTES.find((r) => r.plane === 'concorde' && !r.historic), 'Concorde routes are historic').toBeUndefined()
  })
})

test.describe('facts', () => {
  test('four facts with numeric values and valid formats', () => {
    expect(FACTS).toHaveLength(4)
    expect(new Set(FACTS.map((f) => f.id)).size).toBe(4)
    for (const f of FACTS) {
      expect(typeof f.value === 'number' && Number.isFinite(f.value) && f.value > 0, `fact ${f.id} value`).toBe(true)
      expect(['int', 'hms'], `fact ${f.id} format`).toContain(f.format)
      if (f.format === 'hms') expect(Number.isInteger(f.value), `fact ${f.id}: hms value is whole seconds`).toBe(true)
      expect(f.text.trim(), `fact ${f.id} text`).not.toBe('')
      expect(f.unit.trim(), `fact ${f.id} unit`).not.toBe('')
    }
  })

  test('formatFact prints int and h:mm:ss', () => {
    expect(formatFact(15349, 'int')).toBe('15,349')
    expect(formatFact(53, 'int')).toBe('53')
    expect(formatFact(2 * 3600 + 52 * 60 + 59, 'hms')).toBe('2:52:59')
    expect(formatFact(0, 'hms')).toBe('0:00:00')
    for (const f of FACTS) expect(formatFact(f.value, f.format), `fact ${f.id}`).toMatch(f.format === 'hms' ? /^\d+:\d{2}:\d{2}$/ : /^\d{1,3}(,\d{3})*$/)
  })
})

test.describe('sources and site', () => {
  test('every source and credit is an https URL with a label', () => {
    const bad = allSources().filter((s) => {
      try {
        return new URL(s.url).protocol !== 'https:' || !s.label.trim()
      } catch {
        return true
      }
    })
    expect(bad.map((s) => `${s.where}: ${s.label} ${s.url}`)).toEqual([])
  })

  test('sign-up endpoint stays null and the default route exists', () => {
    expect(SITE.signupEndpoint).toBeNull()
    expect(ROUTE_BY_ID[SITE.defaultRoute], `defaultRoute ${SITE.defaultRoute}`).toBeTruthy()
  })
})
