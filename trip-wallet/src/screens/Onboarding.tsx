import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { newTrip } from '../db/seed';
import { repo } from '../db/repo';
import { Field } from '../components/ui';
import { addDays, todayISO } from '../lib/dates';
import type { Trip } from '../db/types';

export function TripFields({ trip, onChange }: { trip: Trip; onChange: (t: Trip) => void }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-3">
      <Field label={t('settings.tripName')}>
        <input className="input" value={trip.name} onChange={(e) => onChange({ ...trip, name: e.target.value })} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t('settings.start')}>
          <input type="date" className="input" value={trip.startDate} onChange={(e) => e.target.value && onChange({ ...trip, startDate: e.target.value })} />
        </Field>
        <Field label={t('settings.end')}>
          <input type="date" className="input" value={trip.endDate} onChange={(e) => e.target.value && onChange({ ...trip, endDate: e.target.value })} />
        </Field>
      </div>
    </div>
  );
}

export function Onboarding() {
  const { t, i18n } = useTranslation();
  const [trip, setTrip] = useState(() => {
    const tr = newTrip(i18n.language === 'he' ? 'דרום ומרכז אמריקה' : 'South & Central America', addDays(todayISO(), 30));
    if (i18n.language !== 'he') tr.travelers = tr.travelers.map((x, i) => ({ ...x, name: x.isMe ? 'Me' : `Friend ${i}` }));
    return tr;
  });
  async function create() {
    await repo.saveTrip(trip);
    await repo.updateSettings({ activeTripId: trip.id });
  }
  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col px-4 py-8">
      <div className="flex items-center justify-between">
        <span className="text-5xl">🏔️</span>
        <button className="btn-ghost !min-h-[40px] text-sm" onClick={() => repo.updateSettings({ lang: i18n.language === 'he' ? 'en' : 'he' })}>
          {i18n.language === 'he' ? 'English' : 'עברית'}
        </button>
      </div>
      <h1 className="mt-4 text-2xl font-bold">{t('home.welcome')}</h1>
      <p className="mt-1 text-ink-500 dark:text-ink-400">{t('home.welcomeText')}</p>
      <div className="card mt-6 space-y-4">
        <TripFields trip={trip} onChange={setTrip} />
        <Field label={t('settings.travelers')}>
          <div className="space-y-2">
            {trip.travelers.map((p, i) => (
              <input
                key={p.id}
                className="input"
                value={p.name}
                aria-label={`${t('settings.travelers')} ${i + 1}`}
                onChange={(e) => setTrip({ ...trip, travelers: trip.travelers.map((x) => (x.id === p.id ? { ...x, name: e.target.value } : x)) })}
              />
            ))}
          </div>
        </Field>
      </div>
      <button className="btn-primary mt-6 w-full text-lg" onClick={create}>
        {t('home.createTrip')}
      </button>
    </div>
  );
}
