import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useTrip } from './TripContext';
import { byCountry, dailyTotals, total } from '../lib/summaries';
import { progress, type BudgetProgress } from '../lib/budgets';
import { countryName } from '../lib/currencies';
import { todayISO } from '../lib/dates';
import type { CountryCode } from '../db/types';

export interface BudgetRow extends BudgetProgress {
  key: string;
  name: string;
}

export function useBudgets() {
  const { t, i18n } = useTranslation();
  const { trip, expenses, ctx } = useTrip();
  return useMemo(() => {
    const today = todayISO();
    const daily = dailyTotals(expenses, ctx);
    const rows: BudgetRow[] = [];
    const todaySpent = daily.get(today) ?? 0;
    if (trip.dailyBudgetILS) rows.push({ key: `daily-${today}`, name: t('budget.daily'), ...progress(todaySpent, trip.dailyBudgetILS) });
    if (trip.totalBudgetILS) rows.push({ key: 'total', name: t('budget.total'), ...progress(total(daily), trip.totalBudgetILS) });
    const bc = byCountry(expenses, ctx);
    for (const [c, b] of Object.entries(trip.budgetPerCountry ?? {}) as [CountryCode, number][]) {
      if (!b) continue;
      const name = t('budget.country', { country: countryName(c, i18n.language) });
      rows.push({ key: `country-${c}`, name, ...progress(bc.get(c) ?? 0, b) });
    }
    return { rows, todaySpent, today };
  }, [trip, expenses, ctx, t, i18n.language]);
}
