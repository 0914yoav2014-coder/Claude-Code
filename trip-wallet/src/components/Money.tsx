import type { CurrencyCode, Minor } from '../db/types';
import { formatMoney, ilsToLocal } from '../lib/money';

/** A single amount; always LTR + tabular digits, even inside RTL text. */
export function Money({ v, cur = 'ILS', className = '' }: { v: Minor; cur?: CurrencyCode; className?: string }) {
  return (
    <bdi dir="ltr" className={`num ${className}`}>
      {formatMoney(v, cur)}
    </bdi>
  );
}

/**
 * Local currency AND ILS side by side ("25,000 ARS | ₪96"), with an optional small USD line.
 * When the currency is ILS only the ILS is shown.
 */
export function AmountPair({
  local, cur, ils, usdPerILS, className = '', showUsd = true, align = 'end',
}: {
  local: Minor; cur: CurrencyCode; ils: Minor; usdPerILS?: number; className?: string; showUsd?: boolean; align?: 'start' | 'end';
}) {
  const usd = usdPerILS && cur !== 'USD' && cur !== 'PAB' ? ilsToLocal(ils, 'USD', usdPerILS) : undefined;
  return (
    <span className={`inline-flex flex-col ${align === 'end' ? 'items-end' : 'items-start'} ${className}`}>
      <bdi dir="ltr" className="num whitespace-nowrap">
        {cur !== 'ILS' && (
          <>
            <span>{formatMoney(local, cur)}</span>
            <span className="mx-1.5 text-ink-300 dark:text-ink-600">|</span>
          </>
        )}
        <span className="font-semibold">{formatMoney(ils, 'ILS')}</span>
      </bdi>
      {showUsd && usd !== undefined && (
        <bdi dir="ltr" className="num text-[11px] text-ink-400">
          {formatMoney(usd, 'USD')}
        </bdi>
      )}
    </span>
  );
}
