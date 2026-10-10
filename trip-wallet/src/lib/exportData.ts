import type { Category, Expense, Settlement, Trip } from '../db/types';
import { countryName } from './currencies';
import { toMajor } from './money';
import { totalILS, sharesILS } from './expense';
import { byCategory, countryStats, dailyTotals, monthlyTotals, total, type Ctx } from './summaries';
import { computeBalances, minimumTransfers } from './settle';

type Cell = string | number;
export interface SheetData {
  name: string;
  rows: Cell[][];
}

const ils = (agorot: number) => agorot / 100;

export function buildSheets(
  trip: Trip, expenses: Expense[], settlements: Settlement[], categories: Category[], lang: string, ctx: Ctx, today: string,
): SheetData[] {
  const he = lang === 'he';
  const cat = new Map(categories.map((c) => [c.id, he ? c.nameHe : c.nameEn]));
  const person = new Map(trip.travelers.map((p) => [p.id, p.name]));
  const sorted = [...expenses].sort((a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt);
  const H = (en: string, h: string) => (he ? h : en);

  const expenseRows: Cell[][] = [
    [H('Date', 'תאריך'), H('Phase', 'שלב'), H('Country', 'מדינה'), H('City', 'עיר'), H('Category', 'קטגוריה'), H('Sub-category', 'תת-קטגוריה'),
      H('Description', 'תיאור'), H('Amount (local)', 'סכום מקומי'), H('Currency', 'מטבע'), H('Rate (per ₪1)', 'שער (ל-₪1)'),
      H('Amount ILS', 'סכום ₪'), H('Card fee ILS', 'עמלת כרטיס ₪'), H('Total ILS', 'סה"כ ₪'), H('My share ILS', 'החלק שלי ₪'),
      H('Payment', 'תשלום'), H('Paid by', 'שילם'), H('Split between', 'חלוקה בין'), H('Spread days', 'ימי פריסה'),
      H('Refund', 'החזר'), H('Notes', 'הערות')],
  ];
  for (const e of sorted) {
    const sign = e.isRefund ? -1 : 1;
    expenseRows.push([
      e.date, e.phase, countryName(e.country, lang), e.city ?? '', cat.get(e.categoryId) ?? e.categoryId, e.subcategory ?? '',
      e.description, sign * toMajor(e.amountLocal, e.currency), e.currency, e.ratePerILS, sign * ils(e.amountILS),
      sign * ils(e.cardFeeILS), ils(totalILS(e)), ils(ctx.meId ? sharesILS(e)[ctx.meId] ?? 0 : 0), e.paymentMethod,
      person.get(e.paidBy) ?? '', e.split.participants.map((p) => person.get(p) ?? '').join(', '), e.spreadDays,
      e.isRefund ? 'yes' : '', e.notes ?? '',
    ]);
  }

  const daily = [...dailyTotals(expenses, ctx).entries()].sort();
  const monthly = [...monthlyTotals(expenses, ctx).entries()].sort();
  const cats = [...byCategory(expenses, ctx).entries()].sort((a, b) => b[1] - a[1]);
  const catTotal = total(byCategory(expenses, ctx));
  const countries = countryStats(trip, expenses, ctx, today);
  const balances = computeBalances(trip.travelers, expenses, settlements);
  const transfers = minimumTransfers(balances);

  return [
    { name: H('Expenses', 'הוצאות'), rows: expenseRows },
    { name: H('Daily', 'יומי'), rows: [[H('Date', 'תאריך'), H('Total ILS', 'סה"כ ₪')], ...daily.map(([d, v]) => [d, ils(v)])] },
    { name: H('Monthly', 'חודשי'), rows: [[H('Month', 'חודש'), H('Total ILS', 'סה"כ ₪')], ...monthly.map(([m, v]) => [m, ils(v)])] },
    {
      name: H('By country', 'לפי מדינה'),
      rows: [
        [H('Country', 'מדינה'), H('Total ILS', 'סה"כ ₪'), H('Days', 'ימים'), H('Avg/day ILS', 'ממוצע ליום ₪')],
        ...countries.map((c) => [countryName(c.country, lang), ils(c.total), c.days, ils(c.avgPerDay)]),
      ],
    },
    {
      name: H('By category', 'לפי קטגוריה'),
      rows: [
        [H('Category', 'קטגוריה'), H('Total ILS', 'סה"כ ₪'), '%'],
        ...cats.map(([c, v]) => [cat.get(c) ?? c, ils(v), catTotal ? Math.round((v / catTotal) * 1000) / 10 : 0]),
      ],
    },
    {
      name: H('Balances', 'מאזנים'),
      rows: [
        [H('Person', 'אדם'), H('Paid ILS', 'שילם ₪'), H('Share ILS', 'חלק ₪'), H('Net ILS', 'נטו ₪')],
        ...balances.map((b) => [person.get(b.id) ?? b.id, ils(b.paid), ils(b.share), ils(b.net)]),
        [],
        [H('From', 'מ'), H('To', 'אל'), H('Amount ILS', 'סכום ₪')],
        ...transfers.map((x) => [person.get(x.from) ?? '', person.get(x.to) ?? '', ils(x.amount)]),
      ],
    },
  ];
}

export function toCsv(rows: Cell[][]): string {
  const esc = (c: Cell) => {
    const s = String(c ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  // BOM so Excel opens Hebrew correctly
  return '﻿' + rows.map((r) => r.map(esc).join(',')).join('\r\n');
}

export async function toXlsxBlob(sheets: SheetData[], rtl: boolean): Promise<Blob> {
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();
  if (rtl) wb.Workbook = { Views: [{ RTL: true }] };
  for (const s of sheets) {
    const ws = XLSX.utils.aoa_to_sheet(s.rows);
    ws['!cols'] = (s.rows[0] ?? []).map((_, i) => ({ wch: Math.min(40, Math.max(10, ...s.rows.map((r) => String(r[i] ?? '').length + 2))) }));
    XLSX.utils.book_append_sheet(wb, ws, s.name.slice(0, 31));
  }
  const out = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
  return new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
