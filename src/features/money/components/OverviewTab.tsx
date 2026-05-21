'use client'

import { CATEGORY_META } from '../constants'
import { formatCurrency } from '../utils'
import type { Transaction, Loan, FinancialInsight } from '@/lib/types'

export default function OverviewTab({
  t, weekData, maxWeekVal, spendingByCategory, summary, healthScore,
  insights, activeLoans, completedLoans, totalLoanGiven, totalLoanTaken,
  monthTxns, currency_symbol, language, onDismissInsight, onSetTab, onDeleteTxn
}: any) {
  return (
    <div className="space-y-5 animate-[mon-slide-up_400ms_ease-out]">
      {/* Weekly Chart */}
      <div className="p-4 rounded-[var(--mon-radius-xl)]" style={{ background: 'var(--mon-surface-1)', border: '1px solid var(--mon-border)' }}>
        <h3 className="text-[11px] font-semibold uppercase tracking-[1.2px] mb-4" style={{ color: 'var(--mon-text-3)' }}>{t.thisMonth}</h3>
        <div className="flex items-end justify-between gap-2 h-28">
          {weekData.map((d: any, i: number) => (
            <div key={d.day} className="flex-1 flex flex-col items-center gap-1.5">
              <div className="w-full flex flex-col gap-1 relative">
                <div className="w-full rounded-t-sm transition-all duration-700"
                  style={{ height: `${Math.max((d.income / maxWeekVal) * 100, 4)}%`, background: 'var(--mon-income)', opacity: 0.7, minHeight: d.income > 0 ? 4 : 0, animation: `mon-chart-grow 500ms ease-out ${i * 60}ms both`, transformOrigin: 'bottom' }}
                />
                <div className="w-full rounded-t-sm transition-all duration-700"
                  style={{ height: `${Math.max((d.expense / maxWeekVal) * 100, 4)}%`, background: 'var(--mon-expense)', opacity: 0.7, minHeight: d.expense > 0 ? 4 : 0, animation: `mon-chart-grow 500ms ease-out ${i * 60 + 30}ms both`, transformOrigin: 'bottom' }}
                />
              </div>
              <span className="text-[10px] font-medium" style={{ color: 'var(--mon-text-3)' }}>{d.day}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center gap-4 mt-3">
          <span className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--mon-text-3)' }}>
            <span className="w-2 h-2 rounded-full" style={{ background: 'var(--mon-income)' }} /> Income
          </span>
          <span className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--mon-text-3)' }}>
            <span className="w-2 h-2 rounded-full" style={{ background: 'var(--mon-expense)' }} /> Expense
          </span>
        </div>
      </div>

      {/* Category Breakdown */}
      {Object.keys(spendingByCategory).length > 0 && (
        <div>
          <h3 className="text-[11px] font-semibold uppercase tracking-[1.2px] mb-3" style={{ color: 'var(--mon-text-3)' }}>{t.categoryBreakdown}</h3>
          <div className="flex flex-col gap-3">
            {Object.entries(spendingByCategory).sort(([, a]: any, [, b]: any) => b - a).map(([cat, amt]: any, i: number) => {
              const m = CATEGORY_META[cat] || CATEGORY_META.other
              const pct = summary.expense > 0 ? (amt / summary.expense) * 100 : 0
              return (
                <div key={cat} className="flex items-center gap-3 animate-[mon-slide-up_400ms_ease-out]" style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ background: m.bg }}>{m.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between mb-1.5">
                      <span className="text-[13px] font-medium" style={{ color: 'var(--mon-text-2)' }}>{language === 'bn' ? m.labelBn : m.labelEn}</span>
                      <span className="text-[13px] font-bold" style={{ color: 'var(--mon-text-1)' }}>{formatCurrency(amt, currency_symbol)}</span>
                    </div>
                    <div className="h-[3px] rounded-full overflow-hidden" style={{ background: 'var(--mon-surface-3)' }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: m.color, transition: 'width 0.8s cubic-bezier(0.34,1.1,0.64,1)' }} />
                    </div>
                    <span className="text-[10px] mt-0.5 block" style={{ color: 'var(--mon-text-3)' }}>{Math.round(pct)}%</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Financial Health */}
      <div className="p-4 rounded-[var(--mon-radius-xl)]" style={{ background: 'var(--mon-surface-1)', border: '1px solid var(--mon-border)' }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[11px] font-semibold uppercase tracking-[1.2px]" style={{ color: 'var(--mon-text-3)' }}>{t.financialHealth}</h3>
          <span className="text-[20px] font-black" style={{ color: healthScore >= 70 ? 'var(--mon-income)' : healthScore >= 40 ? 'var(--mon-gold)' : 'var(--mon-expense)' }}>{healthScore}</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--mon-surface-3)' }}>
          <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${healthScore}%`, background: 'linear-gradient(90deg, var(--mon-expense), var(--mon-gold), var(--mon-income))' }} />
        </div>
        <div className="flex justify-between mt-2 text-[10px]" style={{ color: 'var(--mon-text-3)' }}><span>Needs Work</span><span>Healthy</span></div>
      </div>

      {/* Insights */}
      {insights.filter((i: FinancialInsight) => !i.read).length > 0 && (
        <div>
          <h3 className="text-[11px] font-semibold uppercase tracking-[1.2px] mb-3" style={{ color: 'var(--mon-text-3)' }}>{t.financialInsights}</h3>
          <div className="flex flex-col gap-2">
            {insights.filter((i: FinancialInsight) => !i.read).slice(0, 3).map((insight: FinancialInsight) => (
              <div key={insight.id} className="flex items-start gap-3 p-3 rounded-[var(--mon-radius-lg)]"
                style={{
                  background: insight.type === 'warning' ? 'var(--mon-expense-bg)' : insight.type === 'achievement' ? 'var(--mon-income-bg)' : 'var(--mon-gold-bg)',
                  border: `1px solid ${insight.type === 'warning' ? 'var(--mon-expense-glow)' : insight.type === 'achievement' ? 'var(--mon-income-glow)' : 'var(--mon-gold-glow)'}`,
                }}
              >
                <span className="text-lg flex-shrink-0">{insight.type === 'warning' ? '⚠️' : insight.type === 'achievement' ? '🎉' : insight.type === 'tip' ? '💡' : '📊'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold" style={{ color: 'var(--mon-text-1)' }}>{insight.title}</p>
                  <p className="text-[12px] mt-0.5" style={{ color: 'var(--mon-text-2)' }}>{insight.description}</p>
                </div>
                <button onClick={() => onDismissInsight(insight.id)} className="text-[var(--mon-text-3)] hover:text-[var(--mon-text-1)] transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loan Summary */}
      {(activeLoans.length > 0 || completedLoans.length > 0) && (
        <button onClick={() => onSetTab('loans')} className="w-full flex items-center gap-3 p-4 rounded-[var(--mon-radius-xl)] transition-all duration-200 active:scale-[0.98] hover:border-[var(--mon-border-hover)]"
          style={{ background: 'var(--mon-surface-1)', border: '1px solid var(--mon-border)' }}
        >
          <div className="flex-1 flex gap-0">
            <div className="flex-1">
              <span className="text-[11px] block mb-1" style={{ color: 'var(--mon-text-3)' }}>{t.givenRemaining}</span>
              <span className="text-[16px] font-bold" style={{ color: 'var(--mon-income)' }}>{formatCurrency(totalLoanGiven, currency_symbol)}</span>
            </div>
            <div className="w-px mx-4" style={{ background: 'var(--mon-border)' }} />
            <div className="flex-1">
              <span className="text-[11px] block mb-1" style={{ color: 'var(--mon-text-3)' }}>{t.takenRemaining}</span>
              <span className="text-[16px] font-bold" style={{ color: 'var(--mon-expense)' }}>{formatCurrency(totalLoanTaken, currency_symbol)}</span>
            </div>
          </div>
          <svg className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--mon-text-3)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M9 5l7 7-7 7" /></svg>
        </button>
      )}

      {/* Recent Transactions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[11px] font-semibold uppercase tracking-[1.2px]" style={{ color: 'var(--mon-text-3)' }}>{t.recentTransactions}</h3>
          <button onClick={() => onSetTab('transactions')} className="text-[11px] font-semibold" style={{ color: 'var(--mon-gold)' }}>{t.seeAll}</button>
        </div>
        {monthTxns.length === 0 ? (
          <EmptyState icon="📊" text={t.emptyTx} sub={t.emptySub} />
        ) : (
          <div className="flex flex-col gap-2">
            {monthTxns.slice(0, 5).map((txn: Transaction, i: number) => (
              <TransactionCard key={txn.id} txn={txn} index={i} currency_symbol={currency_symbol} language={language} onDelete={onDeleteTxn} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function EmptyState({ icon, text, sub }: { icon: string; text: string; sub: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center animate-[mon-scale-in_500ms_ease-out]">
      <div className="w-16 h-16 rounded-[var(--mon-radius-xl)] flex items-center justify-center text-2xl mb-4 animate-[mon-float_4s_ease-in-out_infinite]"
        style={{ background: 'var(--mon-surface-2)', border: '1px solid var(--mon-border)' }}>
        {icon}
      </div>
      <p className="text-[15px] font-semibold" style={{ color: 'var(--mon-text-2)' }}>{text}</p>
      <p className="text-[13px] mt-1" style={{ color: 'var(--mon-text-3)' }}>{sub}</p>
    </div>
  )
}

function TransactionCard({ txn, index, currency_symbol, language, onDelete }: any) {
  const m = CATEGORY_META[txn.category] || CATEGORY_META.other
  const isIncome = txn.type === 'income'
  return (
    <div className="flex items-center gap-3 p-3 rounded-[var(--mon-radius-lg)] transition-all duration-200 hover:border-[var(--mon-border-hover)] group"
      style={{ background: 'var(--mon-surface-1)', border: '1px solid var(--mon-border)', animation: `mon-slide-up 350ms ease-out ${index * 40}ms both` }}
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ background: m.bg }}>{m.icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold truncate" style={{ color: 'var(--mon-text-1)' }}>{txn.note || (language === 'bn' ? m.labelBn : m.labelEn)}</p>
        <p className="text-[11px]" style={{ color: 'var(--mon-text-3)' }}>{txn.date} · {language === 'bn' ? m.labelBn : m.labelEn}</p>
      </div>
      <div className="text-right">
        <p className={`text-[15px] font-bold ${isIncome ? '' : ''}`} style={{ color: isIncome ? 'var(--mon-income)' : 'var(--mon-expense)' }}>
          {isIncome ? '+' : '-'}{formatCurrency(txn.amount, currency_symbol)}
        </p>
      </div>
      <button onClick={() => onDelete(txn.id)} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-[var(--mon-text-3)] hover:text-[var(--mon-expense)] hover:bg-[var(--mon-expense-bg)] transition-all">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
      </button>
    </div>
  )
}
