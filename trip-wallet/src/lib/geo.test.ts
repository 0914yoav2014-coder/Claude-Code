import { describe, expect, it } from 'vitest';
import { lookupCountry } from './geo';

describe('geo', () => {
  it('finds countries offline', () => {
    expect(lookupCountry(-32.9, -68.85)).toEqual({ country: 'AR', city: 'Mendoza' });
    expect(lookupCountry(-33.44, -70.65)?.country).toBe('CL');
    expect(lookupCountry(-13.52, -71.98)?.city).toBe('Cusco');
    expect(lookupCountry(-20.3, -67.2)?.country).toBe('BO');
    expect(lookupCountry(-22.95, -43.2)?.country).toBe('BR');
    expect(lookupCountry(10.4, -75.5)?.country).toBe('CO');
    expect(lookupCountry(-0.2, -78.5)?.country).toBe('EC');
    expect(lookupCountry(8.99, -79.5)?.country).toBe('PA');
    expect(lookupCountry(9.93, -84.1)?.country).toBe('CR');
    expect(lookupCountry(32.08, 34.78)?.country).toBe('IL');
    expect(lookupCountry(48.85, 2.35)).toBeNull();
  });
});
