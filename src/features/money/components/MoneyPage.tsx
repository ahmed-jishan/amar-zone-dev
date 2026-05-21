'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useMoneyStore } from '../store/moneyStore'
import { useSettingsStore } from '@/features/settings/store/settingsStore'
import { CATEGORY_META, TRANSLATIONS } from '../constants'
import { formatCurrency, getCurrentMonth, getMonthName, getWeekData, getHealthScore } from '../utils'
import type { Transaction, Loan } from '@/lib/types'
import '../money.css'
import AddGoalModal from './AddGoalModal'
import AddLoanModal from './AddLoanModal'
import AddTransactionModal from './AddTransactionModal'
import AnalyticsTab from './AnalyticsTab'
import BudgetTab from './BudgetTab'
import EditLoanModal from './EditLoanModal'
import GoalsTab from './GoalsTab'
import LoanEntryModal from './LoanEntryModal'
import LoanHistoryModal from './LoanHistoryModal'
import LoansTab from './LoansTab'
import OverviewTab from './OverviewTab'
import TransactionsTab from './TransactionsTab'

export default function MoneyPage() {
  const [tab, setTab] = useState<'overview' | 'transactions' | 'loans' | 'analytics' | 'budget' | 'goals'>('overview')
  const [showAddTxn, setShowAddTxn] = useState(false)
  const [showLoanModal, setShowLoanModal] = useState(false)
  const [showGoalModal, setShowGoalModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState<{ loan: Loan; type: 'repay' | 'add' } | null>(null)
  const [showEditModal, setShowEditModal] = useState<Loan | null>(null)
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all')
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month')

  const { language, currency_symbol } = useSettingsStore()
  const t = TRANSLATIONS[language] || TRANSLATIONS.en

  const store = useMoneyStore()
  const { transactions, loans, budgets, savingsGoals, wallets, insights } = store

  const month = getCurrentMonth()
  const summary = store.getMonthSummary(month)
  const spendingByCategory = store.getCategoryBreakdown(month)

  const activeLoans = loans.filter((l) => !l.settled)
  const completedLoans = loans.filter((l) => l.settled)
  const totalLoanGiven = activeLoans.filter((l) => l.direction === 'given').reduce((a, l) => a + l.currentBalance, 0)
  const totalLoanTaken = activeLoans.filter((l) => l.direction === 'taken').reduce((a, l) => a + l.currentBalance, 0)
  const totalBalance = wallets.reduce((a, w) => a + w.balance, 0)

  const filteredTxns = useMemo(() => {
    let result = transactions
    if (filterType !== 'all') result = result.filter((t) => t.type === filterType)
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter((t) =>
        t.note?.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.amount.toString().includes(q)
      )
    }
    return result
  }, [transactions, filterType, searchQuery])

  const monthTxns = filteredTxns.filter((t) => t.date.startsWith(month))
  const weekData = useMemo(() => getWeekData(transactions), [transactions])
  const maxWeekVal = Math.max(...weekData.map((d) => Math.max(d.income, d.expense)), 1)

  const healthScore = useMemo(() => {
    const totalSavings = savingsGoals.reduce((a, g) => a + g.currentAmount, 0)
    return getHealthScore(summary.income, summary.expense, totalSavings)
  }, [summary, savingsGoals])

  useEffect(() => { store.generateInsights() }, [])

  return (
    <div className="min-h-[100dvh] bg-[var(--mon-bg)] text-[var(--mon-text-1)]">
      <div className="max-w-[680px] mx-auto px-4 sm:px-6 pb-32">
        {/* HERO */}
        <div className="relative overflow-hidden pt-6 pb-4">
          <div className="absolute top-[-60px] right-[-40px] w-[200px] h-[200px] rounded-full opacity-20 pointer-events-none"
            style={{ background: 'radial-gradient(circle, var(--mon-gold), transparent 70%)', filter: 'blur(40px)', animation: 'mon-orb-float 8s ease-in-out infinite' }}
          />
          <div className="absolute bottom-[-40px] left-[-30px] w-[150px] h-[150px] rounded-full opacity-15 pointer-events-none"
            style={{ background: 'radial-gradient(circle, var(--mon-accent), transparent 70%)', filter: 'blur(40px)', animation: 'mon-orb-float 10s ease-in-out infinite reverse' }}
          />

          <div className="relative z-10">
            <div className="flex items-start justify-between mb-1">
              <div>
                <p className="text-[11px] font-semibold tracking-[1.5px] uppercase" style={{ color: 'var(--mon-gold)', opacity: 0.85 }}>
                  {t.totalBalance}
                </p>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-[22px] font-light" style={{ color: 'var(--mon-text-3)' }}>{currency_symbol}</span>
                  <span className="text-[42px] font-black tracking-[-2px] leading-none" style={{ color: 'var(--mon-text-1)' }}>
                    {totalBalance.toLocaleString('en-BD')}
                  </span>
                </div>
                <p className="text-[12px] mt-1" style={{ color: 'var(--mon-text-3)' }}>{getMonthName(month)}</p>
              </div>
              <button
                onClick={() => setShowAddTxn(true)}
                className="w-[46px] h-[46px] rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 active:scale-90 hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, var(--mon-gold), var(--mon-gold-2))',
                  color: '#080c14',
                  boxShadow: '0 4px 20px var(--mon-gold-glow)',
                }}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* STATS ROW */}
        <div className="flex items-center gap-0 p-3.5 rounded-[var(--mon-radius-xl)] mb-5 animate-[mon-slide-up_300ms_ease-out]"
          style={{ background: 'var(--mon-surface-1)', border: '1px solid var(--mon-border)' }}
        >
          <div className="flex items-center gap-2.5 flex-1 px-2">
            <div className="w-[30px] h-[30px] rounded-lg flex items-center justify-center" style={{ background: 'var(--mon-income-bg)', color: 'var(--mon-income)' }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path d="M7 17l9.2-9.2M17 17V7H7" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--mon-text-3)' }}>{t.income}</p>
              <p className="text-[15px] font-bold" style={{ color: 'var(--mon-text-1)' }}>{formatCurrency(summary.income, currency_symbol)}</p>
            </div>
          </div>
          <div className="w-px h-8" style={{ background: 'var(--mon-border)' }} />
          <div className="flex items-center gap-2.5 flex-1 px-2">
            <div className="w-[30px] h-[30px] rounded-lg flex items-center justify-center" style={{ background: 'var(--mon-expense-bg)', color: 'var(--mon-expense)' }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path d="M17 7l-9.2 9.2M7 7v10h10" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--mon-text-3)' }}>{t.expense}</p>
              <p className="text-[15px] font-bold" style={{ color: 'var(--mon-text-1)' }}>{formatCurrency(summary.expense, currency_symbol)}</p>
            </div>
          </div>
          <div className="w-px h-8" style={{ background: 'var(--mon-border)' }} />
          <div className="flex items-center gap-2.5 flex-1 px-2">
            <div className="w-[30px] h-[30px] rounded-lg flex items-center justify-center" style={{ background: 'var(--mon-gold-bg)', color: 'var(--mon-gold)' }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--mon-text-3)' }}>{t.balance}</p>
              <p className="text-[15px] font-bold" style={{ color: summary.balance >= 0 ? 'var(--mon-income)' : 'var(--mon-expense)' }}>
                {formatCurrency(summary.balance, currency_symbol)}
              </p>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="sticky top-0 z-20 mb-4 flex gap-0 overflow-x-auto pb-1" style={{ borderBottom: '1px solid var(--mon-border)' }}>
          {(['overview', 'transactions', 'loans', 'analytics', 'budget', 'goals'] as const).map((tabKey) => (
            <button
              key={tabKey}
              onClick={() => setTab(tabKey)}
              className={`relative px-4 py-3.5 text-[13px] font-medium whitespace-nowrap transition-colors ${
                tab === tabKey ? 'text-[var(--mon-gold)]' : 'text-[var(--mon-text-3)] hover:text-[var(--mon-text-2)]'
              }`}
            >
              {(t as any)[tabKey] || tabKey}
              {tab === tabKey && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[70%] h-[2px] rounded-full"
                  style={{ background: 'linear-gradient(90deg, var(--mon-gold), var(--mon-gold-2))' }}
                />
              )}
            </button>
          ))}
        </div>

        {/* OVERVIEW */}
        {tab === 'overview' && (
          <OverviewTab
            t={t} weekData={weekData} maxWeekVal={maxWeekVal} spendingByCategory={spendingByCategory}
            summary={summary} healthScore={healthScore} insights={insights}
            activeLoans={activeLoans} completedLoans={completedLoans}
            totalLoanGiven={totalLoanGiven} totalLoanTaken={totalLoanTaken}
            monthTxns={monthTxns} currency_symbol={currency_symbol} language={language}
            onDismissInsight={store.dismissInsight} onSetTab={setTab}
            onDeleteTxn={store.deleteTransaction}
          />
        )}

        {/* TRANSACTIONS */}
        {tab === 'transactions' && (
          <TransactionsTab
            t={t} monthTxns={monthTxns} searchQuery={searchQuery} filterType={filterType}
            currency_symbol={currency_symbol} language={language}
            onSearch={setSearchQuery} onFilter={setFilterType}
            onDelete={store.deleteTransaction}
          />
        )}

        {/* LOANS */}
        {tab === 'loans' && (
          <LoansTab
            t={t} activeLoans={activeLoans} completedLoans={completedLoans}
            currency_symbol={currency_symbol}
            onAdd={() => setShowLoanModal(true)}
            onHistory={(loan: Loan) => { setSelectedLoan(loan); setShowHistoryModal(true) }}
            onPayment={(loan: Loan) => setShowPaymentModal({ loan, type: 'repay' })}
            onAddExtra={(loan: Loan) => setShowPaymentModal({ loan, type: 'add' })}
            onEdit={(loan: Loan) => setShowEditModal(loan)}
            onDelete={store.deleteLoan}
            onSettle={store.settleLoan}
            onReactivate={store.reactivateLoan}
          />
        )}

        {/* ANALYTICS */}
        {tab === 'analytics' && (
          <AnalyticsTab transactions={transactions} currency_symbol={currency_symbol} language={language} t={t} />
        )}

        {/* BUDGET */}
        {tab === 'budget' && (
          <BudgetTab budgets={budgets} transactions={transactions} currency_symbol={currency_symbol} language={language} month={month} t={t} onSetBudget={store.setBudget} />
        )}

        {/* GOALS */}
        {tab === 'goals' && (
          <GoalsTab goals={savingsGoals} currency_symbol={currency_symbol} language={language} t={t}
            onAdd={() => setShowGoalModal(true)} onContribute={store.contributeToGoal} onDelete={store.deleteSavingsGoal} />
        )}
      </div>

      {/* MODALS */}
      {showAddTxn && <AddTransactionModal onClose={() => setShowAddTxn(false)} onAdd={store.addTransaction} translations={t} currencySymbol={currency_symbol} />}
      {showLoanModal && <AddLoanModal onClose={() => setShowLoanModal(false)} onAdd={store.addLoan} translations={t} currencySymbol={currency_symbol} />}
      {showGoalModal && <AddGoalModal onClose={() => setShowGoalModal(false)} onAdd={store.addSavingsGoal} translations={t} currencySymbol={currency_symbol} />}
      {showHistoryModal && selectedLoan && <LoanHistoryModal loan={selectedLoan} onClose={() => setShowHistoryModal(false)} translations={t} currencySymbol={currency_symbol} />}
      {showPaymentModal && <LoanEntryModal loan={showPaymentModal.loan} type={showPaymentModal.type} onClose={() => setShowPaymentModal(null)} onSubmit={store.addLoanEntry} translations={t} currencySymbol={currency_symbol} />}
      {showEditModal && <EditLoanModal loan={showEditModal} onClose={() => setShowEditModal(null)} onSave={store.updateLoan} translations={t} />}
    </div>
  )
}
