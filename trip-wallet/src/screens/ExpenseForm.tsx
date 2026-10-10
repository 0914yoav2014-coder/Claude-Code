import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { CountryCode, Expense, PaymentMethod, Phase, Split } from '../db/types';
import { useTrip, catName } from '../state/TripContext';
import { useConversion } from '../state/useConversion';
import { AmountInputs } from '../components/AmountInputs';
import { CategoryIcon, Field, Segmented, Toggle } from '../components/ui';
import { Money } from '../components/Money';
import { COUNTRIES, COUNTRY_BY_CODE, currenciesFor } from '../lib/currencies';
import { cardFee, formatMoney, minorToInput, parseToMinor } from '../lib/money';
import { todayISO, uid } from '../lib/dates';
import { getLastUsed, setLastUsed } from '../state/lastUsed';
import { compressImage } from '../lib/image';
import { detectLocation } from '../lib/geo';
import { repo } from '../db/repo';
import { useSnackbar } from '../state/undo';
import { customSplitDiff, sharesILS } from '../lib/expense';
import { splitEqual } from '../lib/allocation';

export function ExpenseForm({ initial, duplicate, onDone }: { initial?: Expense; duplicate?: boolean; onDone: () => void }) {
  const { t, i18n } = useTranslation();
  const { trip, me, categories, rateFor, settings } = useTrip();
  const snack = useSnackbar();
  const last = useMemo(getLastUsed, []);
  const isEdit = !!initial && !duplicate;

  const today = todayISO();
  const [date, setDate] = useState(initial && !duplicate ? initial.date : today);
  const [country, setCountry] = useState<CountryCode>(
    initial?.country ?? last.country ?? (today < trip.startDate ? 'IL' : 'AR'),
  );
  const startCurrency = initial?.currency ?? (last.country === country && last.currency ? last.currency : COUNTRY_BY_CODE[country].currency);
  const conv = useConversion({
    currency: startCurrency,
    rate: initial && !duplicate ? initial.ratePerILS : rateFor(startCurrency),
    local: initial?.amountLocal,
    ils: initial && !duplicate ? initial.amountILS : undefined,
  });
  const [categoryId, setCategoryId] = useState<string | undefined>(initial?.categoryId ?? last.categoryId);
  const [description, setDescription] = useState(initial?.description ?? '');
  const [payment, setPayment] = useState<PaymentMethod>(initial?.paymentMethod ?? last.paymentMethod ?? 'cash');
  const [paidBy, setPaidBy] = useState(initial?.paidBy ?? me.id);
  const [split, setSplit] = useState<Split>(initial?.split ?? { mode: 'equal', participants: [me.id] });
  const [customStr, setCustomStr] = useState<Record<string, string>>(() =>
    Object.fromEntries(Object.entries(initial?.split.custom ?? {}).map(([k, v]) => [k, minorToInput(v, startCurrency)])),
  );
  const [spreadDays, setSpreadDays] = useState(initial?.spreadDays ?? 1);
  const [isRefund, setIsRefund] = useState(initial?.isRefund ?? false);
  const [city, setCity] = useState(initial?.city ?? '');
  const [subcategory, setSubcategory] = useState(initial?.subcategory ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [photo, setPhoto] = useState<Blob | undefined>(initial?.receiptPhoto);
  const [phaseOverride, setPhaseOverride] = useState<Phase | undefined>(initial?.phase);
  const [more, setMore] = useState(
    !!initial && (!!initial.city || !!initial.notes || initial.spreadDays > 1 || initial.isRefund || !!initial.receiptPhoto || initial.split.participants.length > 1),
  );
  const [detecting, setDetecting] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const autoPhase: Phase = date < trip.startDate ? 'pre-trip' : 'during';
  const phase = phaseOverride ?? autoPhase;
  useEffect(() => {
    // re-derive phase automatically when the date changes (unless editing an existing record)
    if (!isEdit) setPhaseOverride(undefined);
  }, [date, isEdit]);

  const fee = payment === 'card' && !isRefund ? cardFee(conv.ilsMinor ?? 0, settings.cardFeePct) : 0;
  const total = (conv.ilsMinor ?? 0) + fee;
  const custom = Object.fromEntries(split.participants.map((p) => [p, parseToMinor(customStr[p] ?? '', conv.currency) ?? 0]));
  const customRemaining = split.mode === 'custom' ? customSplitDiff(conv.localMinor ?? 0, split.participants, custom) : 0;

  const photoUrl = useMemo(() => (photo ? URL.createObjectURL(photo) : undefined), [photo]);
  useEffect(() => () => void (photoUrl && URL.revokeObjectURL(photoUrl)), [photoUrl]);

  function chooseCountry(c: CountryCode) {
    setCountry(c);
    const cur = COUNTRY_BY_CODE[c].currency;
    if (cur !== conv.currency) conv.setCurrency(cur, rateFor(cur));
  }

  async function detect() {
    setDetecting(true);
    try {
      const r = await detectLocation();
      if (r) {
        chooseCountry(r.country);
        if (r.city) setCity(r.city);
        setMore((m) => m || !!r.city);
      } else snack(t('expense.detectFail'));
    } catch {
      snack(t('expense.detectFail'));
    } finally {
      setDetecting(false);
    }
  }

  function toggleParticipant(id: string) {
    setSplit((s) => {
      const has = s.participants.includes(id);
      const participants = has ? s.participants.filter((p) => p !== id) : [...s.participants, id];
      return { ...s, participants: participants.length ? participants : [id] };
    });
  }

  async function onPhoto(f: File | undefined) {
    if (!f) return;
    setPhoto(await compressImage(f));
  }

  async function save(andNew = false) {
    const localMinor = conv.localMinor;
    const ilsMinor = conv.ilsMinor;
    if (!localMinor || localMinor <= 0 || !ilsMinor || !categoryId) {
      setError(t('expense.required'));
      return;
    }
    if (split.mode === 'custom' && customRemaining !== 0) {
      setError(t('expense.splitRemaining', { amount: formatMoney(customRemaining, conv.currency) }));
      return;
    }
    const now = Date.now();
    const e: Expense = {
      id: isEdit ? initial!.id : uid(),
      tripId: trip.id,
      phase,
      date,
      country,
      city: city.trim() || undefined,
      categoryId,
      subcategory: subcategory.trim() || undefined,
      description: description.trim(),
      amountLocal: localMinor,
      currency: conv.currency,
      ratePerILS: conv.rateNum,
      amountILS: ilsMinor,
      usdPerILS: isEdit ? initial!.usdPerILS : rateFor('USD'),
      paymentMethod: payment,
      cardFeePct: payment === 'card' && !isRefund ? settings.cardFeePct : 0,
      cardFeeILS: fee,
      paidBy,
      split: split.mode === 'custom' ? { ...split, custom } : { mode: 'equal', participants: split.participants },
      spreadDays: Math.max(1, Math.floor(spreadDays) || 1),
      isRefund,
      receiptPhoto: photo,
      notes: notes.trim() || undefined,
      createdAt: isEdit ? initial!.createdAt : now,
      updatedAt: now,
    };
    await repo.saveExpense(e);
    setLastUsed({ country, currency: conv.currency, categoryId, paymentMethod: payment });
    snack(t('common.saved'));
    if (andNew) {
      conv.onLocal('');
      setDescription('');
      setError('');
      return;
    }
    onDone();
  }

  async function remove() {
    if (!initial) return;
    const copy = initial;
    await repo.deleteExpense(copy.id);
    snack(t('common.deleted'), () => repo.saveExpense(copy));
    onDone();
  }

  const activeCats = categories.filter((c) => !c.archived || c.id === categoryId);
  const perPerson = split.mode === 'equal' && split.participants.length > 1 ? splitEqual(total, split.participants.length)[0] : 0;
  const lang = i18n.language;

  return (
    <div className="space-y-4">
      <AmountInputs
        currency={conv.currency}
        currencies={currenciesFor(country)}
        onCurrency={(c) => conv.setCurrency(c, rateFor(c))}
        local={conv.local}
        ils={conv.ils}
        rate={conv.rate}
        onLocal={conv.onLocal}
        onIls={conv.onIls}
        onRate={conv.onRate}
        onRateReset={() => conv.onRate(String(rateFor(conv.currency)))}
        marketRate={conv.currency === 'ILS' ? undefined : rateFor(conv.currency)}
        autoFocus={!initial}
      />
      {fee > 0 && (
        <p className="text-sm text-ink-500">
          + {t('expense.cardFee', { pct: settings.cardFeePct })}: <Money v={fee} /> → <Money v={total} className="font-semibold" />
        </p>
      )}

      <div>
        <span className="label">{t('expense.category')}</span>
        <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label={t('expense.category')}>
          {activeCats.map((c) => (
            <button
              key={c.id}
              type="button"
              role="radio"
              aria-checked={categoryId === c.id}
              onClick={() => setCategoryId(c.id)}
              className={`flex min-h-[72px] flex-col items-center justify-center gap-1 rounded-2xl p-1 text-center text-[11px] leading-tight transition ${
                categoryId === c.id ? 'bg-white shadow ring-2 dark:bg-ink-800' : 'bg-white/60 ring-1 ring-ink-200 dark:bg-ink-900 dark:ring-ink-800'
              }`}
              style={categoryId === c.id ? { ['--tw-ring-color' as string]: c.color } : undefined}
            >
              <CategoryIcon icon={c.icon} color={c.color} size={34} />
              <span className="line-clamp-2">{catName(c, lang)}</span>
            </button>
          ))}
        </div>
      </div>

      <Field label={t('expense.description')}>
        <input className="input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t('common.optional')} />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label={t('expense.date')}>
          <input type="date" className="input" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
        </Field>
        <Field label={t('expense.country')}>
          <div className="flex gap-1">
            <select className="input min-w-0 flex-1 !px-2" value={country} onChange={(e) => chooseCountry(e.target.value as CountryCode)}>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {lang === 'he' ? c.nameHe : c.nameEn}
                </option>
              ))}
            </select>
            <button type="button" onClick={detect} disabled={detecting} className="btn-ghost !px-2" aria-label={t('expense.detect')} title={t('expense.detect')}>
              {detecting ? '…' : '📍'}
            </button>
          </div>
        </Field>
      </div>

      <Field label={t('expense.payment')}>
        <Segmented
          value={payment}
          onChange={setPayment}
          options={[
            { value: 'cash', label: `💵 ${t('pay.cash')}` },
            { value: 'card', label: `💳 ${t('pay.card')}` },
            { value: 'other', label: t('pay.other') },
          ]}
        />
      </Field>

      {trip.travelers.length > 1 && (
        <Field label={t('expense.paidBy')}>
          <div className="flex flex-wrap gap-1.5">
            {trip.travelers.map((p) => (
              <button key={p.id} type="button" onClick={() => setPaidBy(p.id)} className={`chip ${paidBy === p.id ? 'chip-on' : ''}`}>
                {p.name}
              </button>
            ))}
          </div>
        </Field>
      )}

      {trip.travelers.length > 1 && (
        <Field label={t('expense.splitWith')}>
          <div className="flex flex-wrap gap-1.5">
            {trip.travelers.map((p) => (
              <button
                key={p.id}
                type="button"
                aria-pressed={split.participants.includes(p.id)}
                onClick={() => toggleParticipant(p.id)}
                className={`chip ${split.participants.includes(p.id) ? 'chip-on' : ''}`}
              >
                {split.participants.includes(p.id) ? '✓ ' : ''}
                {p.name}
              </button>
            ))}
            <button
              type="button"
              className="chip"
              onClick={() => setSplit((s) => ({ ...s, participants: trip.travelers.map((x) => x.id) }))}
            >
              {t('common.all')}
            </button>
          </div>
          {split.participants.length > 1 && (
            <div className="mt-2 space-y-2">
              <Segmented
                size="sm"
                value={split.mode}
                onChange={(mode) => setSplit((s) => ({ ...s, mode }))}
                options={[
                  { value: 'equal', label: t('expense.splitEqual') },
                  { value: 'custom', label: t('expense.splitCustom') },
                ]}
              />
              {split.mode === 'equal' && total > 0 && (
                <p className="text-sm text-ink-500">{t('expense.sharePerPerson', { amount: formatMoney(perPerson, 'ILS') })}</p>
              )}
              {split.mode === 'custom' && (
                <div className="space-y-1.5">
                  {split.participants.map((p) => (
                    <label key={p} className="flex items-center gap-2">
                      <span className="w-24 truncate text-sm">{trip.travelers.find((x) => x.id === p)?.name}</span>
                      <input
                        dir="ltr"
                        className="input !min-h-[40px] flex-1 num"
                        inputMode="decimal"
                        value={customStr[p] ?? ''}
                        onChange={(e) => setCustomStr((s) => ({ ...s, [p]: e.target.value }))}
                      />
                      <span className="w-10 text-xs text-ink-400">{conv.currency}</span>
                    </label>
                  ))}
                  <p className={`text-sm ${customRemaining === 0 ? 'text-lake-600' : 'text-terra-500'}`}>
                    {customRemaining === 0
                      ? t('expense.splitOk')
                      : t('expense.splitRemaining', { amount: formatMoney(customRemaining, conv.currency) })}
                  </p>
                </div>
              )}
            </div>
          )}
        </Field>
      )}

      <button type="button" onClick={() => setMore(!more)} className="flex min-h-[44px] w-full items-center justify-between text-sm font-semibold text-lake-700 dark:text-lake-300" aria-expanded={more}>
        {t('expense.moreFields')} <span>{more ? '▴' : '▾'}</span>
      </button>

      {more && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('expense.city')}>
              <input className="input" value={city} onChange={(e) => setCity(e.target.value)} />
            </Field>
            <Field label={t('expense.subcategory')}>
              <input className="input" value={subcategory} onChange={(e) => setSubcategory(e.target.value)} />
            </Field>
          </div>
          <Field label={t('expense.spread')}>
            <div className="flex items-center gap-2">
              <button type="button" className="btn-ghost w-11 !px-0" onClick={() => setSpreadDays((d) => Math.max(1, d - 1))} aria-label="-">−</button>
              <input
                type="number"
                min={1}
                className="input w-20 text-center num"
                value={spreadDays}
                onChange={(e) => setSpreadDays(Math.max(1, Number(e.target.value) || 1))}
              />
              <button type="button" className="btn-ghost w-11 !px-0" onClick={() => setSpreadDays((d) => d + 1)} aria-label="+">+</button>
              <span className="text-sm text-ink-500">
                {t('common.days')}
                {spreadDays > 1 && total > 0 && <> · {t('expense.perDayShare', { amount: formatMoney(Math.round(total / spreadDays), 'ILS') })}</>}
              </span>
            </div>
            <p className="mt-1 text-xs text-ink-400">{t('expense.spreadHint')}</p>
          </Field>
          <Toggle checked={isRefund} onChange={setIsRefund} label={`↩️ ${t('expense.refund')}`} />
          <Field label={t('expense.phase')}>
            <Segmented
              size="sm"
              value={phase}
              onChange={setPhaseOverride}
              options={[
                { value: 'pre-trip', label: t('phase.pre-trip') },
                { value: 'during', label: t('phase.during') },
              ]}
            />
          </Field>
          <Field label={t('expense.photo')}>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onPhoto(e.target.files?.[0])} />
            {photoUrl ? (
              <div className="flex items-start gap-3">
                <img src={photoUrl} alt={t('expense.photo')} className="h-28 w-28 rounded-xl object-cover" />
                <button type="button" className="btn-danger" onClick={() => setPhoto(undefined)}>
                  {t('expense.removePhoto')}
                </button>
              </div>
            ) : (
              <button type="button" className="btn-ghost w-full" onClick={() => fileRef.current?.click()}>
                📷 {t('expense.takePhoto')}
              </button>
            )}
          </Field>
          <Field label={t('expense.notes')}>
            <textarea className="input min-h-[80px] py-2" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
        </div>
      )}

      {error && <p className="text-sm font-semibold text-terra-500" role="alert">{error}</p>}

      <div className="sticky bottom-0 -mx-4 space-y-2 bg-ink-50 px-4 pb-2 pt-2 dark:bg-ink-950">
        <button type="button" className="btn-primary w-full text-lg" onClick={() => save()}>
          {t('common.save')}
          {total > 0 && (
            <span className="opacity-80">
              · <Money v={isRefund ? -total : total} />
            </span>
          )}
        </button>
        <div className="flex gap-2">
          {!isEdit && (
            <button type="button" className="btn-ghost flex-1 text-sm" onClick={() => save(true)}>
              {t('expense.saveAndNew')}
            </button>
          )}
          {isEdit && (
            <button type="button" className="btn-danger flex-1" onClick={remove}>
              🗑 {t('common.delete')}
            </button>
          )}
        </div>
      </div>
      {isEdit && initial && initial.split.participants.length > 1 && (
        <p className="text-xs text-ink-400">
          {Object.entries(sharesILS(initial)).map(([p, s]) => `${trip.travelers.find((x) => x.id === p)?.name}: ${formatMoney(s, 'ILS')}`).join(' · ')}
        </p>
      )}
    </div>
  );
}
