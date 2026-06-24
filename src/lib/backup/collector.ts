// ─── BackupCollector ─────────────────────────────────────────────────────────
// Collects ALL data from ALL persisted stores into a BackupPayload.
// Now includes Notes, Health/BMI records, Namaz extras, and extended Money fields.

import type { AppSettings } from '@/features/settings/store/settingsStore'
import type { Task } from '@/app/(tabs)/tasks/types'
import type {
  Transaction, Loan, MonthlyBudget, SavingsGoal, Wallet, Subscription, FinancialInsight,
  CategoryLimit, RecurringTemplate, Asset, NetWorthSnapshot,
} from '@/lib/types'
import type { PrayerRecord, NamazSettings } from '@/lib/types'
import type { BackupPayload, BackupPrefsCollection, BackupCounts } from './types'
import type { Note } from '@/features/notes/types'
import type { BMIRecord } from '@/features/health/types'
import {
  BACKUP_STORAGE_KEYS,
} from './types'

// ─── Generic reader for Zustand-persisted stores ───
function readStore<T>(key: string): T | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    // Zustand persist wraps in { state: T, version?: number }
    const state = (parsed as { state: T }).state ?? parsed
    return state as T
  } catch {
    return null
  }
}

// ─── Generic reader for plain localStorage stores ───
function readPlainStore<T>(key: string): T | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

// ─── Collect all data ───
export function collectBackupPayload(): BackupPayload {
  const tasks = readStore<{ tasks: Task[] }>(BACKUP_STORAGE_KEYS.tasks)
  const money = readStore<{
    transactions: Transaction[]
    loans: Loan[]
    budgets: MonthlyBudget[]
    savingsGoals: SavingsGoal[]
    wallets: Wallet[]
    subscriptions: Subscription[]
    insights: FinancialInsight[]
    categoryLimits?: CategoryLimit[]
    recurringTemplates?: RecurringTemplate[]
    assets?: Asset[]
    netWorthHistory?: NetWorthSnapshot[]
  }>(BACKUP_STORAGE_KEYS.money)
  const namaz = readStore<{ records: PrayerRecord[]; settings: NamazSettings }>(BACKUP_STORAGE_KEYS.namaz)
  const settings = readStore<AppSettings>(BACKUP_STORAGE_KEYS.settings)
  const prefs = readStore<BackupPrefsCollection>(BACKUP_STORAGE_KEYS.namazPrefs)
  
  // NEW: Notes
  const notes = readPlainStore<Note[]>(BACKUP_STORAGE_KEYS.notes)
  
  // NEW: Health / BMI
  const health = readPlainStore<BMIRecord[]>(BACKUP_STORAGE_KEYS.health)
  
  // NEW: Namaz Extras
  const tasbih = readPlainStore<unknown[]>(BACKUP_STORAGE_KEYS.namazTasbih)
  const duaState = readPlainStore<unknown>(BACKUP_STORAGE_KEYS.namazDua)
  const quranState = readPlainStore<unknown>(BACKUP_STORAGE_KEYS.namazQuran)
  const notifications = readPlainStore<unknown[]>(BACKUP_STORAGE_KEYS.namazNotifications)

  return {
    tasks: {
      tasks: tasks?.tasks ?? [],
    },
    money: {
      transactions: money?.transactions ?? [],
      loans: money?.loans ?? [],
      budgets: money?.budgets ?? [],
      savingsGoals: money?.savingsGoals ?? [],
      wallets: money?.wallets ?? [],
      subscriptions: money?.subscriptions ?? [],
      insights: money?.insights ?? [],
      // NEW fields
      categoryLimits: money?.categoryLimits ?? [],
      recurringTemplates: money?.recurringTemplates ?? [],
      assets: money?.assets ?? [],
      netWorthHistory: money?.netWorthHistory ?? [],
    },
    namaz: {
      records: namaz?.records ?? [],
      settings: namaz?.settings ?? {
        latitude: 23.8103,
        longitude: 90.4125,
        calculationMethod: 'Karachi',
        adhanEnabled: true,
        reminderMinutesBefore: 10,
      },
    },
    settings: {
      appSettings: settings ?? {
        theme: 'dark',
        language: 'bn',
        currency: 'BDT',
        currency_symbol: '৳',
        pinEnabled: false,
        biometricLockEnabled: false,
        onboardingComplete: true,
        notificationsEnabled: true,
        calculatorEnabled: true,
        voiceEnabled: true,
        notificationCategories: { tasks: true, money: true, prayer: true },
        quietHoursEnabled: false,
        quietHoursStart: '22:00',
        quietHoursEnd: '07:00',
        autoLockEnabled: false,
        autoLockMinutes: 10,
        gdriveConnected: false,
        syncEnabled: false,
        autoSync: false,
        wifiOnlySync: false,
      },
    },
    prefs: prefs ?? {
      location: { latitude: 23.8103, longitude: 90.4125, city: 'Dhaka', country: 'Bangladesh', source: 'fallback' },
      calculationMethod: 5,
      madhab: 'shafi',
      remindersEnabled: false,
      reminderMinutesBefore: 10,
      autoDetectLocation: true,
      ramadanMode: false,
      travelMode: false,
      lifeMode: 'normal',
      azanEnabled: false,
      quranReciter: 'alafasy',
    },
    // NEW modules
    notes: {
      notes: notes ?? [],
    },
    health: {
      bmiRecords: health ?? [],
    },
    namazExtras: {
      tasbih: tasbih ?? null,
      duaState: duaState ?? null,
      quranState: quranState ?? null,
      notifications: notifications ?? null,
    },
  }
}

// ─── Get counts for summary display ───
export function getBackupCounts(payload: BackupPayload): BackupCounts {
  const t = payload.tasks.tasks.length
  const m = payload.money
  return {
    tasks: t,
    transactions: m.transactions.length,
    loans: m.loans.length,
    budgets: m.budgets.length,
    savingsGoals: m.savingsGoals.length,
    wallets: m.wallets.length,
    subscriptions: m.subscriptions.length,
    insights: m.insights.length,
    namazRecords: payload.namaz.records.reduce((sum, r) => sum + Object.values(r.prayers).filter(s => s !== 'pending').length, 0),
    namazDays: payload.namaz.records.length,
    // NEW
    notes: payload.notes.notes.length,
    bmiRecords: payload.health.bmiRecords.length,
    categoryLimits: m.categoryLimits.length,
    recurringTemplates: m.recurringTemplates.length,
    assets: m.assets.length,
  }
}

// ─── Calculate total monetary amount from transactions ───
export function getTotalAmount(payload: BackupPayload): number {
  return payload.money.transactions.reduce((sum, t) => {
    return sum + (t.type === 'income' ? t.amount : -t.amount)
  }, 0)
}