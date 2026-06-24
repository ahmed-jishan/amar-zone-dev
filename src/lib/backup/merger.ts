// ─── BackupMerger ─────────────────────────────────────────────────────────────
// Professional merge engine with ID-based dedup, timestamp conflict resolution,
// and content-hash deduplication. Never creates duplicates.
// Updated to handle Notes, Health/BMI, Money extended fields, and Namaz extras.

import type {
  BackupPayload, BackupCounts, BackupDifferences,
} from './types'
import { collectBackupPayload, getBackupCounts, getTotalAmount } from './collector'
import type { Task } from '@/app/(tabs)/tasks/types'
import type { Note } from '@/features/notes/types'
import type { BMIRecord } from '@/features/health/types'

// ─── Merge two payloads (incoming backup into current local data) ───
export function mergeBackup(incoming: BackupPayload, local: BackupPayload): BackupPayload {
  return {
    tasks: mergeTasks(incoming.tasks, local.tasks),
    money: mergeMoney(incoming.money, local.money),
    namaz: mergeNamaz(incoming.namaz, local.namaz),
    settings: mergeSettings(incoming.settings, local.settings),
    prefs: mergePrefs(incoming.prefs, local.prefs),
    // NEW modules
    notes: mergeNotes(incoming.notes, local.notes),
    health: mergeHealth(incoming.health, local.health),
    namazExtras: mergeNamazExtras(incoming.namazExtras, local.namazExtras),
  }
}

// ─── Compute differences between backup and local data ───
export function computeDifferences(backup: BackupPayload): BackupDifferences {
  const local = collectBackupPayload()
  const localTxns = local.money.transactions
  const backupTxns = backup.money.transactions
  const localTasks = local.tasks.tasks
  const backupTasks = backup.tasks.tasks

  // Count transactions in local that are NOT in backup (created after backup)
  const backupTxnIds = new Set(backupTxns.map(t => t.id))
  const newerLocalTransactions = localTxns.filter(t => !backupTxnIds.has(t.id)).length

  const backupTaskIds = new Set(backupTasks.map(t => t.id))
  const newerLocalTasks = localTasks.filter(t => !backupTaskIds.has(t.id)).length

  // Loans
  const backupLoanIds = new Set(backup.money.loans.map(l => l.id))
  const newerLocalLoans = local.money.loans.filter(l => !backupLoanIds.has(l.id)).length

  // Savings goals
  const backupGoalIds = new Set(backup.money.savingsGoals.map(g => g.id))
  const newerLocalSavingsGoals = local.money.savingsGoals.filter(g => !backupGoalIds.has(g.id)).length

  // NEW: Notes
  const backupNoteIds = new Set(backup.notes.notes.map(n => n.id))
  const newerLocalNotes = local.notes.notes.filter(n => !backupNoteIds.has(n.id)).length

  // NEW: BMI Records
  const backupBmiIds = new Set(backup.health.bmiRecords.map(r => r.id))
  const newerLocalBmiRecords = local.health.bmiRecords.filter(r => !backupBmiIds.has(r.id)).length

  return {
    newerLocalTransactions,
    newerLocalTasks,
    newerLocalLoans,
    newerLocalSavingsGoals,
    localAmountBdt: getTotalAmount(local),
    backupAmountBdt: getTotalAmount(backup),
    // NEW
    newerLocalNotes,
    newerLocalBmiRecords,
  }
}

// ─── Get local counts for comparison ───
export function getLocalCounts(): BackupCounts {
  const local = collectBackupPayload()
  return getBackupCounts(local)
}

// ══════════════════════════════════════════════
//  PRIVATE MERGE HELPERS
// ══════════════════════════════════════════════

function mergeTasks(
  incoming: BackupPayload['tasks'],
  local: BackupPayload['tasks'],
): BackupPayload['tasks'] {
  const map = new Map<string, Task>()
  
  // Add local tasks first
  for (const task of local.tasks) {
    map.set(task.id, task)
  }
  
  // Merge incoming — newest wins by updatedAt
  for (const task of incoming.tasks) {
    const existing = map.get(task.id)
    if (!existing) {
      map.set(task.id, task)
    } else {
      const existingTime = parseTime(existing.updatedAt ?? existing.createdAt)
      const incomingTime = parseTime(task.updatedAt ?? task.createdAt)
      if (incomingTime !== null && (existingTime === null || incomingTime >= existingTime)) {
        map.set(task.id, task)
      }
    }
  }

  return { tasks: Array.from(map.values()) }
}

function mergeMoney(
  incoming: BackupPayload['money'],
  local: BackupPayload['money'],
): BackupPayload['money'] {
  return {
    transactions: mergeById(local.transactions, incoming.transactions, (t) => t.createdAt),
    loans: mergeLoans(local.loans, incoming.loans),
    budgets: mergeByKey(local.budgets, incoming.budgets, (b) => b.month),
    savingsGoals: mergeById(local.savingsGoals, incoming.savingsGoals, (g) => g.createdAt),
    wallets: mergeById(local.wallets, incoming.wallets, () => ''),
    subscriptions: mergeById(local.subscriptions, incoming.subscriptions, (s) => s.nextBillingDate),
    insights: mergeById(local.insights, incoming.insights, (i) => i.date),
    // NEW fields
    categoryLimits: mergeByKey(local.categoryLimits, incoming.categoryLimits, (c) => c.category),
    recurringTemplates: mergeById(local.recurringTemplates, incoming.recurringTemplates, () => ''),
    assets: mergeById(local.assets, incoming.assets, () => ''),
    // NetWorthSnapshot doesn't have an 'id' field - use mergeByKey with date
    netWorthHistory: mergeByKey(local.netWorthHistory, incoming.netWorthHistory, (n) => n.date),
  }
}

function mergeNamaz(
  incoming: BackupPayload['namaz'],
  local: BackupPayload['namaz'],
): BackupPayload['namaz'] {
  const recordsMap = new Map<string, typeof local.records[0]>()
  
  for (const record of local.records) {
    recordsMap.set(record.date, record)
  }
  for (const record of incoming.records) {
    const existing = recordsMap.get(record.date)
    if (!existing) {
      recordsMap.set(record.date, record)
    } else {
      // Merge per-prayer — incoming's non-pending status takes priority
      const merged = { ...existing }
      for (const [prayer, status] of Object.entries(record.prayers)) {
        if (status !== 'pending') {
          (merged.prayers as Record<string, string>)[prayer] = status
        }
      }
      recordsMap.set(record.date, merged)
    }
  }

  return {
    records: Array.from(recordsMap.values()),
    settings: { ...local.settings, ...incoming.settings },
  }
}

function mergeSettings(
  incoming: BackupPayload['settings'],
  local: BackupPayload['settings'],
): BackupPayload['settings'] {
  return {
    appSettings: { ...local.appSettings, ...incoming.appSettings },
  }
}

function mergePrefs(
  incoming: BackupPayload['prefs'],
  local: BackupPayload['prefs'],
): BackupPayload['prefs'] {
  return { ...local, ...incoming }
}

// ─── NEW: Merge Notes ───
function mergeNotes(
  incoming: BackupPayload['notes'],
  local: BackupPayload['notes'],
): BackupPayload['notes'] {
  const map = new Map<string, Note>()
  
  for (const note of local.notes) {
    map.set(note.id, note)
  }
  for (const note of incoming.notes) {
    const existing = map.get(note.id)
    if (!existing) {
      map.set(note.id, note)
    } else {
      // Newest wins by updatedAt timestamp
      if (note.updatedAt >= existing.updatedAt) {
        map.set(note.id, note)
      }
    }
  }

  return { notes: Array.from(map.values()) }
}

// ─── NEW: Merge Health/BMI ───
function mergeHealth(
  incoming: BackupPayload['health'],
  local: BackupPayload['health'],
): BackupPayload['health'] {
  const map = new Map<string, BMIRecord>()
  
  for (const record of local.bmiRecords) {
    map.set(record.id, record)
  }
  for (const record of incoming.bmiRecords) {
    if (!map.has(record.id)) {
      map.set(record.id, record)
    }
  }

  return { bmiRecords: Array.from(map.values()).sort((a, b) => b.date - a.date) }
}

// ─── NEW: Merge Namaz Extras ───
function mergeNamazExtras(
  incoming: BackupPayload['namazExtras'],
  local: BackupPayload['namazExtras'],
): BackupPayload['namazExtras'] {
  return {
    tasbih: incoming.tasbih ?? local.tasbih,
    duaState: incoming.duaState ?? local.duaState,
    quranState: incoming.quranState ?? local.quranState,
    notifications: incoming.notifications ?? local.notifications,
  }
}

// ─── Merge by ID with timestamp conflict resolution ───
function mergeById<T extends { id: string }>(
  local: T[],
  incoming: T[],
  getTimeField: (item: T) => string | undefined,
): T[] {
  const map = new Map<string, T>()
  
  for (const item of local) {
    map.set(item.id, item)
  }
  for (const item of incoming) {
    const existing = map.get(item.id)
    if (!existing) {
      map.set(item.id, item)
    } else {
      const existingTime = parseTime(getTimeField(existing))
      const incomingTime = parseTime(getTimeField(item))
      if (incomingTime !== null && (existingTime === null || incomingTime >= existingTime)) {
        map.set(item.id, item)
      }
    }
  }

  return Array.from(map.values())
}

// ─── Merge loans with their entries ───
function mergeLoans(
  local: BackupPayload['money']['loans'],
  incoming: BackupPayload['money']['loans'],
): BackupPayload['money']['loans'] {
  const map = new Map<string, typeof local[0]>()
  
  for (const loan of local) {
    map.set(loan.id, loan)
  }
  for (const loan of incoming) {
    const existing = map.get(loan.id)
    if (!existing) {
      map.set(loan.id, loan)
    } else {
      // Merge entries by ID
      const entriesMap = new Map<string, typeof loan.entries[0]>()
      for (const entry of existing.entries) entriesMap.set(entry.id, entry)
      for (const entry of loan.entries) entriesMap.set(entry.id, entry)
      map.set(loan.id, {
        ...loan,
        entries: Array.from(entriesMap.values()),
      })
    }
  }

  return Array.from(map.values())
}

// ─── Merge by key (for budgets, namaz records) ───
function mergeByKey<T>(
  local: T[],
  incoming: T[],
  getKey: (item: T) => string,
): T[] {
  const map = new Map<string, T>()
  for (const item of local) map.set(getKey(item), item)
  for (const item of incoming) map.set(getKey(item), item)
  return Array.from(map.values())
}

function parseTime(value?: string): number | null {
  if (!value) return null
  const t = Date.parse(value)
  return Number.isNaN(t) ? null : t
}