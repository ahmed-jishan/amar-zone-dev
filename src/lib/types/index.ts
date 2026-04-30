// ─── Task Types ───────────────────────────────────────────────────────────────
export type Priority = 'high' | 'medium' | 'low'
export type TaskCategory = 'work' | 'study' | 'personal' | 'health' | 'other'
export type RecurringType = 'none' | 'daily' | 'weekly' | 'monthly'

export interface Task {
  id: string
  title: string
  description?: string
  category: TaskCategory
  priority: Priority
  completed: boolean
  createdAt: string
  dueDate?: string
  recurring: RecurringType
  timerMinutes: number        // Pomodoro default: 25
  timerSeconds?: number       // remaining when paused
  streak: number
  completedDates: string[]    // ISO date strings
}

// ─── Namaz Types ──────────────────────────────────────────────────────────────
export type PrayerName = 'Fajr' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha'
export type PrayerStatus = 'pending' | 'prayed' | 'missed' | 'qaza'

export interface PrayerRecord {
  date: string                // YYYY-MM-DD
  prayers: Record<PrayerName, PrayerStatus>
}

export interface NamazSettings {
  latitude: number
  longitude: number
  calculationMethod: string
  adhanEnabled: boolean
  reminderMinutesBefore: number
}

// ─── Money Types ──────────────────────────────────────────────────────────────
export type TransactionType = 'income' | 'expense'
export type ExpenseCategory =
  | 'food' | 'transport' | 'utilities' | 'health'
  | 'education' | 'entertainment' | 'shopping' | 'rent' | 'other'

export interface Transaction {
  id: string
  type: TransactionType
  amount: number
  category: ExpenseCategory | 'salary' | 'freelance' | 'other-income'
  note?: string
  date: string                // YYYY-MM-DD
  isRecurring: boolean
}

export interface Loan {
  id: string
  personName: string
  amount: number
  direction: 'given' | 'taken'
  date: string
  dueDate?: string
  note?: string
  settled: boolean
}

export interface MonthlyBudget {
  month: string               // YYYY-MM
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
}

// ─── Settings Types ───────────────────────────────────────────────────────────
export type Theme = 'light' | 'dark' | 'system'
export type Language = 'en' | 'bn'
export type Currency = 'BDT' | 'USD' | 'EUR'

export interface AppSettings {
  theme: Theme
  language: Language
  currency: Currency
  currency_symbol: string
  pinEnabled: boolean
  pinHash?: string
  onboardingComplete: boolean
}
