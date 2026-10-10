import type { Expense, Trip } from '../db/types';

let n = 0;
export function mkExpense(p: Partial<Expense> = {}): Expense {
  n++;
  return {
    id: `e${n}`,
    tripId: 't1',
    phase: 'during',
    date: '2026-11-01',
    country: 'AR',
    categoryId: 'food',
    description: '',
    amountLocal: 0,
    currency: 'ILS',
    ratePerILS: 1,
    amountILS: 0,
    usdPerILS: 0.27,
    paymentMethod: 'cash',
    cardFeePct: 0,
    cardFeeILS: 0,
    paidBy: 'me',
    split: { mode: 'equal', participants: ['me'] },
    spreadDays: 1,
    isRefund: false,
    createdAt: n,
    updatedAt: n,
    ...p,
  };
}

export const trip: Trip = {
  id: 't1',
  name: 'Trip',
  startDate: '2026-11-01',
  endDate: '2027-04-30',
  travelers: [
    { id: 'me', name: 'Me', isMe: true },
    { id: 'dan', name: 'Dan', isMe: false },
    { id: 'noa', name: 'Noa', isMe: false },
    { id: 'yoni', name: 'Yoni', isMe: false },
  ],
  createdAt: 0,
  updatedAt: 0,
};
