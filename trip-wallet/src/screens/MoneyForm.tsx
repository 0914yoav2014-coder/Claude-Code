import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { CountryCode, CurrencyCode, MoneyEntry, MoneyEntryType } from '../db/types';
import { useTrip } from '../state/TripContext';
import { Field, Segmented } from '../components/ui';
import { Money } from '../components/Money';
import { COUNTRIES, COUNTRY_BY_CODE, currenciesFor, SYMBOL } from '../lib/currencies';
import { formatRate, ilsToLocal, impliedRate, localToILS, minorToInput, parseToMinor } from '../lib/money';
import { todayISO, uid } from '../lib/dates';
import { getLastUsed } from '../state/lastUsed';
import { repo } from '../db/repo';
import { useSnackbar } from '../state/undo';
import { rateDiffPct } from '../lib/wallet';

/**
 * Add money to the cash wallet. Side by side: "I paid ₪" → "I received <local>".
 * Fill either side (the other is estimated at the market rate) or both to get the real rate.
 */
export function MoneyForm({ initial, onDone }: { initial?: MoneyEntry; onDone: () => void }) {
  const { t, i18n } = useTranslation();
  const { trip, rateFor } = useTrip();
  const snack = useSnackbar();
  const last = useMemo(getLastUsed, []);
  const [type, setType] = useState<MoneyEntryType>(initial?.type ?? 'atm');
  const [date, setDate] = useState(initial?.date ?? todayISO());
  const [country, setCountry] = useState<CountryCode>(initial?.country ?? (last.country && last.country !== 'IL' ? last.country : 'AR'));
  const [currency, setCurrency] = useState<CurrencyCode>(initial?.currency ?? COUNTRY_BY_CODE[country].currency);
  const [ils, setIls] = useState(initial?.amountILS ? minorToInput(initial.amountILS, 'ILS') : '');
  const [local, setLocal] = useState(initial?.amountLocal ? minorToInput(initial.amountLocal, initial.currency) : '');
  const [fee, setFee] = useState(initial?.feeILS ? minorToInput(initial.feeILS, 'ILS') : '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [error, setError] = useState('');

  const market = initial?.marketRate ?? rateFor(currency);
  const ilsM = parseToMinor(ils, 'ILS');
  const localM = parseToMinor(local, currency);
  const both = !!ilsM && !!localM;
  const effective = both ? impliedRate(localM!, currency, ilsM!) : market;
  const diff = both ? rateDiffPct(effective, market) : 0;
  const estLocal = !localM && ilsM ? ilsToLocal(ilsM, currency, market) : undefined;
  const estIls = !ilsM && localM ? localToILS(localM, currency, market) : undefined;

  async function save() {
    const amountILS = ilsM || estIls || 0;
    const amountLocal = localM || estLocal || 0;
    if (!amountILS || !amountLocal) {
      setError(t('expense.required'));
      return;
    }
    const now = Date.now();
    await repo.saveMoney({
      id: initial?.id ?? uid(),
      tripId: trip.id,
      date,
      country,
      type,
      amountILS,
      amountLocal,
      currency,
      effectiveRate: impliedRate(amountLocal, currency, amountILS),
      marketRate: market,
      feeILS: parseToMinor(fee, 'ILS') ?? 0,
      notes: notes.trim() || undefined,
      createdAt: initial?.createdAt ?? now,
      updatedAt: now,
    });
    snack(t('common.saved'));
    onDone();
  }

  async function remove() {
    if (!initial) return;
    await repo.deleteMoney(initial.id);
    snack(t('common.deleted'), () => repo.saveMoney(initial));
    onDone();
  }

  const lang = i18n.language;
  const curOptions = currenciesFor(country).filter((c) => c !== 'ILS');

  return (
    <div className="space-y-4">
      <Segmented
        value={type}
        onChange={setType}
        options={[
          { value: 'atm', label: `🏧 ${t('moneyType.atm')}` },
          { value: 'exchange', label: `💱 ${t('moneyType.exchange')}` },
          { value: 'other', label: t('moneyType.other') },
        ]}
        size="sm"
      />
      <p className="text-xs text-ink-500">{t('money.hint')}</p>
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
        {curOptions.map((c) => (
          <button key={c} type="button" onClick={() => setCurrency(c)} className={`chip shrink-0 ${currency === c ? 'chip-on' : ''}`}>
            {SYMBOL[c] ? `${SYMBOL[c]} ${c}` : c}
          </button>
        ))}
      </div>
      <div dir="ltr" className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
        <label className="block">
          <span className="label" dir="auto">{t('money.paid')} ₪</span>
          <input className="input text-xl font-bold num" inputMode="decimal" placeholder={estIls ? minorToInput(estIls, 'ILS') : '0'} value={ils} onChange={(e) => setIls(e.target.value)} aria-label={`${t('money.paid')} ILS`} />
        </label>
        <span className="pb-3 text-xl text-ink-400">→</span>
        <label className="block">
          <span className="label" dir="auto">{t('money.received')} {currency}</span>
          <input className="input text-xl font-bold num" inputMode="decimal" placeholder={estLocal ? minorToInput(estLocal, currency) : '0'} value={local} onChange={(e) => setLocal(e.target.value)} aria-label={`${t('money.received')} ${currency}`} />
        </label>
      </div>
      <div className="card !p-3 text-sm">
        <div className="flex justify-between">
          <span>{t('money.market')}</span>
          <bdi dir="ltr" className="num">1 ₪ = {formatRate(market)} {currency}</bdi>
        </div>
        {both && (
          <>
            <div className="mt-1 flex justify-between font-semibold">
              <span>{t('money.effective')}</span>
              <bdi dir="ltr" className="num">1 ₪ = {formatRate(effective)} {currency}</bdi>
            </div>
            <div className={`mt-1 text-end text-xs font-semibold ${diff < 0 ? 'text-terra-500' : 'text-lake-600'}`}>
              <bdi dir="ltr">{t('money.vsMarket', { pct: (diff > 0 ? '+' : '') + diff.toFixed(1) })}</bdi>
              {diff < 0 && (
                <span className="ms-2">
                  (<Money v={ilsM! - localToILS(localM!, currency, market)} />)
                </span>
              )}
            </div>
          </>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t('expense.date')}>
          <input type="date" className="input" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
        </Field>
        <Field label={t('expense.country')}>
          <select
            className="input !px-2"
            value={country}
            onChange={(e) => {
              const c = e.target.value as CountryCode;
              setCountry(c);
              setCurrency(COUNTRY_BY_CODE[c].currency === 'ILS' ? 'USD' : COUNTRY_BY_CODE[c].currency);
            }}
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {lang === 'he' ? c.nameHe : c.nameEn}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label={t('money.fee')}>
        <input dir="ltr" className="input num" inputMode="decimal" value={fee} onChange={(e) => setFee(e.target.value)} placeholder="0" />
      </Field>
      <Field label={t('common.notes')}>
        <input className="input" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>
      {error && <p className="text-sm font-semibold text-terra-500">{error}</p>}
      <div className="sticky bottom-0 -mx-4 space-y-2 bg-ink-50 px-4 py-2 dark:bg-ink-950">
        <button className="btn-primary w-full text-lg" onClick={save}>
          {t('common.save')}
        </button>
        {initial && (
          <button className="btn-danger w-full" onClick={remove}>
            🗑 {t('common.delete')}
          </button>
        )}
      </div>
    </div>
  );
}
