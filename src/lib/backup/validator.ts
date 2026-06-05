// ─── BackupValidator ─────────────────────────────────────────────────────────
// Validates backup integrity: schema version, required fields, checksum.

import type { BackupEnvelope, BackupPayload, ValidationResult, ValidationError } from './types'
import { BACKUP_SCHEMA_VERSION, BACKUP_SCHEMA_NAME } from './types'

// ─── Validate a backup envelope before use ───
export function validateBackup(data: unknown): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: string[] = []

  if (!data || typeof data !== 'object') {
    errors.push({ code: 'NOT_AN_OBJECT', message: 'Backup data is not a valid object' })
    return { valid: false, version: null, errors, warnings }
  }

  const envelope = data as Record<string, unknown>

  // Schema name check
  if (envelope.schema !== BACKUP_SCHEMA_NAME) {
    errors.push({
      code: 'INVALID_SCHEMA',
      message: `Unknown schema "${envelope.schema}". Expected "${BACKUP_SCHEMA_NAME}".`,
      field: 'schema',
    })
  }

  // Version check
  const version = typeof envelope.version === 'string' ? envelope.version : null
  if (!version) {
    errors.push({ code: 'MISSING_VERSION', message: 'Backup version is missing.', field: 'version' })
  } else if (version !== BACKUP_SCHEMA_VERSION) {
    warnings.push(`Backup version "${version}" differs from current "${BACKUP_SCHEMA_VERSION}". Migration may be needed.`)
  }

  // Required fields
  if (!envelope.createdAt || typeof envelope.createdAt !== 'string') {
    errors.push({ code: 'MISSING_DATE', message: 'Backup creation date is missing.', field: 'createdAt' })
  }

  if (!envelope.checksum || typeof envelope.checksum !== 'string') {
    errors.push({ code: 'MISSING_CHECKSUM', message: 'Backup checksum is missing.', field: 'checksum' })
  }

  if (!envelope.data || typeof envelope.data !== 'object') {
    errors.push({ code: 'MISSING_DATA', message: 'Backup data payload is missing or invalid.', field: 'data' })
  }

  return {
    valid: errors.length === 0,
    version,
    errors,
    warnings,
  }
}

// ─── Compute a SHA-256 checksum of the payload data ───
export async function computeChecksum(payload: BackupPayload): Promise<string> {
  const json = JSON.stringify(payload)
  const encoder = new TextEncoder()
  const data = encoder.encode(json)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

// ─── Verify checksum matches payload ───
export async function verifyChecksum(envelope: BackupEnvelope): Promise<boolean> {
  const computed = await computeChecksum(envelope.data)
  return computed === envelope.checksum
}

// ─── Validate required fields exist in the backup data ───
export function validateBackupData(data: BackupPayload): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: string[] = []

  // Tasks
  if (!data.tasks) {
    errors.push({ code: 'MISSING_TASKS', message: 'Tasks data is missing from backup.' })
  } else if (!Array.isArray(data.tasks.tasks)) {
    errors.push({ code: 'INVALID_TASKS', message: 'Tasks data is not an array.' })
  }

  // Money
  if (!data.money) {
    errors.push({ code: 'MISSING_MONEY', message: 'Money data is missing from backup.' })
  } else {
    const required = ['transactions', 'loans', 'budgets', 'savingsGoals', 'wallets', 'subscriptions', 'insights'] as const
    for (const key of required) {
      if (!Array.isArray((data.money as unknown as Record<string, unknown>)[key])) {
        errors.push({ code: `INVALID_MONEY_${key.toUpperCase()}`, message: `Money.${key} is not an array.` })
      }
    }
  }

  // Namaz
  if (!data.namaz) {
    errors.push({ code: 'MISSING_NAMAZ', message: 'Namaz data is missing from backup.' })
  } else {
    if (!Array.isArray(data.namaz.records)) {
      errors.push({ code: 'INVALID_NAMAZ_RECORDS', message: 'Namaz records is not an array.' })
    }
    if (!data.namaz.settings || typeof data.namaz.settings !== 'object') {
      errors.push({ code: 'INVALID_NAMAZ_SETTINGS', message: 'Namaz settings are missing or invalid.' })
    }
  }

  // Settings
  if (!data.settings) {
    errors.push({ code: 'MISSING_SETTINGS', message: 'Settings data is missing from backup.' })
  } else if (!data.settings.appSettings || typeof data.settings.appSettings !== 'object') {
    errors.push({ code: 'INVALID_SETTINGS', message: 'App settings are missing or invalid.' })
  }

  return {
    valid: errors.length === 0,
    version: BACKUP_SCHEMA_VERSION,
    errors,
    warnings,
  }
}

// ─── Full validation pipeline ───
export async function validateFullBackup(data: unknown): Promise<ValidationResult> {
  // Step 1: Envelope validation
  const envelopeResult = validateBackup(data)
  if (!envelopeResult.valid) return envelopeResult

  const envelope = data as BackupEnvelope

  // Step 2: Checksum verification
  const checksumValid = await verifyChecksum(envelope)
  if (!checksumValid) {
    return {
      ...envelopeResult,
      valid: false,
      errors: [...envelopeResult.errors, { code: 'CHECKSUM_MISMATCH', message: 'Backup checksum does not match data. The file may be corrupted.' }],
    }
  }

  // Step 3: Data structure validation
  const dataResult = validateBackupData(envelope.data)
  return {
    valid: dataResult.valid,
    version: envelope.version,
    errors: [...envelopeResult.errors, ...dataResult.errors],
    warnings: [...envelopeResult.warnings, ...dataResult.warnings],
  }
}