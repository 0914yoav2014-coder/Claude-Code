import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ExpenseFilter } from '../lib/filters';
import { isFilterActive } from '../lib/filters';
import { catName, useTrip } from '../state/TripContext';
import { COUNTRIES } from '../lib/currencies';

const KEY = 'tw-filter';

export function useFilter(): [ExpenseFilter, (f: ExpenseFilter) => void] {
  const [f, setF] = useState<ExpenseFilter>(() => {
    try {
      return JSON.parse(sessionStorage.getItem(KEY) || '{}');
    } catch {
      return {};
    }
  });
  useEffect(() => {
    try {
      sessionStorage.setItem(KEY, JSON.stringify(f));
    } catch {
      /* ignore */
    }
  }, [f]);
  return [f, setF];
}

export function FilterBar({ value, onChange, showSearch = true }: { value: ExpenseFilter; onChange: (f: ExpenseFilter) => void; showSearch?: boolean }) {
  const { t, i18n } = useTranslation();
  const { trip, categories } = useTrip();
  const [open, setOpen] = useState(false);
  const active = isFilterActive({ ...value, search: undefined });
  const set = <K extends keyof ExpenseFilter>(k: K, v: ExpenseFilter[K] | '') => onChange({ ...value, [k]: v === '' ? undefined : v });
  const lang = i18n.language;
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {showSearch && (
          <input
            type="search"
            className="input flex-1"
            placeholder={`🔍 ${t('expenses.searchPh')}`}
            value={value.search ?? ''}
            onChange={(e) => set('search', e.target.value)}
            aria-label={t('common.search')}
          />
        )}
        <button
          className={`btn-ghost shrink-0 ${active ? '!bg-lake-600 !text-white' : ''} ${showSearch ? '' : 'w-full'}`}
          onClick={() => setOpen(!open)}
          aria-expanded={open}
        >
          ⚙︎ {t('common.filters')}
          {active ? ' •' : ''}
        </button>
      </div>
      {open && (
        <div className="card grid grid-cols-2 gap-2 !p-3">
          <label>
            <span className="label">{t('filters.from')}</span>
            <input type="date" className="input" value={value.from ?? ''} onChange={(e) => set('from', e.target.value)} />
          </label>
          <label>
            <span className="label">{t('filters.to')}</span>
            <input type="date" className="input" value={value.to ?? ''} onChange={(e) => set('to', e.target.value)} />
          </label>
          <label>
            <span className="label">{t('filters.country')}</span>
            <select className="input !px-2" value={value.country ?? ''} onChange={(e) => set('country', e.target.value as never)}>
              <option value="">{t('common.all')}</option>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>{c.flag} {lang === 'he' ? c.nameHe : c.nameEn}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="label">{t('filters.category')}</span>
            <select className="input !px-2" value={value.categoryId ?? ''} onChange={(e) => set('categoryId', e.target.value)}>
              <option value="">{t('common.all')}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.icon} {catName(c, lang)}</option>
              ))}
            </select>
          </label>
          {trip.travelers.length > 1 && (
            <label>
              <span className="label">{t('filters.person')}</span>
              <select className="input !px-2" value={value.personId ?? ''} onChange={(e) => set('personId', e.target.value)}>
                <option value="">{t('common.all')}</option>
                {trip.travelers.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </label>
          )}
          <label>
            <span className="label">{t('filters.payment')}</span>
            <select className="input !px-2" value={value.paymentMethod ?? ''} onChange={(e) => set('paymentMethod', e.target.value as never)}>
              <option value="">{t('common.all')}</option>
              <option value="cash">{t('pay.cash')}</option>
              <option value="card">{t('pay.card')}</option>
              <option value="other">{t('pay.other')}</option>
            </select>
          </label>
          <label>
            <span className="label">{t('filters.phase')}</span>
            <select className="input !px-2" value={value.phase ?? ''} onChange={(e) => set('phase', e.target.value as never)}>
              <option value="">{t('common.all')}</option>
              <option value="pre-trip">{t('phase.pre-trip')}</option>
              <option value="during">{t('phase.during')}</option>
            </select>
          </label>
          <div className="col-span-2 flex justify-end">
            <button className="btn-ghost text-sm" onClick={() => onChange({ search: value.search })}>
              {t('filters.reset')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
