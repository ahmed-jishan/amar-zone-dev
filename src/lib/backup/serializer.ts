// ─── BackupSerializer ─────────────────────────────────────────────────────────
// Handles export/import of backup files with encryption support.
// Wraps BackupPayload in a versioned, checksummed envelope.

import type { BackupEnvelope, BackupPayload } from './types'
import { BACKUP_SCHEMA_VERSION, BACKUP_SCHEMA_NAME } from './types'
import { collectBackupPayload } from './collector'
import { computeChecksum } from './validator'
import { saveTextFile } from '@/lib/native/fileSave'

// ─── The app version from package.json or a constant ───
const APP_VERSION = '1.0.0'

// ─── Build a complete backup envelope ───
export async function buildBackupEnvelope(payload?: BackupPayload): Promise<BackupEnvelope> {
  const data = payload ?? collectBackupPayload()
  const checksum = await computeChecksum(data)
  return {
    schema: BACKUP_SCHEMA_NAME,
    version: BACKUP_SCHEMA_VERSION,
    createdAt: new Date().toISOString(),
    appVersion: APP_VERSION,
    checksum,
    checksumAlgorithm: 'sha256',
    data,
  }
}

// ─── Serialize envelope to JSON string ───
export function serializeBackup(envelope: BackupEnvelope): string {
  return JSON.stringify(envelope, null, 2)
}

// ─── Deserialize JSON string to envelope ───
export function deserializeBackup(json: string): BackupEnvelope | null {
  try {
    const parsed = JSON.parse(json)
    if (!parsed || typeof parsed !== 'object') return null
    return parsed as BackupEnvelope
  } catch {
    return null
  }
}

// ─── Create a downloadable blob from a backup ───
export function createBackupBlob(envelope: BackupEnvelope): Blob {
  const json = serializeBackup(envelope)
  return new Blob([json], { type: 'application/json;charset=utf-8' })
}

// ─── Trigger a file download ───
export async function downloadBackupFile(envelope: BackupEnvelope, filename?: string) {
  const now = new Date()
  const dateStr = `${now.getMonth() + 1}-${now.getDate()}-${now.getFullYear()}`
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
  
  // Build count string from payload
  const p = envelope.data
  const parts: string[] = []
  if (p.tasks.tasks.length > 0) parts.push(`task-${p.tasks.tasks.length}`)
  if (p.money.transactions.length > 0) parts.push(`money-${p.money.transactions.length}`)
  if (p.money.loans.length > 0) parts.push(`loan-${p.money.loans.length}`)
  if (p.money.budgets.length > 0) parts.push(`budget-${p.money.budgets.length}`)
  if (p.money.savingsGoals.length > 0) parts.push(`goal-${p.money.savingsGoals.length}`)
  if (p.money.subscriptions.length > 0) parts.push(`sub-${p.money.subscriptions.length}`)
  if (p.namaz.records.length > 0) parts.push(`namaz-${p.namaz.records.length}`)
  if (p.notes.notes.length > 0) parts.push(`notes-${p.notes.notes.length}`)
  if (p.health.bmiRecords.length > 0) parts.push(`health-${p.health.bmiRecords.length}`)
  const countStr = parts.join('-')
  
  await saveTextFile(
    filename ?? `selfsync-backup-${dateStr}-${timeStr}${countStr ? `-${countStr}` : ''}.json`,
    serializeBackup(envelope),
    'application/json;charset=utf-8'
  )
}

// ─── Read a backup file from a File object ───
export function readBackupFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target?.result as string ?? '')
    reader.onerror = () => reject(new Error('Failed to read backup file'))
    reader.readAsText(file)
  })
}

// ─── Get the backup file size for preview ───
export function getBackupFileSize(envelope: BackupEnvelope): number {
  return new Blob([serializeBackup(envelope)]).size
}
