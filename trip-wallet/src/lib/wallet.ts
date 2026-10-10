import type { CurrencyCode, Expense, Minor, MoneyEntry } from '../db/types';
import { localToILS } from './money';
import { signedLocal } from './expense';

export interface CashBalance {
  currency: CurrencyCode;
  added: Minor;
  spent: Minor;
  balance: Minor;
}

/** Cash on hand per currency = money added − cash expenses (refunds in cash add back). */
export function cashBalances(entries: MoneyEntry[], expenses: Expense[]): CashBalance[] {
  const map = new Map<CurrencyCode, CashBalance>();
  const get = (c: CurrencyCode) => {
    let b = map.get(c);
    if (!b) map.set(c, (b = { currency: c, added: 0, spent: 0, balance: 0 }));
    return b;
  };
  for (const m of entries) if (m.amountLocal) get(m.currency).added += m.amountLocal;
  for (const e of expenses) if (e.paymentMethod === 'cash') get(e.currency).spent += signedLocal(e);
  for (const b of map.values()) b.balance = b.added - b.spent;
  return [...map.values()];
}

/**
 * Hidden cost of an exchange vs the market rate, in agorot: what I paid minus what the
 * received local money was worth at the market rate (explicit fee excluded).
 */
export function hiddenCostILS(m: MoneyEntry): Minor {
  if (!m.amountILS || !m.amountLocal || !m.marketRate) return 0;
  return m.amountILS - localToILS(m.amountLocal, m.currency, m.marketRate);
}

export function walletFees(entries: MoneyEntry[]) {
  let explicit = 0;
  let hidden = 0;
  for (const m of entries) {
    explicit += m.feeILS || 0;
    hidden += Math.max(0, hiddenCostILS(m));
  }
  return { explicit, hidden, total: explicit + hidden };
}

/** Percentage difference of effective vs market rate (negative = worse than market). */
export function rateDiffPct(effective: number, market: number): number {
  if (!effective || !market) return 0;
  return ((effective - market) / market) * 100;
}
