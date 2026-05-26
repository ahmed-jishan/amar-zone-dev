import { buildBackupPayload, mergeBackupPayload, type BackupPayload } from '@/lib/utils/encryptedBackup'
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

export class SyncManager {
  async createBackup(password: string): Promise<SyncResult> {
    this.assertOnline()
    const payload = buildBackupPayload()
    const encrypted = await encryptData(payload, password)
    const envelope: CloudBackupEnvelope = { schema: 'amar-zone.cloud-backup', version: 1, encrypted }
    const name = `amar-zone-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
    const file = await this.withRetry(() => gdriveAuth.uploadToAppDataFolder(name, JSON.stringify(envelope)))
    return { file, createdAt: payload.createdAt }
  }

  async restoreBackup(fileId: string, password: string): Promise<string[]> {
    this.assertOnline()
    const raw = await this.withRetry(() => gdriveAuth.downloadFile(fileId))
    const envelope = JSON.parse(raw) as CloudBackupEnvelope
    if (envelope.schema !== 'amar-zone.cloud-backup' || envelope.version !== 1) {
      throw new Error('This is not a valid Amar Zone cloud backup')
    }
    const payload = await decryptData<BackupPayload>(envelope.encrypted, password)
    this.validatePayload(payload)
    return mergeBackupPayload(payload)
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

  async downloadRawBackup(fileId: string): Promise<string> {
    this.assertOnline()
    return this.withRetry(() => gdriveAuth.downloadFile(fileId))
  }

  private validatePayload(payload: BackupPayload): void {
    if (payload.version !== 1 || !payload.createdAt || typeof payload.data !== 'object') {
      throw new Error('Backup schema validation failed')
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
