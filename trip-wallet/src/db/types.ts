export type CurrencyCode = 'ILS' | 'USD' | 'ARS' | 'CLP' | 'PEN' | 'BOB' | 'BRL' | 'COP' | 'PAB' | 'CRC';
/** IL = the special "Pre-trip / Israel" option. */
export type CountryCode = 'IL' | 'AR' | 'CL' | 'PE' | 'BO' | 'BR' | 'CO' | 'EC' | 'PA' | 'CR';
export type Phase = 'pre-trip' | 'during';
export type PaymentMethod = 'cash' | 'card' | 'other';
export type MoneyEntryType = 'atm' | 'exchange' | 'other';
export type ArsMode = 'official' | 'blue' | 'mep';

/** All money amounts are integers in minor units (agorot for ILS, cents for USD, whole pesos for CLP/COP/CRC). */
export type Minor = number;

export interface Traveler {
  id: string;
  name: string;
  isMe: boolean;
}

export interface Trip {
  id: string;
  name: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;
  totalBudgetILS?: Minor;
  dailyBudgetILS?: Minor;
  budgetPerCountry?: Partial<Record<CountryCode, Minor>>;
  travelers: Traveler[];
  createdAt: number;
  updatedAt: number;
}

export interface Category {
  id: string;
  nameHe: string;
  nameEn: string;
  icon: string;
  color: string;
  isCustom: boolean;
  archived: boolean;
  order: number;
  updatedAt: number;
}

export interface Split {
  mode: 'equal' | 'custom';
  participants: string[];
  /** custom parts in the expense currency, minor units, keyed by traveler id */
  custom?: Record<string, Minor>;
}

export interface Expense {
  id: string;
  tripId: string;
  phase: Phase;
  date: string;
  country: CountryCode;
  city?: string;
  categoryId: string;
  subcategory?: string;
  description: string;
  amountLocal: Minor; // always positive
  currency: CurrencyCode;
  /** local currency units per 1 ILS, frozen at the time of the expense */
  ratePerILS: number;
  amountILS: Minor; // always positive, without card fee
  /** USD per 1 ILS at the time (for the secondary USD line) */
  usdPerILS: number;
  paymentMethod: PaymentMethod;
  cardFeePct: number;
  cardFeeILS: Minor;
  paidBy: string;
  split: Split;
  spreadDays: number;
  isRefund: boolean;
  receiptPhoto?: Blob;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface MoneyEntry {
  id: string;
  tripId: string;
  date: string;
  country: CountryCode;
  type: MoneyEntryType;
  amountILS: Minor;
  amountLocal: Minor;
  currency: CurrencyCode;
  /** local units received per 1 ILS paid (fees included) */
  effectiveRate: number;
  /** market local units per 1 ILS at the time */
  marketRate: number;
  feeILS: Minor;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface PlannedItem {
  id: string;
  tripId: string;
  categoryId: string;
  country?: CountryCode;
  description: string;
  estimatedILS: Minor;
  linkedExpenseIds: string[];
  createdAt: number;
  updatedAt: number;
}

export interface Settlement {
  id: string;
  tripId: string;
  fromTravelerId: string;
  toTravelerId: string;
  amountILS: Minor;
  date: string;
  settled: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface RatesCache {
  id: 'latest';
  /** units per 1 ILS */
  rates: Partial<Record<CurrencyCode, number>>;
  fetchedAt?: number;
  /** ARS per 1 USD */
  ars?: Partial<Record<ArsMode, number>>;
  arsFetchedAt?: number;
}

export interface AppSettings {
  id: 'app';
  activeTripId?: string;
  lang: 'he' | 'en';
  theme: 'system' | 'light' | 'dark';
  cardFeePct: number;
  arsMode: ArsMode;
  rateOverrides: Partial<Record<CurrencyCode, number>>;
  reminderEnabled: boolean;
  backupReminderEnabled: boolean;
  lastBackupAt?: number;
  viewMode: 'mine' | 'group';
  dismissedAlerts: string[];
}
