import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTrip } from '../state/TripContext';
import { EmptyState, Segmented } from '../components/ui';
import { AmountPair, Money } from '../components/Money';
import { cashBalances, rateDiffPct, walletFees } from '../lib/wallet';
import { formatRate, localToILS } from '../lib/money';
import { computeBalances, minimumTransfers } from '../lib/settle';
import { useEditor } from '../state/editor';
import { repo } from '../db/repo';
import { todayISO, uid, formatDate } from '../lib/dates';
import { useSnackbar } from '../state/undo';
import { COUNTRY_BY_CODE } from '../lib/currencies';

export function WalletSplit() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<'wallet' | 'split'>(() => (sessionStorage.getItem('tw-ws') as 'split') || 'wallet');
  return (
    <div className="space-y-3">
      <Segmented
        value={tab}
        onChange={(v) => {
          setTab(v);
          sessionStorage.setItem('tw-ws', v);
        }}
        options={[
          { value: 'wallet', label: `👛 ${t('wallet.title')}` },
          { value: 'split', label: `👥 ${t('split.title')}` },
        ]}
      />
      {tab === 'wallet' ? <Wallet /> : <Split />}
    </div>
  );
}

function Wallet() {
  const { t, i18n } = useTranslation();
  const { money, expenses, rateFor } = useTrip();
  const open = useEditor();
  const balances = useMemo(() => cashBalances(money, expenses).sort((a, b) => b.balance - a.balance), [money, expenses]);
  const fees = useMemo(() => walletFees(money), [money]);
  const entries = useMemo(() => [...money].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt), [money]);
  const totalIls = balances.reduce((s, b) => s + localToILS(b.balance, b.currency, rateFor(b.currency)), 0);

  return (
    <>
      <button className="btn-primary w-full" onClick={() => open({ kind: 'money' })}>
        ＋ {t('wallet.addMoney')}
      </button>
      {money.length === 0 && balances.length === 0 ? (
        <EmptyState icon="🏧" title={t('wallet.empty')} text={t('wallet.emptyHint')} />
      ) : (
        <>
          <section className="card">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-bold">{t('wallet.cash')}</h2>
              <span className="text-sm text-ink-500">≈ <Money v={totalIls} className="font-bold text-ink-900 dark:text-ink-100" /></span>
            </div>
            <div className="divide-y divide-ink-100 dark:divide-ink-800">
              {balances.map((b) => (
                <div key={b.currency} className="flex items-center justify-between py-2">
                  <div>
                    <div className="font-bold">{b.currency}</div>
                    <div className="text-xs text-ink-500">
                      {t('wallet.added')} <Money v={b.added} cur={b.currency} /> · {t('wallet.spent')} <Money v={b.spent} cur={b.currency} />
                    </div>
                  </div>
                  <AmountPair
                    local={b.balance}
                    cur={b.currency}
                    ils={localToILS(b.balance, b.currency, rateFor(b.currency))}
                    showUsd={false}
                    className={`text-base ${b.balance < 0 ? 'text-terra-500' : ''}`}
                  />
                </div>
              ))}
            </div>
          </section>
          <section className="card">
            <h2 className="mb-2 text-sm font-bold">{t('wallet.fees')}</h2>
            <div className="flex justify-between text-sm"><span>{t('wallet.explicitFees')}</span><Money v={fees.explicit} /></div>
            <div className="flex justify-between text-sm"><span>{t('wallet.hiddenFees')}</span><Money v={fees.hidden} /></div>
            <div className="mt-1 flex justify-between border-t border-ink-100 pt-1 font-bold dark:border-ink-800"><span>{t('common.total')}</span><Money v={fees.total} /></div>
          </section>
          {entries.length > 0 && (
            <section className="card !p-0">
              <h2 className="px-4 pt-3 text-sm font-bold">{t('wallet.entries')}</h2>
              <div className="divide-y divide-ink-100 dark:divide-ink-800">
                {entries.map((m) => {
                  const diff = rateDiffPct(m.effectiveRate, m.marketRate);
                  return (
                    <button key={m.id} className="flex w-full items-center gap-3 px-4 py-2.5 text-start" onClick={() => open({ kind: 'money', entry: m })}>
                      <span className="text-2xl" aria-hidden>{m.type === 'atm' ? '🏧' : m.type === 'exchange' ? '💱' : '💵'}</span>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold">
                          <bdi dir="ltr" className="num"><Money v={m.amountILS} /> → <Money v={m.amountLocal} cur={m.currency} /></bdi>
                        </div>
                        <div className="text-xs text-ink-500">
                          {COUNTRY_BY_CODE[m.country]?.flag} {formatDate(m.date, i18n.language)} · {t(`moneyType.${m.type}`)} ·{' '}
                          <bdi dir="ltr" className="num">1₪={formatRate(m.effectiveRate)}</bdi>
                          {m.feeILS > 0 && <> · {t('money.fee')} <Money v={m.feeILS} /></>}
                        </div>
                      </div>
                      {Math.abs(diff) >= 0.1 && (
                        <span className={`num text-xs font-semibold ${diff < 0 ? 'text-terra-500' : 'text-lake-600'}`} dir="ltr">
                          {diff > 0 ? '+' : ''}{diff.toFixed(1)}%
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}
    </>
  );
}

function Split() {
  const { t, i18n } = useTranslation();
  const { trip, expenses, settlements, travelerName, me } = useTrip();
  const snack = useSnackbar();
  const balances = useMemo(() => computeBalances(trip.travelers, expenses, settlements), [trip, expenses, settlements]);
  const transfers = useMemo(() => minimumTransfers(balances), [balances]);
  const shared = expenses.some((e) => e.split.participants.length > 1 || e.paidBy !== me.id);
  const name = (id: string) => (id === me.id ? `${travelerName(id)}` : travelerName(id));
  const history = [...settlements].filter((s) => s.settled).sort((a, b) => b.createdAt - a.createdAt);

  if (!shared && settlements.length === 0) return <EmptyState icon="👥" title={t('split.empty')} text={t('split.emptyHint')} />;

  async function markPaid(from: string, to: string, amount: number) {
    const now = Date.now();
    const s = { id: uid(), tripId: trip.id, fromTravelerId: from, toTravelerId: to, amountILS: amount, date: todayISO(), settled: true, createdAt: now, updatedAt: now };
    await repo.saveSettlement(s);
    snack(t('common.saved'), () => repo.deleteSettlement(s.id));
  }

  return (
    <>
      <section className="card">
        <h2 className="mb-2 text-sm font-bold">{t('split.settleUp')}</h2>
        {transfers.length === 0 ? (
          <p className="py-3 text-center font-semibold text-lake-600">{t('split.allSettled')}</p>
        ) : (
          <div className="space-y-2">
            {transfers.map((x) => (
              <div key={`${x.from}-${x.to}`} className="flex items-center gap-2 rounded-xl bg-ink-100 p-3 dark:bg-ink-800">
                <div className="flex-1 text-sm">
                  <span className={x.from === me.id ? 'font-bold' : ''}>{name(x.from)}</span>
                  {' → '}
                  <span className={x.to === me.id ? 'font-bold' : ''}>{name(x.to)}</span>
                  <div className="text-xs text-ink-500">{t('split.owes', { from: name(x.from), to: name(x.to) })}</div>
                </div>
                <Money v={x.amount} className="text-lg font-bold" />
                <button className="btn-primary !min-h-[40px] !px-3 text-xs" onClick={() => markPaid(x.from, x.to, x.amount)}>
                  ✓ {t('split.markPaid')}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
      <section className="card">
        <h2 className="mb-2 text-sm font-bold">{t('split.balances')}</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-ink-500">
              <th className="py-1 text-start font-semibold" />
              <th className="py-1 text-end font-semibold">{t('split.paid')}</th>
              <th className="py-1 text-end font-semibold">{t('split.share')}</th>
              <th className="py-1 text-end font-semibold">{t('split.net')}</th>
            </tr>
          </thead>
          <tbody>
            {balances.map((b) => (
              <tr key={b.id} className="border-t border-ink-100 dark:border-ink-800">
                <td className="py-2 font-medium">{name(b.id)}</td>
                <td className="text-end"><Money v={b.paid} /></td>
                <td className="text-end"><Money v={b.share} /></td>
                <td className={`text-end font-bold ${b.net > 0 ? 'text-lake-600 dark:text-lake-400' : b.net < 0 ? 'text-terra-500' : ''}`}>
                  <Money v={b.net} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      {history.length > 0 && (
        <section className="card">
          <h2 className="mb-2 text-sm font-bold">{t('split.history')}</h2>
          {history.map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-2 border-t border-ink-100 py-1.5 text-sm first:border-0 dark:border-ink-800">
              <span>
                {name(s.fromTravelerId)} → {name(s.toTravelerId)} <span className="text-xs text-ink-500">{formatDate(s.date, i18n.language)}</span>
              </span>
              <span className="flex items-center gap-1">
                <Money v={s.amountILS} />
                <button
                  className="h-10 w-10 text-ink-400"
                  aria-label={t('common.delete')}
                  onClick={async () => {
                    await repo.deleteSettlement(s.id);
                    snack(t('common.deleted'), () => repo.saveSettlement(s));
                  }}
                >
                  ✕
                </button>
              </span>
            </div>
          ))}
        </section>
      )}
    </>
  );
}
