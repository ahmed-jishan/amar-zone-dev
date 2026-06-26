import type { Transaction, Wallet, Loan, SavingsGoal, Asset } from '@/lib/types'

/**
 * ─── Centralized Money Selectors ───
 *
 * Professional accounting model:
 * - Assets = Cash in Wallets + Savings + Asset values
 * - Liabilities = Outstanding Loans Taken
 * - Net Worth = Assets - Liabilities
 * - Available Balance = Total wallet cash (for spending)
 *
 * Internal categories excluded from income/expense summaries:
 * transfer, adjustment, and loan-related transactions.
 */

/** Internal categories that should be excluded from income/expense summaries */
const INTERNAL_CATEGORIES = new Set(['transfer', 'adjustment'])

/** Check if a transaction should be counted in user-facing summaries */
const isExternalTransaction = (t: Transaction): boolean =>
  !INTERNAL_CATEGORIES.has(t.category) &&
  !(t.tags && t.tags.includes('loan')) &&      // R9: Loan ≠ Income/Expense
  !(t.tags && t.tags.includes('savings-goal')) // R7: Savings contributions ≠ Expense

/** Safe number helper */
const safeNumber = (value: unknown, fallback = 0) =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback

/**
 * ─── ACCOUNTING SELECTORS ───
 */

/**
 * Total balance across all wallets (Available Cash).
 * This is the money the user can spend right now.
 */
export function selectAvailableBalance(wallets: Wallet[]): number {
  return wallets.reduce((a, w) => a + w.balance, 0)
}

/**
 * Total savings accumulated across all goals.
 * This is an ASSET.
 */
export function selectSavingsTotal(savingsGoals: SavingsGoal[]): number {
  return savingsGoals.reduce((sum, g) => sum + g.currentAmount, 0)
}

/**
 * Total outstanding loans taken (liabilities).
 * Loans given (money others owe us) are assets.
 */
export function selectOutstandingLoans(loans: Loan[]): {
  /** Money we owe to others (liability) */
  taken: number
  /** Money others owe us (asset) */
  given: number
  /** Net loan position */
  net: number
} {
  const taken = loans
    .filter((l) => l.direction === 'taken' && !l.settled)
    .reduce((sum, l) => sum + l.currentBalance, 0)
  const given = loans
    .filter((l) => l.direction === 'given' && !l.settled)
    .reduce((sum, l) => sum + l.currentBalance, 0)
  return { taken, given, net: taken - given }
}

/**
 * Total Net Worth = Assets - Liabilities.
 * Assets: wallet cash + savings + assets + loans given
 * Liabilities: loans taken
 */
export function selectNetWorth(
  wallets: Wallet[],
  savingsGoals: SavingsGoal[],
  loans: Loan[],
  assets: Asset[]
): { totalAssets: number; totalLiabilities: number; netWorth: number } {
  const cash = selectAvailableBalance(wallets)
  const savings = selectSavingsTotal(savingsGoals)
  const loanGiven = loans
    .filter((l) => l.direction === 'given' && !l.settled)
    .reduce((sum, l) => sum + l.currentBalance, 0)
  const assetValues = assets.reduce((sum, a) => sum + a.value, 0)
  // Avoid double-counting: if savings goals have walletId, money is already in wallet balance
  const walletLinkedSavings = savingsGoals
    .filter((g) => g.walletId)
    .reduce((sum, g) => sum + g.currentAmount, 0)

  const totalAssets = cash + (savings - walletLinkedSavings) + loanGiven + assetValues
  const totalLiabilities = loans
    .filter((l) => l.direction === 'taken' && !l.settled)
    .reduce((sum, l) => sum + l.currentBalance, 0)

  return {
    totalAssets: Math.round(totalAssets * 100) / 100,
    totalLiabilities: Math.round(totalLiabilities * 100) / 100,
    netWorth: Math.round((totalAssets - totalLiabilities) * 100) / 100,
  }
}

/**
 * ─── INCOME/EXPENSE SELECTORS (exclude internal & loan transactions) ───
 */

/**
 * Month summary excluding internal transfers, adjustments, and loan transactions.
 */
export function selectMonthSummary(
  transactions: Transaction[],
  month: string
): { income: number; expense: number; balance: number } {
  const txns = transactions.filter(
    (t) =>
      typeof t.date === 'string' &&
      t.date.startsWith(month) &&
      t.status === 'completed' &&
      isExternalTransaction(t)
  )
  const income = txns
    .filter((t) => t.type === 'income')
    .reduce((a, t) => a + safeNumber(t.amount), 0)
  const expense = txns
    .filter((t) => t.type === 'expense')
    .reduce((a, t) => a + safeNumber(t.amount), 0)
  return { income, expense, balance: income - expense }
}

/**
 * Expense category breakdown excluding internal & loan categories.
 */
export function selectCategoryBreakdown(
  transactions: Transaction[],
  month: string
): Record<string, number> {
  const txns = transactions.filter(
    (t) =>
      typeof t.date === 'string' &&
      t.date.startsWith(month) &&
      t.type === 'expense' &&
      isExternalTransaction(t)
  )
  const breakdown: Record<string, number> = {}
  txns.forEach((t) => {
    breakdown[t.category] = (breakdown[t.category] || 0) + safeNumber(t.amount)
  })
  return breakdown
}

/**
 * Income category breakdown excluding internal & loan categories.
 */
export function selectIncomeBreakdown(
  transactions: Transaction[],
  month: string
): Record<string, number> {
  const txns = transactions.filter(
    (t) =>
      typeof t.date === 'string' &&
      t.date.startsWith(month) &&
      t.type === 'income' &&
      isExternalTransaction(t)
  )
  const breakdown: Record<string, number> = {}
  txns.forEach((t) => {
    breakdown[t.category] = (breakdown[t.category] || 0) + safeNumber(t.amount)
  })
  return breakdown
}

/**
 * Daily spending for the pulse (excludes internal & loan categories).
 */
export function selectDailySpending(
  transactions: Transaction[],
  date: string
): number {
  return transactions
    .filter(
      (t) =>
        t.type === 'expense' &&
        t.date === date &&
        t.status === 'completed' &&
        isExternalTransaction(t)
    )
    .reduce((sum, t) => sum + safeNumber(t.amount), 0)
}

/**
 * Monthly expense total excluding internal & loan categories.
 */
export function selectMonthlyExpense(
  transactions: Transaction[],
  month: string
): number {
  return transactions
    .filter(
      (t) =>
        t.type === 'expense' &&
        t.date.startsWith(month) &&
        t.status === 'completed' &&
        isExternalTransaction(t)
    )
    .reduce((sum, t) => sum + safeNumber(t.amount), 0)
}

/**
 * Monthly income total excluding internal & loan categories.
 */
export function selectMonthlyIncome(
  transactions: Transaction[],
  month: string
): number {
  return transactions
    .filter(
      (t) =>
        t.type === 'income' &&
        t.date.startsWith(month) &&
        t.status === 'completed' &&
        isExternalTransaction(t)
    )
    .reduce((sum, t) => sum + safeNumber(t.amount), 0)
}

/**
 * Financial health score (0-100) based on savings rate.
 */
export function selectHealthScore(
  income: number,
  expense: number,
  totalSavings: number
): number {
  if (income === 0 && expense === 0) return 50
  const savingsRate = income > 0 ? (income - expense) / income : 0
  const savingsBoost = Math.min(totalSavings / Math.max(income, 1), 0.5)
  return Math.round(Math.max(0, Math.min(100, (savingsRate * 60 + 40 + savingsBoost * 20))))
}

/**
 * Cashflow forecast data excluding internal & loan transactions.
 */
export function selectCashflowForecast(params: {
  transactions: Transaction[]
  wallets: Wallet[]
  month: string
  daysLeft: number
  dayOfMonth: number
  daysInMonth: number
}) {
  const { transactions, wallets, month, daysLeft, dayOfMonth, daysInMonth } = params

  const currentBalance = wallets.reduce((sum, w) => sum + w.balance, 0)
  const monthIncome = selectMonthlyIncome(transactions, month)
  const monthExpense = selectMonthlyExpense(transactions, month)

  const dailyExpense = monthExpense / Math.max(1, Math.min(dayOfMonth, daysInMonth))
  const projectedDailySpend = dailyExpense * daysLeft

  return {
    currentBalance,
    monthIncome,
    monthExpense,
    dailyExpense,
    projectedDailySpend,
  }
}