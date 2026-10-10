import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useTrip } from '../state/TripContext';
import { useTrips } from '../state/data';
import { repo } from '../db/repo';
import { db } from '../db/db';
import { Segmented, Toggle } from '../components/ui';
import { COUNTRIES, CURRENCIES, countryName } from '../lib/currencies';
import { formatRate, minorToInput, parseToMinor } from '../lib/money';
import { rateSource } from '../lib/rates';
import { refreshRatesIfStale } from '../state/ratesSync';
import { useSnackbar } from '../state/undo';
import { downloadBackup, importBackup, shareOrSave } from '../lib/backup';
import { buildSheets, toCsv, toXlsxBlob } from '../lib/exportData';
import { todayISO, uid } from '../lib/dates';
import { newTrip } from '../db/seed';
import { Planning } from './Planning';
import { CategoriesEditor } from './CategoriesEditor';
import type { CountryCode, CurrencyCode, Trip } from '../db/types';

/** Text input that keeps local state and commits on blur / Enter (avoids cursor jumps with live DB). */
export function CommitInput({ value, onCommit, className = 'input', ...rest }: {
  value: string; onCommit: (v: string) => void; className?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) {
  const [v, setV] = useState(value);
  const focused = useRef(false);
  useEffect(() => {
    if (!focused.current) setV(value);
  }, [value]);
  return (
    <input
      {...rest}
      className={className}
      value={v}
      onFocus={() => (focused.current = true)}
      onChange={(e) => setV(e.target.value)}
      onBlur={() => {
        focused.current = false;
        if (v !== value) onCommit(v);
      }}
      onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
    />
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="section-title">{title}</h2>
      <div className="card space-y-3">{children}</div>
    </section>
  );
}

function NavRow({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button className="flex min-h-[48px] w-full items-center gap-3 text-start font-semibold" onClick={onClick}>
      <span className="text-xl">{icon}</span>
      <span className="flex-1">{label}</span>
      <span className="text-ink-400 rtl:rotate-180">›</span>
    </button>
  );
}

function MoneyInput({ value, onCommit, placeholder }: { value?: number; onCommit: (v: number | undefined) => void; placeholder?: string }) {
  return (
    <CommitInput
      dir="ltr"
      inputMode="decimal"
      className="input num"
      placeholder={placeholder ?? '—'}
      value={value ? minorToInput(value, 'ILS') : ''}
      onCommit={(v) => onCommit(parseToMinor(v, 'ILS') || undefined)}
    />
  );
}

export function Settings({ sub, go }: { sub?: string; go: (r: string) => void }) {
  const { t, i18n } = useTranslation();
  const ctx = useTrip();
  const { trip, settings, rates, expenses, settlements, categories } = ctx;
  const trips = useTrips() ?? [];
  const snack = useSnackbar();
  const fileRef = useRef<HTMLInputElement>(null);
  const [refreshing, setRefreshing] = useState(false);

  if (sub === 'planning') return <SubPage title={t('planning.title')} back={() => go('settings')}><Planning /></SubPage>;
  if (sub === 'categories') return <SubPage title={t('categories.title')} back={() => go('settings')}><CategoriesEditor /></SubPage>;

  const saveTrip = (patch: Partial<Trip>) => repo.saveTrip({ ...trip, ...patch });
  const lang = i18n.language;

  async function refresh() {
    setRefreshing(true);
    const r = await refreshRatesIfStale(true);
    setRefreshing(false);
    snack(r.ok ? t('settings.refreshOk') : t('settings.refreshFail'));
  }

  async function exportX(kind: 'xlsx' | 'csv') {
    const sheets = buildSheets(trip, expenses, settlements, categories, lang, ctx.ctx, todayISO());
    const name = `trip-wallet-${trip.name.replace(/[^\p{L}\p{N}]+/gu, '-')}-${todayISO()}`;
    if (kind === 'xlsx') await shareOrSave(await toXlsxBlob(sheets, lang === 'he'), `${name}.xlsx`);
    else await shareOrSave(new Blob([toCsv(sheets[0].rows)], { type: 'text/csv;charset=utf-8' }), `${name}.csv`);
  }

  async function restore(f: File | undefined) {
    if (!f) return;
    if (!confirm(t('settings.restoreConfirm'))) return;
    try {
      await importBackup(JSON.parse(await f.text()));
      snack(t('settings.restored'));
    } catch (e) {
      alert((e as Error).message);
    }
  }

  async function addTrip() {
    const tr = newTrip(t('settings.newTrip'));
    tr.travelers = trip.travelers.map((p) => ({ ...p, id: p.isMe ? p.id : uid() }));
    await repo.saveTrip(tr);
    await repo.updateSettings({ activeTripId: tr.id });
    snack(t('common.saved'));
  }

  return (
    <div className="pb-6">
      <Group title={t('settings.trip')}>
        <label className="block">
          <span className="label">{t('settings.tripName')}</span>
          <CommitInput value={trip.name} onCommit={(name) => name.trim() && saveTrip({ name: name.trim() })} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="label">{t('settings.start')}</span>
            <input type="date" className="input" value={trip.startDate} onChange={(e) => e.target.value && saveTrip({ startDate: e.target.value })} />
          </label>
          <label className="block">
            <span className="label">{t('settings.end')}</span>
            <input type="date" className="input" value={trip.endDate} onChange={(e) => e.target.value && saveTrip({ endDate: e.target.value })} />
          </label>
        </div>
        <div>
          <span className="label">{t('settings.trips')}</span>
          <div className="flex flex-wrap gap-1.5">
            {trips.map((x) => (
              <button key={x.id} className={`chip ${x.id === trip.id ? 'chip-on' : ''}`} onClick={() => repo.updateSettings({ activeTripId: x.id })}>
                {x.name}
              </button>
            ))}
            <button className="chip" onClick={addTrip}>＋ {t('settings.newTrip')}</button>
          </div>
        </div>
        {trips.length > 1 && (
          <button
            className="btn-danger w-full text-sm"
            onClick={async () => {
              if (!confirm(t('settings.deleteTripConfirm'))) return;
              await repo.deleteTrip(trip.id);
              await repo.updateSettings({ activeTripId: trips.find((x) => x.id !== trip.id)?.id });
            }}
          >
            {t('settings.deleteTrip')}
          </button>
        )}
      </Group>

      <Group title={t('settings.travelers')}>
        {trip.travelers.map((p) => {
          const used = expenses.some((e) => e.paidBy === p.id || e.split.participants.includes(p.id));
          return (
            <div key={p.id} className="flex items-center gap-2">
              <CommitInput
                value={p.name}
                aria-label={t('settings.travelers')}
                onCommit={(name) => name.trim() && saveTrip({ travelers: trip.travelers.map((x) => (x.id === p.id ? { ...x, name: name.trim() } : x)) })}
              />
              {p.isMe ? (
                <span className="chip shrink-0 chip-on">{t('settings.me')}</span>
              ) : (
                !used && (
                  <button className="h-11 w-11 shrink-0 text-ink-400" aria-label={t('common.delete')} onClick={() => saveTrip({ travelers: trip.travelers.filter((x) => x.id !== p.id) })}>
                    ✕
                  </button>
                )
              )}
            </div>
          );
        })}
        <button
          className="btn-ghost w-full text-sm"
          onClick={() => saveTrip({ travelers: [...trip.travelers, { id: uid(), name: `${t('settings.travelers')} ${trip.travelers.length + 1}`, isMe: false }] })}
        >
          ＋ {t('settings.addTraveler')}
        </button>
      </Group>

      <Group title={t('settings.budgets')}>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="label">{t('settings.totalBudget')}</span>
            <MoneyInput value={trip.totalBudgetILS} onCommit={(v) => saveTrip({ totalBudgetILS: v })} />
          </label>
          <label className="block">
            <span className="label">{t('settings.dailyBudget')}</span>
            <MoneyInput value={trip.dailyBudgetILS} onCommit={(v) => saveTrip({ dailyBudgetILS: v })} />
          </label>
        </div>
        <details>
          <summary className="min-h-[44px] cursor-pointer py-2 text-sm font-semibold">{t('settings.countryBudgets')}</summary>
          <div className="grid grid-cols-2 gap-2">
            {COUNTRIES.map((c) => (
              <label key={c.code} className="block">
                <span className="label normal-case">{c.flag} {countryName(c.code, lang)}</span>
                <MoneyInput
                  value={trip.budgetPerCountry?.[c.code]}
                  onCommit={(v) => saveTrip({ budgetPerCountry: { ...trip.budgetPerCountry, [c.code]: v } as Partial<Record<CountryCode, number>> })}
                />
              </label>
            ))}
          </div>
        </details>
        <NavRow icon="📝" label={t('settings.planning')} onClick={() => go('settings/planning')} />
      </Group>

      <Group title={t('settings.rates')}>
        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="text-ink-500">
            {rates?.fetchedAt
              ? t('settings.ratesUpdated', { date: new Date(rates.fetchedAt).toLocaleString(lang === 'he' ? 'he-IL' : 'en-GB', { dateStyle: 'short', timeStyle: 'short' }) })
              : t('settings.ratesNever')}
          </span>
          <button className="btn-ghost shrink-0 !min-h-[40px] text-sm" onClick={refresh} disabled={refreshing}>
            {refreshing ? t('settings.refreshing') : `↻ ${t('settings.refresh')}`}
          </button>
        </div>
        <div role="group" aria-label={t('settings.arsMode')}>
          <span className="label">{t('settings.arsMode')}</span>
          <Segmented
            size="sm"
            value={settings.arsMode}
            onChange={(arsMode) => repo.updateSettings({ arsMode })}
            options={[
              { value: 'official', label: `${t('settings.arsOfficial')}${rates?.ars?.official ? ` ${Math.round(rates.ars.official)}` : ''}` },
              { value: 'blue', label: `${t('settings.arsBlue')}${rates?.ars?.blue ? ` ${Math.round(rates.ars.blue)}` : ''}` },
              { value: 'mep', label: `${t('settings.arsMep')}${rates?.ars?.mep ? ` ${Math.round(rates.ars.mep)}` : ''}` },
            ]}
          />
          {rates?.ars && <span className="mt-1 block text-xs text-ink-400">ARS / 1 USD</span>}
        </div>
        <div className="divide-y divide-ink-100 dark:divide-ink-800">
          {CURRENCIES.filter((c) => c !== 'ILS').map((c) => (
            <RateRow key={c} cur={c} />
          ))}
        </div>
        <label className="block">
          <span className="label">{t('settings.cardFee')}</span>
          <CommitInput
            dir="ltr"
            inputMode="decimal"
            className="input num"
            value={String(settings.cardFeePct || '')}
            placeholder="0"
            onCommit={(v) => repo.updateSettings({ cardFeePct: Math.max(0, Math.min(20, Number(v) || 0)) })}
          />
        </label>
      </Group>

      <Group title={t('settings.categories')}>
        <NavRow icon="🏷️" label={t('settings.manageCategories')} onClick={() => go('settings/categories')} />
      </Group>

      <Group title={t('settings.appearance')}>
        <div role="group" aria-label={t('common.language')}>
          <span className="label">{t('common.language')}</span>
          <Segmented value={settings.lang} onChange={(l) => repo.updateSettings({ lang: l })} options={[{ value: 'he', label: 'עברית' }, { value: 'en', label: 'English' }]} />
        </div>
        <div role="group" aria-label={t('common.theme')}>
          <span className="label">{t('common.theme')}</span>
          <Segmented
            value={settings.theme}
            onChange={(theme) => repo.updateSettings({ theme })}
            options={[
              { value: 'system', label: t('settings.themeSystem') },
              { value: 'light', label: `☀️ ${t('settings.themeLight')}` },
              { value: 'dark', label: `🌙 ${t('settings.themeDark')}` },
            ]}
          />
        </div>
      </Group>

      <Group title={t('settings.reminders')}>
        <Toggle checked={settings.reminderEnabled} onChange={(v) => repo.updateSettings({ reminderEnabled: v })} label={t('settings.dailyReminder')} />
        <Toggle checked={settings.backupReminderEnabled} onChange={(v) => repo.updateSettings({ backupReminderEnabled: v })} label={t('settings.backupReminder')} />
      </Group>

      <Group title={t('settings.data')}>
        <p className="text-xs text-ink-500">
          {settings.lastBackupAt ? t('settings.lastBackup', { date: new Date(settings.lastBackupAt).toLocaleDateString(lang === 'he' ? 'he-IL' : 'en-GB') }) : t('settings.neverBacked')}
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button className="btn-primary text-sm" onClick={async () => { await downloadBackup(); snack(t('common.saved')); }}>💾 {t('settings.backup')}</button>
          <button className="btn-ghost text-sm" onClick={() => fileRef.current?.click()}>📂 {t('settings.restore')}</button>
          <button className="btn-ghost text-sm" onClick={() => exportX('xlsx')}>📗 {t('settings.exportXlsx')}</button>
          <button className="btn-ghost text-sm" onClick={() => exportX('csv')}>📄 {t('settings.exportCsv')}</button>
        </div>
        <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => restore(e.target.files?.[0])} />
        <button
          className="btn-danger w-full text-sm"
          onClick={async () => {
            if (!confirm(t('settings.wipeConfirm'))) return;
            await Promise.all(db.tables.map((tb) => tb.clear()));
            location.reload();
          }}
        >
          {t('settings.wipe')}
        </button>
      </Group>

      <p className="mt-6 px-2 text-center text-xs text-ink-400">{t('settings.about')}<br />{t('settings.install')}</p>
    </div>
  );
}

function RateRow({ cur }: { cur: CurrencyCode }) {
  const { t } = useTranslation();
  const { rates, settings, rateFor } = useTrip();
  const src = rateSource(cur, rates, settings);
  const override = settings.rateOverrides[cur];
  return (
    <div className="flex items-center gap-2 py-1.5">
      <span className="w-12 font-semibold">{cur}</span>
      <span className="flex-1 text-xs text-ink-500">
        <bdi dir="ltr" className="num">1₪ = {formatRate(rateFor(cur))}</bdi>{' '}
        <span className={`rounded px-1 ${src === 'manual' ? 'bg-sun-400/20' : src === 'fallback' ? 'bg-ink-200 dark:bg-ink-800' : 'bg-lake-100 dark:bg-lake-900'}`}>
          {t(`settings.${src === 'fixed' ? 'live' : src}`)}
        </span>
      </span>
      <CommitInput
        dir="ltr"
        inputMode="decimal"
        className="input !min-h-[40px] w-28 text-sm num"
        placeholder={t('settings.override')}
        value={override ? String(override) : ''}
        aria-label={`${cur} ${t('settings.override')}`}
        onCommit={(v) => {
          const n = Number(v.replace(/,/g, ''));
          const next = { ...settings.rateOverrides };
          if (n > 0) next[cur] = n;
          else delete next[cur];
          repo.updateSettings({ rateOverrides: next });
        }}
      />
    </div>
  );
}

function SubPage({ title, back, children }: { title: string; back: () => void; children: ReactNode }) {
  const { t } = useTranslation();
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <button className="btn-ghost !min-h-[40px] !px-3" onClick={back} aria-label={t('common.back')}>
          <span className="rtl:rotate-180 inline-block">‹</span>
        </button>
        <h1 className="text-lg font-bold">{title}</h1>
      </div>
      {children}
    </div>
  );
}
