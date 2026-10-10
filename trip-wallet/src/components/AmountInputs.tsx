import { useTranslation } from 'react-i18next';
import type { CurrencyCode } from '../db/types';
import { SYMBOL } from '../lib/currencies';
import { formatRate } from '../lib/money';

/**
 * Two amount boxes side by side (local ⇄ ILS) with the editable rate between them.
 * The parent owns the conversion logic; this is presentation only.
 */
export function AmountInputs({
  currency, currencies, onCurrency, local, ils, rate, onLocal, onIls, onRate, onRateReset, marketRate,
  localLabel, ilsLabel, autoFocus,
}: {
  currency: CurrencyCode;
  currencies: CurrencyCode[];
  onCurrency: (c: CurrencyCode) => void;
  local: string;
  ils: string;
  rate: string;
  onLocal: (v: string) => void;
  onIls: (v: string) => void;
  onRate: (v: string) => void;
  onRateReset?: () => void;
  marketRate?: number;
  localLabel?: string;
  ilsLabel?: string;
  autoFocus?: boolean;
}) {
  const { t } = useTranslation();
  const isILS = currency === 'ILS';
  const rateNum = Number(rate);
  const rateChanged = marketRate !== undefined && rateNum > 0 && Math.abs(rateNum - marketRate) / marketRate > 0.0005;
  return (
    <div className="space-y-2">
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar" role="radiogroup" aria-label="currency">
        {currencies.map((c) => (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={currency === c}
            onClick={() => onCurrency(c)}
            className={`chip shrink-0 ${currency === c ? 'chip-on' : ''}`}
          >
            {SYMBOL[c] ? `${SYMBOL[c]} ${c}` : c}
          </button>
        ))}
      </div>
      <div dir="ltr" className={`grid gap-2 ${isILS ? 'grid-cols-1' : 'grid-cols-2'}`}>
        {!isILS && (
          <label className="block">
            <span className="label text-start" dir="auto">{localLabel ?? currency}</span>
            <div className="relative">
              <input
                className="input pe-14 text-2xl font-bold num"
                inputMode="decimal"
                placeholder="0"
                value={local}
                autoFocus={autoFocus}
                onChange={(e) => onLocal(e.target.value)}
                aria-label={`${localLabel ?? ''} ${currency}`}
              />
              <span className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-ink-400">{currency}</span>
            </div>
          </label>
        )}
        <label className="block">
          <span className="label text-start" dir="auto">{ilsLabel ?? 'ILS'}</span>
          <div className="relative">
            <input
              className="input pe-10 text-2xl font-bold num"
              inputMode="decimal"
              placeholder="0"
              value={ils}
              autoFocus={autoFocus && isILS}
              onChange={(e) => onIls(e.target.value)}
              aria-label={`${ilsLabel ?? ''} ILS`}
            />
            <span className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-lg font-semibold text-ink-400">₪</span>
          </div>
        </label>
      </div>
      {!isILS && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-ink-500" dir="ltr">1 ₪ =</span>
          <input
            dir="ltr"
            className="input !min-h-[36px] w-28 !py-1 text-sm num"
            inputMode="decimal"
            value={rate}
            onChange={(e) => onRate(e.target.value)}
            aria-label={t('common.rate')}
          />
          <span className="text-ink-500">{currency}</span>
          {rateChanged && onRateReset && (
            <button type="button" onClick={onRateReset} className="ms-auto min-h-[36px] text-xs font-semibold text-lake-600 dark:text-lake-400">
              {t('expense.rateReset')} (<bdi dir="ltr">{formatRate(marketRate!)}</bdi>)
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/** Shared two-way conversion state helpers. */
export function cleanRate(r: number): string {
  if (!(r > 0)) return '';
  const digits = r >= 100 ? 2 : r >= 1 ? 4 : 6;
  return String(Number(r.toFixed(digits)));
}
