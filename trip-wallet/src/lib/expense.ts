import type { Expense, Minor } from '../db/types';
import { allocate, splitEqual } from './allocation';
import { addDays } from './dates';

/** Signed ILS total of an expense including card fee (negative for refunds). */
export function totalILS(e: Pick<Expense, 'amountILS' | 'cardFeeILS' | 'isRefund'>): Minor {
  const t = e.amountILS + (e.cardFeeILS || 0);
  return e.isRefund ? -t : t;
}

/** Signed local amount. */
export const signedLocal = (e: Pick<Expense, 'amountLocal' | 'isRefund'>) => (e.isRefund ? -e.amountLocal : e.amountLocal);

/** Each participant's share of the signed ILS total. Sums exactly to totalILS(e). */
export function sharesILS(e: Expense): Record<string, Minor> {
  const total = totalILS(e);
  const people = e.split?.participants?.length ? e.split.participants : [e.paidBy];
  const parts =
    e.split?.mode === 'custom' && e.split.custom
      ? allocate(total, people.map((p) => e.split.custom?.[p] ?? 0))
      : splitEqual(total, people.length);
  const out: Record<string, Minor> = {};
  people.forEach((p, i) => (out[p] = (out[p] ?? 0) + parts[i]));
  return out;
}

export type ViewMode = 'mine' | 'group';

/** Value of an expense under the view mode (group total or my share). */
export function valueILS(e: Expense, mode: ViewMode, meId: string | undefined): Minor {
  if (mode === 'group' || !meId) return totalILS(e);
  return sharesILS(e)[meId] ?? 0;
}

/** Distribute an amount over the spread days of the expense. */
export function spreadOverDays(e: Pick<Expense, 'date' | 'spreadDays'>, amount: Minor): { date: string; amount: Minor }[] {
  const n = Math.max(1, Math.floor(e.spreadDays || 1));
  return splitEqual(amount, n).map((a, i) => ({ date: addDays(e.date, i), amount: a }));
}

/** Validate custom split parts (local minor units) add up to the expense amount. */
export function customSplitDiff(amountLocal: Minor, participants: string[], custom: Record<string, Minor>): Minor {
  return amountLocal - participants.reduce((s, p) => s + (custom[p] ?? 0), 0);
}
