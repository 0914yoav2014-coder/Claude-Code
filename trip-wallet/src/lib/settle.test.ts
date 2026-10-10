import { describe, expect, it } from 'vitest';
import { computeBalances, minimumTransfers } from './settle';
import { mkExpense, trip } from '../test/factory';
import { sharesILS } from './expense';

const all = ['me', 'dan', 'noa', 'yoni'];

describe('splitting & settle-up', () => {
  it('₪300 dinner split equally between 4 is ₪75 each', () => {
    const e = mkExpense({ amountILS: 30000, split: { mode: 'equal', participants: all } });
    expect(sharesILS(e)).toEqual({ me: 7500, dan: 7500, noa: 7500, yoni: 7500 });
    const b = computeBalances(trip.travelers, [e], []);
    expect(b.find((x) => x.id === 'me')!.net).toBe(22500);
    const t = minimumTransfers(b);
    expect(t).toHaveLength(3);
    expect(t.every((x) => x.to === 'me' && x.amount === 7500)).toBe(true);
  });

  it('custom split proportional to local parts, exact sum', () => {
    const e = mkExpense({
      amountILS: 10000,
      cardFeeILS: 300,
      amountLocal: 3_000_000,
      currency: 'ARS',
      split: { mode: 'custom', participants: ['me', 'dan'], custom: { me: 1_000_000, dan: 2_000_000 } },
    });
    const s = sharesILS(e);
    expect(s.me + s.dan).toBe(10300);
    expect(s.me).toBe(3433);
  });

  it('settles in at most n-1 transfers and zeroes all balances', () => {
    const es = [
      mkExpense({ amountILS: 40000, paidBy: 'me', split: { mode: 'equal', participants: all } }),
      mkExpense({ amountILS: 12000, paidBy: 'dan', split: { mode: 'equal', participants: all } }),
      mkExpense({ amountILS: 9000, paidBy: 'noa', split: { mode: 'equal', participants: ['noa', 'yoni', 'dan'] } }),
    ];
    const b = computeBalances(trip.travelers, es, []);
    expect(b.reduce((a, x) => a + x.net, 0)).toBe(0);
    const t = minimumTransfers(b);
    expect(t.length).toBeLessThanOrEqual(3);
    const net = Object.fromEntries(b.map((x) => [x.id, x.net]));
    for (const x of t) {
      net[x.from] += x.amount;
      net[x.to] -= x.amount;
    }
    expect(Object.values(net).every((v) => v === 0)).toBe(true);
  });

  it('marking a settlement as paid updates balances', () => {
    const e = mkExpense({ amountILS: 30000, split: { mode: 'equal', participants: all } });
    const s = { id: 's', tripId: 't1', fromTravelerId: 'dan', toTravelerId: 'me', amountILS: 7500, date: '2026-11-02', settled: true, createdAt: 0, updatedAt: 0 };
    const b = computeBalances(trip.travelers, [e], [s]);
    expect(b.find((x) => x.id === 'dan')!.net).toBe(0);
    expect(b.find((x) => x.id === 'me')!.net).toBe(15000);
    expect(minimumTransfers(b)).toHaveLength(2);
  });

  it('refunds reduce what was paid', () => {
    const es = [
      mkExpense({ amountILS: 20000, split: { mode: 'equal', participants: ['me', 'dan'] } }),
      mkExpense({ amountILS: 20000, isRefund: true, split: { mode: 'equal', participants: ['me', 'dan'] } }),
    ];
    const b = computeBalances(trip.travelers, es, []);
    expect(b.every((x) => x.net === 0)).toBe(true);
  });
});
