import { db } from './db';
import type { AppSettings, Category, Expense, MoneyEntry, PlannedItem, Settlement, Trip } from './types';

/**
 * All writes go through here so a sync layer can later hook in (every row carries
 * a UUID id + updatedAt).
 */
const stamp = <T extends { updatedAt: number }>(x: T): T => ({ ...x, updatedAt: Date.now() });

export const repo = {
  saveTrip: (t: Trip) => db.trips.put(stamp(t)),
  deleteTrip: async (id: string) =>
    db.transaction('rw', [db.trips, db.expenses, db.moneyEntries, db.plannedItems, db.settlements], async () => {
      await db.expenses.where('tripId').equals(id).delete();
      await db.moneyEntries.where('tripId').equals(id).delete();
      await db.plannedItems.where('tripId').equals(id).delete();
      await db.settlements.where('tripId').equals(id).delete();
      await db.trips.delete(id);
    }),

  saveExpense: (e: Expense) => db.expenses.put(stamp(e)),
  deleteExpense: (id: string) => db.expenses.delete(id),

  saveMoney: (m: MoneyEntry) => db.moneyEntries.put(stamp(m)),
  deleteMoney: (id: string) => db.moneyEntries.delete(id),

  savePlanned: (p: PlannedItem) => db.plannedItems.put(stamp(p)),
  deletePlanned: (id: string) => db.plannedItems.delete(id),

  saveSettlement: (s: Settlement) => db.settlements.put(stamp(s)),
  deleteSettlement: (id: string) => db.settlements.delete(id),

  saveCategory: (c: Category) => db.categories.put(stamp(c)),
  /** Delete a category, moving its expenses and planned items to `moveTo`. */
  deleteCategory: (id: string, moveTo?: string) =>
    db.transaction('rw', [db.categories, db.expenses, db.plannedItems], async () => {
      if (moveTo) {
        await db.expenses.where('categoryId').equals(id).modify({ categoryId: moveTo, updatedAt: Date.now() });
        await db.plannedItems.filter((p) => p.categoryId === id).modify({ categoryId: moveTo, updatedAt: Date.now() });
      }
      await db.categories.delete(id);
    }),

  updateSettings: (patch: Partial<AppSettings>) => db.settings.update('app', patch),
};
