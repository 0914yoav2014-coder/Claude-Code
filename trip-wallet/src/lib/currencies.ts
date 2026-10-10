import type { CountryCode, CurrencyCode } from '../db/types';

export const CURRENCIES: CurrencyCode[] = ['ILS', 'USD', 'ARS', 'CLP', 'PEN', 'BOB', 'BRL', 'COP', 'PAB', 'CRC'];

export const DECIMALS: Record<CurrencyCode, number> = {
  ILS: 2, USD: 2, ARS: 2, CLP: 0, PEN: 2, BOB: 2, BRL: 2, COP: 0, PAB: 2, CRC: 0,
};

export const SYMBOL: Partial<Record<CurrencyCode, string>> = { ILS: '₪', USD: '$' };

export interface CountryInfo {
  code: CountryCode;
  currency: CurrencyCode;
  flag: string;
  nameHe: string;
  nameEn: string;
}

export const COUNTRIES: CountryInfo[] = [
  { code: 'IL', currency: 'ILS', flag: '🇮🇱', nameHe: 'לפני הטיול / ישראל', nameEn: 'Pre-trip / Israel' },
  { code: 'AR', currency: 'ARS', flag: '🇦🇷', nameHe: 'ארגנטינה', nameEn: 'Argentina' },
  { code: 'CL', currency: 'CLP', flag: '🇨🇱', nameHe: "צ'ילה", nameEn: 'Chile' },
  { code: 'PE', currency: 'PEN', flag: '🇵🇪', nameHe: 'פרו', nameEn: 'Peru' },
  { code: 'BO', currency: 'BOB', flag: '🇧🇴', nameHe: 'בוליביה', nameEn: 'Bolivia' },
  { code: 'BR', currency: 'BRL', flag: '🇧🇷', nameHe: 'ברזיל', nameEn: 'Brazil' },
  { code: 'CO', currency: 'COP', flag: '🇨🇴', nameHe: 'קולומביה', nameEn: 'Colombia' },
  { code: 'EC', currency: 'USD', flag: '🇪🇨', nameHe: 'אקוודור', nameEn: 'Ecuador' },
  { code: 'PA', currency: 'USD', flag: '🇵🇦', nameHe: 'פנמה', nameEn: 'Panama' },
  { code: 'CR', currency: 'CRC', flag: '🇨🇷', nameHe: 'קוסטה ריקה', nameEn: 'Costa Rica' },
];

export const COUNTRY_BY_CODE = Object.fromEntries(COUNTRIES.map((c) => [c.code, c])) as Record<CountryCode, CountryInfo>;

export function countryName(code: CountryCode, lang: string): string {
  const c = COUNTRY_BY_CODE[code];
  return c ? (lang === 'he' ? c.nameHe : c.nameEn) : code;
}

/** Currencies offered in a country: its local one(s) plus ILS and USD. */
export function currenciesFor(code: CountryCode): CurrencyCode[] {
  const local = COUNTRY_BY_CODE[code]?.currency ?? 'ILS';
  const list: CurrencyCode[] = [local];
  if (code === 'PA') list.push('PAB');
  for (const c of ['ILS', 'USD'] as CurrencyCode[]) if (!list.includes(c)) list.push(c);
  return list;
}

/**
 * Approximate built-in rates (units per 1 ILS) used only until the first successful
 * online fetch. Every rate is editable in settings.
 */
export const FALLBACK_RATES: Record<CurrencyCode, number> = {
  ILS: 1, USD: 0.27, PAB: 0.27, ARS: 390, CLP: 256, PEN: 1.0, BOB: 1.87, BRL: 1.48, COP: 1100, CRC: 136,
};
