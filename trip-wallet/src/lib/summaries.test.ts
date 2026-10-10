import { describe, expect, it } from 'vitest';
import { mkExpense, trip } from '../test/factory';
import {
  byCategory, byCountry, byPayment, byPerson, countryByDay, countryStats, dailyTotals, expensesOnDay,
  monthlyTotals, overall, percentages, total,
} from './summaries';
import { totalILS } from './expense';
import { applyFilter } from './filters';
import { cashBalances, walletFees } from './wallet';

const all = ['me', 'dan', 'noa', 'yoni'];
const group = { mode: 'group' as const, meId: 'me' };
const mine = { mode: 'mine' as const, meId: 'me' };

const expenses = [
  mkExpense({ phase: 'pre-trip', date: '2026-09-01', country: 'IL', categoryId: 'flights', amountILS: 450000 }),
  mkExpense({ date: '2026-11-01', categoryId: 'accommodation', amountILS: 100003, spreadDays: 5, split: { mode: 'equal', participants: all } }),
  mkExpense({ date: '2026-11-02', categoryId: 'food', amountILS: 30000, split: { mode: 'equal', participants: all }, paymentMethod: 'card', cardFeeILS: 750 }),
  mkExpense({ date: '2026-11-05', country: 'CL', categoryId: 'food', amountILS: 8888 }),
  mkExpense({ date: '2026-11-29', country: 'CL', categoryId: 'transport', amountILS: 12345, spreadDays: 3 }),
  mkExpense({ date: '2026-12-01', country: 'CL', categoryId: 'food', amountILS: 5000, isRefund: true }),
];
const sumAll = expenses.reduce((a, e) => a + totalILS(e), 0);

describe('summaries', () => {
  it('spreads a 5-night hostel 1/5 per day', () => {
    const d = dailyTotals([expenses[1]], group);
    expect([...d.values()]).toEqual([20001, 20001, 20001, 20000, 20000]);
    expect(expensesOnDay([expenses[1]], group, '2026-11-03')[0].amount).toBe(20001);
  });

  it('every view sums to the expense total', () => {
    for (const ctx of [group, mine]) {
      const expected = expenses.reduce((a, e) => a + (ctx.mode === 'group' ? totalILS(e) : 0), 0);
      const t = total(dailyTotals(expenses, ctx));
      if (ctx.mode === 'group') expect(t).toBe(expected);
      expect(total(monthlyTotals(expenses, ctx))).toBe(t);
      expect(total(byCategory(expenses, ctx))).toBe(t);
      expect(total(byCountry(expenses, ctx))).toBe(t);
      expect(total(byPayment(expenses, ctx))).toBe(t);
      expect(overall(trip, expenses, ctx, '2026-12-10').grandTotal).toBe(t);
    }
    expect(total(dailyTotals(expenses, group))).toBe(sumAll);
  });

  it('monthly totals split spread expenses across month boundary', () => {
    const m = monthlyTotals([expenses[4]], group);
    expect(m.get('2026-11')! + m.get('2026-12')!).toBe(12345);
    expect(m.get('2026-12')).toBe(4115);
  });

  it('my share uses split portions', () => {
    const o = overall(trip, expenses, mine, '2026-12-10');
    expect(o.preTrip).toBe(450000);
    expect(o.during).toBe(25001 + 7688 + 8888 + 12345 - 5000);
  });

  it('by person paid == shares total', () => {
    const p = byPerson(expenses);
    const paid = [...p.values()].reduce((a, v) => a + v.paid, 0);
    const share = [...p.values()].reduce((a, v) => a + v.share, 0);
    expect(paid).toBe(sumAll);
    expect(share).toBe(sumAll);
  });

  it('days per country carry forward and average per day', () => {
    const map = countryByDay(trip, expenses, '2026-12-10');
    expect(map.size).toBe(40);
    expect(map.get('2026-11-04')).toBe('AR');
    expect(map.get('2026-11-05')).toBe('CL');
    const stats = countryStats(trip, expenses, group, '2026-12-10');
    const ar = stats.find((s) => s.country === 'AR')!;
    expect(ar.days).toBe(4);
    expect(ar.avgPerDay).toBe(Math.round((100003 + 30750) / 4));
    const o = overall(trip, expenses, group, '2026-12-10');
    expect(o.daysSoFar).toBe(40);
    expect(o.avgPerDay).toBe(Math.round(o.during / 40));
  });

  it('percentages sum to 100', () => {
    const p = percentages([1, 1, 1]);
    expect(p.reduce((a, b) => a + b, 0)).toBeCloseTo(100);
  });

  it('filters by search, person and phase', () => {
    const es = [mkExpense({ description: 'Parrilla dinner', split: { mode: 'equal', participants: ['me', 'dan'] } }), mkExpense({ notes: 'bus to Salta' })];
    expect(applyFilter(es, { search: 'parrilla' })).toHaveLength(1);
    expect(applyFilter(es, { search: 'salta' })).toHaveLength(1);
    expect(applyFilter(es, { personId: 'dan' })).toHaveLength(1);
    expect(applyFilter(expenses, { phase: 'pre-trip' })).toHaveLength(1);
  });
});

describe('wallet', () => {
  it('ATM ₪500 → 120,000 ARS and cash expenses reduce ARS balance', () => {
    const entry = {
      id: 'm1', tripId: 't1', date: '2026-11-01', country: 'AR' as const, type: 'atm' as const,
      amountILS: 50000, amountLocal: 12_000_000, currency: 'ARS' as const,
      effectiveRate: 240, marketRate: 260, feeILS: 0, createdAt: 0, updatedAt: 0,
    };
    const cash = mkExpense({ currency: 'ARS', amountLocal: 2_500_000, amountILS: 9615, ratePerILS: 260 });
    const card = mkExpense({ currency: 'ARS', amountLocal: 1_000_000, paymentMethod: 'card' });
    const b = cashBalances([entry], [cash, card]).find((x) => x.currency === 'ARS')!;
    expect(b.balance).toBe(9_500_000);
    const fees = walletFees([entry]);
    expect(fees.hidden).toBe(50000 - 46154);
  });
});
