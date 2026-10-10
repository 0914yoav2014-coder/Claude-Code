import { useEffect, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { AlertLevel } from '../lib/budgets';

export function Sheet({ open, onClose, title, children, footer }: {
  open: boolean; onClose: () => void; title?: ReactNode; children: ReactNode; footer?: ReactNode;
}) {
  const { t } = useTranslation();
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', h);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative flex max-h-[94dvh] w-full max-w-lg flex-col rounded-t-3xl bg-ink-50 shadow-2xl dark:bg-ink-950">
        <div className="flex items-center justify-between gap-2 px-4 pb-2 pt-3">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} aria-label={t('common.close')} className="flex h-11 w-11 items-center justify-center rounded-full text-xl text-ink-500 hover:bg-ink-200 dark:hover:bg-ink-800">
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-4">{children}</div>
        {footer && <div className="safe-bottom border-t border-ink-200 bg-ink-50 px-4 py-3 dark:border-ink-800 dark:bg-ink-950">{footer}</div>}
      </div>
    </div>
  );
}

export function Segmented<T extends string>({ value, options, onChange, className = '', size = 'md' }: {
  value: T; options: { value: T; label: ReactNode }[]; onChange: (v: T) => void; className?: string; size?: 'sm' | 'md';
}) {
  return (
    <div className={`flex rounded-xl bg-ink-200/70 p-1 dark:bg-ink-800 ${className}`} role="radiogroup">
      {options.map((o) => (
        <button
          key={o.value}
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`flex-1 rounded-lg px-2 font-semibold transition ${size === 'sm' ? 'min-h-[36px] text-xs' : 'min-h-[40px] text-sm'} ${
            value === o.value ? 'bg-white text-ink-900 shadow-sm dark:bg-ink-600 dark:text-white' : 'text-ink-500 dark:text-ink-300'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode }) {
  return (
    <label className="flex min-h-[44px] cursor-pointer items-center justify-between gap-3">
      <span className="text-sm">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${checked ? 'bg-lake-600 dark:bg-lake-500' : 'bg-ink-300 dark:bg-ink-700'}`}
      >
        <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${checked ? 'end-0.5' : 'start-0.5'}`} />
      </button>
    </label>
  );
}

const levelColor: Record<AlertLevel, string> = { ok: 'bg-lake-500', warn: 'bg-sun-500', over: 'bg-terra-500' };

export function ProgressBar({ pct, level }: { pct: number; level: AlertLevel }) {
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-ink-200 dark:bg-ink-800" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <div className={`h-full rounded-full transition-all ${levelColor[level]}`} style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
    </div>
  );
}

export function EmptyState({ icon, title, text, action }: { icon: string; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      <div className="mb-3 text-5xl" aria-hidden>{icon}</div>
      <h3 className="text-base font-bold">{title}</h3>
      {text && <p className="mt-1 max-w-xs text-sm text-ink-500 dark:text-ink-400">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Field({ label, children, className = '' }: { label: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <span className="label">{label}</span>
      {children}
    </div>
  );
}

export function Banner({ tone = 'info', children, action, onDismiss }: {
  tone?: 'info' | 'warn' | 'over'; children: ReactNode; action?: ReactNode; onDismiss?: () => void;
}) {
  const { t } = useTranslation();
  const cls = {
    info: 'bg-lake-50 text-lake-800 ring-lake-200 dark:bg-lake-900/40 dark:text-lake-100 dark:ring-lake-800',
    warn: 'bg-sun-400/15 text-ink-800 ring-sun-400/40 dark:text-sun-400',
    over: 'bg-terra-500/10 text-terra-600 ring-terra-500/30 dark:text-terra-400',
  }[tone];
  return (
    <div className={`flex items-center gap-2 rounded-2xl px-3 py-2 text-sm ring-1 ${cls}`} role="alert">
      <div className="flex-1">{children}</div>
      {action}
      {onDismiss && (
        <button onClick={onDismiss} aria-label={t('home.dismiss')} className="flex h-11 w-9 items-center justify-center opacity-60">
          ✕
        </button>
      )}
    </div>
  );
}

export function CategoryIcon({ icon, color, size = 40 }: { icon: string; color: string; size?: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-xl"
      style={{ width: size, height: size, background: `${color}22`, fontSize: size * 0.5 }}
      aria-hidden
    >
      {icon}
    </span>
  );
}
