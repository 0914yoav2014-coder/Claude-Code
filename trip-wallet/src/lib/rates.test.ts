import { describe, expect, it } from 'vitest';
import { currentRate, fetchRates, parseDolarApi, parseErApi } from './rates';

const er = { result: 'success', base_code: 'ILS', rates: { ILS: 1, USD: 0.27, ARS: 380, CLP: 250, PEN: 1.01, BOB: 1.86, BRL: 1.5, COP: 1100, CRC: 135 } };
const dolar = [
  { casa: 'oficial', compra: 1400, venta: 1450 },
  { casa: 'blue', compra: 1480, venta: 1500 },
  { casa: 'bolsa', compra: 1460, venta: 1470 },
];

describe('rates', () => {
  it('parses open.er-api and fills PAB from USD', () => {
    const r = parseErApi(er);
    expect(r.ARS).toBe(380);
    expect(r.PAB).toBe(0.27);
  });
  it('parses dolarapi', () => {
    expect(parseDolarApi(dolar)).toEqual({ official: 1425, blue: 1490, mep: 1465 });
  });
  it('picks override, ARS mode, cached, fallback', () => {
    const cache = { id: 'latest' as const, rates: parseErApi(er), ars: parseDolarApi(dolar) };
    expect(currentRate('ARS', cache, { arsMode: 'blue', rateOverrides: {} })).toBeCloseTo(1490 * 0.27);
    expect(currentRate('ARS', cache, { arsMode: 'official', rateOverrides: {} })).toBeCloseTo(1425 * 0.27);
    expect(currentRate('ARS', cache, { arsMode: 'blue', rateOverrides: { ARS: 400 } })).toBe(400);
    expect(currentRate('CLP', cache, { arsMode: 'blue', rateOverrides: {} })).toBe(250);
    expect(currentRate('CLP', undefined, undefined)).toBe(256);
    expect(currentRate('ILS', cache, undefined)).toBe(1);
  });
  it('one failing source does not block the other', async () => {
    const fetchFn = (async (url: string) => {
      if (url.includes('dolarapi')) throw new Error('offline');
      return { ok: true, json: async () => er } as Response;
    }) as unknown as typeof fetch;
    const { patch, errors } = await fetchRates(fetchFn);
    expect(patch.rates?.ARS).toBe(380);
    expect(patch.ars).toBeUndefined();
    expect(errors).toHaveLength(1);
  });
});
