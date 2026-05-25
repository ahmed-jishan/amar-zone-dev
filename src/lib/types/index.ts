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
  updatedAt?: string
  completedAt?: string
  dueDate?: string
  status?: string
  archivedAt?: string
  recurring: RecurringType
  timerMinutes: number
  timerSeconds?: number
  streak: number
  completedDates: string[]
}

// ─── Namaz Types ──────────────────────────────────────────────────────────────
export type PrayerName = 'Fajr' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha'
export type PrayerStatus = 'pending' | 'prayed' | 'missed' | 'qaza'

export interface PrayerRecord {
  date: string
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
export * from './money'

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
  biometricLockEnabled: boolean
  onboardingComplete: boolean
}
