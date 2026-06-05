// ─── BackupRestorer ───────────────────────────────────────────────────────────
// Handles restore with emergency snapshots, rollback, and write-back to stores.

import type { BackupPayload, RestoreOptions, RestoreResult, EmergencySnapshot, RestorePreview } from './types'
import { BACKUP_STORAGE_KEYS, BACKUP_META_KEYS } from './types'
import { collectBackupPayload, getBackupCounts, getTotalAmount } from './collector'
import { computeDifferences } from './merger'
import { getBackupFileSize } from './serializer'

// ─── Create emergency snapshot before any destructive operation ───
export function createEmergencySnapshot(): EmergencySnapshot {
  const keys = Object.values(BACKUP_STORAGE_KEYS)
  const data: Record<string, string> = {}
  
  for (const key of keys) {
    try {
      const value = localStorage.getItem(key)
      if (value !== null) data[key] = value
    } catch {
      // Skip keys that can't be read
    }
  }

  const snapshot: EmergencySnapshot = {
    timestamp: new Date().toISOString(),
    keys: Object.keys(data),
    data,
  }

  // Store snapshot in localStorage
  const snapshotKey = `${BACKUP_META_KEYS.snapshotPrefix}${Date.now()}`
  try {
    localStorage.setItem(snapshotKey, JSON.stringify(snapshot))
  } catch {
    // If snapshot is too large, store without full data (key-only snapshot)
    const keyOnly: EmergencySnapshot = { ...snapshot, data: {} }
    localStorage.setItem(snapshotKey, JSON.stringify(keyOnly))
  }

  // Clean old snapshots (keep only the 3 most recent)
  cleanupOldSnapshots()

  return snapshot
}

// ─── Rollback to snapshot ───
export function rollbackToSnapshot(snapshotKey: string): boolean {
  try {
    const raw = localStorage.getItem(snapshotKey)
    if (!raw) return false
    
    const snapshot = JSON.parse(raw) as EmergencySnapshot
    
    // Restore each key
    for (const key of snapshot.keys) {
      if (snapshot.data[key] !== undefined) {
        localStorage.setItem(key, snapshot.data[key])
      }
    }

    // Remove snapshot after successful rollback
    localStorage.removeItem(snapshotKey)
    return true
  } catch {
    return false
  }
}

// ─── Perform restore ───
export async function restoreBackup(
  payload: BackupPayload,
  options: RestoreOptions,
): Promise<RestoreResult> {
  // Step 1: Create emergency snapshot
  const snapshotKey = `${BACKUP_META_KEYS.snapshotPrefix}${Date.now()}`
  const snapshot = createEmergencySnapshot()
  
  try {
    // Step 2: Persist data back to localStorage
    const restoredKeys = writePayloadToStorage(payload, options)
    
    return {
      success: true,
      restoredKeys,
      rolledBack: false,
      snapshotKey,
    }
  } catch (error) {
    // Step 3: Rollback on failure
    const rolledBack = rollbackToSnapshot(snapshotKey)
    return {
      success: false,
      restoredKeys: [],
      error: error instanceof Error ? error.message : 'Restore failed',
      rolledBack,
      snapshotKey: rolledBack ? undefined : snapshotKey,
    }
  }
}

// ─── Validate that restored data is consistent ───
export function validateRestoredData(): boolean {
  try {
    // Try to read each store and verify it parses correctly
    for (const key of Object.values(BACKUP_STORAGE_KEYS)) {
      const raw = localStorage.getItem(key)
      if (raw !== null) {
        JSON.parse(raw) // Will throw if corrupted
      }
    }
    return true
  } catch {
    return false
  }
}

// ─── Get all available snapshots ───
export function listSnapshots(): { key: string; timestamp: string }[] {
  const snapshots: { key: string; timestamp: string }[] = []
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith(BACKUP_META_KEYS.snapshotPrefix)) {
      try {
        const raw = localStorage.getItem(key)
        if (raw) {
          const data = JSON.parse(raw) as EmergencySnapshot
          snapshots.push({ key, timestamp: data.timestamp })
        }
      } catch {
        // Corrupted snapshot entry
      }
    }
  }
  
  return snapshots.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

// ─── Build restore preview from a backup envelope ───
export function buildRestorePreview(backup: BackupPayload, sizeBytes: number): RestorePreview {
  const local = collectBackupPayload()
  return {
    backupCreatedAt: '', // Will be set from envelope
    backupSizeBytes: sizeBytes,
    counts: getBackupCounts(backup),
    localCounts: getBackupCounts(local),
    differences: computeDifferences(backup),
  }
}

// ══════════════════════════════════════════════
//  PRIVATE HELPERS
// ══════════════════════════════════════════════

function writePayloadToStorage(payload: BackupPayload, options: RestoreOptions): string[] {
  const keys: string[] = []

  // Tasks
  if (options.selectedModules?.tasks !== false) {
    const existing = readRaw(BACKUP_STORAGE_KEYS.tasks)
    if (existing) {
      const parsed = JSON.parse(existing)
      const state = (parsed as { state?: unknown }).state ?? parsed
      writeWithState(BACKUP_STORAGE_KEYS.tasks, { tasks: payload.tasks.tasks }, existing)
    } else {
      localStorage.setItem(BACKUP_STORAGE_KEYS.tasks, JSON.stringify({ state: { tasks: payload.tasks.tasks } }))
    }
    keys.push(BACKUP_STORAGE_KEYS.tasks)
  }

  // Money
  if (options.selectedModules?.money !== false) {
    const existing = readRaw(BACKUP_STORAGE_KEYS.money)
    if (existing) {
      writeWithState(BACKUP_STORAGE_KEYS.money, payload.money, existing)
    } else {
      localStorage.setItem(BACKUP_STORAGE_KEYS.money, JSON.stringify({ state: payload.money }))
    }
    keys.push(BACKUP_STORAGE_KEYS.money)
  }

  // Namaz
  if (options.selectedModules?.namaz !== false) {
    const existing = readRaw(BACKUP_STORAGE_KEYS.namaz)
    if (existing) {
      writeWithState(BACKUP_STORAGE_KEYS.namaz, payload.namaz, existing)
    } else {
      localStorage.setItem(BACKUP_STORAGE_KEYS.namaz, JSON.stringify({ state: payload.namaz }))
    }
    keys.push(BACKUP_STORAGE_KEYS.namaz)
  }

  // Settings
  if (options.selectedModules?.settings !== false) {
    const existing = readRaw(BACKUP_STORAGE_KEYS.settings)
    if (existing) {
      writeWithState(BACKUP_STORAGE_KEYS.settings, payload.settings.appSettings, existing)
    } else {
      localStorage.setItem(BACKUP_STORAGE_KEYS.settings, JSON.stringify({ state: payload.settings.appSettings }))
    }
    keys.push(BACKUP_STORAGE_KEYS.settings)
  }

  // Namaz Prefs
  if (options.selectedModules?.prefs !== false) {
    const existing = readRaw(BACKUP_STORAGE_KEYS.namazPrefs)
    if (existing) {
      writeWithState(BACKUP_STORAGE_KEYS.namazPrefs, payload.prefs, existing)
    } else {
      localStorage.setItem(BACKUP_STORAGE_KEYS.namazPrefs, JSON.stringify({ state: payload.prefs }))
    }
    keys.push(BACKUP_STORAGE_KEYS.namazPrefs)
  }

  return keys
}

function readRaw(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeWithState(key: string, newState: unknown, existingRaw: string): void {
  try {
    const parsed = JSON.parse(existingRaw)
    // Zustand format: { state: T, version?: number }
    if ('state' in parsed) {
      const version = parsed.version
      localStorage.setItem(key, JSON.stringify({
        state: newState,
        version: version ?? undefined,
      }))
    } else {
      // Plain format
      localStorage.setItem(key, JSON.stringify(newState))
    }
  } catch {
    // Fallback: write directly
    localStorage.setItem(key, JSON.stringify({ state: newState }))
  }
}

function cleanupOldSnapshots(): void {
  const snapshots = listSnapshots()
  if (snapshots.length > 3) {
    for (let i = 3; i < snapshots.length; i++) {
      try {
        localStorage.removeItem(snapshots[i].key)
      } catch {
        // Ignore cleanup errors
      }
    }
  }
}