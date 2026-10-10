import type { CurrencyCode, Minor } from '../db/types';
import { DECIMALS, SYMBOL } from './currencies';

export const factor = (cur: CurrencyCode) => 10 ** DECIMALS[cur];

/** Round half away from zero to an integer. */
export function roundInt(x: number): number {
  const r = Math.round(Math.abs(x) + 1e-9);
  return x < 0 ? -r : r;
}

/** Parse user input like "25,000" or "12.5" into minor units. Returns null for empty/invalid. */
export function parseToMinor(input: string, cur: CurrencyCode): Minor | null {
  const clean = input.replace(/[\s,₪$]/g, '');
  if (!clean || !/^-?\d*\.?\d*$/.test(clean) || clean === '.' || clean === '-') return null;
  const n = Number(clean);
  if (!Number.isFinite(n)) return null;
  return roundInt(n * factor(cur));
}

export const toMajor = (minor: Minor, cur: CurrencyCode) => minor / factor(cur);

/** Minor units to a plain input string (no thousands separator). */
export function minorToInput(minor: Minor, cur: CurrencyCode): string {
  const d = DECIMALS[cur];
  const s = (minor / factor(cur)).toFixed(d);
  return d ? s.replace(/\.?0+$/, '') : s;
}

/** local minor -> ILS agorot, given rate = local units per 1 ILS. */
export function localToILS(localMinor: Minor, cur: CurrencyCode, ratePerILS: number): Minor {
  if (cur === 'ILS') return localMinor;
  if (!(ratePerILS > 0)) return 0;
  return roundInt(((localMinor / factor(cur)) / ratePerILS) * 100);
}

/** ILS agorot -> local minor. */
export function ilsToLocal(agorot: Minor, cur: CurrencyCode, ratePerILS: number): Minor {
  if (cur === 'ILS') return agorot;
  if (!(ratePerILS > 0)) return 0;
  return roundInt((agorot / 100) * ratePerILS * factor(cur));
}

/** Rate (local units per ILS) implied by two amounts. */
export function impliedRate(localMinor: Minor, cur: CurrencyCode, agorot: Minor): number {
  if (!agorot) return 0;
  return localMinor / factor(cur) / (agorot / 100);
}

export function cardFee(agorot: Minor, pct: number): Minor {
  return pct > 0 ? roundInt((agorot * pct) / 100) : 0;
}

const nfCache = new Map<string, Intl.NumberFormat>();
function nf(min: number, max: number) {
  const key = `${min}-${max}`;
  let f = nfCache.get(key);
  if (!f) {
    f = new Intl.NumberFormat('en-US', { minimumFractionDigits: min, maximumFractionDigits: max });
    nfCache.set(key, f);
  }
  return f;
}

/** Format a number of major units with grouping. */
export function formatNumber(major: number, decimals: number): string {
  return nf(decimals, decimals).format(major);
}

/**
 * Format minor units. ILS/USD get a symbol prefix ("₪96"), others a code suffix ("25,000 ARS").
 * `compact`: drop decimals when the value is whole or large (>= 1000).
 */
export function formatMoney(minor: Minor, cur: CurrencyCode, opts: { compact?: boolean } = {}): string {
  const d = DECIMALS[cur];
  const major = minor / factor(cur);
  let dec = d;
  if (opts.compact !== false && d > 0) {
    if (Number.isInteger(major) || Math.abs(major) >= 1000) dec = 0;
  }
  const num = formatNumber(Math.abs(major), dec);
  const sign = minor < 0 ? '-' : '';
  const sym = SYMBOL[cur];
  return sym ? `${sign}${sym}${num}` : `${sign}${num} ${cur}`;
}

export const formatILS = (agorot: Minor, opts?: { compact?: boolean }) => formatMoney(agorot, 'ILS', opts);

/** Format a rate for display, with sensible precision. */
export function formatRate(rate: number): string {
  if (!rate) return '–';
  if (rate >= 100) return formatNumber(rate, 1);
  if (rate >= 1) return formatNumber(rate, 3);
  return formatNumber(rate, 4);
}

export const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
