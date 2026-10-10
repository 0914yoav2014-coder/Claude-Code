import type { Expense, Minor, Settlement, Traveler } from '../db/types';
import { sharesILS, totalILS } from './expense';

export interface PersonBalance {
  id: string;
  paid: Minor;
  share: Minor;
  /** settlements: transfers sent (+) minus received (−) */
  settledOut: Minor;
  /** positive = others owe this person */
  net: Minor;
}

export function computeBalances(travelers: Traveler[], expenses: Expense[], settlements: Settlement[]): PersonBalance[] {
  const map = new Map<string, PersonBalance>();
  const get = (id: string) => {
    let b = map.get(id);
    if (!b) {
      b = { id, paid: 0, share: 0, settledOut: 0, net: 0 };
      map.set(id, b);
    }
    return b;
  };
  travelers.forEach((t) => get(t.id));
  for (const e of expenses) {
    get(e.paidBy).paid += totalILS(e);
    for (const [pid, s] of Object.entries(sharesILS(e))) get(pid).share += s;
  }
  for (const s of settlements) {
    if (!s.settled) continue;
    get(s.fromTravelerId).settledOut += s.amountILS;
    get(s.toTravelerId).settledOut -= s.amountILS;
  }
  for (const b of map.values()) b.net = b.paid - b.share + b.settledOut;
  return [...map.values()];
}

export interface Transfer {
  from: string;
  to: string;
  amount: Minor;
}

/**
 * Minimum transfers to settle balances: repeatedly match the largest debtor with the
 * largest creditor. Produces at most n−1 transfers; exact on integer agorot.
 */
export function minimumTransfers(balances: { id: string; net: Minor }[]): Transfer[] {
  const debtors = balances.filter((b) => b.net < 0).map((b) => ({ id: b.id, amt: -b.net }));
  const creditors = balances.filter((b) => b.net > 0).map((b) => ({ id: b.id, amt: b.net }));
  const out: Transfer[] = [];
  // First pass: exact matches remove two people with one transfer.
  for (const d of debtors) {
    const c = creditors.find((c) => c.amt === d.amt && c.amt > 0);
    if (c && d.amt > 0) {
      out.push({ from: d.id, to: c.id, amount: d.amt });
      c.amt = 0;
      d.amt = 0;
    }
  }
  for (;;) {
    debtors.sort((a, b) => b.amt - a.amt);
    creditors.sort((a, b) => b.amt - a.amt);
    const d = debtors[0];
    const c = creditors[0];
    if (!d || !c || d.amt <= 0 || c.amt <= 0) break;
    const amt = Math.min(d.amt, c.amt);
    out.push({ from: d.id, to: c.id, amount: amt });
    d.amt -= amt;
    c.amt -= amt;
  }
  return out;
}
