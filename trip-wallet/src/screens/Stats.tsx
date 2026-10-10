import { useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { catName, useTrip } from '../state/TripContext';
import { FilterBar, useFilter } from '../components/FilterBar';
import { ViewToggle } from '../components/ViewToggle';
import { CategoryIcon, EmptyState } from '../components/ui';
import { Money } from '../components/Money';
import { ExpenseRow } from '../components/ExpenseRow';
import { applyFilter } from '../lib/filters';
import {
  byCategory, byPayment, byPerson, countryStats, dailyByCategory, dailyTotals, expensesOnDay, monthlyTotals, overall,
  percentages, priceComparison, total,
} from '../lib/summaries';
import { COUNTRY_BY_CODE, countryName } from '../lib/currencies';
import { formatILS } from '../lib/money';
import { formatDate, formatMonth, todayISO } from '../lib/dates';

type Tab = 'overview' | 'daily' | 'monthly' | 'country' | 'category' | 'people';

const isDark = () => document.documentElement.classList.contains('dark');

function chartColors() {
  const d = isDark();
  return {
    bar: d ? '#24a5a8' : '#0e7c86',
    barSel: d ? '#93dada' : '#0f5f68',
    grid: d ? '#353b33' : '#e3e6df',
    axis: d ? '#8a9385' : '#646d60',
    budget: d ? '#f2b84b' : '#b45309',
    surface: d ? '#161a14' : '#ffffff',
  };
}

function ChartTooltip({ active, payload, label, fmtLabel }: { active?: boolean; payload?: { value: number }[]; label?: string; fmtLabel?: (l: string) => string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg bg-white px-2.5 py-1.5 text-xs shadow-lg ring-1 ring-ink-200 dark:bg-ink-800 dark:ring-ink-700">
      <div className="text-ink-500">{fmtLabel && label ? fmtLabel(label) : label}</div>
      <div className="num font-bold">{formatILS(Math.round(payload[0].value * 100))}</div>
    </div>
  );
}

function Section({ title, children, right }: { title: string; children: ReactNode; right?: ReactNode }) {
  return (
    <section className="card">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-sm font-bold">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}

function Row({ label, value, sub, pct, color }: { label: ReactNode; value: number; sub?: ReactNode; pct?: number; color?: string }) {
  return (
    <div className="py-1.5">
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="min-w-0 truncate">{label}</span>
        <span className="shrink-0 text-end">
          <Money v={value} className="font-semibold" />
          {pct !== undefined && <span className="ms-1.5 num text-xs text-ink-500">{pct.toFixed(1)}%</span>}
        </span>
      </div>
      {sub && <div className="text-xs text-ink-500">{sub}</div>}
      {pct !== undefined && (
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
          <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: color ?? '#0e8a8f' }} />
        </div>
      )}
    </div>
  );
}

export function Stats() {
  const { t, i18n } = useTranslation();
  const { trip, expenses, ctx, catById, travelerName } = useTrip();
  const [filter, setFilter] = useFilter();
  const [tab, setTab] = useState<Tab>('overview');
  const [day, setDay] = useState<string | undefined>();
  const lang = i18n.language;
  const today = todayISO();
  const es = useMemo(() => applyFilter(expenses, filter), [expenses, filter]);
  const c = chartColors();

  const data = useMemo(() => {
    const daily = dailyTotals(es, ctx);
    const dailyArr = [...daily.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([d, v]) => ({ d, v: v / 100 }));
    const monthly = [...monthlyTotals(es, ctx).entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([m, v]) => ({ m, v: v / 100 }));
    const cats = [...byCategory(es, ctx).entries()].filter(([, v]) => v !== 0).sort((a, b) => b[1] - a[1]);
    const catPct = percentages(cats.map(([, v]) => Math.max(0, v)));
    const countries = countryStats(trip, es, ctx, today);
    const ov = overall(trip, es, ctx, today);
    const pay = byPayment(es, ctx);
    const people = byPerson(es);
    const find = (...ids: string[]) => ids.filter((id) => catById.has(id));
    const compare = priceComparison(countries.filter((x) => x.country !== 'IL'), [
      { key: 'food', categoryIds: find('food', 'groceries') },
      { key: 'accommodation', categoryIds: find('accommodation') },
      { key: 'transport', categoryIds: find('transport', 'taxi') },
    ]);
    return { daily, dailyArr, monthly, cats, catPct, countries, ov, pay, people, compare };
  }, [es, ctx, trip, today, catById]);

  if (expenses.length === 0) return <EmptyState icon="📊" title={t('stats.empty')} text={t('stats.emptyHint')} />;

  const tabs: { value: Tab; label: string }[] = [
    { value: 'overview', label: t('stats.overall') },
    { value: 'daily', label: t('stats.daily') },
    { value: 'monthly', label: t('stats.monthly') },
    { value: 'country', label: t('stats.byCountry') },
    { value: 'category', label: t('stats.byCategory') },
    { value: 'people', label: t('stats.byPerson') },
  ];
  const short = (d: string) => formatDate(d, lang, { day: 'numeric', month: 'numeric' });
  const budget = trip.dailyBudgetILS ? trip.dailyBudgetILS / 100 : undefined;
  const pieData = data.cats.filter(([, v]) => v > 0);
  const top = pieData.slice(0, 7);
  const rest = pieData.slice(7).reduce((s, [, v]) => s + v, 0);
  const pie = [
    ...top.map(([id, v]) => ({ name: catName(catById.get(id), lang), v: v / 100, color: catById.get(id)?.color ?? '#999' })),
    ...(rest > 0 ? [{ name: t('common.more'), v: rest / 100, color: '#8a9385' }] : []),
  ];
  const selDay = day ?? (data.daily.has(today) ? today : data.dailyArr[data.dailyArr.length - 1]?.d);
  const axisProps = { tick: { fill: c.axis, fontSize: 11 }, axisLine: false, tickLine: false } as const;

  return (
    <div className="space-y-3">
      <FilterBar value={filter} onChange={setFilter} />
      <ViewToggle />
      <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 no-scrollbar">
        {tabs.map((x) => (
          <button key={x.value} onClick={() => setTab(x.value)} className={`chip shrink-0 ${tab === x.value ? 'chip-on' : ''}`}>
            {x.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <>
          <Section title={t('stats.overall')}>
            <div className="grid grid-cols-2 gap-3">
              <Big label={t('stats.grandTotal')} v={data.ov.grandTotal} />
              <Big label={t('stats.avgDay')} v={data.ov.avgPerDay} sub={`${data.ov.daysSoFar} ${t('common.days')}`} />
              <Big label={t('stats.preTrip')} v={data.ov.preTrip} />
              <Big label={t('stats.during')} v={data.ov.during} />
            </div>
            <div className="mt-3 text-sm text-ink-500">{t('common.expenses', { count: data.ov.count })}</div>
          </Section>
          <Section title={t('stats.byPayment')}>
            {(['cash', 'card', 'other'] as const).filter((p) => data.pay.get(p)).map((p) => (
              <Row key={p} label={t(`pay.${p}`)} value={data.pay.get(p) ?? 0} pct={(100 * (data.pay.get(p) ?? 0)) / (total(data.pay) || 1)} />
            ))}
          </Section>
          {data.compare.length > 0 && (
            <Section title={t('stats.compare')}>
              <p className="mb-2 text-xs text-ink-500">{t('stats.compareHint')}</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-ink-500">
                      <th className="py-1 text-start font-semibold" />
                      <th className="py-1 text-end font-semibold">🍽️ {t('stats.food')}</th>
                      <th className="py-1 text-end font-semibold">🛏️ {t('stats.accommodation')}</th>
                      <th className="py-1 text-end font-semibold">🚌 {t('stats.transport')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.compare.map((r) => (
                      <tr key={r.country} className="border-t border-ink-100 dark:border-ink-800">
                        <td className="py-1.5">{COUNTRY_BY_CODE[r.country].flag} {countryName(r.country, lang)}</td>
                        <td className="text-end"><Money v={r.values.food} /></td>
                        <td className="text-end"><Money v={r.values.accommodation} /></td>
                        <td className="text-end"><Money v={r.values.transport} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          )}
        </>
      )}

      {tab === 'daily' && (
        <>
          <Section title={t('stats.daily')} right={<span className="text-xs text-ink-500">{t('stats.selectDay')}</span>}>
            <div className="h-56" dir="ltr">
              <ResponsiveContainer>
                <BarChart data={data.dailyArr} margin={{ top: 8, right: 4, left: -12, bottom: 0 }} onClick={(s) => s?.activeLabel && setDay(String(s.activeLabel))}>
                  <CartesianGrid vertical={false} stroke={c.grid} />
                  <XAxis dataKey="d" tickFormatter={short} {...axisProps} minTickGap={16} reversed={lang === 'he'} />
                  <YAxis {...axisProps} width={48} orientation={lang === 'he' ? 'right' : 'left'} />
                  <Tooltip cursor={{ fill: c.grid, opacity: 0.5 }} content={<ChartTooltip fmtLabel={(l) => formatDate(l, lang, { weekday: 'short', day: 'numeric', month: 'short' })} />} />
                  <Bar dataKey="v" radius={[4, 4, 0, 0]} maxBarSize={22} stroke={c.surface} strokeWidth={1}>
                    {data.dailyArr.map((x) => (
                      <Cell key={x.d} fill={x.d === selDay ? c.barSel : c.bar} cursor="pointer" />
                    ))}
                  </Bar>
                  {budget && <ReferenceLine y={budget} stroke={c.budget} strokeDasharray="5 4" strokeWidth={2} label={{ value: t('stats.budgetLine'), fill: c.budget, fontSize: 11, position: 'insideTopRight' }} />}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Section>
          {selDay && <DayDetail day={selDay} es={es} />}
        </>
      )}

      {tab === 'monthly' && (
        <Section title={t('stats.monthly')}>
          <div className="h-52" dir="ltr">
            <ResponsiveContainer>
              <BarChart data={data.monthly} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={c.grid} />
                <XAxis dataKey="m" tickFormatter={(m) => formatMonth(m, lang).split(' ')[0]} {...axisProps} reversed={lang === 'he'} />
                <YAxis {...axisProps} width={52} orientation={lang === 'he' ? 'right' : 'left'} />
                <Tooltip cursor={{ fill: c.grid, opacity: 0.5 }} content={<ChartTooltip fmtLabel={(m) => formatMonth(m, lang)} />} />
                <Bar dataKey="v" fill={c.bar} radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 divide-y divide-ink-100 dark:divide-ink-800">
            {[...data.monthly].reverse().map((m) => (
              <Row key={m.m} label={formatMonth(m.m, lang)} value={Math.round(m.v * 100)} />
            ))}
          </div>
        </Section>
      )}

      {tab === 'country' && (
        <>
          <Section title={t('stats.byCountry')}>
            <div className="h-52" dir="ltr">
              <ResponsiveContainer>
                <BarChart data={data.countries.map((x) => ({ n: `${COUNTRY_BY_CODE[x.country].flag}`, name: countryName(x.country, lang), v: x.total / 100 }))} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke={c.grid} />
                  <XAxis dataKey="n" {...axisProps} tick={{ fontSize: 18 }} reversed={lang === 'he'} />
                  <YAxis {...axisProps} width={52} orientation={lang === 'he' ? 'right' : 'left'} />
                  <Tooltip cursor={{ fill: c.grid, opacity: 0.5 }} content={({ active, payload }) => (
                    <ChartTooltip active={active} payload={payload as never} label={(payload?.[0]?.payload as { name?: string })?.name} />
                  )} />
                  <Bar dataKey="v" fill={c.bar} radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Section>
          {data.countries.map((s) => (
            <Section
              key={s.country}
              title={`${COUNTRY_BY_CODE[s.country].flag} ${countryName(s.country, lang)}`}
              right={<Money v={s.total} className="font-bold" />}
            >
              {s.days > 0 && (
                <div className="mb-2 text-sm text-ink-500">
                  {t('stats.daysIn', { count: s.days })} · {t('stats.avgDay')}: <Money v={s.avgPerDay} className="font-semibold text-ink-900 dark:text-ink-100" />
                </div>
              )}
              {[...s.byCategory.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([id, v]) => {
                const cat = catById.get(id);
                return <Row key={id} label={`${cat?.icon ?? ''} ${catName(cat, lang)}`} value={v} pct={s.total ? (100 * v) / s.total : 0} color={cat?.color} />;
              })}
            </Section>
          ))}
        </>
      )}

      {tab === 'category' && (
        <Section title={t('stats.byCategory')}>
          {pie.length > 0 && (
            <div className="relative h-56" dir="ltr">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={pie} dataKey="v" nameKey="name" innerRadius="62%" outerRadius="92%" paddingAngle={1} stroke={c.surface} strokeWidth={2} isAnimationActive={false}>
                    {pie.map((p) => (
                      <Cell key={p.name} fill={p.color} />
                    ))}
                  </Pie>
                  <Tooltip content={({ active, payload }) => (
                    <ChartTooltip active={active} payload={payload as never} label={payload?.[0]?.name as string} />
                  )} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xs text-ink-500">{t('common.total')}</span>
                <Money v={total(byCategory(es, ctx))} className="text-lg font-bold" />
              </div>
            </div>
          )}
          <div className="mt-2">
            {data.cats.map(([id, v], i) => {
              const cat = catById.get(id);
              return (
                <Row
                  key={id}
                  label={<span className="inline-flex items-center gap-2"><CategoryIcon icon={cat?.icon ?? '?'} color={cat?.color ?? '#999'} size={24} />{catName(cat, lang)}</span>}
                  value={v}
                  pct={data.catPct[i]}
                  color={cat?.color}
                />
              );
            })}
          </div>
        </Section>
      )}

      {tab === 'people' && (
        <>
          <Section title={t('stats.byPerson')}>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-ink-500">
                  <th className="py-1 text-start font-semibold" />
                  <th className="py-1 text-end font-semibold">{t('stats.paid')}</th>
                  <th className="py-1 text-end font-semibold">{t('stats.share')}</th>
                </tr>
              </thead>
              <tbody>
                {trip.travelers.map((p) => {
                  const v = data.people.get(p.id) ?? { paid: 0, share: 0 };
                  return (
                    <tr key={p.id} className="border-t border-ink-100 dark:border-ink-800">
                      <td className="py-2">{travelerName(p.id)}</td>
                      <td className="text-end"><Money v={v.paid} /></td>
                      <td className="text-end"><Money v={v.share} className="font-semibold" /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Section>
          <Section title={t('stats.byPayment')}>
            {(['cash', 'card', 'other'] as const).map((p) => (
              <Row key={p} label={t(`pay.${p}`)} value={data.pay.get(p) ?? 0} pct={(100 * (data.pay.get(p) ?? 0)) / (total(data.pay) || 1)} />
            ))}
          </Section>
        </>
      )}
    </div>
  );
}

function Big({ label, v, sub }: { label: string; v: number; sub?: string }) {
  return (
    <div>
      <div className="text-xs text-ink-500">{label}</div>
      <Money v={v} className="text-xl font-bold" />
      {sub && <div className="text-xs text-ink-400">{sub}</div>}
    </div>
  );
}

function DayDetail({ day, es }: { day: string; es: ReturnType<typeof applyFilter> }) {
  const { t, i18n } = useTranslation();
  const { ctx, trip, catById } = useTrip();
  const items = expensesOnDay(es, ctx, day);
  const cats = [...dailyByCategory(es, ctx, day).entries()].sort((a, b) => b[1] - a[1]);
  const sum = items.reduce((s, x) => s + x.amount, 0);
  const budget = trip.dailyBudgetILS;
  return (
    <Section
      title={formatDate(day, i18n.language, { weekday: 'long', day: 'numeric', month: 'long' })}
      right={
        <span className="text-sm">
          <Money v={sum} className="font-bold" />
          {budget ? <span className="text-ink-500"> / <Money v={budget} /></span> : null}
        </span>
      }
    >
      {budget ? (
        <div className={`mb-2 text-sm font-semibold ${sum > budget ? 'text-terra-500' : 'text-lake-600'}`}>
          {sum > budget ? <><Money v={sum - budget} /> {t('common.over')}</> : <><Money v={budget - sum} /> {t('common.left')}</>}
        </div>
      ) : null}
      {cats.map(([id, v]) => {
        const cat = catById.get(id);
        return <Row key={id} label={`${cat?.icon ?? ''} ${catName(cat, i18n.language)}`} value={v} pct={sum ? (100 * v) / sum : 0} color={cat?.color} />;
      })}
      <div className="-mx-4 mt-2 divide-y divide-ink-100 border-t border-ink-100 dark:divide-ink-800 dark:border-ink-800">
        {items.map(({ e, amount }) => (
          <div key={e.id}>
            <ExpenseRow e={e} />
            {e.spreadDays > 1 && (
              <div className="px-4 pb-2 text-xs text-ink-500">
                ÷{e.spreadDays} → <Money v={amount} /> {t('common.perDay')}
              </div>
            )}
          </div>
        ))}
      </div>
    </Section>
  );
}

