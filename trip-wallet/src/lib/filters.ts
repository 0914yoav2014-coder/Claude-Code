import type { CountryCode, Expense, PaymentMethod, Phase } from '../db/types';

export interface ExpenseFilter {
  from?: string;
  to?: string;
  country?: CountryCode;
  categoryId?: string;
  personId?: string;
  paymentMethod?: PaymentMethod;
  phase?: Phase;
  search?: string;
}

export function involves(e: Expense, personId: string): boolean {
  return e.paidBy === personId || (e.split?.participants ?? []).includes(personId);
}

export function applyFilter(expenses: Expense[], f: ExpenseFilter): Expense[] {
  const q = f.search?.trim().toLowerCase();
  return expenses.filter((e) => {
    if (f.from && e.date < f.from) return false;
    if (f.to && e.date > f.to) return false;
    if (f.country && e.country !== f.country) return false;
    if (f.categoryId && e.categoryId !== f.categoryId) return false;
    if (f.personId && !involves(e, f.personId)) return false;
    if (f.paymentMethod && e.paymentMethod !== f.paymentMethod) return false;
    if (f.phase && e.phase !== f.phase) return false;
    if (q) {
      const hay = `${e.description} ${e.notes ?? ''} ${e.city ?? ''} ${e.subcategory ?? ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export const isFilterActive = (f: ExpenseFilter) =>
  Object.entries(f).some(([, v]) => v !== undefined && v !== '');
