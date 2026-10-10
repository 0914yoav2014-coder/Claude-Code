import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { TripWalletDB } from '../db/db';
import { ensureSeed, newTrip } from '../db/seed';
import { exportBackup, importBackup } from './backup';
import { mkExpense } from '../test/factory';

describe('backup', () => {
  it('backup → wipe → restore brings back everything, including photos', async () => {
    const db = new TripWalletDB('test-backup');
    await ensureSeed(db);
    const trip = newTrip('T', '2026-11-01');
    await db.trips.add(trip);
    const photo = new Blob([new Uint8Array([1, 2, 3, 250, 255])], { type: 'image/jpeg' });
    await db.expenses.add(mkExpense({ id: 'x1', tripId: trip.id, amountILS: 1234, receiptPhoto: photo }));
    await db.expenses.add(mkExpense({ id: 'x2', tripId: trip.id, amountILS: 99 }));
    const backup = JSON.parse(JSON.stringify(await exportBackup(db)));

    await Promise.all(db.tables.map((t) => t.clear()));
    expect(await db.expenses.count()).toBe(0);

    await importBackup(backup, db);
    expect(await db.trips.count()).toBe(1);
    expect(await db.categories.count()).toBe(20);
    const e = await db.expenses.get('x1');
    expect(e?.amountILS).toBe(1234);
    expect(e?.receiptPhoto).toBeInstanceOf(Blob);
    expect([...new Uint8Array(await e!.receiptPhoto!.arrayBuffer())]).toEqual([1, 2, 3, 250, 255]);
    expect(e?.receiptPhoto?.type).toBe('image/jpeg');
  });

  it('rejects foreign files', async () => {
    await expect(importBackup({} as never, new TripWalletDB('x'))).rejects.toThrow();
  });
});
