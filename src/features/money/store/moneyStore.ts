import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  Transaction, Loan, MonthlyBudget, SavingsGoal, Wallet, Subscription, LoanEntry, FinancialInsight
} from '@/lib/types'
import { generateId } from '@/lib/utils/helpers'
import { toLocalDateISO } from '@/features/money/utils'

// ─── Undo Action Types ───
type MoneyUndoAction =
  | { type: 'deleteTxn'; transaction: Transaction }
  | { type: 'deleteLoan'; loan: Loan }
  | { type: 'updateLoan'; id: string; previous: Partial<Loan> }
  | { type: 'bulkDeleteTxn'; transactions: Transaction[] }

interface MoneyState {
  transactions: Transaction[]
  loans: Loan[]
  budgets: MonthlyBudget[]
  savingsGoals: SavingsGoal[]
  wallets: Wallet[]
  subscriptions: Subscription[]
  insights: FinancialInsight[]

  // ── UI State ──
  selectedWalletId: string | null
  viewMode: 'overview' | 'transactions' | 'loans' | 'analytics' | 'budget' | 'goals'
  timeRange: 'week' | 'month' | 'quarter' | 'year'
  searchQuery: string
  sortMode: 'date' | 'amount' | 'category'
  filterCategory: string | null
  filterType: 'all' | 'income' | 'expense'

  // ── Actions: Transactions ──
  addTransaction: (t: Omit<Transaction, 'id' | 'createdAt' | 'status'>) => void
  updateTransaction: (id: string, updates: Partial<Transaction>) => void
  deleteTransaction: (id: string) => void
  bulkDeleteTransactions: (ids: string[]) => void
  getMonthSummary: (month: string) => { income: number; expense: number; balance: number }
  getCategoryBreakdown: (month: string) => Record<string, number>

  // ── Actions: Loans ──
  addLoan: (l: Omit<Loan, 'id' | 'entries' | 'currentBalance' | 'status' | 'reminderEnabled'>) => void
  updateLoan: (id: string, updates: Partial<Loan>) => void
  deleteLoan: (id: string) => void
  settleLoan: (id: string) => void
  reactivateLoan: (id: string) => void
  addLoanEntry: (loanId: string, amount: number, note: string, date: string) => void
  getLoanStatus: (loan: Loan) => 'active' | 'settled' | 'overdue'

  // ── Actions: Budgets ──
  setBudget: (budget: MonthlyBudget) => void
  getBudgetForMonth: (month: string) => MonthlyBudget | undefined

  // ── Actions: Savings Goals ──
  addSavingsGoal: (g: Omit<SavingsGoal, 'id' | 'createdAt'>) => void
  updateSavingsGoal: (id: string, updates: Partial<SavingsGoal>) => void
  deleteSavingsGoal: (id: string) => void
  contributeToGoal: (id: string, amount: number) => void

  // ── Actions: Wallets ──
  addWallet: (w: Omit<Wallet, 'id'>) => void
  updateWallet: (id: string, updates: Partial<Wallet>) => void
  deleteWallet: (id: string) => void
  setDefaultWallet: (id: string) => void
  transferWalletBalance: (fromWalletId: string, toWalletId: string, amount: number) => void
  reconcileWalletBalance: (walletId: string, balance: number) => void

  // ── Actions: Subscriptions ──
  addSubscription: (s: Omit<Subscription, 'id'>) => void
  updateSubscription: (id: string, updates: Partial<Subscription>) => void
  deleteSubscription: (id: string) => void
  pauseSubscription: (id: string) => void
  resumeSubscription: (id: string) => void

  // ── Actions: Insights ──
  generateInsights: () => void
  dismissInsight: (id: string) => void
  markInsightRead: (id: string) => void

  // ── Undo ──
  undoStack: MoneyUndoAction[]
  canUndo: boolean
  undo: () => void

  // ── UI Setters ──
  setSelectedWallet: (id: string | null) => void
  setViewMode: (mode: MoneyState['viewMode']) => void
  setTimeRange: (range: MoneyState['timeRange']) => void
  setSearchQuery: (q: string) => void
  setSortMode: (mode: MoneyState['sortMode']) => void
  setFilterCategory: (cat: string | null) => void
  setFilterType: (type: MoneyState['filterType']) => void
}

export const useMoneyStore = create<MoneyState>()(
  persist(
    (set, get) => ({
      transactions: [],
      loans: [],
      budgets: [],
      savingsGoals: [],
      wallets: [
        { id: 'default', name: 'Cash', type: 'cash', balance: 0, currency: 'BDT', color: '#10b981', icon: '💵', isDefault: true }
      ],
      subscriptions: [],
      insights: [],
      selectedWalletId: 'default',
      viewMode: 'overview',
      timeRange: 'month',
      searchQuery: '',
      sortMode: 'date',
      filterCategory: null,
      filterType: 'all',
      undoStack: [],
      canUndo: false,

      // ── Transactions ──
      addTransaction: (t) =>
        set((s) => {
          const txn: Transaction = {
            ...t,
            id: generateId(),
            createdAt: new Date().toISOString(),
            status: 'completed',
          }
          // Update wallet balance
          const wallets = s.wallets.map((w) =>
            w.id === (t.walletId || s.selectedWalletId || 'default')
              ? { ...w, balance: w.balance + (t.type === 'income' ? t.amount : -t.amount) }
              : w
          )
          return { transactions: [txn, ...s.transactions], wallets }
        }),

      updateTransaction: (id, updates) =>
        set((s) => {
          const previous = s.transactions.find((t) => t.id === id)
          if (!previous) return s
          const next = { ...previous, ...updates }
          const previousWalletId = previous.walletId || s.selectedWalletId || 'default'
          const nextWalletId = next.walletId || s.selectedWalletId || 'default'
          const reversePrevious = previous.type === 'income' ? -previous.amount : previous.amount
          const applyNext = next.type === 'income' ? next.amount : -next.amount
          const wallets = s.wallets.map((w) => {
            let balance = w.balance
            if (w.id === previousWalletId) balance += reversePrevious
            if (w.id === nextWalletId) balance += applyNext
            return balance === w.balance ? w : { ...w, balance }
          })
          return {
            transactions: s.transactions.map((t) => (t.id === id ? next : t)),
            wallets,
          }
        }),

      deleteTransaction: (id) =>
        set((s) => {
          const txn = s.transactions.find((t) => t.id === id)
          if (!txn) return s
          // Reverse wallet balance
          const wallets = s.wallets.map((w) =>
            w.id === (txn.walletId || s.selectedWalletId || 'default')
              ? { ...w, balance: w.balance + (txn.type === 'income' ? -txn.amount : txn.amount) }
              : w
          )
          return {
            transactions: s.transactions.filter((t) => t.id !== id),
            wallets,
            undoStack: [{ type: 'deleteTxn' as const, transaction: txn }, ...s.undoStack].slice(0, 50),
            canUndo: true,
          }
        }),

      bulkDeleteTransactions: (ids) =>
        set((s) => {
          const toDelete = s.transactions.filter((t) => ids.includes(t.id))
          return {
            transactions: s.transactions.filter((t) => !ids.includes(t.id)),
            undoStack: [{ type: 'bulkDeleteTxn' as const, transactions: toDelete }, ...s.undoStack].slice(0, 50),
            canUndo: true,
          }
        }),

      getMonthSummary: (month) => {
        const txns = get().transactions.filter((t) => t.date.startsWith(month) && t.status === 'completed')
        const income = txns.filter((t) => t.type === 'income').reduce((a, t) => a + t.amount, 0)
        const expense = txns.filter((t) => t.type === 'expense').reduce((a, t) => a + t.amount, 0)
        return { income, expense, balance: income - expense }
      },

      getCategoryBreakdown: (month) => {
        const txns = get().transactions.filter((t) => t.date.startsWith(month) && t.type === 'expense')
        const breakdown: Record<string, number> = {}
        txns.forEach((t) => {
          breakdown[t.category] = (breakdown[t.category] || 0) + t.amount
        })
        return breakdown
      },

      // ── Loans ──
      addLoan: (l) =>
        set((s) => ({
          loans: [
            ...s.loans,
            {
              ...l,
              id: generateId(),
              initialAmount: l.amount,
              currentBalance: l.amount,
              entries: [],
              status: 'active',
              reminderEnabled: true,
              settled: false,
            },
          ],
        })),

      updateLoan: (id, updates) =>
        set((s) => {
          const previous = s.loans.find((l) => l.id === id)
          if (!previous) return s
          return {
            loans: s.loans.map((l) => (l.id === id ? { ...l, ...updates } : l)),
            undoStack: [
              { type: 'updateLoan' as const, id, previous: { settled: previous.settled, currentBalance: previous.currentBalance } },
              ...s.undoStack,
            ].slice(0, 50),
            canUndo: true,
          }
        }),

      deleteLoan: (id) =>
        set((s) => {
          const loan = s.loans.find((l) => l.id === id)
          if (!loan) return s
          return {
            loans: s.loans.filter((l) => l.id !== id),
            undoStack: [{ type: 'deleteLoan' as const, loan }, ...s.undoStack].slice(0, 50),
            canUndo: true,
          }
        }),

      settleLoan: (id) =>
        set((s) => ({
          loans: s.loans.map((l) =>
            l.id === id ? { ...l, settled: true, status: 'settled' as const, currentBalance: 0 } : l
          ),
        })),

      reactivateLoan: (id) =>
        set((s) => ({
          loans: s.loans.map((l) =>
            l.id === id
              ? { ...l, settled: false, status: get().getLoanStatus({ ...l, settled: false }) }
              : l
          ),
        })),

      addLoanEntry: (loanId, amount, note, date) =>
        set((s) => ({
          loans: s.loans.map((l) => {
            if (l.id !== loanId) return l
            const entry: LoanEntry = {
              id: generateId(),
              type: amount > 0 ? 'added' : 'repaid',
              amount: Math.abs(amount),
              note,
              date,
              balanceAfter: l.currentBalance + amount,
            }
            const newBalance = l.currentBalance + amount
            return {
              ...l,
              currentBalance: newBalance,
              entries: [...l.entries, entry],
              settled: newBalance <= 0,
              status: newBalance <= 0 ? 'settled' : l.dueDate && new Date(l.dueDate) < new Date() ? 'overdue' : 'active',
            }
          }),
        })),

      getLoanStatus: (loan) => {
        if (loan.settled || loan.currentBalance <= 0) return 'settled'
        if (loan.dueDate && new Date(loan.dueDate) < new Date()) return 'overdue'
        return 'active'
      },

      // ── Budgets ──
      setBudget: (budget) =>
        set((s) => {
          const exists = s.budgets.find((b) => b.month === budget.month)
          return {
            budgets: exists
              ? s.budgets.map((b) => (b.month === budget.month ? budget : b))
              : [...s.budgets, budget],
          }
        }),

      getBudgetForMonth: (month) => {
        return get().budgets.find((b) => b.month === month)
      },

      // ── Savings Goals ──
      addSavingsGoal: (g) =>
        set((s) => ({
          savingsGoals: [
            ...s.savingsGoals,
            { ...g, id: generateId(), createdAt: new Date().toISOString() },
          ],
        })),

      updateSavingsGoal: (id, updates) =>
        set((s) => ({
          savingsGoals: s.savingsGoals.map((g) => (g.id === id ? { ...g, ...updates } : g)),
        })),

      deleteSavingsGoal: (id) =>
        set((s) => ({
          savingsGoals: s.savingsGoals.filter((g) => g.id !== id),
        })),

      contributeToGoal: (id, amount) =>
        set((s) => ({
          savingsGoals: s.savingsGoals.map((g) =>
            g.id === id ? { ...g, currentAmount: Math.min(g.targetAmount, g.currentAmount + amount) } : g
          ),
        })),

      // ── Wallets ──
      addWallet: (w) =>
        set((s) => ({
          wallets: [...s.wallets, { ...w, id: generateId() }],
        })),

      updateWallet: (id, updates) =>
        set((s) => ({
          wallets: s.wallets.map((w) => (w.id === id ? { ...w, ...updates } : w)),
        })),

      deleteWallet: (id) =>
        set((s) => ({
          wallets: s.wallets.filter((w) => w.id !== id),
          selectedWalletId: s.selectedWalletId === id ? s.wallets.find((w) => w.id !== id)?.id || null : s.selectedWalletId,
        })),

      setDefaultWallet: (id) =>
        set((s) => ({
          wallets: s.wallets.map((w) => ({ ...w, isDefault: w.id === id })),
        })),

      transferWalletBalance: (fromWalletId, toWalletId, amount) =>
        set((s) => {
          if (fromWalletId === toWalletId || amount <= 0) return s
          return {
            wallets: s.wallets.map((w) => {
              if (w.id === fromWalletId) return { ...w, balance: w.balance - amount }
              if (w.id === toWalletId) return { ...w, balance: w.balance + amount }
              return w
            }),
          }
        }),

      reconcileWalletBalance: (walletId, balance) =>
        set((s) => ({
          wallets: s.wallets.map((w) => (w.id === walletId ? { ...w, balance } : w)),
        })),

      // ── Subscriptions ──
      addSubscription: (sub) =>
        set((s) => ({
          subscriptions: [...s.subscriptions, { ...sub, id: generateId() }],
        })),

      updateSubscription: (id, updates) =>
        set((s) => ({
          subscriptions: s.subscriptions.map((sub) => (sub.id === id ? { ...sub, ...updates } : sub)),
        })),

      deleteSubscription: (id) =>
        set((s) => ({
          subscriptions: s.subscriptions.filter((sub) => sub.id !== id),
        })),

      pauseSubscription: (id) =>
        set((s) => ({
          subscriptions: s.subscriptions.map((sub) =>
            sub.id === id ? { ...sub, status: 'paused' as const } : sub
          ),
        })),

      resumeSubscription: (id) =>
        set((s) => ({
          subscriptions: s.subscriptions.map((sub) =>
            sub.id === id ? { ...sub, status: 'active' as const } : sub
          ),
        })),

      // ── Insights ──
      generateInsights: () => {
        const s = get()
        const insights: FinancialInsight[] = []
        const now = new Date()
        const month = toLocalDateISO(now).slice(0, 7)
        const summary = s.getMonthSummary(month)

        // Overspending warning
        const budget = s.getBudgetForMonth(month)
        if (budget && summary.expense > budget.salary * 0.9) {
          insights.push({
            id: generateId(),
            type: 'warning',
            title: 'Near budget limit',
            description: `You've spent ${Math.round((summary.expense / budget.salary) * 100)}% of your monthly budget.`,
            severity: 'high',
            date: now.toISOString(),
            read: false,
          })
        }

        // Savings tip
        if (summary.income > 0 && summary.expense / summary.income > 0.8) {
          insights.push({
            id: generateId(),
            type: 'tip',
            title: 'Increase savings',
            description: 'Your expense-to-income ratio is high. Consider reviewing non-essential spending.',
            severity: 'medium',
            date: now.toISOString(),
            read: false,
          })
        }

        // Goal achievement
        s.savingsGoals.forEach((g) => {
          const pct = (g.currentAmount / g.targetAmount) * 100
          if (pct >= 100) {
            insights.push({
              id: generateId(),
              type: 'achievement',
              title: `Goal reached: ${g.title}`,
              description: `Congratulations! You've saved ${g.targetAmount.toLocaleString()} for ${g.title}.`,
              severity: 'low',
              date: now.toISOString(),
              read: false,
            })
          }
        })

        set({ insights: [...insights, ...s.insights].slice(0, 20) })
      },

      dismissInsight: (id) =>
        set((s) => ({
          insights: s.insights.filter((i) => i.id !== id),
        })),

      markInsightRead: (id) =>
        set((s) => ({
          insights: s.insights.map((i) => (i.id === id ? { ...i, read: true } : i)),
        })),

      // ── Undo ──
      undo: () =>
        set((s) => {
          const [action, ...rest] = s.undoStack
          if (!action) return { canUndo: false }

          let newState: Partial<MoneyState> = {}
          if (action.type === 'deleteTxn') {
            newState = { transactions: [action.transaction, ...s.transactions] }
          } else if (action.type === 'deleteLoan') {
            newState = { loans: [...s.loans, action.loan] }
          } else if (action.type === 'updateLoan') {
            newState = {
              loans: s.loans.map((l) =>
                l.id === action.id ? { ...l, ...action.previous } : l
              ),
            }
          } else if (action.type === 'bulkDeleteTxn') {
            newState = { transactions: [...s.transactions, ...action.transactions] }
          }

          return { ...newState, undoStack: rest, canUndo: rest.length > 0 }
        }),

      // ── UI Setters ──
      setSelectedWallet: (id) => set({ selectedWalletId: id }),
      setViewMode: (mode) => set({ viewMode: mode }),
      setTimeRange: (range) => set({ timeRange: range }),
      setSearchQuery: (q) => set({ searchQuery: q }),
      setSortMode: (mode) => set({ sortMode: mode }),
      setFilterCategory: (cat) => set({ filterCategory: cat }),
      setFilterType: (type) => set({ filterType: type }),
    }),
    {
      name: 'selfsync-money-v2',
      partialize: (state) => ({
        transactions: state.transactions,
        loans: state.loans,
        budgets: state.budgets,
        savingsGoals: state.savingsGoals,
        wallets: state.wallets,
        subscriptions: state.subscriptions,
        insights: state.insights,
      }),
    }
  )
)
