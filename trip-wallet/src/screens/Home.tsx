import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useTrip } from '../state/TripContext';
import { useBudgets } from '../state/useBudgets';
import { Banner, EmptyState, ProgressBar } from '../components/ui';
import { Money } from '../components/Money';
import { ExpenseRow } from '../components/ExpenseRow';
import { ViewToggle } from '../components/ViewToggle';
import { cashBalances } from '../lib/wallet';
import { localToILS } from '../lib/money';
import { overall } from '../lib/summaries';
import { repo } from '../db/repo';
import { useEditor } from '../state/editor';
import { downloadBackup } from '../lib/backup';
import { useSnackbar } from '../state/undo';
import { interp } from '../components/interp';

export function Home({ go }: { go: (r: string) => void }) {
  const { t } = useTranslation();
  const { trip, expenses, money, ctx, settings, rateFor, loaded } = useTrip();
  const { rows, todaySpent, today } = useBudgets();
  const open = useEditor();
  const snack = useSnackbar();

  const recent = useMemo(
    () => [...expenses].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt).slice(0, 6),
    [expenses],
  );
  const cash = useMemo(() => cashBalances(money, expenses).filter((b) => b.balance !== 0), [money, expenses]);
  const ov = useMemo(() => overall(trip, expenses, ctx, today), [trip, expenses, ctx, today]);

  const hour = new Date().getHours();
  const loggedToday = expenses.some((e) => e.date === today || e.createdAt > new Date(`${today}T00:00`).getTime());
  const showReminder = settings.reminderEnabled && loaded && hour >= 18 && today >= trip.startDate && today <= trip.endDate && !loggedToday && !settings.dismissedAlerts.includes(`remind-${today}`);
  const weekAgo = Date.now() - 7 * 86400000;
  const backupBase = settings.lastBackupAt ?? Math.min(...expenses.map((e) => e.createdAt));
  const showBackup = settings.backupReminderEnabled && expenses.length > 0 && backupBase < weekAgo && !settings.dismissedAlerts.some((k) => k.startsWith('backup-') && Number(k.slice(7)) > weekAgo);
  const alerts = rows.filter((r) => r.level !== 'ok' && !settings.dismissedAlerts.includes(`${r.key}-${r.level}`));
  const dismiss = (k: string) => repo.updateSettings({ dismissedAlerts: [...settings.dismissedAlerts.slice(-50), k] });
  const daily = rows.find((r) => r.key.startsWith('daily'));
  const tripDay = ov.daysSoFar;
  const tripLen = Math.round((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / 86400000) + 1;

  return (
    <div className="space-y-3">
      {showReminder && (
        <Banner
          action={<button className="btn-primary !min-h-[36px] text-xs" onClick={() => open({ kind: 'expense' })}>{t('home.remindAction')}</button>}
          onDismiss={() => dismiss(`remind-${today}`)}
        >
          🌙 {t('home.remindToday')}
        </Banner>
      )}
      {showBackup && (
        <Banner
          action={
            <button
              className="btn-primary !min-h-[36px] text-xs"
              onClick={async () => {
                await downloadBackup();
                snack(t('common.saved'));
              }}
            >
              {t('home.backupNow')}
            </button>
          }
          onDismiss={() => dismiss(`backup-${Date.now()}`)}
        >
          💾 {t('home.backupReminder')}
        </Banner>
      )}
      {alerts.map((a) => (
        <Banner key={a.key} tone={a.level === 'over' ? 'over' : 'warn'} onDismiss={() => dismiss(`${a.key}-${a.level}`)}>
          {a.level === 'over' ? '🚨 ' + t('budget.over', { name: a.name }) : '⚠️ ' + t('budget.warn', { name: a.name, pct: Math.round(a.pct) })}
        </Banner>
      ))}

      <ViewToggle />

      <section className="card bg-gradient-to-br from-lake-600 to-lake-800 text-white ring-0 dark:from-lake-700 dark:to-lake-900">
        <div className="text-sm opacity-80">{t('home.today')}</div>
        <div className="mt-1 flex items-baseline gap-2">
          <Money v={todaySpent} className="text-4xl font-bold" />
          {daily ? (
            <span className="text-sm opacity-90">{interp(t('home.ofDaily', { budget: '\u0000' }), <Money v={daily.budget} />)}</span>
          ) : (
            <span className="text-xs opacity-70">{t('home.noDaily')}</span>
          )}
        </div>
        {daily && (
          <div className="mt-3">
            <div className="h-2.5 overflow-hidden rounded-full bg-white/25">
              <div
                className={`h-full rounded-full ${daily.level === 'over' ? 'bg-terra-400' : daily.level === 'warn' ? 'bg-sun-400' : 'bg-white'}`}
                style={{ width: `${Math.min(100, daily.pct)}%` }}
              />
            </div>
            <div className="mt-1 text-xs opacity-90">
              {daily.left >= 0 ? (
                <><Money v={daily.left} /> {t('common.left')}</>
              ) : (
                <><Money v={-daily.left} /> {t('common.over')}</>
              )}
            </div>
          </div>
        )}
      </section>

      <section className="grid grid-cols-3 gap-2">
        <Stat label={t('home.tripDay')} value={<bdi dir="ltr" className="num">{tripDay > 0 ? `${Math.min(tripDay, tripLen)}/${tripLen}` : '–'}</bdi>} />
        <Stat label={t('home.spent')} value={<Money v={ov.grandTotal} />} />
        <Stat label={t('home.avgDay')} value={<Money v={ov.avgPerDay} />} />
      </section>

      {rows.filter((r) => !r.key.startsWith('daily')).length > 0 && (
        <section className="card space-y-3">
          <h2 className="text-sm font-bold">{t('home.budgets')}</h2>
          {rows
            .filter((r) => !r.key.startsWith('daily'))
            .map((r) => (
              <div key={r.key}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{r.name}</span>
                  <span className="text-ink-500">
                    <Money v={r.used} /> / <Money v={r.budget} />
                  </span>
                </div>
                <ProgressBar pct={r.pct} level={r.level} />
              </div>
            ))}
        </section>
      )}

      {cash.length > 0 && (
        <section className="card">
          <button className="flex w-full justify-between text-sm font-bold" onClick={() => go('wallet')}>
            <span>👛 {t('home.cash')}</span>
            <span className="text-lake-600 dark:text-lake-400">›</span>
          </button>
          <div className="mt-2 flex flex-wrap gap-2">
            {cash.map((b) => (
              <div key={b.currency} className="rounded-xl bg-ink-100 px-3 py-2 dark:bg-ink-800">
                <Money v={b.balance} cur={b.currency} className={`font-bold ${b.balance < 0 ? 'text-terra-500' : ''}`} />
                {b.currency !== 'ILS' && (
                  <div className="text-xs text-ink-500">
                    ≈ <Money v={localToILS(b.balance, b.currency, rateFor(b.currency))} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="card !p-0">
        <div className="flex items-center justify-between px-4 pt-3">
          <h2 className="text-sm font-bold">{t('home.recent')}</h2>
          {recent.length > 0 && (
            <button className="min-h-[44px] text-sm font-semibold text-lake-600 dark:text-lake-400" onClick={() => go('expenses')}>
              {t('home.seeAll')} ›
            </button>
          )}
        </div>
        {recent.length === 0 ? (
          <EmptyState icon="🧾" title={t('expenses.empty')} text={t('home.emptyRecent')} />
        ) : (
          <div className="divide-y divide-ink-100 pb-1 dark:divide-ink-800">
            {recent.map((e) => (
              <ExpenseRow key={e.id} e={e} showDate />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="card !p-3">
      <div className="text-[11px] text-ink-500 dark:text-ink-400">{label}</div>
      <div className="mt-0.5 text-base font-bold">{value}</div>
    </div>
  );
}
