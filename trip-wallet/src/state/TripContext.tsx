import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { AppSettings, Category, Expense, MoneyEntry, PlannedItem, RatesCache, Settlement, Traveler, Trip } from '../db/types';
import { useCategories, useExpenses, useMoneyEntries, usePlanned, useRatesCache, useSettings, useSettlements } from './data';
import { currentRate } from '../lib/rates';
import type { CurrencyCode } from '../db/types';
import type { Ctx } from '../lib/summaries';

export interface TripData {
  trip: Trip;
  me: Traveler;
  settings: AppSettings;
  categories: Category[];
  catById: Map<string, Category>;
  expenses: Expense[];
  money: MoneyEntry[];
  settlements: Settlement[];
  planned: PlannedItem[];
  rates?: RatesCache;
  rateFor: (c: CurrencyCode) => number;
  ctx: Ctx;
  travelerName: (id: string) => string;
  loaded: boolean;
}

const C = createContext<TripData | null>(null);

export function useTrip(): TripData {
  const v = useContext(C);
  if (!v) throw new Error('useTrip outside provider');
  return v;
}

export function TripProvider({ trip, children }: { trip: Trip; children: ReactNode }) {
  const settings = useSettings();
  const categories = useCategories();
  const expenses = useExpenses(trip.id);
  const money = useMoneyEntries(trip.id);
  const settlements = useSettlements(trip.id);
  const planned = usePlanned(trip.id);
  const rates = useRatesCache();
  const value = useMemo<TripData>(() => {
    const me = trip.travelers.find((t) => t.isMe) ?? trip.travelers[0] ?? { id: 'me', name: 'Me', isMe: true };
    const names = new Map(trip.travelers.map((t) => [t.id, t.name]));
    return {
      trip,
      me,
      settings,
      categories,
      catById: new Map(categories.map((c) => [c.id, c])),
      expenses: expenses ?? [],
      money: money ?? [],
      settlements: settlements ?? [],
      planned: planned ?? [],
      rates,
      rateFor: (c) => currentRate(c, rates, settings),
      ctx: { mode: settings.viewMode, meId: me.id },
      travelerName: (id) => names.get(id) ?? '?',
      loaded: expenses !== undefined && money !== undefined,
    };
  }, [trip, settings, categories, expenses, money, settlements, planned, rates]);
  return <C.Provider value={value}>{children}</C.Provider>;
}

export function catName(c: Category | undefined, lang: string) {
  if (!c) return '?';
  return lang === 'he' ? c.nameHe || c.nameEn : c.nameEn || c.nameHe;
}
