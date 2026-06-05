// ─── SelfSync Backup System — Public API ─────────────────────────────────────
// Import from here to access all backup/restore functionality.

// Types
export type {
  BackupEnvelope,
  BackupPayload,
  BackupCounts,
  BackupDifferences,
  BackupPrefsCollection,
  RestoreOptions,
  RestorePreview,
  RestoreResult,
  ValidationResult,
  ValidationError,
  EmergencySnapshot,
  RestoreStrategy,
} from './types'

export {
  BACKUP_SCHEMA_VERSION,
  BACKUP_SCHEMA_NAME,
  BACKUP_STORAGE_KEYS,
} from './types'

// Collector
export {
  collectBackupPayload,
  getBackupCounts,
  getTotalAmount,
} from './collector'

// Validator
export {
  validateBackup,
  validateBackupData,
  validateFullBackup,
  computeChecksum,
  verifyChecksum,
} from './validator'

// Serializer
export {
  buildBackupEnvelope,
  serializeBackup,
  deserializeBackup,
  createBackupBlob,
  downloadBackupFile,
  readBackupFile,
  getBackupFileSize,
} from './serializer'

// Merger
export {
  mergeBackup,
  computeDifferences,
  getLocalCounts,
} from './merger'

// Restorer
export {
  restoreBackup,
  createEmergencySnapshot,
  rollbackToSnapshot,
  validateRestoredData,
  listSnapshots,
  buildRestorePreview,
} from './restorer'

// Auto Scheduler
export {
  triggerAutoBackup,
  startAutoBackupScheduler,
  stopAutoBackupScheduler,
  isAutoBackupRunning,
  setupVisibilityHandler,
} from './autoscheduler'