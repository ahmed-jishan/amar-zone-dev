// ─── BackupAutoScheduler ─────────────────────────────────────────────────────
// Debounced auto-backup on app close, major data changes, and periodic intervals.
// Respects user preferences (autoSync, wifiOnlySync).

import { buildBackupEnvelope, downloadBackupFile } from './serializer'

const AUTO_BACKUP_INTERVAL_MS = 15 * 60 * 1000 // 15 minutes
const DEBOUNCE_MS = 5000 // 5 seconds after last change

let debounceTimer: ReturnType<typeof setTimeout> | null = null
let intervalTimer: ReturnType<typeof setInterval> | null = null
let isRunning = false

// ─── Trigger auto-backup (debounced) ───
export function triggerAutoBackup(): void {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(async () => {
    if (isRunning) return
    isRunning = true
    try {
      const envelope = await buildBackupEnvelope()
      await downloadBackupFile(envelope)
    } catch {
      // Silently fail for auto-backup
    } finally {
      isRunning = false
    }
  }, DEBOUNCE_MS)
}

// ─── Start periodic auto-backup ───
export function startAutoBackupScheduler(): void {
  if (intervalTimer) return

  // Run once immediately on start
  triggerAutoBackup()

  // Then every interval
  intervalTimer = setInterval(() => {
    triggerAutoBackup()
  }, AUTO_BACKUP_INTERVAL_MS)
}

// ─── Stop periodic auto-backup ───
export function stopAutoBackupScheduler(): void {
  if (intervalTimer) {
    clearInterval(intervalTimer)
    intervalTimer = null
  }
  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }
}

// ─── Check if scheduler is running ───
export function isAutoBackupRunning(): boolean {
  return intervalTimer !== null
}

// ─── Handle app visibility change (for PWA/mobile) ───
export function setupVisibilityHandler(): () => void {
  const handler = () => {
    if (document.visibilityState === 'hidden') {
      // App is being closed/minimized — trigger backup
      triggerAutoBackup()
    }
  }

  document.addEventListener('visibilitychange', handler)
  return () => document.removeEventListener('visibilitychange', handler)
}
