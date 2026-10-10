import { createContext, useContext, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { Expense, MoneyEntry } from '../db/types';
import { Segmented, Sheet } from '../components/ui';
import { ExpenseForm } from '../screens/ExpenseForm';
import { MoneyForm } from '../screens/MoneyForm';

type Target =
  | { kind: 'expense'; expense?: Expense; duplicate?: boolean }
  | { kind: 'money'; entry?: MoneyEntry }
  | null;

const Ctx = createContext<(t: Target) => void>(() => {});
export const useEditor = () => useContext(Ctx);

export function EditorProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const [target, setTarget] = useState<Target>(null);
  const [key, setKey] = useState(0);
  const open = (x: Target) => {
    setKey((k) => k + 1);
    setTarget(x);
  };
  const close = () => setTarget(null);
  const isNew = target && (target.kind === 'expense' ? !target.expense || target.duplicate : !target.entry);
  const title =
    target?.kind === 'money' ? t('money.new') : target?.kind === 'expense' && target.expense && !target.duplicate ? t('expense.editTitle') : t('expense.new');
  return (
    <Ctx.Provider value={open}>
      {children}
      <Sheet open={!!target} onClose={close} title={title}>
        {isNew && (
          <Segmented
            className="mb-4"
            value={target!.kind}
            onChange={(k) => open(k === 'money' ? { kind: 'money' } : { kind: 'expense' })}
            options={[
              { value: 'expense', label: `🧾 ${t('quick.expense')}` },
              { value: 'money', label: `💵 ${t('quick.money')}` },
            ]}
          />
        )}
        {target?.kind === 'expense' && <ExpenseForm key={key} initial={target.expense} duplicate={target.duplicate} onDone={close} />}
        {target?.kind === 'money' && <MoneyForm key={key} initial={target.entry} onDone={close} />}
      </Sheet>
    </Ctx.Provider>
  );
}
