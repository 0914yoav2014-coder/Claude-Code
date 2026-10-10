import type { AppSettings, ArsMode, CurrencyCode, RatesCache } from '../db/types';
import { CURRENCIES, FALLBACK_RATES } from './currencies';

export const ER_API = 'https://open.er-api.com/v6/latest/ILS';
export const DOLAR_API = 'https://dolarapi.com/v1/dolares';

/** Parse open.er-api response (base ILS) into units-per-ILS for our currencies. */
export function parseErApi(json: unknown): Partial<Record<CurrencyCode, number>> {
  const j = json as { result?: string; base_code?: string; rates?: Record<string, number> };
  if (!j || j.result !== 'success' || !j.rates) throw new Error('bad rates response');
  const out: Partial<Record<CurrencyCode, number>> = { ILS: 1 };
  for (const c of CURRENCIES) {
    const v = j.rates[c];
    if (typeof v === 'number' && v > 0) out[c] = v;
  }
  // PAB is pegged 1:1 to USD.
  if (!out.PAB && out.USD) out.PAB = out.USD;
  return out;
}

/** Parse dolarapi.com /v1/dolares into ARS per USD for each mode (mid of buy/sell). */
export function parseDolarApi(json: unknown): Partial<Record<ArsMode, number>> {
  if (!Array.isArray(json)) throw new Error('bad dolarapi response');
  const out: Partial<Record<ArsMode, number>> = {};
  const map: Record<string, ArsMode> = { oficial: 'official', blue: 'blue', bolsa: 'mep' };
  for (const row of json as { casa?: string; compra?: number; venta?: number }[]) {
    const mode = row.casa ? map[row.casa] : undefined;
    if (!mode) continue;
    const vals = [row.compra, row.venta].filter((x): x is number => typeof x === 'number' && x > 0);
    if (vals.length) out[mode] = vals.reduce((a, b) => a + b, 0) / vals.length;
  }
  return out;
}

async function getJSON(url: string, fetchFn: typeof fetch, timeoutMs = 8000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetchFn(url, { signal: ctrl.signal, cache: 'no-store' });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } finally {
    clearTimeout(t);
  }
}

/** Fetch both sources; each one fails independently. Returns a patch for the cache. */
export async function fetchRates(fetchFn: typeof fetch = fetch): Promise<{ patch: Partial<RatesCache>; errors: string[] }> {
  const patch: Partial<RatesCache> = {};
  const errors: string[] = [];
  const [a, b] = await Promise.allSettled([getJSON(ER_API, fetchFn), getJSON(DOLAR_API, fetchFn)]);
  try {
    if (a.status === 'rejected') throw a.reason;
    patch.rates = parseErApi(a.value);
    patch.fetchedAt = Date.now();
  } catch (e) {
    errors.push(`rates: ${(e as Error).message}`);
  }
  try {
    if (b.status === 'rejected') throw b.reason;
    const ars = parseDolarApi(b.value);
    if (Object.keys(ars).length) {
      patch.ars = ars;
      patch.arsFetchedAt = Date.now();
    }
  } catch (e) {
    errors.push(`ars: ${(e as Error).message}`);
  }
  return { patch, errors };
}

/** The rate (units per 1 ILS) to use now for a currency: override > ARS mode > cached > fallback. */
export function currentRate(
  cur: CurrencyCode,
  cache: RatesCache | undefined,
  settings: Pick<AppSettings, 'rateOverrides' | 'arsMode'> | undefined,
): number {
  if (cur === 'ILS') return 1;
  const override = settings?.rateOverrides?.[cur];
  if (override && override > 0) return override;
  const usd = cache?.rates?.USD ?? FALLBACK_RATES.USD;
  if (cur === 'ARS' && settings?.arsMode && settings.arsMode !== 'official') {
    const perUsd = cache?.ars?.[settings.arsMode];
    if (perUsd) return perUsd * usd;
  }
  if (cur === 'ARS' && settings?.arsMode === 'official' && cache?.ars?.official) return cache.ars.official * usd;
  if (cur === 'PAB') return cache?.rates?.PAB ?? usd;
  return cache?.rates?.[cur] ?? FALLBACK_RATES[cur];
}

export function rateSource(cur: CurrencyCode, cache: RatesCache | undefined, settings: Pick<AppSettings, 'rateOverrides'> | undefined) {
  if (cur === 'ILS') return 'fixed';
  if (settings?.rateOverrides?.[cur]) return 'manual';
  if (cache?.rates?.[cur]) return 'live';
  return 'fallback';
}
