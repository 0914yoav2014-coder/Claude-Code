import { useTranslation } from 'react-i18next';
import type { Expense } from '../db/types';
import { catName, useTrip } from '../state/TripContext';
import { useEditor } from '../state/editor';
import { CategoryIcon } from './ui';
import { AmountPair } from './Money';
import { COUNTRY_BY_CODE } from '../lib/currencies';
import { repo } from '../db/repo';
import { useSnackbar } from '../state/undo';
import { useState } from 'react';

export function ExpenseRow({ e, showDate }: { e: Expense; showDate?: boolean }) {
  const { t, i18n } = useTranslation();
  const { catById, travelerName, me } = useTrip();
  const open = useEditor();
  const snack = useSnackbar();
  const [menu, setMenu] = useState(false);
  const c = catById.get(e.categoryId);
  const sign = e.isRefund ? -1 : 1;
  const meta = [
    COUNTRY_BY_CODE[e.country]?.flag,
    e.city,
    showDate ? e.date.slice(5).split('-').reverse().join('/') : undefined,
    e.paymentMethod === 'card' ? '💳' : e.paymentMethod === 'cash' ? '💵' : undefined,
    e.spreadDays > 1 ? `÷${e.spreadDays}` : undefined,
    e.split.participants.length > 1 ? `👥${e.split.participants.length}` : undefined,
    e.paidBy !== me.id ? `${t('expense.paidBy')}: ${travelerName(e.paidBy)}` : undefined,
    e.receiptPhoto ? '📎' : undefined,
  ].filter(Boolean);
  return (
    <div>
      <div className="flex items-stretch">
      <button
        className="flex min-w-0 flex-1 items-center gap-3 py-2.5 ps-3 text-start hover:bg-ink-100/60 dark:hover:bg-ink-800/40"
        onClick={() => open({ kind: 'expense', expense: e })}
        onContextMenu={(ev) => {
          ev.preventDefault();
          setMenu(true);
        }}
      >
        <CategoryIcon icon={c?.icon ?? '❔'} color={c?.color ?? '#888'} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">
            {e.isRefund && '↩️ '}
            {e.description || catName(c, i18n.language)}
          </div>
          <div className="truncate text-xs text-ink-500 dark:text-ink-400">{meta.join(' · ')}</div>
        </div>
        <AmountPair
          local={sign * e.amountLocal}
          cur={e.currency}
          ils={sign * (e.amountILS + e.cardFeeILS)}
          usdPerILS={e.usdPerILS}
          className={`text-sm ${e.isRefund ? 'text-lake-600 dark:text-lake-400' : ''}`}
        />
      </button>
      <button
        onClick={() => setMenu(!menu)}
        className="w-9 shrink-0 text-lg text-ink-400 hover:text-ink-700"
        aria-label={t('common.more')}
        aria-expanded={menu}
      >
        ⋮
      </button>
      </div>
      {menu && (
        <div className="flex gap-2 px-3 pb-2">
          <button
            className="btn-ghost flex-1 !min-h-[40px] text-sm"
            onClick={() => {
              setMenu(false);
              open({ kind: 'expense', expense: e, duplicate: true });
            }}
          >
            ⧉ {t('common.duplicate')}
          </button>
          <button
            className="btn-danger flex-1 !min-h-[40px] text-sm"
            onClick={async () => {
              setMenu(false);
              await repo.deleteExpense(e.id);
              snack(t('common.deleted'), () => repo.saveExpense(e));
            }}
          >
            🗑 {t('common.delete')}
          </button>
        </div>
      )}
    </div>
  );
}
