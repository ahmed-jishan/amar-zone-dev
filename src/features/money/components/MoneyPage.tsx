'use client'

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { ArrowDownLeft, ArrowUpRight, Eye, EyeOff, TrendingDown, TrendingUp, Wallet, Plus, X, Check } from 'lucide-react'
import { useMoneyStore } from '../store/moneyStore'
import { repairPersistedMoneyConsistency } from '@/lib/backup/money-consistency'
import { useTaskStore } from '@/lib/store/taskStore'
import { useSettingsStore } from '@/features/settings/store/settingsStore'
import { CATEGORY_META, TRANSLATIONS } from '../constants'
import { formatCurrency, getCurrentMonth, getMonthName, getWeekData, getHealthScore, todayISO } from '../utils'
import type { Transaction, Loan } from '@/lib/types'
import { useMoneyHaptics } from '../hooks/useMoneyHaptics'
import { useAnimatedNumber } from '../hooks/useAnimatedNumber'
import { useSwipeNavigation } from '@/features/namaz/hooks/useSwipeNavigation'
import '../money.css'

// Premium components
const WealthHub = dynamic(() => import('./premium/WealthHub'), { ssr: false })
const ActivityFeed = dynamic(() => import('./premium/ActivityFeed'), { ssr: false })
const SmartMorningDashboard = dynamic(() => import('./premium/SmartMorningDashboard'), { ssr: false })

// Existing components
import AddGoalModal from './AddGoalModal'
import AddLoanModal from './AddLoanModal'
import AddSubscriptionModal from './AddSubscriptionModal'
import AddTransactionModal from './AddTransactionModal'
const AnalyticsTab = dynamic(() => import('./AnalyticsTab'), { ssr: false })
const NetWorthSparkline = dynamic(() => import('./premium/NetWorthSparkline'), { ssr: false })
const SmartInsights = dynamic(() => import('./premium/SmartInsights'), { ssr: false })
const GoalRing = dynamic(() => import('./premium/GoalRing'), { ssr: false })
import TransactionFilterBar from './TransactionFilterBar'
import type { FilterState } from './TransactionFilterBar'
import BudgetTab from './BudgetTab'
const BudgetCoach = dynamic(() => import('./BudgetCoach'), { ssr: false })
const CashflowForecast = dynamic(() => import('./CashflowForecast'), { ssr: false })
import EditLoanModal from './EditLoanModal'
import GoalsTab from './GoalsTab'
import LoanEntryModal from './LoanEntryModal'
import LoanHistoryModal from './LoanHistoryModal'
import LoansTab from './LoansTab'
import OverviewTab from './OverviewTab'
import SubscriptionsPanel from './SubscriptionsPanel'
import TransactionsTab from './TransactionsTab'
import UpcomingMoneyTimeline from './UpcomingMoneyTimeline'
import WalletStrip from './WalletStrip'
import WalletToolsModal from './WalletToolsModal'
import SpendingPulse from './SpendingPulse'
import QuickTransactionWidget from './QuickTransactionWidget'
import CategoryLimits from './CategoryLimits'
import RecurringManager from './RecurringManager'
import NetWorthCard from './NetWorthCard'
import MoneySkeleton from './SkeletonLoader'
import type { MoneyTabKey } from './premium/types'

type TabKey = MoneyTabKey

const TAB_KEYS: TabKey[] = ['overview', 'transactions', 'budget', 'bills', 'goals', 'loans', 'analytics']

// ─── Success Burst Component ───
function SuccessBurst({ visible, onComplete }: { visible: boolean; onComplete: () => void }) {
  useEffect(() => {
    if (!visible) return
    const timer = setTimeout(onComplete, 700)
    return () => clearTimeout(timer)
  }, [visible, onComplete])

  if (!visible) return null

  const particles = Array.from({ length: 8 }, (_, i) => {
    const angle = (i / 8) * Math.PI * 2
    const dist = 40 + Math.random() * 30
    return {
      id: i,
      dx: Math.cos(angle) * dist,
      dy: Math.sin(angle) * dist,
      color: ['#c9a84c', '#22c55e', '#6366f1', '#f59e0b', '#ef4444', '#14b8a6'][i % 6],
    }
  })

  return (
    <div className="mon-success-burst" aria-hidden>
      {particles.map((p) => (
        <div
          key={p.id}
          className="mon-success-burst-particle"
          style={{
            background: p.color,
            '--dx': `${p.dx}px`,
            '--dy': `${p.dy}px`,
          } as React.CSSProperties}
        />
      ))}
      <div className="mon-success-check">
        <Check size={22} strokeWidth={3} />
      </div>
    </div>
  )
}

// ─── Snackbar Toast ───
interface SnackbarState {
  message: string
  actionLabel?: string
  onAction?: () => void
  visible: boolean
  exiting: boolean
}

function Snackbar({
  snackbar,
  onDismiss,
}: {
  snackbar: SnackbarState
  onDismiss: () => void
}) {
  useEffect(() => {
    if (!snackbar.visible) return
    const timer = setTimeout(onDismiss, 4000)
    return () => clearTimeout(timer)
  }, [snackbar.visible, onDismiss])

  if (!snackbar.visible) return null

  return (
    <div className={`mon-snackbar ${snackbar.exiting ? 'exiting' : ''}`}>
      <span className="mon-snackbar-text">{snackbar.message}</span>
      {snackbar.actionLabel && (
        <button
          className="mon-snackbar-action"
          onClick={() => {
            snackbar.onAction?.()
            onDismiss()
          }}
        >
          {snackbar.actionLabel}
        </button>
      )}
      <button className="mon-snackbar-dismiss" onClick={onDismiss} aria-label="Dismiss">
        <X size={14} />
      </button>
    </div>
  )
}

export default function MoneyPage() {
  const [tab, setTab] = useState<TabKey>('overview')
  const [showAddTxn, setShowAddTxn] = useState(false)
  const [addTxnType, setAddTxnType] = useState<'income' | 'expense'>('expense')
  const [editingTxn, setEditingTxn] = useState<Transaction | null>(null)
  const [showLoanModal, setShowLoanModal] = useState(false)
  const [showGoalModal, setShowGoalModal] = useState(false)
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)
  const [subscriptionModalAnchor, setSubscriptionModalAnchor] = useState<DOMRect | null>(null)
  const [showWalletTools, setShowWalletTools] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState<{ loan: Loan; type: 'repay' | 'add' } | null>(null)
  const [showEditModal, setShowEditModal] = useState<Loan | null>(null)
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all')
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month')
  const [balanceVisible, setBalanceVisible] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [pillScrolled, setPillScrolled] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [snackbar, setSnackbar] = useState<SnackbarState>({ message: '', visible: false, exiting: false })

  // Advanced filter state for TransactionFilterBar
  const [filterState, setFilterState] = useState<FilterState>({
    query: '',
    type: 'all',
    categories: [],
    walletId: null,
    dateFrom: '',
    dateTo: '',
    minAmount: '',
    maxAmount: '',
  })

  const resetFilter = useCallback(() => {
    setFilterState({ query: '', type: 'all', categories: [], walletId: null, dateFrom: '', dateTo: '', minAmount: '', maxAmount: '' })
    setSearchQuery('')
    setFilterType('all')
  }, [])

  // Sync searchQuery/filterType with filterState for backward compat
  const handleFilterChange = useCallback((f: FilterState) => {
    setFilterState(f)
    setSearchQuery(f.query)
    setFilterType(f.type)
  }, [])

  const { language, currency_symbol } = useSettingsStore()
  const router = useRouter()
  const t = TRANSLATIONS[language] || TRANSLATIONS.en
  const haptics = useMoneyHaptics()

  const store = useMoneyStore()
  const addTask = useTaskStore((s) => s.addTask)
  const tasks = useTaskStore((s) => s.tasks)
  const { transactions, loans, budgets, savingsGoals, wallets, insights } = store

  const month = getCurrentMonth()
  const summary = store.getMonthSummary(month)
  const spendingByCategory = store.getCategoryBreakdown(month)
  const currentBudget = store.getBudgetForMonth(month)

  const activeLoans = loans.filter((l) => !l.settled)
  const completedLoans = loans.filter((l) => l.settled)
  const totalLoanGiven = activeLoans.filter((l) => l.direction === 'given').reduce((a, l) => a + l.currentBalance, 0)
  const totalLoanTaken = activeLoans.filter((l) => l.direction === 'taken').reduce((a, l) => a + l.currentBalance, 0)
  const totalBalance = wallets.reduce((a, w) => a + w.balance, 0)

  // Net worth calculation
  const netWorth = useMemo(() => {
    const totalSavings = savingsGoals.reduce((a, g) => a + g.currentAmount, 0)
    const totalAssets = store.assets.reduce((a: number, as: any) => a + as.value, 0)
    const totalLoansNet = activeLoans.reduce((a, l) => a + (l.direction === 'given' ? l.currentBalance : -l.currentBalance), 0)
    return totalBalance + totalSavings + totalAssets + totalLoansNet
  }, [totalBalance, savingsGoals, activeLoans, store.assets])

  // Animated balance
  const animatedBalance = useAnimatedNumber(totalBalance, 600)

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

  // Budget alert data for ActivityFeed
  const currentBudgetAlert = useMemo(() => {
    if (!currentBudget) return null
    // Get the first budget entry from the monthly budget
    const budgetEntries = Object.entries(currentBudget.budgets || {}) as [string, number][]
    if (budgetEntries.length === 0) return null
    const [cat, limit] = budgetEntries[0]
    const spent = (spendingByCategory as Record<string, number>)[cat] || 0
    return { category: cat, limit, spent }
  }, [currentBudget, spendingByCategory])

  // Content scroll ref for pill bar
  const contentRef = useRef<HTMLDivElement>(null)

  // Swipe navigation between tabs
  const tabIndex = TAB_KEYS.indexOf(tab)
  const { swipeHandlers } = useSwipeNavigation({
    onSwipeLeft: () => {
      if (tabIndex < TAB_KEYS.length - 1) {
        haptics.tabChange()
        setTab(TAB_KEYS[tabIndex + 1])
      }
    },
    onSwipeRight: () => {
      if (tabIndex > 0) {
        haptics.tabChange()
        setTab(TAB_KEYS[tabIndex - 1])
      }
    },
    threshold: 50,
  })

  // Snackbar helpers
  const showSnackbar = useCallback((message: string, actionLabel?: string, onAction?: () => void) => {
    setSnackbar({ message, actionLabel, onAction, visible: true, exiting: false })
  }, [])

  const dismissSnackbar = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, exiting: true }))
    setTimeout(() => setSnackbar({ message: '', visible: false, exiting: false }), 220)
  }, [])

  // Success animation
  const triggerSuccess = useCallback(() => {
    setShowSuccess(true)
    haptics.success()
  }, [haptics])

  // Tab change handler with haptics
  const handleTabChange = useCallback((newTab: TabKey) => {
    haptics.tabChange()
    setTab(newTab)
  }, [haptics])

  useEffect(() => {
    if (repairPersistedMoneyConsistency()) {
      void useMoneyStore.persist.rehydrate()
    }
  }, [])

  useEffect(() => {
    setMounted(true)
    store.generateInsights()
    store.processRecurringTemplates()
  }, [])

  const createSubscriptionTask = useCallback((subscription: typeof store.subscriptions[number]) => {
    addTask({
      title: `Pay ${subscription.name}`,
      description: `${subscription.billingCycle} bill · ${formatCurrency(subscription.amount, currency_symbol)}`,
      priority: 'high',
      category: 'finance',
      status: subscription.nextBillingDate <= todayISO() ? 'today' : 'upcoming',
      completed: false,
      recurring: 'none',
      dueDate: subscription.nextBillingDate,
      timeEstimate: 10,
      tags: ['money', 'bill'],
    })
    triggerSuccess()
    showSnackbar(`Task created for ${subscription.name}`)
  }, [addTask, currency_symbol, triggerSuccess, showSnackbar])

  const createGoalTask = useCallback((goalTitle: string, dueDate?: string) => {
    addTask({
      title: `Save for ${goalTitle}`,
      description: 'Savings goal from Money tab',
      priority: 'medium',
      category: 'finance',
      status: dueDate && dueDate <= todayISO() ? 'today' : 'upcoming',
      completed: false,
      recurring: 'none',
      dueDate,
      timeEstimate: 15,
      tags: ['money', 'goal'],
    })
    triggerSuccess()
    showSnackbar(`Task created for ${goalTitle}`)
  }, [addTask, triggerSuccess, showSnackbar])

  const createBudgetTask = useCallback((title: string, dueDate?: string) => {
    addTask({
      title,
      description: 'Budget coaching task from Money tab',
      priority: 'medium',
      category: 'finance',
      status: 'today',
      completed: false,
      recurring: 'none',
      dueDate: dueDate || todayISO(),
      timeEstimate: 15,
      tags: ['money', 'budget'],
    })
    triggerSuccess()
    showSnackbar('Budget review task created')
  }, [addTask, triggerSuccess, showSnackbar])

  // FAB contextual actions
  const fabActions = useMemo(() => {
    const base = [
      { icon: ArrowDownLeft, label: 'Expense', color: 'var(--mon-expense)', onClick: () => { setAddTxnType('expense'); setShowAddTxn(true) } },
      { icon: ArrowUpRight, label: 'Income', color: 'var(--mon-income)', onClick: () => { setAddTxnType('income'); setShowAddTxn(true) } },
    ]
    if (tab === 'budget') {
      base.push({ icon: Wallet, label: 'Set Budget', color: 'var(--mon-gold)', onClick: () => document.querySelector('[data-budget-edit]')?.dispatchEvent(new MouseEvent('click', { bubbles: true })) })
    } else if (tab === 'goals') {
      base.push({ icon: Wallet, label: 'Add Goal', color: 'var(--mon-gold)', onClick: () => setShowGoalModal(true) })
    } else if (tab === 'loans') {
      base.push({ icon: Wallet, label: 'Add Loan', color: 'var(--mon-gold)', onClick: () => setShowLoanModal(true) })
    } else if (tab === 'bills') {
      base.push({ icon: Wallet, label: 'Add Bill', color: 'var(--mon-gold)', onClick: () => setShowSubscriptionModal(true) })
    } else {
      base.push({ icon: Wallet, label: 'Wallets', color: 'var(--mon-gold)', onClick: () => setShowWalletTools(true) })
    }
    return base
  }, [tab])

  // Transaction add wrapper with success burst
  const handleAddTransaction = useCallback((txn: Omit<Transaction, 'id' | 'createdAt' | 'status'>) => {
    store.addTransaction(txn)
    triggerSuccess()
    showSnackbar(txn.type === 'income' ? 'Income added' : 'Expense added')
  }, [store, triggerSuccess, showSnackbar])

  // Transaction delete with undo snackbar
  const handleDeleteTransaction = useCallback((id: string) => {
    const txn = transactions.find((t) => t.id === id)
    if (!txn) return
    store.deleteTransaction(id)
    haptics.deleteAction()
    showSnackbar(
      `${txn.type === 'income' ? 'Income' : 'Expense'} deleted`,
      'Undo',
      () => store.undo()
    )
  }, [transactions, store, haptics, showSnackbar])

  if (!mounted) return <MoneySkeleton />

  return (
    <div
      className="mon-root min-h-[100dvh] bg-[var(--mon-bg)] text-[var(--mon-text-1)]"
      {...swipeHandlers}
    >
      {/* Success Burst */}
      <SuccessBurst visible={showSuccess} onComplete={() => setShowSuccess(false)} />

      {/* Snackbar */}
      <Snackbar snackbar={snackbar} onDismiss={dismissSnackbar} />

      <div className="max-w-[680px] mx-auto px-4 sm:px-6 pb-32" ref={contentRef}>
        {/* ── PREMIUM: Wealth Hub (replaces Hero + Stats + Net Worth + Wallets) ── */}
        <div className="pt-5 pb-4 mon-animate-spring-in">
          <WealthHub
            totalBalance={totalBalance}
            animatedBalance={animatedBalance}
            currencySymbol={currency_symbol}
            balanceVisible={balanceVisible}
            onToggleBalance={() => { setBalanceVisible(v => !v); haptics.tap() }}
            summary={summary}
            monthName={getMonthName(month)}
            healthScore={healthScore}
            wallets={wallets}
            selectedWalletId={store.selectedWalletId}
            savingsGoals={savingsGoals}
            loans={loans}
            assets={(store.assets as any[]).map((a: any) => ({ id: a.id, label: a.name || a.label, value: a.value }))}
            onSelectWallet={store.setSelectedWallet}
            onOpenWalletTools={() => setShowWalletTools(true)}
            onAddTransaction={(type) => { setAddTxnType(type); setShowAddTxn(true) }}
            netWorth={netWorth}
          />
        </div>

        {/* ── PREMIUM: Activity Feed (replaces Daily Brief + overview sections) ── */}
        <div className="mb-5">
          <ActivityFeed
            transactions={transactions}
            subscriptions={store.subscriptions}
            insights={insights}
            savingsGoals={savingsGoals}
            loans={loans}
            budgets={budgets}
            currentBudget={currentBudgetAlert}
            month={month}
            currencySymbol={currency_symbol}
            onDismissInsight={store.dismissInsight}
            onSetTab={handleTabChange}
            onDeleteTxn={handleDeleteTransaction}
            language={language}
          />
        </div>

        {/* ── PREMIUM: Spending Pulse + Recurring Manager (only on overview) ── */}
        {tab === 'overview' && (
          <div className="mb-5 space-y-4">
            <SpendingPulse currencySymbol={currency_symbol} />
            <RecurringManager currencySymbol={currency_symbol} />
            <CategoryLimits currencySymbol={currency_symbol} />
          </div>
        )}

        {/* ── PREMIUM: Smart Morning Dashboard ── */}
        <SmartMorningDashboard
          tasks={tasks}
          transactions={transactions}
          budget={currentBudget}
          subscriptions={store.subscriptions}
          loans={loans}
          wallets={wallets}
          month={month}
          currencySymbol={currency_symbol}
          onOpenTasks={() => router.push('/tasks')}
          onAddTransaction={(type) => { setAddTxnType(type); setShowAddTxn(true) }}
        />

        {/* ── PILL TAB BAR ── */}
        <div className={`mon-pill-wrapper ${pillScrolled ? 'scrolled' : ''}`}>
          <div className="mon-pill-wrapper-bg" />
          <div className="mon-pill-tab-bar">
            {TAB_KEYS.map((tabKey) => (
              <button
                key={tabKey}
                onClick={() => handleTabChange(tabKey)}
                className={`mon-pill-tab ${tab === tabKey ? 'active' : ''}`}
              >
                {(t as any)[tabKey] || tabKey}
                {tab === tabKey && <div className="pill-indicator" />}
              </button>
            ))}
          </div>
        </div>

        {/* ── TAB CONTENT ── */}
        <div key={tab} className="mon-tab-content">
          {tab === 'overview' && (
            <div className="space-y-5">
              <SmartInsights
                transactions={transactions}
                insights={insights}
                month={month}
                currencySymbol={currency_symbol}
                onDismiss={store.dismissInsight}
                onSetTab={handleTabChange}
              />
              <NetWorthSparkline
                history={store.netWorthHistory}
                currencySymbol={currency_symbol}
                days={30}
              />
              <CashflowForecast
                transactions={transactions}
                loans={loans}
                budgets={budgets}
                savingsGoals={savingsGoals}
                subscriptions={store.subscriptions}
                wallets={wallets}
                month={month}
                currencySymbol={currency_symbol}
              />
              <UpcomingMoneyTimeline
                transactions={transactions}
                subscriptions={store.subscriptions}
                wallets={wallets}
                selectedWalletId={store.selectedWalletId}
                currencySymbol={currency_symbol}
                onPostTransaction={handleAddTransaction}
                onUpdateSubscription={store.updateSubscription}
              />
              <BudgetCoach
                budget={currentBudget}
                transactions={transactions}
                month={month}
                currencySymbol={currency_symbol}
                onCreateTask={createBudgetTask}
              />
              <OverviewTab
                t={t} weekData={weekData} maxWeekVal={maxWeekVal} spendingByCategory={spendingByCategory}
                summary={summary} healthScore={healthScore} insights={insights}
                activeLoans={activeLoans} completedLoans={completedLoans}
                totalLoanGiven={totalLoanGiven} totalLoanTaken={totalLoanTaken}
                monthTxns={monthTxns} currency_symbol={currency_symbol} language={language}
                onDismissInsight={store.dismissInsight} onSetTab={handleTabChange}
                onDeleteTxn={handleDeleteTransaction}
              />
            </div>
          )}

          {tab === 'transactions' && (
            <div className="space-y-4">
              <TransactionFilterBar
                transactions={transactions}
                wallets={wallets.map(w => ({ id: w.id, name: w.name, icon: w.icon }))}
                filter={filterState}
                onChange={handleFilterChange}
                onReset={resetFilter}
              />
              <TransactionsTab
                t={t} monthTxns={monthTxns} searchQuery={searchQuery} filterType={filterType}
                currency_symbol={currency_symbol} language={language}
                onSearch={setSearchQuery} onFilter={setFilterType}
                onDelete={handleDeleteTransaction}
                onEdit={setEditingTxn}
              />
            </div>
          )}

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

          {tab === 'analytics' && (
            <AnalyticsTab transactions={transactions} currency_symbol={currency_symbol} language={language} t={t} />
          )}

          {tab === 'budget' && (
            <BudgetTab budgets={budgets} transactions={transactions} currency_symbol={currency_symbol} language={language} month={month} t={t} onSetBudget={store.setBudget} />
          )}

          {tab === 'bills' && (
            <SubscriptionsPanel
              subscriptions={store.subscriptions}
              currencySymbol={currency_symbol}
              onAdd={(anchor) => {
                setSubscriptionModalAnchor(anchor ?? null)
                setShowSubscriptionModal(true)
              }}
              onPause={store.pauseSubscription}
              onResume={store.resumeSubscription}
              onDelete={store.deleteSubscription}
              onCreateTask={createSubscriptionTask}
            />
          )}

          {tab === 'goals' && (
            <GoalsTab goals={savingsGoals} currency_symbol={currency_symbol} language={language} t={t}
              onAdd={() => setShowGoalModal(true)} onContribute={store.contributeToGoal} onDelete={store.deleteSavingsGoal}
              onCreateTask={createGoalTask} />
          )}
        </div>
      </div>

      {/* ── MODALS ── */}
      {showAddTxn && <AddTransactionModal onClose={() => setShowAddTxn(false)} onAdd={handleAddTransaction} translations={t} currencySymbol={currency_symbol} wallets={wallets} selectedWalletId={store.selectedWalletId} initialType={addTxnType} />}
      {editingTxn && <AddTransactionModal onClose={() => setEditingTxn(null)} onAdd={(updates: Partial<Transaction>) => store.updateTransaction(editingTxn.id, updates)} translations={t} currencySymbol={currency_symbol} wallets={wallets} selectedWalletId={store.selectedWalletId} transaction={editingTxn} />}
      {showLoanModal && <AddLoanModal onClose={() => setShowLoanModal(false)} onAdd={store.addLoan} translations={t} currencySymbol={currency_symbol} />}
      {showGoalModal && <AddGoalModal onClose={() => setShowGoalModal(false)} onAdd={store.addSavingsGoal} translations={t} currencySymbol={currency_symbol} />}
      {showSubscriptionModal && (
        <AddSubscriptionModal
          onClose={() => {
            setShowSubscriptionModal(false)
            setSubscriptionModalAnchor(null)
          }}
          onAdd={store.addSubscription}
          currencySymbol={currency_symbol}
          anchorRect={subscriptionModalAnchor}
        />
      )}
      {showWalletTools && <WalletToolsModal wallets={wallets} selectedWalletId={store.selectedWalletId} onClose={() => setShowWalletTools(false)} onTransfer={store.transferWalletBalance} onReconcile={store.reconcileWalletBalance} onAddWallet={store.addWallet} onDeleteWallet={store.deleteWallet} currencySymbol={currency_symbol} />}
      {showHistoryModal && selectedLoan && <LoanHistoryModal loan={selectedLoan} onClose={() => setShowHistoryModal(false)} translations={t} currencySymbol={currency_symbol} />}
      {showPaymentModal && <LoanEntryModal loan={showPaymentModal.loan} type={showPaymentModal.type} onClose={() => setShowPaymentModal(null)} onSubmit={store.addLoanEntry} translations={t} currencySymbol={currency_symbol} />}
      {showEditModal && <EditLoanModal loan={showEditModal} onClose={() => setShowEditModal(null)} onSave={store.updateLoan} translations={t} />}

      {/* ── Smart FAB ── */}
      <QuickTransactionWidget
        onAddExpense={() => { setAddTxnType('expense'); setShowAddTxn(true); haptics.tap() }}
        onAddIncome={() => { setAddTxnType('income'); setShowAddTxn(true); haptics.tap() }}
        onWalletTools={() => setShowWalletTools(true)}
      />
    </div>
  )
}
