import { describe, expect, it } from 'vitest';
import { cardFee, formatMoney, ilsToLocal, impliedRate, localToILS, minorToInput, parseToMinor } from './money';
import { allocate, splitEqual } from './allocation';

describe('money', () => {
  it('parses input into minor units by currency decimals', () => {
    expect(parseToMinor('25,000', 'ARS')).toBe(2_500_000);
    expect(parseToMinor('12.5', 'PEN')).toBe(1250);
    expect(parseToMinor('10000', 'CLP')).toBe(10000);
    expect(parseToMinor('0.1', 'ILS')).toBe(10);
    expect(parseToMinor('1.005', 'ILS')).toBe(101);
    expect(parseToMinor('', 'ILS')).toBeNull();
    expect(parseToMinor('abc', 'ILS')).toBeNull();
  });

  it('converts both ways with a frozen rate', () => {
    // 1 ILS = 260 ARS -> 10,000 ARS = ₪38.46
    expect(localToILS(1_000_000, 'ARS', 260)).toBe(3846);
    expect(ilsToLocal(3846, 'ARS', 260)).toBe(999_960);
    expect(ilsToLocal(10000, 'CLP', 256)).toBe(25600);
    expect(localToILS(25600, 'CLP', 256)).toBe(10000);
    expect(localToILS(500, 'ILS', 1)).toBe(500);
  });

  it('computes implied rate', () => {
    expect(impliedRate(12_000_000, 'ARS', 50000)).toBeCloseTo(240);
  });

  it('formats with symbol or code and correct decimals', () => {
    expect(formatMoney(2_500_000_00, 'ARS')).toBe('2,500,000 ARS');
    expect(formatMoney(9615, 'ILS')).toBe('₪96.15');
    expect(formatMoney(9600, 'ILS')).toBe('₪96');
    expect(formatMoney(12345, 'CLP')).toBe('12,345 CLP');
    expect(formatMoney(-7500, 'ILS')).toBe('-₪75');
    expect(minorToInput(1250, 'PEN')).toBe('12.5');
    expect(minorToInput(12000, 'CLP')).toBe('12000');
  });

  it('card fee rounds to agorot', () => {
    expect(cardFee(10000, 2.5)).toBe(250);
    expect(cardFee(333, 3)).toBe(10);
    expect(cardFee(10000, 0)).toBe(0);
  });

  it('never drifts when summing many small amounts', () => {
    const parts = Array.from({ length: 1000 }, () => parseToMinor('0.1', 'ILS')!);
    expect(parts.reduce((a, b) => a + b, 0)).toBe(10000);
  });
});

describe('allocation', () => {
  it('splits exactly', () => {
    expect(splitEqual(30000, 4)).toEqual([7500, 7500, 7500, 7500]);
    expect(splitEqual(100, 3)).toEqual([34, 33, 33]);
    expect(splitEqual(-100, 3)).toEqual([-34, -33, -33]);
    const p = allocate(1001, [1, 2, 3]);
    expect(p.reduce((a, b) => a + b, 0)).toBe(1001);
    expect(allocate(10, [0, 0])).toEqual([5, 5]);
  });
});
