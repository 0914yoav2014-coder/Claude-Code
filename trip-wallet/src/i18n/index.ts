import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en';
import he from './he';

function initialLang(): 'he' | 'en' {
  try {
    return JSON.parse(localStorage.getItem('tw-ui') || '{}').lang === 'en' ? 'en' : 'he';
  } catch {
    return 'he';
  }
}

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, he: { translation: he } },
  lng: initialLang(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export function applyLang(lang: 'he' | 'en') {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
  if (i18n.language !== lang) i18n.changeLanguage(lang);
}

export default i18n;
