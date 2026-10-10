import type { CountryCode, Expense, Minor, PaymentMethod, Trip } from '../db/types';
import { allocate } from './allocation';
import { addDays, dateRange, diffDays, monthKey } from './dates';
import { sharesILS, spreadOverDays, valueILS, type ViewMode } from './expense';

export interface Ctx {
  mode: ViewMode;
  meId?: string;
}

const add = <K>(m: Map<K, number>, k: K, v: number) => m.set(k, (m.get(k) ?? 0) + v);

/** Per-day totals with spread days applied. */
export function dailyTotals(expenses: Expense[], ctx: Ctx): Map<string, Minor> {
  const m = new Map<string, Minor>();
  for (const e of expenses) for (const p of spreadOverDays(e, valueILS(e, ctx.mode, ctx.meId))) add(m, p.date, p.amount);
  return m;
}

/** Per-day, per-category totals (spread applied). */
export function dailyByCategory(expenses: Expense[], ctx: Ctx, date: string): Map<string, Minor> {
  const m = new Map<string, Minor>();
  for (const e of expenses)
    for (const p of spreadOverDays(e, valueILS(e, ctx.mode, ctx.meId))) if (p.date === date) add(m, e.categoryId, p.amount);
  return m;
}

/** Expenses that have a portion falling on `date`, with that portion. */
export function expensesOnDay(expenses: Expense[], ctx: Ctx, date: string): { e: Expense; amount: Minor }[] {
  const out: { e: Expense; amount: Minor }[] = [];
  for (const e of expenses) {
    const n = Math.max(1, e.spreadDays || 1);
    const i = diffDays(e.date, date);
    if (i < 0 || i >= n) continue;
    const part = spreadOverDays(e, valueILS(e, ctx.mode, ctx.meId))[i];
    out.push({ e, amount: part.amount });
  }
  return out;
}

export function monthlyTotals(expenses: Expense[], ctx: Ctx): Map<string, Minor> {
  const m = new Map<string, Minor>();
  for (const [d, v] of dailyTotals(expenses, ctx)) add(m, monthKey(d), v);
  return m;
}

export function byKey<K>(expenses: Expense[], ctx: Ctx, key: (e: Expense) => K): Map<K, Minor> {
  const m = new Map<K, Minor>();
  for (const e of expenses) add(m, key(e), valueILS(e, ctx.mode, ctx.meId));
  return m;
}

export const byCategory = (es: Expense[], ctx: Ctx) => byKey(es, ctx, (e) => e.categoryId);
export const byCountry = (es: Expense[], ctx: Ctx) => byKey<CountryCode>(es, ctx, (e) => e.country);
export const byPayment = (es: Expense[], ctx: Ctx) => byKey<PaymentMethod>(es, ctx, (e) => e.paymentMethod);
export const byPhase = (es: Expense[], ctx: Ctx) => byKey(es, ctx, (e) => e.phase);

/** Per person: paid (group money they paid) and share (their portion). Independent of view mode. */
export function byPerson(expenses: Expense[]): Map<string, { paid: Minor; share: Minor }> {
  const m = new Map<string, { paid: Minor; share: Minor }>();
  const get = (id: string) => {
    let v = m.get(id);
    if (!v) m.set(id, (v = { paid: 0, share: 0 }));
    return v;
  };
  for (const e of expenses) {
    const shares = sharesILS(e);
    get(e.paidBy).paid += Object.values(shares).reduce((a, b) => a + b, 0);
    for (const [p, s] of Object.entries(shares)) get(p).share += s;
  }
  return m;
}

export const total = (m: Map<unknown, number>) => [...m.values()].reduce((a, b) => a + b, 0);

/** Number of calendar days of the trip so far (start → min(today, end)), at least 1. */
export function tripDaysSoFar(trip: Pick<Trip, 'startDate' | 'endDate'>, today: string): number {
  if (today < trip.startDate) return 0;
  const end = today < trip.endDate ? today : trip.endDate;
  return diffDays(trip.startDate, end) + 1;
}

/**
 * Which country I was in on each trip day so far: carry the country of the latest
 * during-trip expense forward over days without expenses.
 */
export function countryByDay(trip: Pick<Trip, 'startDate' | 'endDate'>, expenses: Expense[], today: string): Map<string, CountryCode> {
  const daysSoFar = tripDaysSoFar(trip, today);
  const out = new Map<string, CountryCode>();
  if (!daysSoFar) return out;
  const last = addDays(trip.startDate, daysSoFar - 1);
  const firstByDay = new Map<string, CountryCode>();
  const sorted = expenses
    .filter((e) => e.phase === 'during' && e.country !== 'IL')
    .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt);
  for (const e of sorted) firstByDay.set(e.date, e.country); // last expense of the day wins
  let current: CountryCode | undefined = sorted.find((e) => e.date >= trip.startDate)?.country;
  for (const d of dateRange(trip.startDate, last)) {
    const c = firstByDay.get(d);
    if (c) current = c;
    if (current) out.set(d, current);
  }
  return out;
}

export function daysPerCountry(dayMap: Map<string, CountryCode>): Map<CountryCode, number> {
  const m = new Map<CountryCode, number>();
  for (const c of dayMap.values()) add(m, c, 1);
  return m;
}

export interface Overall {
  grandTotal: Minor;
  preTrip: Minor;
  during: Minor;
  count: number;
  daysSoFar: number;
  avgPerDay: Minor;
}

export function overall(trip: Trip, expenses: Expense[], ctx: Ctx, today: string): Overall {
  const ph = byPhase(expenses, ctx);
  const preTrip = ph.get('pre-trip') ?? 0;
  const during = ph.get('during') ?? 0;
  const daysSoFar = tripDaysSoFar(trip, today);
  return {
    grandTotal: preTrip + during,
    preTrip,
    during,
    count: expenses.length,
    daysSoFar,
    avgPerDay: daysSoFar ? Math.round(during / daysSoFar) : 0,
  };
}

export interface CountryStat {
  country: CountryCode;
  total: Minor;
  days: number;
  avgPerDay: Minor;
  byCategory: Map<string, Minor>;
}

export function countryStats(trip: Trip, expenses: Expense[], ctx: Ctx, today: string): CountryStat[] {
  const days = daysPerCountry(countryByDay(trip, expenses, today));
  const groups = new Map<CountryCode, Expense[]>();
  for (const e of expenses) {
    const g = groups.get(e.country) ?? [];
    g.push(e);
    groups.set(e.country, g);
  }
  return [...groups.entries()]
    .map(([country, es]) => {
      const t = total(byKey(es, ctx, () => 0));
      const d = days.get(country) ?? 0;
      return { country, total: t, days: d, avgPerDay: d ? Math.round(t / d) : 0, byCategory: byCategory(es, ctx) };
    })
    .sort((a, b) => b.total - a.total);
}

/** Average daily spend per country for a group of categories ("a food day in Peru"). */
export function priceComparison(
  stats: CountryStat[],
  groups: { key: string; categoryIds: string[] }[],
): { country: CountryCode; values: Record<string, Minor> }[] {
  return stats
    .filter((s) => s.days > 0)
    .map((s) => ({
      country: s.country,
      values: Object.fromEntries(
        groups.map((g) => [g.key, Math.round(g.categoryIds.reduce((a, c) => a + (s.byCategory.get(c) ?? 0), 0) / s.days)]),
      ),
    }));
}

/** Percentages that sum to 100 (rounded to 0.1). */
export function percentages(values: number[]): number[] {
  const t = values.reduce((a, b) => a + b, 0);
  if (!t) return values.map(() => 0);
  return allocate(1000, values).map((x) => x / 10);
}
