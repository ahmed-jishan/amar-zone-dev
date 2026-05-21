// ─── Enhanced Money Types ───────────────────────────────────────────────────

export type TransactionType = 'income' | 'expense'
export type ExpenseCategory =
  | 'food' | 'transport' | 'utilities' | 'health'
  | 'education' | 'entertainment' | 'shopping' | 'rent' | 'other'

export type IncomeCategory = 'salary' | 'freelance' | 'investment' | 'gift' | 'other-income'

export type TransactionStatus = 'completed' | 'pending' | 'cancelled'

export interface Transaction {
  id: string
  type: TransactionType
  amount: number
  category: ExpenseCategory | IncomeCategory
  note?: string
  date: string // YYYY-MM-DD
  createdAt: string
  isRecurring: boolean
  recurringInterval?: 'daily' | 'weekly' | 'monthly' | 'yearly'
  tags?: string[]
  status: TransactionStatus
  walletId?: string
}

export type LoanDirection = 'given' | 'taken'
export type LoanStatus = 'active' | 'settled' | 'overdue'

export interface LoanEntry {
  id: string
  type: 'added' | 'repaid'
  amount: number
  note?: string
  date: string
  balanceAfter: number
}

export interface Loan {
  id: string
  personName: string
  amount: number
  initialAmount: number
  currentBalance: number
  direction: LoanDirection
  date: string
  dueDate?: string
  note?: string
  settled: boolean
  status: LoanStatus
  interestRate?: number // annual %
  entries: LoanEntry[]
  reminderEnabled: boolean
}

export interface MonthlyBudget {
  month: string // YYYY-MM
  salary: number
  budgets: Record<ExpenseCategory, number>
}

export interface SavingsGoal {
  id: string
  title: string
  targetAmount: number
  currentAmount: number
  deadline?: string
  createdAt: string
  category?: string
  color?: string
}

export interface Wallet {
  id: string
  name: string
  type: 'cash' | 'bank' | 'mobile' | 'savings'
  balance: number
  currency: string
  color: string
  icon: string
  isDefault: boolean
}

export interface Subscription {
  id: string
  name: string
  amount: number
  category: ExpenseCategory
  billingCycle: 'monthly' | 'yearly' | 'weekly'
  nextBillingDate: string
  status: 'active' | 'paused' | 'cancelled'
  note?: string
}

export interface FinancialInsight {
  id: string
  type: 'warning' | 'tip' | 'achievement' | 'trend'
  title: string
  description: string
  severity: 'low' | 'medium' | 'high'
  date: string
  read: boolean
}

export type MoneyViewMode = 'overview' | 'transactions' | 'loans' | 'analytics' | 'budget' | 'goals'
export type MoneyTimeRange = 'week' | 'month' | 'quarter' | 'year'
export type MoneySortMode = 'date' | 'amount' | 'category'
