import { describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx';
import { buildSheets, toCsv, toXlsxBlob } from './exportData';
import { mkExpense, trip } from '../test/factory';
import { defaultCategories } from '../db/seed';

describe('export', () => {
  const es = [
    mkExpense({ amountILS: 30000, description: 'Dinner, "parrilla"', split: { mode: 'equal', participants: ['me', 'dan', 'noa', 'yoni'] } }),
    mkExpense({ date: '2026-11-03', amountILS: 5000, spreadDays: 2 }),
  ];
  const sheets = buildSheets(trip, es, [], defaultCategories(), 'en', { mode: 'group', meId: 'me' }, '2026-11-05');

  it('builds all sheets with totals matching', () => {
    expect(sheets.map((s) => s.name)).toEqual(['Expenses', 'Daily', 'Monthly', 'By country', 'By category', 'Balances']);
    const dailySum = sheets[1].rows.slice(1).reduce((a, r) => a + (r[1] as number), 0);
    expect(dailySum).toBe(350);
    expect(sheets[2].rows[1]).toEqual(['2026-11', 350]);
  });

  it('writes a readable xlsx', async () => {
    const blob = await toXlsxBlob(sheets, false);
    const wb = XLSX.read(new Uint8Array(await blob.arrayBuffer()), { type: 'array' });
    expect(wb.SheetNames).toHaveLength(6);
    expect(XLSX.utils.sheet_to_json(wb.Sheets.Expenses)).toHaveLength(2);
  });

  it('escapes csv', () => {
    const csv = toCsv(sheets[0].rows);
    expect(csv).toContain('"Dinner, ""parrilla"""');
  });
});
