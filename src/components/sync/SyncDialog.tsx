'use client'

import { useState } from 'react'
import { CheckCircle2, Loader2, ShieldCheck, XCircle } from 'lucide-react'
import { Modal } from '@/components/shared/Modal'
import { syncManager } from '@/lib/sync/sync-manager'
import { useSettingsStore } from '@/features/settings/store/settingsStore'

type Props = {
  open: boolean
  onClose: () => void
}

type SyncState = 'idle' | 'syncing' | 'success' | 'error'

export default function SyncDialog({ open, onClose }: Props) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [state, setState] = useState<SyncState>('idle')
  const [message, setMessage] = useState('')
  const update = useSettingsStore((s) => s.update)
  const setLastSync = useSettingsStore((s) => s.setLastSync)

  const canSubmit = password.length >= 8 && password === confirmPassword && state !== 'syncing'

  const handleSync = async () => {
    if (!canSubmit) {
      setState('error')
      setMessage(password.length < 8 ? 'Use at least 8 characters.' : 'Passwords do not match.')
      return
    }

    setState('syncing')
    setMessage('Encrypting your data on this device...')
    try {
      const result = await syncManager.createBackup(password)
      update({ syncPassword: password, syncEnabled: true })
      setLastSync(result.createdAt)
      setState('success')
      setMessage('Backup uploaded securely to Google Drive.')
    } catch (error) {
      setState('error')
      setMessage(error instanceof Error ? error.message : 'Sync failed. Please try again.')
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Encrypted Cloud Sync">
      <div className="space-y-4">
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm leading-6 text-emerald-200 dark:text-emerald-100">
          <div className="mb-1 flex items-center gap-2 font-semibold">
            <ShieldCheck size={17} /> Private by design
          </div>
          Your data is encrypted on your device before uploading. We never see your data.
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-semibold text-slate-500 dark:text-slate-300">Sync password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="input"
            autoComplete="new-password"
            placeholder="At least 8 characters"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-semibold text-slate-500 dark:text-slate-300">Confirm password</span>
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="input"
            autoComplete="new-password"
            placeholder="Repeat sync password"
          />
        </label>

        {message && (
          <div className="flex items-start gap-2 rounded-2xl bg-slate-100 p-3 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            {state === 'syncing' && <Loader2 className="mt-0.5 animate-spin" size={16} />}
            {state === 'success' && <CheckCircle2 className="mt-0.5 text-emerald-500" size={16} />}
            {state === 'error' && <XCircle className="mt-0.5 text-red-500" size={16} />}
            <span>{message}</span>
          </div>
        )}

        <button type="button" onClick={handleSync} disabled={!canSubmit} className="btn-primary flex w-full items-center justify-center gap-2">
          {state === 'syncing' && <Loader2 className="animate-spin" size={17} />}
          {state === 'error' ? 'Retry Sync' : 'Sync Now'}
        </button>
      </div>
    </Modal>
  )
}
