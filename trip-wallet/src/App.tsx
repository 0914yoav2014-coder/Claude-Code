import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { db } from './db/db';
import { ensureSeed } from './db/seed';
import { useActiveTrip, useSettings } from './state/data';
import { useApplyUi, useHashRoute } from './state/ui';
import { SnackbarProvider } from './state/undo';
import { TripProvider, useTrip } from './state/TripContext';
import { EditorProvider, useEditor } from './state/editor';
import { Home } from './screens/Home';
import { Expenses } from './screens/Expenses';
import { Stats } from './screens/Stats';
import { WalletSplit } from './screens/WalletSplit';
import { Settings } from './screens/Settings';
import { Onboarding } from './screens/Onboarding';
import { refreshRatesIfStale } from './state/ratesSync';
import { repo } from './db/repo';

const TABS = [
  { id: 'home', icon: '🏠', key: 'nav.home' },
  { id: 'expenses', icon: '🧾', key: 'nav.expenses' },
  { id: 'stats', icon: '📊', key: 'nav.stats' },
  { id: 'wallet', icon: '👛', key: 'nav.wallet' },
  { id: 'settings', icon: '⚙️', key: 'nav.settings' },
] as const;

export default function App() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    ensureSeed(db).then(() => setReady(true));
    refreshRatesIfStale();
    const onOnline = () => refreshRatesIfStale(true);
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, []);
  const settings = useSettings();
  useApplyUi(settings);
  const trip = useActiveTrip();
  if (!ready || trip === undefined) return <div className="min-h-dvh" />;
  return (
    <SnackbarProvider>
      {trip === null ? (
        <Onboarding />
      ) : (
        <TripProvider trip={trip}>
          <EditorProvider>
            <Shell />
          </EditorProvider>
        </TripProvider>
      )}
    </SnackbarProvider>
  );
}

function Header() {
  const { t, i18n } = useTranslation();
  const { trip } = useTrip();
  return (
    <header className="safe-top sticky top-0 z-20 bg-ink-50/90 backdrop-blur dark:bg-ink-950/90">
      <div className="mx-auto flex h-14 max-w-lg items-center justify-between gap-2 px-4">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-lake-600 dark:text-lake-400">{t('app.name')}</div>
          <div className="truncate text-base font-bold leading-tight">{trip.name}</div>
        </div>
        <button
          className="btn-ghost !min-h-[40px] !px-3 text-sm"
          onClick={() => repo.updateSettings({ lang: i18n.language === 'he' ? 'en' : 'he' })}
          aria-label={t('common.language')}
        >
          {i18n.language === 'he' ? 'EN' : 'עב'}
        </button>
      </div>
    </header>
  );
}

function Shell() {
  const { t } = useTranslation();
  const [route, go] = useHashRoute();
  const open = useEditor();
  const tab = route.split('/')[0];
  let screen;
  switch (tab) {
    case 'expenses': screen = <Expenses />; break;
    case 'stats': screen = <Stats />; break;
    case 'wallet': screen = <WalletSplit />; break;
    case 'settings': screen = <Settings sub={route.split('/')[1]} go={go} />; break;
    default: screen = <Home go={go} />;
  }
  useEffect(() => window.scrollTo(0, 0), [tab]);
  return (
    <div className="min-h-dvh">
      <Header />
      <main className="mx-auto max-w-lg px-4 pb-32 pt-2">{screen}</main>
      <button
        onClick={() => open({ kind: 'expense' })}
        aria-label={t('expense.new')}
        className="fixed end-5 z-30 flex h-16 w-16 items-center justify-center rounded-full bg-terra-500 text-4xl font-light text-white shadow-xl shadow-terra-500/30 transition active:scale-95"
        style={{ bottom: 'calc(env(safe-area-inset-bottom) + 5rem)' }}
      >
        +
      </button>
      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-20 border-t border-ink-200 bg-white/95 backdrop-blur dark:border-ink-800 dark:bg-ink-900/95">
        <div className="mx-auto flex max-w-lg">
          {TABS.map((x) => (
            <button
              key={x.id}
              onClick={() => go(x.id)}
              aria-current={tab === x.id || (x.id === 'home' && !TABS.some((y) => y.id === tab)) ? 'page' : undefined}
              className={`flex min-h-[60px] flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold ${
                tab === x.id || (x.id === 'home' && !TABS.some((y) => y.id === tab)) ? 'text-lake-600 dark:text-lake-400' : 'text-ink-500 dark:text-ink-400'
              }`}
            >
              <span className="text-xl" aria-hidden>{x.icon}</span>
              {t(x.key)}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
