import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import type { AppSettings, Category, Expense, MoneyEntry, PlannedItem, RatesCache, Settlement, Trip } from '../db/types';
import { defaultSettings } from '../db/seed';
import { currentRate } from '../lib/rates';
import type { CurrencyCode } from '../db/types';

export function useSettings(): AppSettings {
  return useLiveQuery(() => db.settings.get('app'), []) ?? defaultSettings();
}

export function useTrips(): Trip[] | undefined {
  return useLiveQuery(() => db.trips.orderBy('updatedAt').reverse().toArray(), []);
}

export function useActiveTrip(): Trip | undefined | null {
  const settings = useLiveQuery(() => db.settings.get('app'), []);
  return useLiveQuery(async () => {
    if (!settings) return undefined;
    if (settings.activeTripId) {
      const t = await db.trips.get(settings.activeTripId);
      if (t) return t;
    }
    const first = await db.trips.orderBy('updatedAt').last();
    return first ?? null;
  }, [settings?.activeTripId, !!settings]);
}

export function useCategories(): Category[] {
  return useLiveQuery(() => db.categories.orderBy('order').toArray(), []) ?? [];
}

export function useExpenses(tripId: string | undefined): Expense[] | undefined {
  return useLiveQuery(
    () => (tripId ? db.expenses.where('tripId').equals(tripId).toArray() : Promise.resolve([] as Expense[])),
    [tripId],
  );
}

export function useMoneyEntries(tripId: string | undefined): MoneyEntry[] | undefined {
  return useLiveQuery(
    () => (tripId ? db.moneyEntries.where('tripId').equals(tripId).toArray() : Promise.resolve([] as MoneyEntry[])),
    [tripId],
  );
}

export function useSettlements(tripId: string | undefined): Settlement[] | undefined {
  return useLiveQuery(
    () => (tripId ? db.settlements.where('tripId').equals(tripId).toArray() : Promise.resolve([] as Settlement[])),
    [tripId],
  );
}

export function usePlanned(tripId: string | undefined): PlannedItem[] | undefined {
  return useLiveQuery(
    () => (tripId ? db.plannedItems.where('tripId').equals(tripId).toArray() : Promise.resolve([] as PlannedItem[])),
    [tripId],
  );
}

export function useRatesCache(): RatesCache | undefined {
  return useLiveQuery(() => db.rates.get('latest'), []);
}

/** Returns a function giving the current rate (units per ILS) for a currency. */
export function useRateFor() {
  const cache = useRatesCache();
  const settings = useSettings();
  return (cur: CurrencyCode) => currentRate(cur, cache, settings);
}
