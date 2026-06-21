import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  Transaction, Loan, MonthlyBudget, SavingsGoal, Wallet, Subscription, LoanEntry, FinancialInsight,
  CategoryLimit, RecurringTemplate, Asset, NetWorthSnapshot, SpendingPulse, ExpenseCategory
} from '@/lib/types'
import { generateId } from '@/lib/utils/helpers'
import { toLocalDateISO, todayISO } from '@/features/money/utils'

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

  // ── Phase 1+2 Premium State ──
  categoryLimits: CategoryLimit[]
  recurringTemplates: RecurringTemplate[]
  assets: Asset[]
  netWorthHistory: NetWorthSnapshot[]

  // ── UI State ──
  selectedWalletId: string | null
  viewMode: 'overview' | 'transactions' | 'loans' | 'analytics' | 'budget' | 'goals' | 'bills'
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

  // ── Phase 1+2 Premium Actions ──
  setCategoryLimit: (limit: CategoryLimit) => void
  removeCategoryLimit: (category: ExpenseCategory) => void
  getSpendingPulse: () => SpendingPulse

  // Recurring Templates
  addRecurringTemplate: (t: Omit<RecurringTemplate, 'id'>) => void
  updateRecurringTemplate: (id: string, updates: Partial<RecurringTemplate>) => void
  deleteRecurringTemplate: (id: string) => void
  pauseRecurringTemplate: (id: string) => void
  resumeRecurringTemplate: (id: string) => void
  processRecurringTemplates: () => void

  // Assets & Net Worth
  addAsset: (a: Omit<Asset, 'id'>) => void
  updateAsset: (id: string, updates: Partial<Asset>) => void
  deleteAsset: (id: string) => void
  calculateNetWorth: () => { totalAssets: number; totalLiabilities: number; netWorth: number }

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
      categoryLimits: [],
      recurringTemplates: [],
      assets: [],
      netWorthHistory: [],
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

        // Category limit alerts
        s.categoryLimits.forEach((cl) => {
          if (!cl.enabled) return
          const spent = s.getCategoryBreakdown(month)[cl.category] || 0
          const pct = cl.monthlyLimit > 0 ? (spent / cl.monthlyLimit) * 100 : 0
          if (pct >= cl.alertAtPercent && pct < 100) {
            insights.push({
              id: generateId(),
              type: 'warning',
              title: `${cl.category} limit approaching`,
              description: `You've used ${Math.round(pct)}% of your ${cl.category} budget.`,
              severity: 'medium',
              date: now.toISOString(),
              read: false,
            })
          }
          if (pct >= 100) {
            insights.push({
              id: generateId(),
              type: 'warning',
              title: `${cl.category} limit exceeded`,
              description: `You've exceeded your ${cl.category} budget by ${formatCurrency(spent - cl.monthlyLimit, '৳')}.`,
              severity: 'high',
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

      // ── Phase 1+2: Category Limits ──
      setCategoryLimit: (limit) =>
        set((s) => {
          const exists = s.categoryLimits.find((cl) => cl.category === limit.category)
          return {
            categoryLimits: exists
              ? s.categoryLimits.map((cl) => (cl.category === limit.category ? limit : cl))
              : [...s.categoryLimits, limit],
          }
        }),

      removeCategoryLimit: (category) =>
        set((s) => ({
          categoryLimits: s.categoryLimits.filter((cl) => cl.category !== category),
        })),

      getSpendingPulse: () => {
        const s = get()
        const today = todayISO()
        const todaySpent = s.transactions
          .filter((t) => t.type === 'expense' && t.date === today && t.status === 'completed')
          .reduce((sum, t) => sum + t.amount, 0)
        const month = today.slice(0, 7)
        const budget = s.getBudgetForMonth(month)
        const daysInMonth = new Date(parseInt(month.slice(0, 4)), parseInt(month.slice(5, 7)), 0).getDate()
        const dayOfMonth = new Date().getDate()
        const dailyBudget = budget ? budget.salary / daysInMonth : 0
        const percentUsed = dailyBudget > 0 ? (todaySpent / dailyBudget) * 100 : 0
        const status: 'green' | 'amber' | 'red' = percentUsed < 70 ? 'green' : percentUsed < 100 ? 'amber' : 'red'
        return { todaySpent, dailyBudget, percentUsed, status }
      },

      // ── Phase 1+2: Recurring Templates ──
      addRecurringTemplate: (t) =>
        set((s) => ({
          recurringTemplates: [...s.recurringTemplates, { ...t, id: generateId() }],
        })),

      updateRecurringTemplate: (id, updates) =>
        set((s) => ({
          recurringTemplates: s.recurringTemplates.map((rt) =>
            rt.id === id ? { ...rt, ...updates } : rt
          ),
        })),

      deleteRecurringTemplate: (id) =>
        set((s) => ({
          recurringTemplates: s.recurringTemplates.filter((rt) => rt.id !== id),
        })),

      pauseRecurringTemplate: (id) =>
        set((s) => ({
          recurringTemplates: s.recurringTemplates.map((rt) =>
            rt.id === id ? { ...rt, status: 'paused' as const } : rt
          ),
        })),

      resumeRecurringTemplate: (id) =>
        set((s) => ({
          recurringTemplates: s.recurringTemplates.map((rt) =>
            rt.id === id ? { ...rt, status: 'active' as const } : rt
          ),
        })),

      processRecurringTemplates: () => {
        const s = get()
        const today = todayISO()
        const newTransactions: Transaction[] = []
        const updatedTemplates = s.recurringTemplates.map((rt) => {
          if (rt.status !== 'active' || rt.nextDate > today) return rt
          const txn: Transaction = {
            id: generateId(),
            type: rt.type,
            amount: rt.amount,
            category: rt.category as any,
            note: rt.note || `Recurring: ${rt.type}`,
            date: today,
            createdAt: new Date().toISOString(),
            isRecurring: true,
            recurringInterval: rt.interval,
            tags: rt.tags,
            status: 'completed',
            walletId: rt.walletId,
          }
          newTransactions.push(txn)
          let nextDate = new Date(today)
          switch (rt.interval) {
            case 'daily': nextDate.setDate(nextDate.getDate() + 1); break
            case 'weekly': nextDate.setDate(nextDate.getDate() + 7); break
            case 'monthly': nextDate.setMonth(nextDate.getMonth() + 1); break
            case 'yearly': nextDate.setFullYear(nextDate.getFullYear() + 1); break
          }
          return { ...rt, nextDate: toLocalDateISO(nextDate) }
        })

        if (newTransactions.length > 0) {
          set((state) => ({
            transactions: [...newTransactions, ...state.transactions],
            recurringTemplates: updatedTemplates,
            wallets: (() => {
              let updatedWallets = [...state.wallets]
              newTransactions.forEach((txn) => {
                const walletId = txn.walletId || state.selectedWalletId || 'default'
                updatedWallets = updatedWallets.map((w) =>
                  w.id === walletId
                    ? { ...w, balance: w.balance + (txn.type === 'income' ? txn.amount : -txn.amount) }
                    : w
                )
              })
              return updatedWallets
            })(),
          }))
        }
      },

      // ── Phase 1+2: Assets & Net Worth ──
      addAsset: (a) =>
        set((s) => ({
          assets: [...s.assets, { ...a, id: generateId() }],
        })),

      updateAsset: (id, updates) =>
        set((s) => ({
          assets: s.assets.map((a) => (a.id === id ? { ...a, ...updates } : a)),
        })),

      deleteAsset: (id) =>
        set((s) => ({
          assets: s.assets.filter((a) => a.id !== id),
        })),

      calculateNetWorth: () => {
        const s = get()
        const totalAssets = s.assets.reduce((sum, a) => sum + a.value, 0) +
          s.wallets.reduce((sum, w) => sum + w.balance, 0) +
          s.savingsGoals.reduce((sum, g) => sum + g.currentAmount, 0)
        const totalLiabilities = s.loans
          .filter((l) => l.direction === 'taken' && !l.settled)
          .reduce((sum, l) => sum + l.currentBalance, 0)
        const netWorth = totalAssets - totalLiabilities
        const snapshot: NetWorthSnapshot = {
          date: todayISO(),
          totalAssets,
          totalLiabilities,
          netWorth,
        }
        set((state) => ({
          netWorthHistory: [...state.netWorthHistory, snapshot].slice(-365),
        }))
        return snapshot
      },

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
        categoryLimits: state.categoryLimits,
        recurringTemplates: state.recurringTemplates,
        assets: state.assets,
        netWorthHistory: state.netWorthHistory,
      }),
    }
  )
)

function formatCurrency(amount: number, symbol: string) {
  return `${symbol}${amount.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}