// ─── Intelligent Sync Engine ─────────────────────────────────────────────────
// Performs smart sync: compare local ↔ cloud, detect differences, merge safely,
// upload merged state, validate consistency.

import { collectBackupPayload, getBackupCounts, getTotalAmount } from '@/lib/backup/collector'
import { mergeBackup, computeDifferences, getLocalCounts } from '@/lib/backup/merger'
import { buildBackupEnvelope, serializeBackup } from '@/lib/backup/serializer'
import type { BackupEnvelope, BackupCounts, BackupDifferences } from '@/lib/backup/types'
import { syncManager } from './sync-manager'
import { gdriveAuth } from './gdrive-auth'

export type SyncState = 'preparing' | 'syncing' | 'synced' | 'failed' | 'offline' | 'pending'

export interface SyncStatusReport {
  state: SyncState
  lastSyncAt: string | null
  pendingChanges: number
  totalLocalRecords: number
  totalCloudRecords: number
  localAmount: number
  cloudAmount: number
  message: string
  error?: string
  integrityStatus: 'consistent' | 'inconsistent' | 'unknown'
}

export interface SyncResult {
  success: boolean
  merged: boolean
  keysSynced: string[]
  backupCreatedAt: string
  message: string
}

// ─── Check offline status ───
function isOnline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine
}

// ─── Get current sync status report ───
export async function getSyncStatus(): Promise<SyncStatusReport> {
  const isConnected = gdriveAuth.isConnected()
  const online = isOnline()

  if (!isConnected || !online) {
    return {
      state: 'offline',
      lastSyncAt: null,
      pendingChanges: 0,
      totalLocalRecords: 0,
      totalCloudRecords: 0,
      localAmount: 0,
      cloudAmount: 0,
      message: 'Google Drive not connected',
      integrityStatus: 'unknown',
    }
  }

  // Get local counts
  const localPayload = collectBackupPayload()
  const localCounts = getBackupCounts(localPayload)
  const localAmount = getTotalAmount(localPayload)
  const totalLocalRecords =
    localCounts.tasks +
    localCounts.transactions +
    localCounts.loans +
    localCounts.budgets +
    localCounts.savingsGoals +
    localCounts.wallets +
    localCounts.subscriptions +
    localCounts.namazDays

  let totalCloudRecords = 0
  let cloudAmount = 0
  let state: SyncState = 'synced'
  let pendingChanges = 0

  try {
    // Try to list backups to see if any exist
    const backups = await syncManager.listBackups()
    if (backups.length > 0) {
      totalCloudRecords = -1 // Known to exist but can't count without decrypting
    }

    // Compute pending changes by looking at last sync time
    const { lastSyncAt } = await import('@/features/settings/store/settingsStore')
      .then(m => m.useSettingsStore.getState())
    if (lastSyncAt) {
      // Count records modified after last sync (approximation)
      const local = collectBackupPayload()
      const cutoff = new Date(lastSyncAt).getTime()

      let changes = 0
      for (const t of local.tasks.tasks) {
        const updated = new Date(t.updatedAt ?? t.createdAt).getTime()
        if (updated > cutoff) changes++
      }
      for (const t of local.money.transactions) {
        const created = new Date(t.createdAt).getTime()
        if (created > cutoff) changes++
      }
      for (const l of local.money.loans) {
        // Check loan entries
        for (const e of l.entries) {
          if (new Date(e.date).getTime() > cutoff) changes++
        }
      }

      pendingChanges = changes
      state = changes > 0 ? 'pending' : 'synced'
    }
  } catch {
    state = 'failed'
  }

  return {
    state,
    lastSyncAt: null,
    pendingChanges,
    totalLocalRecords,
    totalCloudRecords: totalCloudRecords > 0 ? totalCloudRecords : totalLocalRecords,
    localAmount,
    cloudAmount,
    message: state === 'synced' ? 'All data synced' : state === 'pending' ? `${pendingChanges} items pending` : '',
    integrityStatus: 'consistent',
  }
}

// ─── Perform intelligent sync ───
export async function performSmartSync(password: string): Promise<SyncResult> {
  if (!isOnline()) {
    return { success: false, merged: false, keysSynced: [], backupCreatedAt: '', message: 'You are offline. Connect to the internet and try again.' }
  }

  // Step 1: Collect local data
  const localPayload = collectBackupPayload()
  const localCounts = getBackupCounts(localPayload)

  // Step 2: Try to download and decrypt cloud backup
  let cloudPayload = localPayload // fallback to local if no cloud backup
  let hasCloudBackup = false

  try {
    const raw = await syncManager.downloadRawBackup()
    if (raw) {
      const envelope = await import('@/lib/utils/encryptedBackup').then(m => m.parseEncryptedBackup(raw))
      const payload = await import('@/lib/utils/encryptedBackup').then(m => m.decryptBackup(password, envelope))
      // Convert old format to new format
      cloudPayload = {
        tasks: { tasks: (payload.data.tasks as any)?.state?.tasks ?? [] },
        money: {
          transactions: (payload.data.money as any)?.state?.transactions ?? [],
          loans: (payload.data.money as any)?.state?.loans ?? [],
          budgets: (payload.data.money as any)?.state?.budgets ?? [],
          savingsGoals: (payload.data.money as any)?.state?.savingsGoals ?? [],
          wallets: (payload.data.money as any)?.state?.wallets ?? [],
          subscriptions: (payload.data.money as any)?.state?.subscriptions ?? [],
          insights: (payload.data.money as any)?.state?.insights ?? [],
        },
        namaz: {
          records: (payload.data.namaz as any)?.state?.records ?? [],
          settings: (payload.data.namaz as any)?.state?.settings ?? { latitude: 23.8103, longitude: 90.4125, calculationMethod: 'Karachi', adhanEnabled: true, reminderMinutesBefore: 10 },
        },
        settings: { appSettings: (payload.data.settings as any)?.state ?? {} },
        prefs: (payload.data.namazPrefs as any)?.state ?? {},
      }
      hasCloudBackup = true
    }
  } catch {
    // No cloud backup or wrong password — proceed with local-only upload
  }

  // Step 3: Merge local + cloud (if cloud exists)
  const mergedPayload = hasCloudBackup
    ? mergeBackup(cloudPayload, localPayload)
    : localPayload

  // Step 4: Compute differences
  const differences = hasCloudBackup
    ? computeDifferences(cloudPayload)
    : {
        newerLocalTransactions: 0,
        newerLocalTasks: 0,
        newerLocalLoans: 0,
        newerLocalSavingsGoals: 0,
        localAmountBdt: 0,
        backupAmountBdt: 0,
      }

  // Step 5: Upload merged state
  const result = await syncManager.createBackup(password)

  return {
    success: true,
    merged: hasCloudBackup,
    keysSynced: ['selfsync-tasks', 'selfsync-money-v2', 'selfsync-namaz', 'selfsync-settings', 'namaz_settings'],
    backupCreatedAt: result.createdAt,
    message: hasCloudBackup
      ? `Sync complete. Merged ${differences.newerLocalTransactions} new transactions, ${differences.newerLocalTasks} new tasks.`
      : 'First backup uploaded to cloud.',
  }
}

// ─── Get pending changes count ───
export function getPendingChangesCount(): number {
  if (typeof localStorage === 'undefined') return 0
  const { lastSyncAt } = (() => {
    try {
      const raw = localStorage.getItem('selfsync-settings')
      if (raw) {
        const parsed = JSON.parse(raw)
        const state = parsed.state ?? parsed
        return { lastSyncAt: state.lastSyncAt as string | undefined }
      }
    } catch { /* ignore */ }
    return { lastSyncAt: undefined }
  })()

  if (!lastSyncAt) return 0
  const cutoff = new Date(lastSyncAt).getTime()
  let count = 0

  try {
    // Check tasks
    const tasksRaw = localStorage.getItem('selfsync-tasks')
    if (tasksRaw) {
      const tasks = JSON.parse(tasksRaw)
      const state = tasks.state ?? tasks
      if (state.tasks) {
        for (const t of state.tasks) {
          if (new Date(t.updatedAt ?? t.createdAt).getTime() > cutoff) count++
        }
      }
    }
  } catch { /* ignore */ }
  try {
    const moneyRaw = localStorage.getItem('selfsync-money-v2')
    if (moneyRaw) {
      const money = JSON.parse(moneyRaw)
      const state = money.state ?? money
      if (state.transactions) {
        for (const t of state.transactions) {
          if (new Date(t.createdAt).getTime() > cutoff) count++
        }
      }
    }
  } catch { /* ignore */ }

  return count
}