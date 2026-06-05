import { buildBackupPayload, replaceBackupPayload, type BackupPayload } from '@/lib/utils/encryptedBackup'
import { encryptData, decryptData } from './crypto'
import { gdriveAuth, type GDriveBackupFile } from './gdrive-auth'

export type SyncResult = {
  file: GDriveBackupFile
  createdAt: string
}

type CloudBackupEnvelope = {
  schema: 'amar-zone.cloud-backup'
  version: 1
  encrypted: string
}

function buildBackupFileName(payload: BackupPayload): string {
  const now = new Date()
  const dateStr = `${now.getMonth() + 1}-${now.getDate()}-${now.getFullYear()}`
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
  const parts: string[] = []
  if (payload.data.tasks?.state?.tasks?.length) parts.push(`task-${payload.data.tasks.state.tasks.length}`)
  if (payload.data.money?.state?.transactions?.length) parts.push(`money-${payload.data.money.state.transactions.length}`)
  if (payload.data.money?.state?.loans?.length) parts.push(`loan-${payload.data.money.state.loans.length}`)
  if (payload.data.money?.state?.budgets?.length) parts.push(`budget-${payload.data.money.state.budgets.length}`)
  if (payload.data.money?.state?.savingsGoals?.length) parts.push(`goal-${payload.data.money.state.savingsGoals.length}`)
  if (payload.data.money?.state?.subscriptions?.length) parts.push(`sub-${payload.data.money.state.subscriptions.length}`)
  if (payload.data.namaz?.state?.records?.length) parts.push(`namaz-${payload.data.namaz.state.records.length}`)
  const countStr = parts.join('-')
  return `selfsync-backup-${dateStr}-${timeStr}${countStr ? `-${countStr}` : ''}.json`
}

export class SyncManager {
  async createBackup(password: string): Promise<SyncResult> {
    this.assertOnline()
    const payload = buildBackupPayload()
    const backupName = buildBackupFileName(payload)
    const encrypted = await encryptData(payload, password)
    const envelope: CloudBackupEnvelope = { schema: 'amar-zone.cloud-backup', version: 1, encrypted }
    const content = JSON.stringify(envelope)
    const file = await this.withRetry(() => gdriveAuth.upsertBackupFile(content, backupName))
    return { file, createdAt: payload.createdAt }
  }

  async restoreBackup(password: string): Promise<string[]> {
    this.assertOnline()
    const raw = await this.withRetry(() => gdriveAuth.downloadBackup())
    const envelope = this.parseEnvelope(raw)
    if (envelope.schema !== 'amar-zone.cloud-backup' || envelope.version !== 1) {
      throw new Error('This is not a valid Amar Zone cloud backup')
    }
    const payload = await decryptData<BackupPayload>(envelope.encrypted, password)
    this.validatePayload(payload)
    return replaceBackupPayload(payload)
  }

  async autoSync(password?: string): Promise<SyncResult | null> {
    if (!password || !gdriveAuth.isConnected() || !navigator.onLine) return null
    return this.createBackup(password)
  }

  async listBackups(): Promise<GDriveBackupFile[]> {
    this.assertOnline()
    return this.withRetry(() => gdriveAuth.listBackups())
  }

  async deleteBackup(fileId: string): Promise<void> {
    this.assertOnline()
    await this.withRetry(() => gdriveAuth.deleteFile(fileId))
  }

  async downloadRawBackup(): Promise<string> {
    this.assertOnline()
    const raw = await this.withRetry(() => gdriveAuth.downloadBackup())
    this.parseEnvelope(raw)
    return raw
  }

  private validatePayload(payload: BackupPayload): void {
    if (payload.version !== 1 || !payload.createdAt || typeof payload.data !== 'object') {
      throw new Error('Backup schema validation failed')
    }
  }

  private parseEnvelope(raw: string): CloudBackupEnvelope {
    try {
      return JSON.parse(raw) as CloudBackupEnvelope
    } catch {
      throw new Error('Backup file is corrupted or unreadable')
    }
  }

  private assertOnline(): void {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new Error('You are offline. Connect to the internet and try again.')
    }
  }

  private async withRetry<T>(operation: () => Promise<T>, attempts = 3): Promise<T> {
    let lastError: unknown
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      try {
        return await operation()
      } catch (error) {
        lastError = error
        if (attempt === attempts - 1) break
        await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)))
      }
    }
    throw lastError instanceof Error ? lastError : new Error('Sync failed')
  }
}

export const syncManager = new SyncManager()
