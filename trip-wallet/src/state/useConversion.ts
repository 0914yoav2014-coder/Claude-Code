import { useState } from 'react';
import type { CurrencyCode } from '../db/types';
import { ilsToLocal, localToILS, minorToInput, parseToMinor } from '../lib/money';
import { cleanRate } from '../components/AmountInputs';

/**
 * Two-way local ⇄ ILS conversion. Typing either side fills the other; editing the rate
 * recalculates from the side the user typed last.
 */
export function useConversion(init: { currency: CurrencyCode; rate: number; local?: number; ils?: number }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>(init.currency);
  const [rate, setRateStr] = useState(cleanRate(init.rate));
  const [local, setLocal] = useState(init.local !== undefined ? minorToInput(init.local, init.currency) : '');
  const [ils, setIls] = useState(init.ils !== undefined ? minorToInput(init.ils, 'ILS') : '');
  const [lastEdited, setLastEdited] = useState<'local' | 'ils'>('local');

  const r = Number(rate);

  function fromLocal(v: string, cur = currency, rt = r) {
    const m = parseToMinor(v, cur);
    setIls(m === null ? '' : minorToInput(localToILS(m, cur, rt), 'ILS'));
  }
  function fromIls(v: string, cur = currency, rt = r) {
    const m = parseToMinor(v, 'ILS');
    setLocal(m === null ? '' : minorToInput(ilsToLocal(m, cur, rt), cur));
  }

  return {
    currency,
    rate,
    local: currency === 'ILS' ? ils : local,
    ils,
    rateNum: currency === 'ILS' ? 1 : r,
    localMinor: currency === 'ILS' ? parseToMinor(ils, 'ILS') : parseToMinor(local, currency),
    ilsMinor: parseToMinor(ils, 'ILS'),
    onLocal(v: string) {
      setLocal(v);
      setLastEdited('local');
      fromLocal(v);
    },
    onIls(v: string) {
      setIls(v);
      setLastEdited('ils');
      if (currency !== 'ILS') fromIls(v);
    },
    onRate(v: string) {
      setRateStr(v);
      const n = Number(v);
      if (!(n > 0)) return;
      if (lastEdited === 'local') fromLocal(local, currency, n);
      else fromIls(ils, currency, n);
    },
    setCurrency(cur: CurrencyCode, newRate: number) {
      setCurrencyState(cur);
      setRateStr(cleanRate(newRate));
      if (cur === 'ILS') {
        if (currency !== 'ILS' && lastEdited === 'local') setIls('');
        setLocal('');
        setLastEdited('ils');
        return;
      }
      // keep what the user typed on the side they typed it, recompute the other
      if (currency === 'ILS' || lastEdited === 'ils') {
        setLastEdited('ils');
        fromIls(ils, cur, newRate);
      } else {
        // the user probably typed the number before picking the right currency: keep it
        fromLocal(local, cur, newRate);
      }
    },
  };
}
