'use client'

import { useEffect, useState } from 'react'
import { Download, Loader2, RefreshCw, Trash2 } from 'lucide-react'
import { Modal } from '@/components/shared/Modal'
import { syncManager } from '@/lib/sync/sync-manager'
import { deserializeBackup } from '@/lib/backup'
import { saveTextFile } from '@/lib/native/fileSave'
import type { GDriveBackupFile } from '@/lib/sync/gdrive-auth'

type Props = {
  open: boolean
  onClose: () => void
  refreshKey?: number
}

export default function BackupListDialog({ open, onClose, refreshKey }: Props) {
  const [backups, setBackups] = useState<GDriveBackupFile[]>([])
  const [password, setPassword] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const loadBackups = async () => {
    setLoading(true)
    setMessage('')
    try {
      setBackups(await syncManager.listBackups())
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not load backups.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) void loadBackups()
  }, [open, refreshKey])

  const restore = async (fileId: string) => {
    setBusyId(fileId)
    setMessage('Restoring encrypted backup...')
    try {
      await syncManager.restoreBackup(password)
      setMessage('Backup restored. Restart the app to reload all stores.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Restore failed.')
    } finally {
      setBusyId(null)
    }
  }

  const remove = async (fileId: string) => {
    setBusyId(fileId)
    try {
      await syncManager.deleteBackup(fileId)
      setBackups((items) => items.filter((item) => item.id !== fileId))
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Delete failed.')
    } finally {
      setBusyId(null)
    }
  }

  const downloadRaw = async (file: GDriveBackupFile) => {
    setBusyId(file.id)
    setMessage('Preparing backup download...')
    try {
      const raw = await syncManager.downloadRawBackup()
      if (!deserializeBackup(raw)) throw new Error('Downloaded content is not a valid SelfSync backup JSON.')
      const safeName = 'selfsync-backup.json'
      await saveTextFile(safeName, raw, 'application/json;charset=utf-8')
      setMessage('Backup JSON saved to Downloads.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Download failed.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Drive Backups">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="input"
            placeholder="Password for restore"
          />
          <button type="button" onClick={loadBackups} className="btn-ghost shrink-0" aria-label="Refresh backups">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {message && <div className="rounded-2xl bg-slate-100 p-3 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">{message}</div>}

        {loading && <div className="flex items-center justify-center gap-2 rounded-2xl p-6 text-sm text-slate-500"><Loader2 className="animate-spin" size={18} /> Loading backups</div>}

        {!loading && backups.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700">
            No cloud backups yet.
          </div>
        )}

        <div className="space-y-2">
          {backups.map((file) => (
            <div key={file.id} className="rounded-2xl border border-slate-200 p-3 dark:border-slate-800">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{file.name}</div>
                <div className="mt-1 text-xs text-slate-500">
                  {file.modifiedTime
                    ? new Date(file.modifiedTime).toLocaleString()
                    : file.createdTime
                      ? new Date(file.createdTime).toLocaleString()
                      : 'Backup'}
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <button type="button" disabled={!password || busyId === file.id} onClick={() => restore(file.id)} className="btn-primary px-2 py-2 text-xs">Restore</button>
                <button type="button" disabled={busyId === file.id} onClick={() => downloadRaw(file)} className="btn-ghost px-2 py-2 text-xs"><Download size={14} /></button>
                <button type="button" disabled={busyId === file.id} onClick={() => remove(file.id)} className="btn-ghost px-2 py-2 text-xs text-red-500"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  )
}
