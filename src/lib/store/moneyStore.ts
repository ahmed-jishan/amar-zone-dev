import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Transaction, Loan, MonthlyBudget, SavingsGoal } from '@/lib/types'
import { generateId } from '@/lib/utils/helpers'

interface MoneyState {
  transactions: Transaction[]
  loans: Loan[]
  budgets: MonthlyBudget[]
  savingsGoals: SavingsGoal[]
  addTransaction: (t: Omit<Transaction, 'id'>) => void
  updateTransaction: (id: string, updates: Partial<Transaction>) => void
  deleteTransaction: (id: string) => void
  addLoan: (l: Omit<Loan, 'id'>) => void
  settleLoan: (id: string) => void
  deleteLoan: (id: string) => void
  setBudget: (budget: MonthlyBudget) => void
  addSavingsGoal: (g: Omit<SavingsGoal, 'id' | 'createdAt'>) => void
  updateSavingsGoal: (id: string, updates: Partial<SavingsGoal>) => void
  getMonthSummary: (month: string) => { income: number; expense: number; balance: number }
}

export const useMoneyStore = create<MoneyState>()(
  persist(
    (set, get) => ({
      transactions: [],
      loans: [],
      budgets: [],
      savingsGoals: [],

      addTransaction: (t) => set((s) => ({
        transactions: [...s.transactions, { ...t, id: generateId() }],
      })),
      updateTransaction: (id, updates) => set((s) => ({
        transactions: s.transactions.map((t) => t.id === id ? { ...t, ...updates } : t),
      })),
      deleteTransaction: (id) => set((s) => ({
        transactions: s.transactions.filter((t) => t.id !== id),
      })),

      addLoan: (l) => set((s) => ({
        loans: [...s.loans, { ...l, id: generateId() }],
      })),
      settleLoan: (id) => set((s) => ({
        loans: s.loans.map((l) => l.id === id ? { ...l, settled: true } : l),
      })),
      deleteLoan: (id) => set((s) => ({
        loans: s.loans.filter((l) => l.id !== id),
      })),

      setBudget: (budget) => set((s) => {
        const exists = s.budgets.find((b) => b.month === budget.month)
        return {
          budgets: exists
            ? s.budgets.map((b) => (b.month === budget.month ? budget : b))
            : [...s.budgets, budget],
        }
      }),

      addSavingsGoal: (g) => set((s) => ({
        savingsGoals: [...s.savingsGoals, {
          ...g, id: generateId(), createdAt: new Date().toISOString(),
        }],
      })),
      updateSavingsGoal: (id, updates) => set((s) => ({
        savingsGoals: s.savingsGoals.map((g) => g.id === id ? { ...g, ...updates } : g),
      })),

      getMonthSummary: (month) => {
        const txns = get().transactions.filter((t) => t.date.startsWith(month))
        const income  = txns.filter((t) => t.type === 'income').reduce((a, t) => a + t.amount, 0)
        const expense = txns.filter((t) => t.type === 'expense').reduce((a, t) => a + t.amount, 0)
        return { income, expense, balance: income - expense }
      },
    }),
    { name: 'amar-zone-money' }
  )
)
