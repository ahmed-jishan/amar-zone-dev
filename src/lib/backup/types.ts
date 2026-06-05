// ─── SelfSync Backup Schema v2 ───────────────────────────────────────────────
// This file defines ALL types for the enterprise backup/restore system.
// It is the single source of truth for backup schema versions & storage keys.

import type { Task } from '@/app/(tabs)/tasks/types'
import type {
  Transaction, Loan, MonthlyBudget, SavingsGoal, Wallet, Subscription, FinancialInsight,
} from '@/lib/types'
import type { PrayerRecord, NamazSettings } from '@/lib/types'
import type { AppSettings } from '@/features/settings/store/settingsStore'
import type { LifeMode, QuranReciter } from '@/features/namaz/store/prefsStore'
import type { Madhab, PrayerLocation } from '@/features/namaz/types/prayer.types'

// ─── Version ───
export const BACKUP_SCHEMA_VERSION = '2.0.0'
export const BACKUP_SCHEMA_NAME = 'selfsync-backup'

// ─── Storage Keys (source of truth) ───
export const BACKUP_STORAGE_KEYS = {
  settings: 'selfsync-settings',
  tasks: 'selfsync-tasks',
  money: 'selfsync-money-v2',
  namaz: 'selfsync-namaz',
  namazPrefs: 'namaz_settings',
} as const

export const BACKUP_META_KEYS = {
  snapshotPrefix: 'selfsync-snapshot-',
} as const

// ─── Backup Envelope (the outer wrapper) ───
export interface BackupEnvelope {
  schema: typeof BACKUP_SCHEMA_NAME
  version: typeof BACKUP_SCHEMA_VERSION
  createdAt: string
  appVersion: string
  checksum: string
  checksumAlgorithm: 'sha256'
  data: BackupPayload
}

// ─── Backup Payload (all application data) ───
export interface BackupPayload {
  tasks: BackupTaskCollection
  namaz: BackupNamazCollection
  money: BackupMoneyCollection
  settings: BackupSettingsCollection
  prefs: BackupPrefsCollection
}

// ─── Tasks ───
export interface BackupTaskCollection {
  tasks: Task[]
}

// ─── Namaz ───
export interface BackupNamazCollection {
  records: PrayerRecord[]
  settings: NamazSettings
}

// ─── Money ───
export interface BackupMoneyCollection {
  transactions: Transaction[]
  loans: Loan[]
  budgets: MonthlyBudget[]
  savingsGoals: SavingsGoal[]
  wallets: Wallet[]
  subscriptions: Subscription[]
  insights: FinancialInsight[]
}

// ─── Settings ───
export interface BackupSettingsCollection {
  appSettings: AppSettings
}

// ─── Namaz Preferences ───
export interface BackupPrefsCollection {
  location: PrayerLocation
  calculationMethod: number
  madhab: Madhab
  remindersEnabled: boolean
  reminderMinutesBefore: number
  autoDetectLocation: boolean
  ramadanMode: boolean
  travelMode: boolean
  lifeMode: LifeMode
  azanEnabled: boolean
  quranReciter: QuranReciter
}

// ─── Restore Options ───
export type RestoreStrategy = 'replace' | 'merge' | 'cancel'

export interface RestoreOptions {
  strategy: RestoreStrategy
  selectedModules?: {
    tasks?: boolean
    namaz?: boolean
    money?: boolean
    settings?: boolean
    prefs?: boolean
  }
}

// ─── Restore Preview (shown to user before restore) ───
export interface RestorePreview {
  backupCreatedAt: string
  backupSizeBytes: number
  counts: BackupCounts
  localCounts: BackupCounts
  differences: BackupDifferences
}

export interface BackupCounts {
  tasks: number
  transactions: number
  loans: number
  budgets: number
  savingsGoals: number
  wallets: number
  subscriptions: number
  insights: number
  namazRecords: number
  namazDays: number
}

export interface BackupDifferences {
  newerLocalTransactions: number
  newerLocalTasks: number
  newerLocalLoans: number
  newerLocalSavingsGoals: number
  localAmountBdt: number
  backupAmountBdt: number
}

// ─── Snapshot Metadata ───
export interface EmergencySnapshot {
  timestamp: string
  keys: string[]
  data: Record<string, string> // localStorage key → value
}

// ─── Validation Result ───
export interface ValidationResult {
  valid: boolean
  version: string | null
  errors: ValidationError[]
  warnings: string[]
}

export interface ValidationError {
  code: string
  message: string
  field?: string
}

// ─── Restore Result ───
export interface RestoreResult {
  success: boolean
  restoredKeys: string[]
  error?: string
  rolledBack: boolean
  snapshotKey?: string
}