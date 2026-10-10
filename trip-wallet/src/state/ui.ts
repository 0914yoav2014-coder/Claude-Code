import { useEffect, useState } from 'react';
import { applyLang } from '../i18n';
import type { AppSettings } from '../db/types';

function prefersDark() {
  return typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches;
}

/** Apply language + theme to <html> and mirror them to localStorage for flash-free startup. */
export function useApplyUi(settings: AppSettings) {
  const [sysDark, setSysDark] = useState(prefersDark());
  useEffect(() => {
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const h = () => setSysDark(mq.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);
  useEffect(() => {
    applyLang(settings.lang);
    const dark = settings.theme === 'dark' || (settings.theme === 'system' && sysDark);
    document.documentElement.classList.toggle('dark', dark);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0d100b' : '#0e7c86');
    try {
      localStorage.setItem('tw-ui', JSON.stringify({ lang: settings.lang, theme: settings.theme }));
    } catch {
      /* ignore */
    }
  }, [settings.lang, settings.theme, sysDark]);
}

/** Hash routing: "#/expenses" etc. */
export function useHashRoute(): [string, (r: string) => void] {
  const read = () => window.location.hash.replace(/^#\/?/, '') || 'home';
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const h = () => setRoute(read());
    window.addEventListener('hashchange', h);
    return () => window.removeEventListener('hashchange', h);
  }, []);
  return [route, (r: string) => (window.location.hash = `/${r}`)];
}
