import type { Minor } from '../db/types';

export type AlertLevel = 'ok' | 'warn' | 'over';

export interface BudgetProgress {
  budget: Minor;
  used: Minor;
  left: Minor;
  pct: number;
  level: AlertLevel;
}

export function progress(used: Minor, budget: Minor): BudgetProgress {
  const pct = budget > 0 ? (used / budget) * 100 : 0;
  const level: AlertLevel = pct >= 100 ? 'over' : pct >= 80 ? 'warn' : 'ok';
  return { budget, used, left: budget - used, pct, level };
}
