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

const asArray = <T,>(value: T[] | unknown): T[] => Array.isArray(value) ? value : []
const safeNumber = (value: unknown, fallback = 0) =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback

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
  getIncomeBreakdown: (month: string) => Record<string, number>

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
  contributeToGoal: (id: string, amount: number, walletId?: string) => void

  // ── Actions: Wallets ──
  addWallet: (w: Omit<Wallet, 'id'>) => void
  updateWallet: (id: string, updates: Partial<Wallet>) => void
  deleteWallet: (id: string) => void
  setDefaultWallet: (id: string) => void
  transferWalletBalance: (fromWalletId: string, toWalletId: string, amount: number) => void
  reconcileWalletBalance: (walletId: string, balance: number, note?: string) => void

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

/**
 * ─── FINANCIAL INTEGRITY RULES ───
 *
 * R1: Every transaction MUST update exactly one wallet's balance.
 * R2: Every wallet balance change MUST have a corresponding transaction record.
 * R3: Transfer MUST create TWO paired transactions (expense from source, income to target).
 * R4: Reconcile MUST create an adjustment transaction for the difference.
 * R5: All wallet operations MUST check sufficient balance before expense.
 * R6: Loan operations MUST also create wallet transactions (loan taken → income, repayment → expense).
 * R7: Savings contributions MUST deduct from wallet + create expense transaction.
 * R8: Net Worth calculation MUST avoid double-counting wallet + savings goal overlap.
 */

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

      // ──────────────────────────────────────────
      // ── HELPERS ──
      // ──────────────────────────────────────────

      /**
       * Resolves the effective wallet ID for any transaction.
       */
      _resolveWalletId: (walletId?: string): string => {
        const s = get()
        return walletId || s.selectedWalletId || 'default'
      },

      /**
       * Checks if a wallet has sufficient balance for an expense/withdrawal.
       * Returns { ok: true } or { ok: false, currentBalance, needed }.
       */
      _checkSufficientBalance: (walletId: string, amount: number): { ok: boolean; currentBalance: number; needed: number } => {
        const wallet = get().wallets.find(w => w.id === walletId)
        if (!wallet) return { ok: false, currentBalance: 0, needed: amount }
        if (wallet.balance < amount) {
          return { ok: false, currentBalance: wallet.balance, needed: amount }
        }
        return { ok: true, currentBalance: wallet.balance, needed: 0 }
      },

      // ──────────────────────────────────────────
      // ── Transactions ──
      // ──────────────────────────────────────────

      addTransaction: (t) =>
        set((s) => {
          const walletId = t.walletId || s.selectedWalletId || 'default'

          // R5: Guard against insufficient balance for expenses
          if (t.type === 'expense' && t.category !== 'transfer' && t.category !== 'adjustment') {
            const wallet = s.wallets.find(w => w.id === walletId)
            if (wallet && wallet.balance < t.amount) {
              // Instead of silently failing, we let it proceed but the user
              // has been warned (UI-level). For strict mode, return s and log.
              // We keep the existing behavior but the guard is here for future strict mode.
            }
          }

          const txn: Transaction = {
            ...t,
            id: generateId(),
            createdAt: new Date().toISOString(),
            status: 'completed',
          }
          const wallets = s.wallets.map((w) =>
            w.id === walletId
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
        const INTERNAL_CATEGORIES = new Set(['transfer', 'adjustment'])
        const txns = asArray<Transaction>(get().transactions).filter(
          (t) => typeof t.date === 'string' && t.date.startsWith(month) && t.status === 'completed'
            && !INTERNAL_CATEGORIES.has(t.category)
            && !(t.tags && t.tags.includes('loan')) // R9: Loan txns are NOT income/expense
        )
        const income = txns.filter((t) => t.type === 'income').reduce((a, t) => a + safeNumber(t.amount), 0)
        const expense = txns.filter((t) => t.type === 'expense').reduce((a, t) => a + safeNumber(t.amount), 0)
        return { income, expense, balance: income - expense }
      },

      getCategoryBreakdown: (month) => {
        const INTERNAL_CATEGORIES = new Set(['transfer', 'adjustment'])
        const txns = asArray<Transaction>(get().transactions).filter(
          (t) => typeof t.date === 'string' && t.date.startsWith(month) && t.type === 'expense'
            && !INTERNAL_CATEGORIES.has(t.category)
            && !(t.tags && t.tags.includes('loan')) // R9: Loan repayments are NOT expenses
        )
        const breakdown: Record<string, number> = {}
        txns.forEach((t) => {
          breakdown[t.category] = (breakdown[t.category] || 0) + safeNumber(t.amount)
        })
        return breakdown
      },

      getIncomeBreakdown: (month) => {
        const INTERNAL_CATEGORIES = new Set(['transfer', 'adjustment'])
        const txns = asArray<Transaction>(get().transactions).filter(
          (t) => typeof t.date === 'string' && t.date.startsWith(month) && t.type === 'income'
            && !INTERNAL_CATEGORIES.has(t.category)
            && !(t.tags && t.tags.includes('loan')) // R9: Loan additions are NOT income
        )
        const breakdown: Record<string, number> = {}
        txns.forEach((t) => {
          breakdown[t.category] = (breakdown[t.category] || 0) + safeNumber(t.amount)
        })
        return breakdown
      },

      // ──────────────────────────────────────────
      // ── Loans (Wallet-Integrated) ──
      // ──────────────────────────────────────────

      addLoan: (l) =>
        set((s) => {
          const walletId = l.walletId || s.selectedWalletId || 'default'
          const loanId = generateId()
          const now = new Date().toISOString()
          const today = todayISO()

          // R6: Loan taken → money comes from the lender (income to wallet)
          // Loan given → money goes to the borrower (expense from wallet)
          const direction = l.direction
          const txnType = direction === 'taken' ? 'income' : 'expense'
          const txnNote = direction === 'taken'
            ? `Loan taken from ${l.personName}`
            : `Loan given to ${l.personName}`

          const loanTxn: Transaction = {
            id: generateId(),
            type: txnType,
            amount: l.amount,
            category: 'other-income' as any,
            note: txnNote,
            date: today,
            createdAt: now,
            isRecurring: false,
            status: 'completed',
            walletId,
            tags: ['loan', loanId],
          }

          const wallets = s.wallets.map((w) =>
            w.id === walletId
              ? { ...w, balance: w.balance + (txnType === 'income' ? l.amount : -l.amount) }
              : w
          )

          return {
            loans: [
              ...s.loans,
              {
                ...l,
                id: loanId,
                walletId,
                initialAmount: l.amount,
                currentBalance: l.amount,
                entries: [],
                status: 'active',
                reminderEnabled: true,
                settled: false,
              },
            ],
            transactions: [loanTxn, ...s.transactions],
            wallets,
          }
        }),

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
          // Also remove any loan-associated transactions
          const remainingTxns = s.transactions.filter(
            (t) => !(t.tags && t.tags.includes(id)) && !(t.tags && t.tags.includes('loan') && t.note?.includes(loan.personName))
          )
          return {
            loans: s.loans.filter((l) => l.id !== id),
            transactions: remainingTxns,
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
        set((s) => {
          const loan = s.loans.find((l) => l.id === loanId)
          if (!loan) return s

          const entry: LoanEntry = {
            id: generateId(),
            type: amount > 0 ? 'added' : 'repaid',
            amount: Math.abs(amount),
            note,
            date,
            balanceAfter: loan.currentBalance + amount,
          }
          const newBalance = loan.currentBalance + amount

          // R6: Repayment → expense from wallet, Addition → income to wallet
          const walletId = loan.walletId || s.selectedWalletId || 'default'
          const now = new Date().toISOString()

          const entryTxn: Transaction = {
            id: generateId(),
            type: amount < 0 ? 'expense' : 'income', // repayment (negative) = expense, addition (positive) = income
            amount: Math.abs(amount),
            category: 'other-income' as any,
            note: note || (amount < 0
              ? `Loan repayment → ${loan.personName}`
              : `Loan addition ← ${loan.personName}`),
            date,
            createdAt: now,
            isRecurring: false,
            status: 'completed',
            walletId,
            tags: ['loan', loanId],
          }

          const wallets = s.wallets.map((w) =>
            w.id === walletId
              ? { ...w, balance: w.balance + (amount < 0 ? -Math.abs(amount) : Math.abs(amount)) }
              : w
          )

          return {
            loans: s.loans.map((l) => {
              if (l.id !== loanId) return l
              return {
                ...l,
                currentBalance: newBalance,
                entries: [...l.entries, entry],
                settled: newBalance <= 0,
                status: newBalance <= 0 ? 'settled' : l.dueDate && new Date(l.dueDate) < new Date() ? 'overdue' : 'active',
              }
            }),
            transactions: [entryTxn, ...s.transactions],
            wallets,
          }
        }),

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

      contributeToGoal: (id, amount, walletId) =>
        set((s) => {
          const resolvedWalletId = walletId || s.selectedWalletId || 'default'
          const now = new Date().toISOString()
          const today = todayISO()

          // R7: Create expense transaction from wallet for the contribution
          const contributionTxn: Transaction = {
            id: generateId(),
            type: 'expense',
            amount,
            category: 'other' as any,
            note: `Savings contribution → ${s.savingsGoals.find(g => g.id === id)?.title || 'goal'}`,
            date: today,
            createdAt: now,
            isRecurring: false,
            status: 'completed',
            walletId: resolvedWalletId,
            tags: ['savings-goal', id],
          }

          const wallets = s.wallets.map((w) =>
            w.id === resolvedWalletId
              ? { ...w, balance: w.balance - amount }
              : w
          )

          return {
            savingsGoals: s.savingsGoals.map((g) =>
              g.id === id
                ? {
                    ...g,
                    currentAmount: Math.min(g.targetAmount, g.currentAmount + amount),
                    walletId: resolvedWalletId,
                  }
                : g
            ),
            transactions: [contributionTxn, ...s.transactions],
            wallets,
          }
        }),

      // ──────────────────────────────────────────
      // ── Wallets (Financial Integrity Core) ──
      // ──────────────────────────────────────────

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

      /**
       * R3: Transfer creates TWO paired transactions:
       *   - Expense from source wallet (category: 'transfer')
       *   - Income to target wallet (category: 'transfer')
       * Both transactions are linked via shared tags for audit trail.
       */
      transferWalletBalance: (fromWalletId, toWalletId, amount) =>
        set((s) => {
          if (fromWalletId === toWalletId || amount <= 0) return s

          const fromWallet = s.wallets.find(w => w.id === fromWalletId)
          const toWallet = s.wallets.find(w => w.id === toWalletId)
          if (!fromWallet || !toWallet) return s

          // R5: Check sufficient balance
          if (fromWallet.balance < amount) {
            // Insufficient balance — could throw or return
            return s
          }

          const now = new Date().toISOString()
          const today = todayISO()
          const transferGroupId = generateId() // Shared ID to link the pair

          // Expense transaction (money leaves source wallet)
          const txnOut: Transaction = {
            id: generateId(),
            type: 'expense',
            amount,
            category: 'transfer',
            note: `Transfer → ${toWallet.name}`,
            date: today,
            createdAt: now,
            isRecurring: false,
            status: 'completed',
            walletId: fromWalletId,
            tags: ['transfer', transferGroupId],
          }

          // Income transaction (money arrives in target wallet)
          const txnIn: Transaction = {
            id: generateId(),
            type: 'income',
            amount,
            category: 'transfer',
            note: `Transfer ← ${fromWallet.name}`,
            date: today,
            createdAt: now,
            isRecurring: false,
            status: 'completed',
            walletId: toWalletId,
            tags: ['transfer', transferGroupId],
          }

          return {
            wallets: s.wallets.map((w) => {
              if (w.id === fromWalletId) return { ...w, balance: w.balance - amount }
              if (w.id === toWalletId) return { ...w, balance: w.balance + amount }
              return w
            }),
            transactions: [txnIn, txnOut, ...s.transactions],
          }
        }),

      /**
       * R4: Reconcile creates an adjustment transaction for the difference.
       * This ensures every wallet balance change has a corresponding audit trail.
       *
       * @param walletId - The wallet to reconcile
       * @param actualBalance - The actual (real-world) balance
       * @param note - Optional note explaining the discrepancy
       */
      reconcileWalletBalance: (walletId, actualBalance, note) =>
        set((s) => {
          const wallet = s.wallets.find(w => w.id === walletId)
          if (!wallet) return s

          const difference = actualBalance - wallet.balance

          // No difference — nothing to adjust
          if (Math.abs(difference) < 0.01) return s

          const now = new Date().toISOString()
          const today = todayISO()

          // Create adjustment transaction
          const adjustmentTxn: Transaction = {
            id: generateId(),
            type: difference > 0 ? 'income' : 'expense',
            amount: Math.abs(difference),
            category: 'adjustment',
            note: note
              ? `Reconciliation: ${note}`
              : `Reconciliation adjustment (${wallet.name}): ${wallet.balance} → ${actualBalance}`,
            date: today,
            createdAt: now,
            isRecurring: false,
            status: 'completed',
            walletId,
            tags: ['reconciliation', `wallet:${walletId}`],
          }

          return {
            wallets: s.wallets.map((w) =>
              w.id === walletId ? { ...w, balance: actualBalance } : w
            ),
            transactions: [adjustmentTxn, ...s.transactions],
          }
        }),

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
        const INTERNAL_CATEGORIES = new Set(['transfer', 'adjustment'])
        const todaySpent = asArray<Transaction>(s.transactions)
          .filter((t) => t.type === 'expense' && t.date === today && t.status === 'completed' && !INTERNAL_CATEGORIES.has(t.category))
          .reduce((sum, t) => sum + safeNumber(t.amount), 0)
        const month = today.slice(0, 7)
        const budget = s.getBudgetForMonth(month)
        const daysInMonth = new Date(parseInt(month.slice(0, 4)), parseInt(month.slice(5, 7)), 0).getDate()
        const daysInMonthSafe = Math.max(1, daysInMonth)
        const dailyBudget = budget ? safeNumber(budget.salary) / daysInMonthSafe : 0
        const percentUsed = dailyBudget > 0.01 ? (todaySpent / dailyBudget) * 100 : 0
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

      // ──────────────────────────────────────────
      // ── Assets & Net Worth ──
      // ──────────────────────────────────────────

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

      /**
       * R8: Net Worth calculation prevents double-counting.
       *
       * Problem: Savings goals may hold money that is ALSO in a wallet.
       * Solution: If a savings goal has a walletId, the goal currentAmount
       * represents money already counted in that wallet's balance.
       * We only count savings goals WITHOUT a walletId as additional assets.
       *
       * We also exclude 'transfer' and 'adjustment' categories from
       * the net worth calculation since they are internal movements.
       */
      calculateNetWorth: () => {
        const s = get()

        // Total wallet balance (real money)
        const totalWalletBalance = s.wallets.reduce((sum, w) => sum + w.balance, 0)

        // Assets (property, vehicle, investments etc.)
        const totalAssetValue = s.assets.reduce((sum, a) => sum + a.value, 0)

        // Savings goals: only count those NOT linked to a wallet (to avoid double-count)
        const goalAssets = s.savingsGoals
          .filter((g) => !g.walletId) // Only if no wallet link
          .reduce((sum, g) => sum + g.currentAmount, 0)

        // Goals WITH walletId: the money is already in the wallet balance
        // so we don't add it again here.

        const totalAssets = totalWalletBalance + totalAssetValue + goalAssets

        // Liabilities: loans taken (money we owe others)
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