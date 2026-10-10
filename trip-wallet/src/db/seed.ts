import type { AppSettings, Category, Trip } from './types';
import { addDays, todayISO, uid } from '../lib/dates';
import type { TripWalletDB } from './db';

type Def = [id: string, en: string, he: string, icon: string, color: string];

/** Andean textile + mountain-lake palette. */
const DEFAULTS: Def[] = [
  ['flights', 'Flights', 'טיסות', '✈️', '#2563eb'],
  ['transport', 'Buses & Transport', 'אוטובוסים ותחבורה', '🚌', '#0e8a8f'],
  ['taxi', 'Taxis & Uber', 'מוניות ו-Uber', '🚕', '#e5a12b'],
  ['accommodation', 'Accommodation', 'לינה', '🛏️', '#7c3aed'],
  ['food', 'Food & Restaurants', 'אוכל ומסעדות', '🍽️', '#d0603a'],
  ['groceries', 'Groceries', 'סופר', '🛒', '#65a30d'],
  ['attractions', 'Attractions & Tours', 'אטרקציות וסיורים', '🎟️', '#db2777'],
  ['treks', 'Treks & National Parks', 'טרקים ופארקים לאומיים', '🥾', '#15803d'],
  ['entrance', 'Entrance Fees', 'דמי כניסה', '🏛️', '#a16207'],
  ['insurance', 'Insurance', 'ביטוח', '🛡️', '#475569'],
  ['gear', 'Gear & Equipment', 'ציוד', '🎒', '#9a3412'],
  ['sim', 'SIM & Internet', 'סים ואינטרנט', '📶', '#0891b2'],
  ['visas', 'Visas & Border Fees', 'ויזות ומעברי גבול', '🛂', '#4f46e5'],
  ['laundry', 'Laundry', 'כביסה', '🧺', '#0ea5e9'],
  ['health', 'Health & Pharmacy', 'בריאות ובית מרקחת', '💊', '#dc2626'],
  ['shopping', 'Shopping & Souvenirs', 'קניות ומזכרות', '🛍️', '#c026d3'],
  ['nightlife', 'Nightlife', 'בילויים', '🍹', '#9333ea'],
  ['tips', 'Tips', 'טיפים', '🤝', '#ca8a04'],
  ['fees', 'ATM & Bank Fees', 'עמלות בנק וכספומט', '🏧', '#64748b'],
  ['other', 'Other', 'אחר', '📦', '#78716c'],
];

export function defaultCategories(): Category[] {
  return DEFAULTS.map(([id, nameEn, nameHe, icon, color], order) => ({
    id, nameEn, nameHe, icon, color, order, isCustom: false, archived: false, updatedAt: Date.now(),
  }));
}

export function newTrip(name: string, start = todayISO()): Trip {
  const now = Date.now();
  return {
    id: uid(),
    name,
    startDate: start,
    endDate: addDays(start, 182),
    travelers: [
      { id: uid(), name: 'אני', isMe: true },
      { id: uid(), name: 'חבר/ה 1', isMe: false },
      { id: uid(), name: 'חבר/ה 2', isMe: false },
      { id: uid(), name: 'חבר/ה 3', isMe: false },
    ],
    createdAt: now,
    updatedAt: now,
  };
}

export function defaultSettings(lang: 'he' | 'en' = 'he'): AppSettings {
  return {
    id: 'app',
    lang,
    theme: 'system',
    cardFeePct: 0,
    arsMode: 'blue',
    rateOverrides: {},
    reminderEnabled: true,
    backupReminderEnabled: true,
    viewMode: 'mine',
    dismissedAlerts: [],
  };
}

/** Ensure categories + settings exist. Does not create a trip (onboarding does). */
export async function ensureSeed(db: TripWalletDB) {
  await db.transaction('rw', db.categories, db.settings, async () => {
    if ((await db.categories.count()) === 0) await db.categories.bulkAdd(defaultCategories());
    if (!(await db.settings.get('app'))) await db.settings.add(defaultSettings());
  });
}
