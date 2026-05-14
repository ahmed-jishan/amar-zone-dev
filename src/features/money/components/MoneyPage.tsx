// src/app/(tabs)/money/page.tsx
'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Plus, ArrowUpRight, ArrowDownRight, ChevronRight,
  X, Check, Clock, Pencil, History, PlusCircle,
  MinusCircle, Archive, RefreshCw, TrendingUp, Wallet,
  Sparkles, AlertCircle
} from 'lucide-react'
import { useSettingsStore } from '@/features/settings/store/settingsStore'

// ====================== TYPES ======================
type TransactionType = 'income' | 'expense'
type ExpenseCategory = 'food' | 'transport' | 'utilities' | 'health' | 'education' | 'entertainment' | 'shopping' | 'rent' | 'other'
type IncomeCategory = 'salary' | 'freelance' | 'other-income'

interface Transaction {
  id: string
  type: TransactionType
  amount: number
  category: ExpenseCategory | IncomeCategory
  note?: string
  date: string
  isRecurring?: boolean
}

interface LoanEntry {
  id: string
  date: string
  amount: number
  type: 'added' | 'repaid'
  note?: string
  balanceAfter: number
}

interface Loan {
  id: string
  personName: string
  direction: 'given' | 'taken'
  initialAmount: number
  currentBalance: number
  entries: LoanEntry[]
  date: string
  dueDate?: string
  settled: boolean
  settledDate?: string
  note?: string
}

// ====================== HELPERS ======================
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
const todayISO = () => new Date().toISOString().split('T')[0]
const monthISO = () => new Date().toISOString().slice(0, 7)

// Currency formatting will use symbol from store
let currentCurrencySymbol = '৳'
const formatCurrency = (amount: number | undefined | null): string => {
  if (amount === undefined || amount === null || isNaN(amount)) return `${currentCurrencySymbol}0`
  return `${currentCurrencySymbol}${amount.toLocaleString('en-BD')}`
}

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'food', 'transport', 'utilities', 'health', 'education', 'entertainment', 'shopping', 'rent', 'other'
]

// Category metadata – labels will be translated later
const CATEGORY_META: Record<string, { icon: string; color: string; labelBn: string; labelEn: string }> = {
  food:           { icon: '🍛', color: '#f97316', labelBn: 'খাবার', labelEn: 'Food' },
  transport:      { icon: '🚌', color: '#3b82f6', labelBn: 'যানবাহন', labelEn: 'Transport' },
  utilities:      { icon: '💡', color: '#eab308', labelBn: 'বিল', labelEn: 'Utilities' },
  health:         { icon: '❤️', color: '#ef4444', labelBn: 'স্বাস্থ্য', labelEn: 'Health' },
  education:      { icon: '📚', color: '#8b5cf6', labelBn: 'শিক্ষা', labelEn: 'Education' },
  entertainment:  { icon: '🎬', color: '#ec4899', labelBn: 'বিনোদন', labelEn: 'Entertainment' },
  shopping:       { icon: '🛍️', color: '#06b6d4', labelBn: 'কেনাকাটা', labelEn: 'Shopping' },
  rent:           { icon: '🏠', color: '#10b981', labelBn: 'ভাড়া', labelEn: 'Rent' },
  salary:         { icon: '💰', color: '#22c55e', labelBn: 'বেতন', labelEn: 'Salary' },
  freelance:      { icon: '💻', color: '#6366f1', labelBn: 'ফ্রিল্যান্স', labelEn: 'Freelance' },
  'other-income': { icon: '📈', color: '#14b8a6', labelBn: 'অন্যান্য আয়', labelEn: 'Other Income' },
  other:          { icon: '📦', color: '#94a3b8', labelBn: 'অন্যান্য', labelEn: 'Other' },
}

type Tab = 'overview' | 'transactions' | 'loans'

// ====================== TRANSLATIONS ======================
const translations = {
  bn: {
    emptyTx: 'কোনো লেনদেন নেই',
    emptySub: 'লেনদেন যোগ করতে উপরের + বাটন চাপুন',
    emptyLoan: 'কোনো চলমান ধার নেই',
    emptyLoanSub: 'নতুন ধার যোগ করুন',
    month: new Date().toLocaleString('bn-BD', { month: 'long', year: 'numeric' }),
    netBalance: 'নেট ব্যালেন্স',
    deficit: 'ঘাটতি',
    income: 'আয়',
    expense: 'খরচ',
    spentPercent: 'খরচ হয়েছে',
    remaining: 'বাকি',
    nearLimit: 'সীমার কাছাকাছি',
    overview: 'সারাংশ',
    transactions: 'লেনদেন',
    loans: 'ধার',
    addTransaction: 'যোগ করুন',
    newLoan: 'নতুন ধার',
    categoryBreakdown: 'ক্যাটাগরি ব্রেকডাউন',
    givenRemaining: 'দিয়েছি (বাকি)',
    takenRemaining: 'নিয়েছি (বাকি)',
    thisMonth: 'এই মাসের লেনদেন',
    activeLoans: 'চলমান ধার',
    completedLoans: 'সমাপ্ত ধার',
    history: 'ইতিহাস',
    repay: 'শোধ',
    addMore: 'আরো',
    edit: 'সম্পাদনা',
    delete: 'মুছুন',
    reactivate: 'পুনরায়',
    principal: 'মূল',
    dueDate: 'ডেডলাইন',
    overdue: 'মেয়াদ উত্তীর্ণ',
    repaidPercent: 'শোধ',
    // Modal texts
    newTransaction: 'নতুন লেনদেন',
    expenseLabel: 'খরচ',
    incomeLabel: 'আয়',
    notePlaceholder: 'নোট (ঐচ্ছিক)',
    save: 'সংরক্ষণ করুন',
    newLoanTitle: 'নতুন ধার',
    given: 'দিয়েছি',
    taken: 'নিয়েছি',
    withWhom: 'কার সাথে?',
    dueDatePlaceholder: 'শেষ তারিখ',
    loanNote: 'নোট (ঐচ্ছিক)',
    historyTitle: 'ইতিহাস',
    currentBalance: 'বর্তমান বাকি',
    status: 'স্থিতি',
    settled: 'সমাপ্ত',
    active: 'চলমান',
    add: 'যোগ',
    paymentTitle: 'শোধ করুন',
    extraTitle: 'আরো ধার',
    maxRepayHint: 'সর্বোচ্চ শোধ',
    editDetails: 'তথ্য সম্পাদনা',
    name: 'নাম',
  },
  en: {
    emptyTx: 'No transactions',
    emptySub: 'Tap + to add a transaction',
    emptyLoan: 'No active loans',
    emptyLoanSub: 'Add a new loan',
    month: new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }),
    netBalance: 'Net balance',
    deficit: 'Deficit',
    income: 'Income',
    expense: 'Expense',
    spentPercent: 'spent',
    remaining: 'remaining',
    nearLimit: 'Near limit',
    overview: 'Overview',
    transactions: 'Transactions',
    loans: 'Loans',
    addTransaction: 'Add',
    newLoan: 'New loan',
    categoryBreakdown: 'Category breakdown',
    givenRemaining: 'Given (remaining)',
    takenRemaining: 'Taken (remaining)',
    thisMonth: 'This month',
    activeLoans: 'Active loans',
    completedLoans: 'Completed loans',
    history: 'History',
    repay: 'Repay',
    addMore: 'Add more',
    edit: 'Edit',
    delete: 'Delete',
    reactivate: 'Reactivate',
    principal: 'Principal',
    dueDate: 'Due date',
    overdue: 'Overdue',
    repaidPercent: 'repaid',
    newTransaction: 'New transaction',
    expenseLabel: 'Expense',
    incomeLabel: 'Income',
    notePlaceholder: 'Note (optional)',
    save: 'Save',
    newLoanTitle: 'New loan',
    given: 'Given',
    taken: 'Taken',
    withWhom: 'With whom?',
    dueDatePlaceholder: 'Due date',
    loanNote: 'Note (optional)',
    historyTitle: 'History',
    currentBalance: 'Current balance',
    status: 'Status',
    settled: 'Settled',
    active: 'Active',
    add: 'Add',
    paymentTitle: 'Make payment',
    extraTitle: 'Add more loan',
    maxRepayHint: 'Maximum repayment',
    editDetails: 'Edit details',
    name: 'Name',
  }
}

// ====================== LOCAL STORE (Money) ======================
// (same as before, but now using localStorage keys that settings backup also uses)
function useMoneyStore() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loans, setLoans] = useState<Loan[]>([])
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    const storedTx = localStorage.getItem('money_transactions')
    const storedLoans = localStorage.getItem('money_loans')
    let parsedLoans: Loan[] = []
    if (storedLoans) {
      const rawLoans = JSON.parse(storedLoans)
      parsedLoans = rawLoans.map((loan: any) => {
        if (loan.currentBalance !== undefined && loan.entries) return loan as Loan
        const oldAmount = loan.amount || 0
        return {
          ...loan, initialAmount: oldAmount,
          currentBalance: loan.settled ? 0 : oldAmount,
          entries: [{ id: generateId(), date: loan.date || todayISO(), amount: oldAmount, type: 'added', balanceAfter: loan.settled ? 0 : oldAmount, note: 'Initial' }]
        } as Loan
      })
    }
    if (storedTx) setTransactions(JSON.parse(storedTx))
    if (parsedLoans.length) setLoans(parsedLoans)
    setIsHydrated(true)
  }, [])

  useEffect(() => { if (isHydrated) localStorage.setItem('money_transactions', JSON.stringify(transactions)) }, [transactions, isHydrated])
  useEffect(() => { if (isHydrated) localStorage.setItem('money_loans', JSON.stringify(loans)) }, [loans, isHydrated])

  const addTransaction = (txn: Omit<Transaction, 'id'>) => setTransactions(prev => [{ ...txn, id: generateId() }, ...prev])
  const deleteTransaction = (id: string) => setTransactions(prev => prev.filter(t => t.id !== id))

  const addLoan = (loan: Omit<Loan, 'id' | 'entries' | 'currentBalance'> & { initialAmount: number }) => {
    setLoans(prev => [{
      ...loan, id: generateId(), currentBalance: loan.initialAmount, settled: false,
      entries: [{ id: generateId(), date: loan.date, amount: loan.initialAmount, type: 'added', balanceAfter: loan.initialAmount, note: 'Initial' }]
    }, ...prev])
  }

  const addLoanEntry = (loanId: string, amountChange: number, note: string, date: string) => {
    setLoans(prev => prev.map(loan => {
      if (loan.id !== loanId || loan.settled) return loan
      const newBalance = loan.currentBalance + amountChange
      if (newBalance < 0) return loan
      const newEntry: LoanEntry = { id: generateId(), date, amount: Math.abs(amountChange), type: amountChange < 0 ? 'repaid' : 'added', note, balanceAfter: newBalance }
      const updated = { ...loan, currentBalance: newBalance, entries: [...loan.entries, newEntry] }
      if (newBalance === 0) { updated.settled = true; (updated as any).settledDate = date }
      return updated
    }))
  }

  const updateLoanDetails = (loanId: string, updates: Partial<Pick<Loan, 'personName' | 'dueDate' | 'note'>>) =>
    setLoans(prev => prev.map(l => l.id === loanId ? { ...l, ...updates } : l))

  const deleteLoan = (id: string) => setLoans(prev => prev.filter(l => l.id !== id))
  const reactivateLoan = (id: string) => setLoans(prev => prev.map(l => l.id === id ? { ...l, settled: false, settledDate: undefined } : l))

  const getMonthSummary = (month: string) => {
    const t = transactions.filter(t => t.date.startsWith(month))
    const income = t.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const expense = t.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    return { income, expense, balance: income - expense }
  }

  return { transactions, loans, addTransaction, deleteTransaction, addLoan, addLoanEntry, updateLoanDetails, deleteLoan, reactivateLoan, getMonthSummary, isHydrated }
}

// ====================== MAIN PAGE ======================
export default function MoneyPage() {
  const { language, currency_symbol, theme } = useSettingsStore()
  currentCurrencySymbol = currency_symbol

  const store = useMoneyStore()
  const { transactions, loans, addTransaction, deleteTransaction, addLoan, addLoanEntry, updateLoanDetails, deleteLoan, reactivateLoan, getMonthSummary, isHydrated } = store
  const [tab, setTab] = useState<Tab>('overview')
  const [showAddTxn, setShowAddTxn] = useState(false)
  const [showLoanModal, setShowLoanModal] = useState(false)
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState<{ loan: Loan; type: 'add' | 'repay' } | null>(null)
  const [showEditModal, setShowEditModal] = useState<Loan | null>(null)
  const [systemDark, setSystemDark] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const sync = () => setSystemDark(media.matches)
    sync()
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [])

  const resolvedThemeClass = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme

  const validLanguage = (language === 'bn' ? 'bn' : 'en') as 'bn' | 'en'
  const t = translations[validLanguage]
  const currentMonth = monthISO()
  const summary = getMonthSummary(currentMonth)
  const spendPct = summary.income > 0 ? Math.min(100, (summary.expense / summary.income) * 100) : 0

  const monthTxns = useMemo(() =>
    transactions.filter(t => t.date.startsWith(currentMonth)).sort((a, b) => b.date.localeCompare(a.date)),
    [transactions, currentMonth])

  const activeLoans = loans.filter(l => !l.settled)
  const completedLoans = loans.filter(l => l.settled)
  const totalLoanGiven = activeLoans.filter(l => l.direction === 'given').reduce((s, l) => s + (l.currentBalance || 0), 0)
  const totalLoanTaken = activeLoans.filter(l => l.direction === 'taken').reduce((s, l) => s + (l.currentBalance || 0), 0)

  const spendingByCategory = useMemo(() => {
    const map: Record<string, number> = {}
    monthTxns.filter(t => t.type === 'expense').forEach(t => { map[t.category] = (map[t.category] || 0) + t.amount })
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [monthTxns])

  function getCategoryLabel(cat: string): string {
    const meta = CATEGORY_META[cat] || CATEGORY_META.other
    return language === 'bn' ? meta.labelBn : meta.labelEn
  }

  if (!isHydrated) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#080a0e', color: '#c9a84c', fontFamily: 'system-ui', gap: 8 }}>
      <Sparkles size={16} /> Loading...
    </div>
  )

  return (
    <div className={`mp-root ${resolvedThemeClass}`}>
      <div className="mp-hero">
        <div className="mp-hero-bg" />
        <div className="mp-hero-orb mp-hero-orb1" />
        <div className="mp-hero-orb mp-hero-orb2" />

        <div className="mp-hero-inner">
          <div className="mp-hero-top">
            <div>
              <p className="mp-hero-eyebrow">
                <Sparkles size={10} style={{ display: 'inline', marginRight: 5 }} />
                {t.month}
              </p>
              <div className="mp-hero-balance-wrap">
                <span className="mp-hero-currency">{currency_symbol}</span>
                <span className={`mp-hero-balance ${summary.balance < 0 ? 'mp-balance-neg' : ''}`}>
                  {Math.abs(summary.balance).toLocaleString('en-BD')}
                </span>
              </div>
              <p className="mp-hero-sublabel">{summary.balance < 0 ? t.deficit : t.netBalance}</p>
            </div>
            <button className="mp-fab" onClick={() => setShowAddTxn(true)} aria-label={t.addTransaction}>
              <Plus size={22} strokeWidth={2.5} />
            </button>
          </div>

          <div className="mp-stat-row">
            <div className="mp-stat mp-stat--income">
              <div className="mp-stat-icon"><ArrowUpRight size={13} /></div>
              <div>
                <p className="mp-stat-label">{t.income}</p>
                <p className="mp-stat-val">{formatCurrency(summary.income)}</p>
              </div>
            </div>
            <div className="mp-stat-sep" />
            <div className="mp-stat mp-stat--expense">
              <div className="mp-stat-icon"><ArrowDownRight size={13} /></div>
              <div>
                <p className="mp-stat-label">{t.expense}</p>
                <p className="mp-stat-val">{formatCurrency(summary.expense)}</p>
              </div>
            </div>
          </div>

          {summary.income > 0 && (
            <div className="mp-progress-wrap">
              <div className="mp-progress-track">
                <div className="mp-progress-fill" style={{ width: `${spendPct}%` }} />
                <div className="mp-progress-glow" style={{ left: `${spendPct}%` }} />
              </div>
              <div className="mp-progress-labels">
                <span>{Math.round(spendPct)}% {t.spentPercent}</span>
                <span className={spendPct > 90 ? 'mp-warn' : ''}>
                  {spendPct > 90 ? `⚠ ${t.nearLimit}` : `${formatCurrency(summary.income - summary.expense)} ${t.remaining}`}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mp-tabbar">
        {(['overview', 'transactions', 'loans'] as Tab[]).map(tabKey => (
          <button key={tabKey} className={`mp-tab ${tab === tabKey ? 'mp-tab--on' : ''}`} onClick={() => setTab(tabKey)}>
            {tabKey === 'overview' ? t.overview : tabKey === 'transactions' ? t.transactions : `${t.loans}${activeLoans.length > 0 ? ` (${activeLoans.length})` : ''}`}
            {tab === tabKey && <span className="mp-tab-indicator" />}
          </button>
        ))}
      </div>

      <div className="mp-body">
        {/* OVERVIEW */}
        {tab === 'overview' && (
          <div className="mp-fade">
            {spendingByCategory.length === 0 ? (
              <EmptyPlaceholder icon={<Wallet size={36} strokeWidth={1} />} text={t.emptyTx} sub={t.emptySub} />
            ) : (
              <div className="mp-section">
                <p className="mp-section-title">{t.categoryBreakdown}</p>
                <div className="mp-cat-list">
                  {spendingByCategory.map(([cat, amt], i) => {
                    const m = CATEGORY_META[cat] || CATEGORY_META.other
                    const pct = summary.expense > 0 ? (amt / summary.expense) * 100 : 0
                    const label = language === 'bn' ? m.labelBn : m.labelEn
                    return (
                      <div key={cat} className="mp-cat-row" style={{ animationDelay: `${i * 50}ms` }}>
                        <div className="mp-cat-icon" style={{ background: m.color + '18', border: `1px solid ${m.color}30` }}>
                          {m.icon}
                        </div>
                        <div className="mp-cat-info">
                          <div className="mp-cat-head">
                            <span className="mp-cat-name">{label}</span>
                            <span className="mp-cat-amt">{formatCurrency(amt)}</span>
                          </div>
                          <div className="mp-cat-track">
                            <div className="mp-cat-bar" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${m.color}cc, ${m.color})` }} />
                          </div>
                          <span className="mp-cat-pct">{Math.round(pct)}%</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {(activeLoans.length > 0 || completedLoans.length > 0) && (
              <div className="mp-loan-summary" onClick={() => setTab('loans')}>
                <div className="mp-loan-summary-inner">
                  <div className="mp-loan-col">
                    <span className="mp-loan-col-label">{t.givenRemaining}</span>
                    <span className="mp-loan-col-val mp-given">{formatCurrency(totalLoanGiven)}</span>
                  </div>
                  <div className="mp-loan-summary-div" />
                  <div className="mp-loan-col">
                    <span className="mp-loan-col-label">{t.takenRemaining}</span>
                    <span className="mp-loan-col-val mp-taken">{formatCurrency(totalLoanTaken)}</span>
                  </div>
                </div>
                <ChevronRight size={16} className="mp-loan-arrow" />
              </div>
            )}
          </div>
        )}

        {/* TRANSACTIONS */}
        {tab === 'transactions' && (
          <div className="mp-fade">
            <div className="mp-list-header">
              <p className="mp-section-title">{t.thisMonth}</p>
              <button className="mp-add-chip" onClick={() => setShowAddTxn(true)}><Plus size={12} /> {t.addTransaction}</button>
            </div>
            {monthTxns.length === 0 ? (
              <EmptyPlaceholder icon={<TrendingUp size={36} strokeWidth={1} />} text={t.emptyTx} sub={t.emptySub} />
            ) : (
              <div className="mp-txn-list">
                {monthTxns.map((txn, i) => {
                  const m = CATEGORY_META[txn.category] || CATEGORY_META.other
                  const label = language === 'bn' ? m.labelBn : m.labelEn
                  return (
                    <div key={txn.id} className="mp-txn-card" style={{ animationDelay: `${i * 35}ms` }}>
                      <div className="mp-txn-icon" style={{ background: m.color + '15', border: `1px solid ${m.color}25` }}>{m.icon}</div>
                      <div className="mp-txn-info">
                        <span className="mp-txn-title">{txn.note || label}</span>
                        <span className="mp-txn-meta">{txn.date} · {label}</span>
                      </div>
                      <div className="mp-txn-right">
                        <span className={`mp-txn-amt ${txn.type === 'income' ? 'mp-inc' : 'mp-exp'}`}>
                          {txn.type === 'income' ? '+' : '−'}{formatCurrency(txn.amount)}
                        </span>
                        <button className="mp-del-btn" onClick={() => deleteTransaction(txn.id)}><X size={11} /></button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* LOANS */}
        {tab === 'loans' && (
          <div className="mp-fade">
            <div className="mp-list-header">
              <p className="mp-section-title">{t.activeLoans}</p>
              <button className="mp-add-chip" onClick={() => setShowLoanModal(true)}><Plus size={12} /> {t.newLoan}</button>
            </div>
            {activeLoans.length === 0 ? (
              <EmptyPlaceholder icon={<Clock size={36} strokeWidth={1} />} text={t.emptyLoan} sub={t.emptyLoanSub} />
            ) : (
              <div className="mp-txn-list">
                {activeLoans.map((l, i) => (
                  <LoanCard key={l.id} loan={l} index={i} translations={t} currencySymbol={currency_symbol}
                    onShowHistory={() => { setSelectedLoan(l); setShowHistoryModal(true) }}
                    onAddPayment={() => setShowPaymentModal({ loan: l, type: 'repay' })}
                    onAddExtra={() => setShowPaymentModal({ loan: l, type: 'add' })}
                    onEdit={() => setShowEditModal(l)}
                    onDelete={() => deleteLoan(l.id)}
                  />
                ))}
              </div>
            )}

            {completedLoans.length > 0 && (
              <div style={{ marginTop: 28 }}>
                <div className="mp-list-header">
                  <p className="mp-section-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Archive size={12} /> {t.completedLoans}
                  </p>
                </div>
                <div className="mp-txn-list mp-txn-list--dim">
                  {completedLoans.map((l, i) => (
                    <LoanCard key={l.id} loan={l} index={i} isCompleted translations={t} currencySymbol={currency_symbol}
                      onShowHistory={() => { setSelectedLoan(l); setShowHistoryModal(true) }}
                      onReactivate={() => reactivateLoan(l.id)}
                      onDelete={() => deleteLoan(l.id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODALS with translations */}
      {showAddTxn && <AddTransactionModal onClose={() => setShowAddTxn(false)} onAdd={addTransaction} translations={t} currencySymbol={currency_symbol} />}
      {showLoanModal && <AddLoanModal onClose={() => setShowLoanModal(false)} onAdd={addLoan} translations={t} currencySymbol={currency_symbol} />}
      {showHistoryModal && selectedLoan && <LoanHistoryModal loan={selectedLoan} onClose={() => setShowHistoryModal(false)} translations={t} currencySymbol={currency_symbol} />}
      {showPaymentModal && (
        <LoanEntryModal loan={showPaymentModal.loan} type={showPaymentModal.type} translations={t} currencySymbol={currency_symbol}
          onClose={() => setShowPaymentModal(null)}
          onSubmit={(amount: number, note: string, date: string) => { addLoanEntry(showPaymentModal.loan.id, showPaymentModal.type === 'repay' ? -amount : amount, note, date); setShowPaymentModal(null) }}
        />
      )}
      {showEditModal && (
        <EditLoanModal loan={showEditModal} onClose={() => setShowEditModal(null)} translations={t}
          onSave={(updates: Partial<Pick<Loan, 'personName' | 'dueDate' | 'note'>>) => { updateLoanDetails(showEditModal.id, updates); setShowEditModal(null) }}
        />
      )}

      <style>{CSS}</style>
    </div>
  )
}

// ------------------ COMPONENTS ------------------
function LoanCard({ loan, index, onShowHistory, onAddPayment, onAddExtra, onEdit, onDelete, onReactivate, isCompleted = false, translations, currencySymbol }: any) {
  const bal = loan.currentBalance ?? loan.initialAmount ?? 0
  const init = loan.initialAmount ?? bal
  const repaidPct = init > 0 ? Math.min(100, ((init - bal) / init) * 100) : 0
  const isOverdue = !isCompleted && loan.dueDate && loan.dueDate < todayISO()
  const formatCurr = (amt: number) => `${currencySymbol}${amt.toLocaleString('en-BD')}`

  return (
    <div className={`mp-loan-card ${isCompleted ? 'mp-loan-card--done' : ''}`} style={{ animationDelay: `${index * 40}ms` }}>
      <div className="mp-loan-top">
        <div className="mp-loan-left">
          <div className={`mp-loan-badge ${loan.direction === 'given' ? 'mp-badge-given' : 'mp-badge-taken'}`}>
            {loan.direction === 'given' ? '↑ ' + translations.given : '↓ ' + translations.taken}
          </div>
          <div>
            <p className="mp-loan-name">{loan.personName}</p>
            {loan.dueDate && (
              <p className={`mp-loan-due ${isOverdue ? 'mp-loan-due--over' : ''}`}>
                {isOverdue && <AlertCircle size={10} style={{ display: 'inline', marginRight: 3 }} />}
                {translations.dueDate}: {loan.dueDate}
              </p>
            )}
            {loan.note && <p className="mp-loan-note">{loan.note}</p>}
          </div>
        </div>
        <div className="mp-loan-right">
          <span className={`mp-loan-bal ${loan.direction === 'given' ? 'mp-given' : 'mp-taken'}`}>{formatCurr(bal)}</span>
          <span className="mp-loan-init">{translations.principal}: {formatCurr(init)}</span>
        </div>
      </div>

      {!isCompleted && init > 0 && (
        <div className="mp-loan-prog">
          <div className="mp-loan-prog-track">
            <div className="mp-loan-prog-fill" style={{ width: `${repaidPct}%`, background: loan.direction === 'given' ? '#10b981' : '#ef4444' }} />
          </div>
          <span className="mp-loan-prog-pct">{Math.round(repaidPct)}% {translations.repaidPercent}</span>
        </div>
      )}

      <div className="mp-loan-actions">
        <button className="mp-action-btn mp-action-hist" onClick={onShowHistory}><History size={12} /><span>{translations.history}</span></button>
        {!isCompleted && (<>
          <button className="mp-action-btn mp-action-rep" onClick={onAddPayment}><MinusCircle size={12} /><span>{translations.repay}</span></button>
          <button className="mp-action-btn mp-action-add" onClick={onAddExtra}><PlusCircle size={12} /><span>{translations.addMore}</span></button>
          <button className="mp-action-btn mp-action-edit" onClick={onEdit}><Pencil size={12} /></button>
        </>)}
        {isCompleted && <button className="mp-action-btn mp-action-react" onClick={onReactivate}><RefreshCw size={12} /><span>{translations.reactivate}</span></button>}
        <button className="mp-action-btn mp-action-del" onClick={onDelete}><X size={12} /></button>
      </div>
    </div>
  )
}

function EmptyPlaceholder({ icon, text, sub }: any) {
  return (
    <div className="mp-empty">
      <div className="mp-empty-icon">{icon}</div>
      <p className="mp-empty-text">{text}</p>
      {sub && <p className="mp-empty-sub">{sub}</p>}
    </div>
  )
}

// ------------------ MODAL COMPONENTS (simplified but with translations) ------------------
function ModalShell({ onClose, title, children }: any) {
  return (
    <div className="mo-backdrop" onClick={onClose}>
      <div className="mo-sheet" onClick={e => e.stopPropagation()}>
        <div className="mo-notch" />
        <div className="mo-head">
          <h2 className="mo-title">{title}</h2>
          <button className="mo-close" onClick={onClose}><X size={16} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

function AddTransactionModal({ onClose, onAdd, translations, currencySymbol }: any) {
  const [type, setType] = useState<TransactionType>('expense')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<string>('food')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(todayISO())
  const cats = type === 'income' ? ['salary', 'freelance', 'other-income'] : EXPENSE_CATEGORIES
  const handleSubmit = () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return
    onAdd({ type, amount: Number(amount), category: category as ExpenseCategory, note, date, isRecurring: false })
    onClose()
  }
  const getLabel = (cat: string) => {
    const meta = CATEGORY_META[cat] || CATEGORY_META.other
    return translations.language === 'bn' ? meta.labelBn : meta.labelEn
  }
  return (
    <ModalShell onClose={onClose} title={translations.newTransaction}>
      <div className="mo-type-row">
        <button className={`mo-type ${type === 'expense' ? 'mo-type--exp' : ''}`} onClick={() => { setType('expense'); setCategory('food') }}><ArrowDownRight size={14} /> {translations.expenseLabel}</button>
        <button className={`mo-type ${type === 'income' ? 'mo-type--inc' : ''}`} onClick={() => { setType('income'); setCategory('salary') }}><ArrowUpRight size={14} /> {translations.incomeLabel}</button>
      </div>
      <div className={`mo-amount-box ${type === 'income' ? 'mo-amount-box--inc' : 'mo-amount-box--exp'}`}>
        <span className="mo-amount-sign">{currencySymbol}</span>
        <input className="mo-amount-inp" type="number" placeholder="0" value={amount} onChange={e => setAmount(e.target.value)} autoFocus />
      </div>
      <div className="mo-cats">
        {cats.map(c => {
          const m = CATEGORY_META[c] || CATEGORY_META.other
          const label = translations.language === 'bn' ? m.labelBn : m.labelEn
          return (
            <button key={c} className={`mo-cat ${category === c ? 'mo-cat--on' : ''}`}
              style={category === c ? { background: m.color + '25', borderColor: m.color, color: m.color } : {}}
              onClick={() => setCategory(c)}>
              {m.icon} {label}
            </button>
          )
        })}
      </div>
      <input className="mo-inp" placeholder={translations.notePlaceholder} value={note} onChange={e => setNote(e.target.value)} />
      <input className="mo-inp" type="date" value={date} onChange={e => setDate(e.target.value)} />
      <button className={`mo-submit ${type === 'income' ? 'mo-submit--inc' : 'mo-submit--exp'}`} onClick={handleSubmit}>{translations.save}</button>
    </ModalShell>
  )
}

function AddLoanModal({ onClose, onAdd, translations, currencySymbol }: any) {
  const [direction, setDirection] = useState<'given' | 'taken'>('given')
  const [personName, setPersonName] = useState('')
  const [amount, setAmount] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [note, setNote] = useState('')
  const handleSubmit = () => {
    if (!personName || !amount || isNaN(Number(amount))) return
    onAdd({ personName, direction, initialAmount: Number(amount), date: todayISO(), dueDate: dueDate || undefined, note: note || undefined })
    onClose()
  }
  return (
    <ModalShell onClose={onClose} title={translations.newLoanTitle}>
      <div className="mo-type-row">
        <button className={`mo-type ${direction === 'given' ? 'mo-type--inc' : ''}`} onClick={() => setDirection('given')}>↑ {translations.given}</button>
        <button className={`mo-type ${direction === 'taken' ? 'mo-type--exp' : ''}`} onClick={() => setDirection('taken')}>↓ {translations.taken}</button>
      </div>
      <input className="mo-inp" placeholder={translations.withWhom} value={personName} onChange={e => setPersonName(e.target.value)} autoFocus />
      <div className="mo-amount-box mo-amount-box--neutral">
        <span className="mo-amount-sign">{currencySymbol}</span>
        <input className="mo-amount-inp" type="number" placeholder="0" value={amount} onChange={e => setAmount(e.target.value)} />
      </div>
      <input className="mo-inp" type="date" placeholder={translations.dueDatePlaceholder} value={dueDate} onChange={e => setDueDate(e.target.value)} />
      <input className="mo-inp" placeholder={translations.loanNote} value={note} onChange={e => setNote(e.target.value)} />
      <button className="mo-submit mo-submit--neu" onClick={handleSubmit}>{translations.save}</button>
    </ModalShell>
  )
}

function LoanHistoryModal({ loan, onClose, translations, currencySymbol }: any) {
  const formatCurr = (amt: number) => `${currencySymbol}${amt.toLocaleString('en-BD')}`
  return (
    <ModalShell onClose={onClose} title={`${loan.personName} — ${translations.historyTitle}`}>
      <div className="mo-history-stats">
        <div className="mo-hstat"><span>{translations.principal}</span><strong>{formatCurr(loan.initialAmount)}</strong></div>
        <div className="mo-hstat"><span>{translations.currentBalance}</span><strong className={loan.direction === 'given' ? 'mp-given' : 'mp-taken'}>{formatCurr(loan.currentBalance)}</strong></div>
        <div className="mo-hstat"><span>{translations.status}</span><strong>{loan.settled ? <span className="mp-badge-done">{translations.settled} ✓</span> : <span className="mp-badge-active">{translations.active}</span>}</strong></div>
      </div>
      <div className="mo-history-list">
        {(loan.entries || []).map((e: any) => (
          <div key={e.id} className="mo-history-row">
            <div className="mo-hist-left">
              <span className={`mo-hist-type ${e.type === 'added' ? 'mo-hist-add' : 'mo-hist-rep'}`}>
                {e.type === 'added' ? '+' : '−'}{formatCurr(e.amount)}
              </span>
              <span className="mo-hist-note">{e.note || (e.type === 'added' ? translations.add : translations.repay)}</span>
            </div>
            <div className="mo-hist-right">
              <span className="mo-hist-date">{e.date}</span>
              <span className="mo-hist-bal">{translations.currentBalance}: {formatCurr(e.balanceAfter)}</span>
            </div>
          </div>
        ))}
      </div>
      <button className="mo-submit mo-submit--neu" onClick={onClose}>{translations.save}</button>
    </ModalShell>
  )
}

function LoanEntryModal({ loan, type, onClose, onSubmit, translations, currencySymbol }: any) {
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(todayISO())
  const isRepay = type === 'repay'
  const handleSubmit = () => { if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return; onSubmit(Number(amount), note, date) }
  const formatCurr = (amt: number) => `${currencySymbol}${amt.toLocaleString('en-BD')}`
  return (
    <ModalShell onClose={onClose} title={`${isRepay ? translations.paymentTitle : translations.extraTitle} — ${loan.personName}`}>
      <div className="mo-info-pill">{translations.currentBalance}: <strong>{formatCurr(loan.currentBalance)}</strong></div>
      <div className={`mo-amount-box ${isRepay ? 'mo-amount-box--exp' : 'mo-amount-box--inc'}`}>
        <span className="mo-amount-sign">{currencySymbol}</span>
        <input className="mo-amount-inp" type="number" placeholder="0" value={amount} onChange={e => setAmount(e.target.value)} autoFocus />
      </div>
      {isRepay && <p className="mo-hint">{translations.maxRepayHint}: {formatCurr(loan.currentBalance)}</p>}
      <input className="mo-inp" placeholder={translations.notePlaceholder} value={note} onChange={e => setNote(e.target.value)} />
      <input className="mo-inp" type="date" value={date} onChange={e => setDate(e.target.value)} />
      <button className={`mo-submit ${isRepay ? 'mo-submit--exp' : 'mo-submit--inc'}`} onClick={handleSubmit}>{isRepay ? translations.repay : translations.add}</button>
    </ModalShell>
  )
}

function EditLoanModal({ loan, onClose, onSave, translations }: any) {
  const [personName, setPersonName] = useState(loan.personName)
  const [dueDate, setDueDate] = useState(loan.dueDate || '')
  const [note, setNote] = useState(loan.note || '')
  return (
    <ModalShell onClose={onClose} title={translations.editDetails}>
      <input className="mo-inp" placeholder={translations.name} value={personName} onChange={e => setPersonName(e.target.value)} />
      <input className="mo-inp" type="date" placeholder={translations.dueDatePlaceholder} value={dueDate} onChange={e => setDueDate(e.target.value)} />
      <input className="mo-inp" placeholder={translations.notePlaceholder} value={note} onChange={e => setNote(e.target.value)} />
      <button className="mo-submit mo-submit--neu" onClick={() => { onSave({ personName, dueDate: dueDate || undefined, note: note || undefined }); onClose() }}>{translations.save}</button>
    </ModalShell>
  )
}

// ====================== CSS ======================
const CSS = `
/* Base – respects dark class from settings store */
:root {
  --mp-bg: #f8fafc;
  --mp-hero-bg-start: #e2e8f0;
  --mp-hero-bg-end: #f1f5f9;
  --mp-card-bg: #ffffff;
  --mp-border: #e2e8f0;
  --mp-text-primary: #0f172a;
  --mp-text-secondary: #334155;
  --mp-text-muted: #64748b;
  --mp-accent-gold: #c9a84c;
  --mp-accent-gold-glow: #c9a84c30;
}

.dark {
  --mp-bg: #080c14;
  --mp-hero-bg-start: #1a2340;
  --mp-hero-bg-end: #080c14;
  --mp-card-bg: #0f1520;
  --mp-border: #1a2535;
  --mp-text-primary: #e8eaf0;
  --mp-text-secondary: #b8c8d8;
  --mp-text-muted: #556677;
  --mp-accent-gold: #c9a84c;
  --mp-accent-gold-glow: #4ade8030;
}

.mp-root {
  min-height: 100%;
  background: var(--mp-bg);
  color: var(--mp-text-primary);
  font-family: 'Siyam Rupali', 'Noto Sans Bengali', system-ui, sans-serif;
  display: flex; flex-direction: column;
}

/* Hero */
.mp-hero {
  position: relative; overflow: hidden;
  background: var(--mp-bg);
}
.mp-hero-bg {
  position: absolute; inset: 0;
  background: radial-gradient(ellipse 80% 60% at 50% 0%, var(--mp-hero-bg-start) 0%, var(--mp-hero-bg-end) 70%);
}
.mp-hero-orb {
  position: absolute; border-radius: 50%;
  filter: blur(50px); pointer-events: none;
}
.mp-hero-orb1 { width: 220px; height: 220px; top: -80px; right: -60px; background: radial-gradient(circle, var(--mp-accent-gold)18, transparent 70%); }
.mp-hero-orb2 { width: 180px; height: 180px; bottom: -60px; left: -40px; background: radial-gradient(circle, #6366f118, transparent 70%); }

.mp-hero-inner { position: relative; z-index: 1; padding: 28px 20px 24px; }
.mp-hero-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 22px; }
.mp-hero-eyebrow { font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--mp-accent-gold); opacity: 0.85; margin-bottom: 8px; }
.mp-hero-balance-wrap { display: flex; align-items: baseline; gap: 4px; }
.mp-hero-currency { font-size: 22px; font-weight: 300; color: var(--mp-text-muted); margin-top: 4px; }
.mp-hero-balance { font-size: 42px; font-weight: 800; color: var(--mp-text-primary); letter-spacing: -2px; line-height: 1; }
.mp-balance-neg { color: #f87171; }
.mp-hero-sublabel { font-size: 12px; color: var(--mp-text-muted); margin-top: 4px; }

.mp-fab {
  width: 46px; height: 46px; border-radius: 50%;
  background: linear-gradient(135deg, #c9a84c, #e8c56a);
  border: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: #080c14;
  box-shadow: 0 4px 20px #c9a84c40;
  transition: transform 0.2s, box-shadow 0.2s;
  flex-shrink: 0;
}
.mp-fab:active { transform: scale(0.92); }

/* stats */
.mp-stat-row {
  display: flex; align-items: center;
  background: var(--mp-card-bg);
  border: 1px solid var(--mp-border);
  border-radius: 16px; padding: 14px 16px;
  gap: 0; margin-bottom: 16px;
}
.mp-stat { display: flex; align-items: center; gap: 10px; flex: 1; }
.mp-stat-sep { width: 1px; height: 32px; background: var(--mp-border); margin: 0 16px; }
.mp-stat-icon { width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
.mp-stat--income .mp-stat-icon { background: #10b98120; color: #10b981; }
.mp-stat--expense .mp-stat-icon { background: #ef444420; color: #ef4444; }
.mp-stat-label { font-size: 10px; color: var(--mp-text-muted); text-transform: uppercase; }
.mp-stat-val { font-size: 15px; font-weight: 700; color: var(--mp-text-primary); }

/* progress */
.mp-progress-track { height: 5px; background: var(--mp-border); border-radius: 999px; overflow: visible; position: relative; }
.mp-progress-fill { height: 100%; border-radius: 999px; background: linear-gradient(90deg, #10b981, #c9a84c, #ef4444); transition: width 1s cubic-bezier(0.34,1.3,0.64,1); }
.mp-progress-glow { position: absolute; top: 50%; transform: translate(-50%, -50%); width: 10px; height: 10px; border-radius: 50%; background: #c9a84c; box-shadow: 0 0 8px #c9a84c; transition: left 1s cubic-bezier(0.34,1.3,0.64,1); }
.mp-progress-labels { display: flex; justify-content: space-between; margin-top: 8px; font-size: 11px; color: var(--mp-text-muted); }
.mp-warn { color: #f59e0b !important; }

/* tabs */
.mp-tabbar {
  display: flex; gap: 0;
  background: var(--mp-bg);
  border-bottom: 1px solid var(--mp-border);
  padding: 0 16px;
  position: sticky; top: 0; z-index: 10;
}
.mp-tab {
  position: relative; padding: 14px 18px;
  font-size: 13px; font-weight: 500; color: var(--mp-text-muted);
  background: transparent; border: none; cursor: pointer;
  transition: color 0.2s;
}
.mp-tab--on { color: var(--mp-accent-gold); }
.mp-tab-indicator {
  position: absolute; bottom: 0; left: 50%; transform: translateX(-50%);
  width: 70%; height: 2px; border-radius: 999px;
  background: linear-gradient(90deg, #c9a84c, #e8c56a);
  animation: indicatorSlide 0.25s ease-out;
}
@keyframes indicatorSlide { from { width: 0; opacity: 0; } to { width: 70%; opacity: 1; } }

/* body */
.mp-body { flex: 1; padding: 16px; overflow-y: auto; }
.mp-section { margin-bottom: 16px; }
.mp-section-title { font-size: 11px; font-weight: 600; letter-spacing: 1.2px; text-transform: uppercase; color: var(--mp-text-muted); margin-bottom: 14px; }
.mp-list-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }

/* categories */
.mp-cat-list { display: flex; flex-direction: column; gap: 12px; }
.mp-cat-row { display: flex; align-items: center; gap: 12px; animation: mpSlide 0.4s ease-out both; }
.mp-cat-icon { width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 19px; flex-shrink: 0; }
.mp-cat-info { flex: 1; }
.mp-cat-head { display: flex; justify-content: space-between; margin-bottom: 6px; }
.mp-cat-name { font-size: 13px; color: var(--mp-text-secondary); }
.mp-cat-amt { font-size: 13px; font-weight: 700; color: var(--mp-text-primary); }
.mp-cat-track { height: 3px; background: var(--mp-border); border-radius: 999px; overflow: hidden; margin-bottom: 3px; }
.mp-cat-bar { height: 100%; border-radius: 999px; transition: width 0.8s cubic-bezier(0.34,1.1,0.64,1); }
.mp-cat-pct { font-size: 10px; color: var(--mp-text-muted); }

/* loan summary */
.mp-loan-summary {
  display: flex; align-items: center; gap: 12px;
  background: var(--mp-card-bg);
  border: 1px solid var(--mp-border);
  border-radius: 18px; padding: 16px 18px;
  cursor: pointer; margin-top: 20px;
  transition: transform 0.15s, border-color 0.2s;
}
.mp-loan-summary:active { transform: scale(0.98); }
.mp-loan-summary-inner { display: flex; flex: 1; gap: 0; }
.mp-loan-col { flex: 1; }
.mp-loan-col-label { font-size: 11px; color: var(--mp-text-muted); display: block; margin-bottom: 4px; }
.mp-loan-col-val { font-size: 16px; font-weight: 700; }
.mp-loan-summary-div { width: 1px; background: var(--mp-border); margin: 0 16px; }
.mp-loan-arrow { color: var(--mp-text-muted); }

/* txn list */
.mp-txn-list { display: flex; flex-direction: column; gap: 8px; }
.mp-txn-card {
  display: flex; align-items: center; gap: 12px;
  background: var(--mp-card-bg);
  border: 1px solid var(--mp-border);
  border-radius: 16px; padding: 13px 14px;
  transition: transform 0.15s;
  animation: mpSlide 0.35s ease-out both;
}
.mp-txn-card:active { transform: scale(0.98); }
.mp-txn-icon { width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 19px; flex-shrink: 0; }
.mp-txn-info { flex: 1; display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.mp-txn-title { font-size: 14px; font-weight: 500; color: var(--mp-text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.mp-txn-meta { font-size: 11px; color: var(--mp-text-muted); }
.mp-txn-right { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; flex-shrink: 0; }
.mp-txn-amt { font-size: 14px; font-weight: 800; }
.mp-inc { color: #34d399; }
.mp-exp { color: #f87171; }
.mp-del-btn { width: 22px; height: 22px; border-radius: 6px; background: var(--mp-border); color: var(--mp-text-muted); border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.15s; }
.mp-del-btn:hover { color: #f87171; }

.mp-add-chip {
  display: flex; align-items: center; gap: 5px;
  font-size: 12px; font-weight: 600;
  color: var(--mp-accent-gold); background: var(--mp-accent-gold-glow);
  border: 1px solid var(--mp-accent-gold)30; border-radius: 20px;
  padding: 6px 12px; cursor: pointer;
}
.mp-add-chip:hover { background: var(--mp-accent-gold)25; }

/* loan card */
.mp-loan-card {
  background: var(--mp-card-bg);
  border: 1px solid var(--mp-border);
  border-radius: 18px; padding: 16px;
  animation: mpSlide 0.35s ease-out both;
}
.mp-loan-card--done { border-style: dashed; }
.mp-loan-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
.mp-loan-left { display: flex; align-items: flex-start; gap: 10px; }
.mp-loan-right { text-align: right; }
.mp-loan-badge { font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 6px; white-space: nowrap; }
.mp-badge-given { background: #10b98118; color: #34d399; border: 1px solid #10b98130; }
.mp-badge-taken { background: #ef444418; color: #f87171; border: 1px solid #ef444430; }
.mp-loan-name { font-size: 15px; font-weight: 600; color: var(--mp-text-primary); }
.mp-loan-due { font-size: 11px; color: var(--mp-text-muted); margin-top: 2px; }
.mp-loan-due--over { color: #f87171 !important; }
.mp-loan-note { font-size: 11px; color: var(--mp-text-muted); margin-top: 2px; }
.mp-loan-bal { font-size: 18px; font-weight: 800; display: block; }
.mp-loan-init { font-size: 11px; color: var(--mp-text-muted); display: block; margin-top: 2px; }
.mp-loan-prog { margin-bottom: 12px; }
.mp-loan-prog-track { height: 3px; background: var(--mp-border); border-radius: 999px; overflow: hidden; margin-bottom: 4px; }
.mp-loan-prog-fill { height: 100%; border-radius: 999px; transition: width 0.8s cubic-bezier(0.34,1.1,0.64,1); }
.mp-loan-prog-pct { font-size: 10px; color: var(--mp-text-muted); }
.mp-loan-actions { display: flex; gap: 6px; }
.mp-action-btn {
  display: flex; align-items: center; gap: 4px;
  padding: 6px 10px; border-radius: 8px; border: none;
  font-size: 11px; font-weight: 500; cursor: pointer;
  transition: opacity 0.15s, transform 0.15s;
}
.mp-action-btn:active { transform: scale(0.94); }
.mp-action-hist { background: var(--mp-border); color: var(--mp-text-muted); }
.mp-action-rep  { background: #1e1018; color: #f87171; }
.mp-action-add  { background: #0e1e18; color: #34d399; }
.mp-action-edit { background: #101828; color: #60a5fa; }
.mp-action-react{ background: #1e1808; color: #fbbf24; }
.mp-action-del  { background: #1e1018; color: #f87171; margin-left: auto; }

/* empty */
.mp-empty {
  display: flex; flex-direction: column; align-items: center;
  gap: 10px; padding: 56px 0; color: var(--mp-text-muted);
}
.mp-empty-icon { opacity: 0.5; }
.mp-empty-text { font-size: 15px; color: var(--mp-text-secondary); font-weight: 500; }
.mp-empty-sub { font-size: 12px; }

/* animations */
.mp-fade { animation: mpFade 0.3s ease-out; }
@keyframes mpFade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
@keyframes mpSlide { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

/* Modal styles (same as before, using variables) */
.mo-backdrop {
  position: fixed; inset: 0; z-index: 300;
  background: rgba(0,0,0,0.7);
  backdrop-filter: blur(8px);
  display: flex; align-items: flex-end; justify-content: center;
  animation: stFade 0.2s ease-out;
}
.mo-sheet {
  width: 100%; max-width: 480px;
  background: var(--mp-card-bg);
  border: 1px solid var(--mp-border);
  border-bottom: none;
  border-radius: 24px 24px 0 0;
  padding: 8px 20px 48px;
  max-height: 92vh; overflow-y: auto;
  animation: moSlide 0.35s cubic-bezier(0.32,1.5,0.6,1);
}
@keyframes moSlide { from { transform: translateY(80px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
@keyframes stFade { from { opacity: 0; } to { opacity: 1; } }
.mo-notch { width: 36px; height: 4px; background: var(--mp-border); border-radius: 999px; margin: 10px auto 18px; }
.mo-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
.mo-title { font-size: 18px; font-weight: 700; color: var(--mp-text-primary); }
.mo-close { width: 32px; height: 32px; border-radius: 10px; background: var(--mp-border); border: none; color: var(--mp-text-muted); display: flex; align-items: center; justify-content: center; cursor: pointer; }
.mo-type-row { display: flex; gap: 8px; margin-bottom: 16px; }
.mo-type { flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 11px; border-radius: 12px; border: 1.5px solid var(--mp-border); background: var(--mp-card-bg); color: var(--mp-text-muted); font-size: 14px; font-weight: 600; cursor: pointer; }
.mo-type--exp { background: #1e101820; border-color: #f87171; color: #f87171; }
.mo-type--inc { background: #0e1e1820; border-color: #34d399; color: #34d399; }
.mo-amount-box { display: flex; align-items: center; gap: 8px; border-radius: 16px; padding: 14px 18px; margin-bottom: 16px; border: 1.5px solid var(--mp-border); }
.mo-amount-box--exp { background: #1e101812; border-color: #f8717130; }
.mo-amount-box--inc { background: #0e1e1812; border-color: #34d39930; }
.mo-amount-box--neutral { background: var(--mp-card-bg); border-color: var(--mp-border); }
.mo-amount-sign { font-size: 22px; font-weight: 300; color: var(--mp-text-muted); }
.mo-amount-inp { flex: 1; font-size: 30px; font-weight: 800; background: transparent; border: none; outline: none; color: var(--mp-text-primary); }
.mo-cats { display: flex; flex-wrap: wrap; gap: 7px; margin-bottom: 16px; }
.mo-cat { display: flex; align-items: center; gap: 5px; padding: 7px 12px; border-radius: 999px; border: 1.5px solid var(--mp-border); background: var(--mp-card-bg); color: var(--mp-text-muted); font-size: 12px; font-weight: 500; cursor: pointer; }
.mo-cat--on { font-weight: 700; }
.mo-inp { display: block; width: 100%; background: var(--mp-card-bg); border: 1.5px solid var(--mp-border); border-radius: 12px; padding: 13px 15px; color: var(--mp-text-primary); font-size: 14px; outline: none; margin-bottom: 10px; }
.mo-inp:focus { border-color: var(--mp-accent-gold); }
.mo-submit { width: 100%; padding: 15px; border-radius: 14px; font-size: 15px; font-weight: 700; border: none; cursor: pointer; margin-top: 6px; transition: transform 0.15s; }
.mo-submit:active { transform: scale(0.97); }
.mo-submit--exp { background: linear-gradient(135deg, #c0392b, #e74c3c); color: white; }
.mo-submit--inc { background: linear-gradient(135deg, #0d9e6f, #10b981); color: white; }
.mo-submit--neu { background: linear-gradient(135deg, #c9a84c, #e8c56a); color: #080c14; }
.mo-info-pill { font-size: 13px; color: var(--mp-text-muted); background: var(--mp-border); border-radius: 10px; padding: 10px 14px; margin-bottom: 14px; }
.mo-hint { font-size: 11px; color: #f87171; margin-top: -6px; margin-bottom: 12px; }
.mo-history-stats { display: flex; justify-content: space-between; background: var(--mp-border); border-radius: 14px; padding: 14px; margin-bottom: 16px; gap: 8px; }
.mo-hstat span { font-size: 11px; color: var(--mp-text-muted); display: block; }
.mo-hstat strong { font-size: 14px; color: var(--mp-text-primary); }
.mo-history-list { max-height: 320px; overflow-y: auto; margin-bottom: 16px; display: flex; flex-direction: column; gap: 4px; }
.mo-history-row { display: flex; justify-content: space-between; align-items: center; padding: 11px 12px; border-radius: 10px; background: var(--mp-card-bg); border: 1px solid var(--mp-border); }
.mo-hist-left { display: flex; flex-direction: column; gap: 3px; }
.mo-hist-type { font-size: 14px; font-weight: 700; }
.mo-hist-add { color: #34d399; }
.mo-hist-rep { color: #f87171; }
.mo-hist-note { font-size: 11px; color: var(--mp-text-muted); }
.mo-hist-date { font-size: 11px; color: var(--mp-text-muted); }
.mo-hist-bal { font-size: 12px; color: var(--mp-text-muted); font-weight: 500; }

/* Polished light palette */
.mp-root.light {
  --mp-bg: #f6f8fc;
  --mp-hero-bg-start: #dbe7ff;
  --mp-hero-bg-end: #f6f8fc;
  --mp-card-bg: #ffffff;
  --mp-border: #dbe3ef;
  --mp-text-primary: #0f172a;
  --mp-text-secondary: #334155;
  --mp-text-muted: #64748b;
  --mp-accent-gold: #b88a28;
  --mp-accent-gold-glow: #b88a2822;
}

.mp-root.light .mp-hero-bg {
  background: radial-gradient(ellipse 85% 65% at 50% 0%, #dce7ff 0%, #f6f8fc 72%);
}

.mp-root.light .mp-hero-orb1 {
  background: radial-gradient(circle, #f6c45340, transparent 72%);
}

.mp-root.light .mp-hero-orb2 {
  background: radial-gradient(circle, #7c8cff26, transparent 72%);
}

.mp-root.light .mp-fab {
  background: linear-gradient(135deg, #b88a28, #d6ab4e);
  color: #ffffff;
  box-shadow: 0 8px 24px #b88a2838;
}

.mp-root.light .mp-tabbar,
.mp-root.light .mo-sheet,
.mp-root.light .mo-type,
.mp-root.light .mo-cat,
.mp-root.light .mo-inp,
.mp-root.light .mo-history-row,
.mp-root.light .mp-action-hist {
  background: #ffffff;
}

.mp-root.light .mp-stat-row,
.mp-root.light .mp-loan-summary,
.mp-root.light .mp-txn-card,
.mp-root.light .mp-loan-card,
.mp-root.light .mo-sheet,
.mp-root.light .mo-type,
.mp-root.light .mo-cat,
.mp-root.light .mo-inp,
.mp-root.light .mo-history-row,
.mp-root.light .mp-action-hist,
.mp-root.light .mo-info-pill,
.mp-root.light .mo-history-stats {
  border-color: #dbe3ef;
}

.mp-root.light .mp-progress-track,
.mp-root.light .mp-cat-track,
.mp-root.light .mp-loan-prog-track,
.mp-root.light .mo-info-pill,
.mp-root.light .mo-history-stats,
.mp-root.light .mo-close {
  background: #f1f5fb;
}

.mp-root.light .mp-section-title,
.mp-root.light .mp-progress-labels,
.mp-root.light .mp-cat-pct,
.mp-root.light .mp-loan-col-label,
.mp-root.light .mp-loan-due,
.mp-root.light .mp-loan-note,
.mp-root.light .mp-loan-init,
.mp-root.light .mp-loan-prog-pct,
.mp-root.light .mp-txn-meta,
.mp-root.light .mp-loan-arrow,
.mp-root.light .mo-hstat span,
.mp-root.light .mo-hist-note,
.mp-root.light .mo-hist-date,
.mp-root.light .mo-hist-bal,
.mp-root.light .mo-close {
  color: #64748b;
}

.mp-root.light .mp-action-hist { color: #475569; }
.mp-root.light .mp-action-rep { background: #fef2f2; color: #dc2626; }
.mp-root.light .mp-action-add { background: #ecfdf5; color: #059669; }
.mp-root.light .mp-action-edit { background: #eff6ff; color: #2563eb; }
.mp-root.light .mp-action-react { background: #fffbeb; color: #d97706; }
.mp-root.light .mp-action-del { background: #fef2f2; color: #dc2626; }

.mp-root.light .mp-add-chip {
  color: #9a6f16;
  background: #fff5dc;
  border-color: #f2d797;
}

.mp-root.light .mp-add-chip:hover { background: #ffefc7; }

.mp-root.light .mo-submit--neu {
  background: linear-gradient(135deg, #b88a28, #d6ab4e);
  color: #ffffff;
}
`

// export const dynamic = 'force-dynamic'
