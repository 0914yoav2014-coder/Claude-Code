import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTrip } from '../state/TripContext';
import { FilterBar, useFilter } from '../components/FilterBar';
import { applyFilter, isFilterActive } from '../lib/filters';
import { ExpenseRow } from '../components/ExpenseRow';
import { EmptyState } from '../components/ui';
import { Money } from '../components/Money';
import { ViewToggle } from '../components/ViewToggle';
import { valueILS } from '../lib/expense';
import { addDays, formatDate, todayISO } from '../lib/dates';

const PAGE = 40;

export function Expenses() {
  const { t, i18n } = useTranslation();
  const { expenses, ctx } = useTrip();
  const [filter, setFilter] = useFilter();
  const [days, setDays] = useState(PAGE);
  const filtered = useMemo(() => applyFilter(expenses, filter), [expenses, filter]);
  const groups = useMemo(() => {
    const m = new Map<string, typeof filtered>();
    for (const e of filtered) {
      const g = m.get(e.date) ?? [];
      g.push(e);
      m.set(e.date, g);
    }
    return [...m.entries()]
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([date, es]) => ({
        date,
        items: es.sort((a, b) => b.createdAt - a.createdAt),
        total: es.reduce((s, e) => s + valueILS(e, ctx.mode, ctx.meId), 0),
      }));
  }, [filtered, ctx]);
  const sum = groups.reduce((s, g) => s + g.total, 0);
  const today = todayISO();
  const label = (d: string) =>
    d === today ? t('common.today') : d === addDays(today, -1) ? t('common.yesterday') : formatDate(d, i18n.language, { weekday: 'short', day: 'numeric', month: 'short', year: d.slice(0, 4) !== today.slice(0, 4) ? 'numeric' : undefined });

  if (expenses.length === 0)
    return <EmptyState icon="🧾" title={t('expenses.empty')} text={t('expenses.emptyHint')} />;

  return (
    <div className="space-y-3">
      <FilterBar value={filter} onChange={setFilter} />
      <ViewToggle />
      {(isFilterActive(filter)) && (
        <div className="flex justify-between px-1 text-sm text-ink-500">
          <span>{t('common.expenses', { count: filtered.length })}</span>
          <span>
            {t('common.total')}: <Money v={sum} className="font-bold text-ink-900 dark:text-ink-100" />
          </span>
        </div>
      )}
      {groups.length === 0 && <EmptyState icon="🔍" title={t('expenses.noMatch')} />}
      {groups.slice(0, days).map((g) => (
        <section key={g.date} className="card !p-0 overflow-hidden">
          <div className="flex items-center justify-between bg-ink-100/70 px-3 py-2 text-sm dark:bg-ink-800/60">
            <span className="font-bold">{label(g.date)}</span>
            <Money v={g.total} className="font-bold" />
          </div>
          <div className="divide-y divide-ink-100 dark:divide-ink-800">
            {g.items.map((e) => (
              <ExpenseRow key={e.id} e={e} />
            ))}
          </div>
        </section>
      ))}
      {groups.length > days && (
        <button className="btn-ghost w-full" onClick={() => setDays(days + PAGE)}>
          {t('common.more')}…
        </button>
      )}
    </div>
  );
}
