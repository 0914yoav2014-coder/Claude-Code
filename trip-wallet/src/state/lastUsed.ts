import type { CountryCode, CurrencyCode, PaymentMethod } from '../db/types';

export interface LastUsed {
  country?: CountryCode;
  currency?: CurrencyCode;
  categoryId?: string;
  paymentMethod?: PaymentMethod;
}

const KEY = 'tw-last';

export function getLastUsed(): LastUsed {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}');
  } catch {
    return {};
  }
}

export function setLastUsed(v: LastUsed) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...getLastUsed(), ...v }));
  } catch {
    /* ignore */
  }
}
