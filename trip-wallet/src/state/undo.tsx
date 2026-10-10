import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface Snack {
  id: number;
  text: string;
  undo?: () => void | Promise<unknown>;
}

const Ctx = createContext<(text: string, undo?: Snack['undo']) => void>(() => {});

export const useSnackbar = () => useContext(Ctx);

export function SnackbarProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const [snack, setSnack] = useState<Snack | null>(null);
  const timer = useRef<number>();
  const show = useCallback((text: string, undo?: Snack['undo']) => {
    window.clearTimeout(timer.current);
    const s = { id: Date.now(), text, undo };
    setSnack(s);
    timer.current = window.setTimeout(() => setSnack((cur) => (cur?.id === s.id ? null : cur)), undo ? 6000 : 2500);
  }, []);
  return (
    <Ctx.Provider value={show}>
      {children}
      {snack && (
        <div className="fixed inset-x-0 z-50 flex justify-center px-4 pointer-events-none" style={{ bottom: 'calc(env(safe-area-inset-bottom) + 5.5rem)' }}>
          <div role="status" className="pointer-events-auto flex items-center gap-4 rounded-xl bg-ink-900 px-4 py-3 text-sm text-white shadow-lg dark:bg-ink-100 dark:text-ink-900">
            <span>{snack.text}</span>
            {snack.undo && (
              <button
                className="min-h-[44px] px-2 font-semibold text-lake-300 dark:text-lake-700"
                onClick={async () => {
                  await snack.undo?.();
                  setSnack(null);
                }}
              >
                {t('common.undo')}
              </button>
            )}
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}
