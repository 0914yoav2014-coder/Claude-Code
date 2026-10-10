import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { catName, useTrip } from '../state/TripContext';
import { CategoryIcon, Field, Sheet } from '../components/ui';
import { repo } from '../db/repo';
import { db } from '../db/db';
import type { Category } from '../db/types';
import { uid } from '../lib/dates';

const ICONS = ['🍽️', '🛏️', '🚌', '✈️', '🚕', '🛒', '🎟️', '🥾', '🏛️', '🎒', '📶', '🛂', '🧺', '💊', '🛍️', '🍹', '☕', '🍦', '🏄', '🚲', '⛴️', '🚂', '🏕️', '🎁', '📚', '💇', '🐎', '🦙', '🌋', '🏖️', '🎭', '📦'];
const COLORS = ['#0e8a8f', '#2563eb', '#7c3aed', '#d0603a', '#e5a12b', '#65a30d', '#db2777', '#15803d', '#a16207', '#475569', '#dc2626', '#0891b2', '#c026d3', '#78716c'];

export function CategoriesEditor() {
  const { t, i18n } = useTranslation();
  const { categories } = useTrip();
  const [edit, setEdit] = useState<Category | null>(null);
  const lang = i18n.language;
  const active = categories.filter((c) => !c.archived);
  const archived = categories.filter((c) => c.archived);
  const newCat = (): Category => ({
    id: uid(), nameHe: '', nameEn: '', icon: '📦', color: COLORS[categories.length % COLORS.length], isCustom: true, archived: false,
    order: Math.max(0, ...categories.map((c) => c.order)) + 1, updatedAt: Date.now(),
  });
  const list = (cs: Category[]) => (
    <div className="card !p-0">
      {cs.map((c) => (
        <button key={c.id} className="flex w-full items-center gap-3 border-b border-ink-100 px-3 py-2 text-start last:border-0 dark:border-ink-800" onClick={() => setEdit(c)}>
          <CategoryIcon icon={c.icon} color={c.color} size={36} />
          <span className="flex-1 text-sm font-medium">{catName(c, lang)}</span>
          <span className="h-3 w-3 rounded-full" style={{ background: c.color }} />
        </button>
      ))}
    </div>
  );
  return (
    <div className="space-y-3">
      <button className="btn-primary w-full" onClick={() => setEdit(newCat())}>＋ {t('categories.add')}</button>
      {list(active)}
      {archived.length > 0 && (
        <>
          <h2 className="section-title">{t('categories.archived')}</h2>
          {list(archived)}
        </>
      )}
      <Sheet open={!!edit} onClose={() => setEdit(null)} title={t('categories.title')}>
        {edit && <CategoryForm key={edit.id} cat={edit} onDone={() => setEdit(null)} />}
      </Sheet>
    </div>
  );
}

function CategoryForm({ cat, onDone }: { cat: Category; onDone: () => void }) {
  const { t, i18n } = useTranslation();
  const { categories } = useTrip();
  const [c, setC] = useState(cat);
  const [moveAsk, setMoveAsk] = useState<number | null>(null);
  const [moveTo, setMoveTo] = useState('other');
  const exists = categories.some((x) => x.id === cat.id);
  async function save() {
    if (!c.nameHe.trim() && !c.nameEn.trim()) return;
    await repo.saveCategory({ ...c, nameHe: c.nameHe.trim() || c.nameEn.trim(), nameEn: c.nameEn.trim() || c.nameHe.trim() });
    onDone();
  }
  async function del() {
    const n = await db.expenses.where('categoryId').equals(c.id).count();
    if (n > 0 && moveAsk === null) {
      setMoveAsk(n);
      setMoveTo(categories.find((x) => x.id !== c.id && !x.archived)?.id ?? 'other');
      return;
    }
    await repo.deleteCategory(c.id, n > 0 ? moveTo : undefined);
    onDone();
  }
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <CategoryIcon icon={c.icon} color={c.color} size={56} />
        <div className="flex-1 space-y-2">
          <input className="input" placeholder={t('categories.nameHe')} dir="rtl" value={c.nameHe} onChange={(e) => setC({ ...c, nameHe: e.target.value })} aria-label={t('categories.nameHe')} />
          <input className="input" placeholder={t('categories.nameEn')} dir="ltr" value={c.nameEn} onChange={(e) => setC({ ...c, nameEn: e.target.value })} aria-label={t('categories.nameEn')} />
        </div>
      </div>
      <Field label={t('categories.icon')}>
        <div className="flex flex-wrap gap-1">
          {ICONS.map((i) => (
            <button key={i} onClick={() => setC({ ...c, icon: i })} className={`h-11 w-11 rounded-xl text-xl ${c.icon === i ? 'bg-lake-100 ring-2 ring-lake-500 dark:bg-lake-900' : ''}`}>{i}</button>
          ))}
          <input className="input !w-20 text-center text-xl" maxLength={4} value={ICONS.includes(c.icon) ? '' : c.icon} placeholder="✍️" onChange={(e) => e.target.value && setC({ ...c, icon: e.target.value })} aria-label={t('categories.icon')} />
        </div>
      </Field>
      <Field label={t('categories.color')}>
        <div className="flex flex-wrap gap-2">
          {COLORS.map((col) => (
            <button key={col} onClick={() => setC({ ...c, color: col })} aria-label={col} className={`h-10 w-10 rounded-full ${c.color === col ? 'ring-4 ring-offset-2 ring-ink-400 dark:ring-offset-ink-950' : ''}`} style={{ background: col }} />
          ))}
        </div>
      </Field>
      <button className="btn-primary w-full" onClick={save}>{t('common.save')}</button>
      {exists && (
        <div className="grid grid-cols-2 gap-2">
          <button className="btn-ghost" onClick={async () => { await repo.saveCategory({ ...cat, archived: !cat.archived }); onDone(); }}>
            {cat.archived ? t('categories.unarchive') : `🗄 ${t('categories.archive')}`}
          </button>
          <button className="btn-danger" onClick={del}>🗑 {t('common.delete')}</button>
        </div>
      )}
      {moveAsk !== null && (
        <div className="card space-y-2">
          <p className="text-sm">{t('categories.moveTo', { count: moveAsk })}</p>
          <select className="input" value={moveTo} onChange={(e) => setMoveTo(e.target.value)}>
            {categories.filter((x) => x.id !== c.id).map((x) => <option key={x.id} value={x.id}>{x.icon} {catName(x, i18n.language)}</option>)}
          </select>
          <button className="btn-danger w-full" onClick={del}>🗑 {t('common.delete')}</button>
        </div>
      )}
    </div>
  );
}
