import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { catName, useTrip } from '../state/TripContext';
import { CategoryIcon, EmptyState, Field, Sheet } from '../components/ui';
import { Money } from '../components/Money';
import { repo } from '../db/repo';
import { parseToMinor, minorToInput } from '../lib/money';
import { uid } from '../lib/dates';
import { valueILS } from '../lib/expense';
import type { PlannedItem } from '../db/types';
import { useSnackbar } from '../state/undo';

function Diff({ est, act }: { est: number; act: number }) {
  const d = act - est;
  if (!act) return <span className="text-xs text-ink-400">—</span>;
  return (
    <span className={`text-xs font-semibold ${d > 0 ? 'text-terra-500' : 'text-lake-600 dark:text-lake-400'}`}>
      {d > 0 ? '▲' : '▼'} <Money v={Math.abs(d)} />
    </span>
  );
}

export function Planning() {
  const { t, i18n } = useTranslation();
  const { planned, expenses, catById, ctx } = useTrip();
  const snack = useSnackbar();
  const [edit, setEdit] = useState<PlannedItem | 'new' | null>(null);
  const [linking, setLinking] = useState<PlannedItem | null>(null);
  const lang = i18n.language;
  const expById = useMemo(() => new Map(expenses.map((e) => [e.id, e])), [expenses]);
  const actualOf = (p: PlannedItem) =>
    p.linkedExpenseIds.reduce((s, id) => s + (expById.has(id) ? valueILS(expById.get(id)!, ctx.mode, ctx.meId) : 0), 0);

  const byCat = useMemo(() => {
    const m = new Map<string, { est: number; act: number }>();
    for (const p of planned) {
      const v = m.get(p.categoryId) ?? { est: 0, act: 0 };
      v.est += p.estimatedILS;
      v.act += actualOf(p);
      m.set(p.categoryId, v);
    }
    return [...m.entries()].sort((a, b) => b[1].est - a[1].est);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planned, expById, ctx]);
  const totEst = byCat.reduce((s, [, v]) => s + v.est, 0);
  const totAct = byCat.reduce((s, [, v]) => s + v.act, 0);

  return (
    <div className="space-y-3">
      <button className="btn-primary w-full" onClick={() => setEdit('new')}>＋ {t('planning.add')}</button>
      {planned.length === 0 ? (
        <EmptyState icon="📝" title={t('planning.empty')} text={t('planning.emptyHint')} />
      ) : (
        <>
          <section className="card">
            <h2 className="mb-2 text-sm font-bold">{t('planning.totals')}</h2>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div><div className="text-xs text-ink-500">{t('common.estimated')}</div><Money v={totEst} className="font-bold" /></div>
              <div><div className="text-xs text-ink-500">{t('common.actual')}</div><Money v={totAct} className="font-bold" /></div>
              <div><div className="text-xs text-ink-500">{t('common.difference')}</div><Diff est={totEst} act={totAct} /></div>
            </div>
          </section>
          <section className="card !p-0">
            {[...planned].sort((a, b) => b.estimatedILS - a.estimatedILS).map((p) => {
              const c = catById.get(p.categoryId);
              const act = actualOf(p);
              return (
                <div key={p.id} className="flex items-center gap-3 border-b border-ink-100 px-3 py-2.5 last:border-0 dark:border-ink-800">
                  <CategoryIcon icon={c?.icon ?? '?'} color={c?.color ?? '#999'} />
                  <button className="min-w-0 flex-1 text-start" onClick={() => setEdit(p)}>
                    <div className="truncate text-sm font-semibold">{p.description || catName(c, lang)}</div>
                    <div className="text-xs text-ink-500">
                      {t('common.estimated')} <Money v={p.estimatedILS} /> · {t('common.actual')} <Money v={act} />
                    </div>
                  </button>
                  <div className="flex flex-col items-end gap-1">
                    <Diff est={p.estimatedILS} act={act} />
                    <button className="chip !min-h-[32px] text-xs" onClick={() => setLinking(p)}>
                      🔗 {p.linkedExpenseIds.length || ''}
                    </button>
                  </div>
                </div>
              );
            })}
          </section>
          <section className="card">
            <h2 className="mb-2 text-sm font-bold">{t('planning.byCategory')}</h2>
            <table className="w-full text-sm">
              <thead><tr className="text-xs text-ink-500"><th /><th className="text-end">{t('common.estimated')}</th><th className="text-end">{t('common.actual')}</th><th className="text-end">{t('common.diff')}</th></tr></thead>
              <tbody>
                {byCat.map(([id, v]) => (
                  <tr key={id} className="border-t border-ink-100 dark:border-ink-800">
                    <td className="py-1.5">{catById.get(id)?.icon} {catName(catById.get(id), lang)}</td>
                    <td className="text-end"><Money v={v.est} /></td>
                    <td className="text-end"><Money v={v.act} /></td>
                    <td className="text-end"><Diff est={v.est} act={v.act} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}

      <Sheet open={!!edit} onClose={() => setEdit(null)} title={t('planning.add')}>
        {edit && (
          <PlannedForm
            initial={edit === 'new' ? undefined : edit}
            onDone={() => setEdit(null)}
            onDelete={async (p) => {
              await repo.deletePlanned(p.id);
              snack(t('common.deleted'), () => repo.savePlanned(p));
              setEdit(null);
            }}
          />
        )}
      </Sheet>
      <Sheet open={!!linking} onClose={() => setLinking(null)} title={t('planning.link')}>
        {linking && (
          <div className="divide-y divide-ink-100 dark:divide-ink-800">
            {[...expenses]
              .sort((a, b) => Number(b.categoryId === linking.categoryId) - Number(a.categoryId === linking.categoryId) || b.date.localeCompare(a.date))
              .map((e) => {
                const on = linking.linkedExpenseIds.includes(e.id);
                const c = catById.get(e.categoryId);
                return (
                  <label key={e.id} className="flex min-h-[52px] cursor-pointer items-center gap-3 py-1">
                    <input
                      type="checkbox"
                      className="h-5 w-5 accent-lake-600"
                      checked={on}
                      onChange={async () => {
                        const next = { ...linking, linkedExpenseIds: on ? linking.linkedExpenseIds.filter((x) => x !== e.id) : [...linking.linkedExpenseIds, e.id] };
                        setLinking(next);
                        await repo.savePlanned(next);
                      }}
                    />
                    <span className="text-lg">{c?.icon}</span>
                    <span className="min-w-0 flex-1 truncate text-sm">{e.description || catName(c, lang)} <span className="text-xs text-ink-500">{e.date}</span></span>
                    <Money v={valueILS(e, 'group', undefined)} className="text-sm" />
                  </label>
                );
              })}
          </div>
        )}
      </Sheet>
    </div>
  );
}

function PlannedForm({ initial, onDone, onDelete }: { initial?: PlannedItem; onDone: () => void; onDelete: (p: PlannedItem) => void }) {
  const { t, i18n } = useTranslation();
  const { trip, categories } = useTrip();
  const [description, setDescription] = useState(initial?.description ?? '');
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? 'flights');
  const [est, setEst] = useState(initial ? minorToInput(initial.estimatedILS, 'ILS') : '');
  async function save() {
    const now = Date.now();
    await repo.savePlanned({
      id: initial?.id ?? uid(), tripId: trip.id, categoryId, description: description.trim(),
      estimatedILS: parseToMinor(est, 'ILS') ?? 0, linkedExpenseIds: initial?.linkedExpenseIds ?? [],
      createdAt: initial?.createdAt ?? now, updatedAt: now,
    });
    onDone();
  }
  return (
    <div className="space-y-3">
      <Field label={t('expense.description')}>
        <input className="input" value={description} onChange={(e) => setDescription(e.target.value)} autoFocus />
      </Field>
      <Field label={t('expense.category')}>
        <select className="input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          {categories.filter((c) => !c.archived).map((c) => <option key={c.id} value={c.id}>{c.icon} {catName(c, i18n.language)}</option>)}
        </select>
      </Field>
      <Field label={t('planning.estimated')}>
        <input dir="ltr" className="input num text-xl font-bold" inputMode="decimal" value={est} onChange={(e) => setEst(e.target.value)} />
      </Field>
      <button className="btn-primary w-full" onClick={save}>{t('common.save')}</button>
      {initial && <button className="btn-danger w-full" onClick={() => onDelete(initial)}>🗑 {t('common.delete')}</button>}
    </div>
  );
}
