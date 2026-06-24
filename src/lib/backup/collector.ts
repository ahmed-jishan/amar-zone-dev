// ─── BackupCollector ─────────────────────────────────────────────────────────
// Collects ALL data from ALL persisted stores into a BackupPayload.

import type { AppSettings } from '@/features/settings/store/settingsStore'
import type { Task } from '@/app/(tabs)/tasks/types'
import type {
  Transaction, Loan, MonthlyBudget, SavingsGoal, Wallet, Subscription, FinancialInsight,
} from '@/lib/types'
import type { PrayerRecord, NamazSettings } from '@/lib/types'
import type { BackupPayload, BackupPrefsCollection } from './types'
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
  }>(BACKUP_STORAGE_KEYS.money)
  const namaz = readStore<{ records: PrayerRecord[]; settings: NamazSettings }>(BACKUP_STORAGE_KEYS.namaz)
  const settings = readStore<AppSettings>(BACKUP_STORAGE_KEYS.settings)
  const prefs = readStore<BackupPrefsCollection>(BACKUP_STORAGE_KEYS.namazPrefs)

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
  }
}

// ─── Get counts for summary display ───
export function getBackupCounts(payload: BackupPayload) {
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
  }
}

// ─── Calculate total monetary amount from transactions ───
export function getTotalAmount(payload: BackupPayload): number {
  return payload.money.transactions.reduce((sum, t) => {
    return sum + (t.type === 'income' ? t.amount : -t.amount)
  }, 0)
}