import { db } from '../db/db';
import { fetchRates } from '../lib/rates';

let inflight: Promise<{ ok: boolean; errors: string[] }> | null = null;

/** Fetch rates when online and the cache is older than 6 hours (or `force`). Never throws. */
export function refreshRatesIfStale(force = false): Promise<{ ok: boolean; errors: string[] }> {
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.onLine === false) return { ok: false, errors: ['offline'] };
      const cache = await db.rates.get('latest');
      if (!force && cache?.fetchedAt && Date.now() - cache.fetchedAt < 6 * 3600 * 1000) return { ok: true, errors: [] };
      const { patch, errors } = await fetchRates();
      if (Object.keys(patch).length) {
        await db.rates.put({ id: 'latest', rates: {}, ...cache, ...patch });
      }
      return { ok: !!patch.rates, errors };
    } catch (e) {
      return { ok: false, errors: [(e as Error).message] };
    } finally {
      setTimeout(() => (inflight = null), 0);
    }
  })();
  return inflight;
}
