import { db as defaultDb, type TripWalletDB } from '../db/db';
import type { Expense } from '../db/types';

const TABLES = ['trips', 'categories', 'expenses', 'moneyEntries', 'plannedItems', 'settlements', 'settings', 'rates'] as const;

async function blobToDataUrl(b: Blob): Promise<string> {
  const bytes = new Uint8Array(await b.arrayBuffer());
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return `data:${b.type || 'application/octet-stream'};base64,${btoa(bin)}`;
}

function dataUrlToBlob(url: string): Blob {
  const [head, b64] = url.split(',');
  const type = /data:([^;]+)/.exec(head)?.[1] ?? 'application/octet-stream';
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type });
}

export interface BackupFile {
  app: 'trip-wallet';
  version: 1;
  exportedAt: string;
  tables: Record<string, unknown[]>;
}

export async function exportBackup(db: TripWalletDB = defaultDb): Promise<BackupFile> {
  const tables: Record<string, unknown[]> = {};
  for (const name of TABLES) {
    const rows = await db.table(name).toArray();
    if (name === 'expenses') {
      tables[name] = await Promise.all(
        (rows as Expense[]).map(async (e) => (e.receiptPhoto ? { ...e, receiptPhoto: await blobToDataUrl(e.receiptPhoto) } : e)),
      );
    } else tables[name] = rows;
  }
  return { app: 'trip-wallet', version: 1, exportedAt: new Date().toISOString(), tables };
}

export async function importBackup(file: BackupFile, db: TripWalletDB = defaultDb) {
  if (!file || file.app !== 'trip-wallet' || !file.tables) throw new Error('Not a Trip Wallet backup');
  await db.transaction('rw', TABLES.map((n) => db.table(n)), async () => {
    for (const name of TABLES) {
      await db.table(name).clear();
      let rows = (file.tables[name] ?? []) as Record<string, unknown>[];
      if (name === 'expenses')
        rows = rows.map((e) => (typeof e.receiptPhoto === 'string' ? { ...e, receiptPhoto: dataUrlToBlob(e.receiptPhoto) } : e));
      if (rows.length) await db.table(name).bulkAdd(rows);
    }
  });
}

export function saveFile(blob: Blob, filename: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 10000);
}

/** Share sheet on phones (save to Files / Drive / WhatsApp), download elsewhere. */
export async function shareOrSave(blob: Blob, filename: string) {
  const file = new File([blob], filename, { type: blob.type });
  const nav = navigator as Navigator & { canShare?: (d: unknown) => boolean };
  if (nav.canShare?.({ files: [file] }) && /iPhone|iPad|Android/i.test(navigator.userAgent)) {
    try {
      await navigator.share({ files: [file], title: filename });
      return;
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
    }
  }
  saveFile(blob, filename);
}

export async function downloadBackup() {
  const data = await exportBackup();
  const stamp = new Date().toISOString().slice(0, 10);
  await shareOrSave(new Blob([JSON.stringify(data)], { type: 'application/json' }), `trip-wallet-backup-${stamp}.json`);
  await defaultDb.settings.update('app', { lastBackupAt: Date.now() });
}
