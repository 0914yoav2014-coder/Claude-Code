import Dexie, { type Table } from 'dexie';
import type { AppSettings, Category, Expense, MoneyEntry, PlannedItem, RatesCache, Settlement, Trip } from './types';

export class TripWalletDB extends Dexie {
  trips!: Table<Trip, string>;
  categories!: Table<Category, string>;
  expenses!: Table<Expense, string>;
  moneyEntries!: Table<MoneyEntry, string>;
  plannedItems!: Table<PlannedItem, string>;
  settlements!: Table<Settlement, string>;
  rates!: Table<RatesCache, string>;
  settings!: Table<AppSettings, string>;

  constructor(name = 'trip-wallet') {
    super(name);
    this.version(1).stores({
      trips: 'id, updatedAt',
      categories: 'id, order, updatedAt',
      expenses: 'id, tripId, date, [tripId+date], categoryId, updatedAt',
      moneyEntries: 'id, tripId, date, updatedAt',
      plannedItems: 'id, tripId, updatedAt',
      settlements: 'id, tripId, updatedAt',
      rates: 'id',
      settings: 'id',
    });
  }
}

export const db = new TripWalletDB();
