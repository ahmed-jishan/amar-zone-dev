'use client'

import { useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, Loader2, Mail, Trash2, Undo2 } from 'lucide-react'
import { gdriveAuth } from '@/lib/sync/gdrive-auth'
import { GMAIL_PRESETS, previewGmail, trashGmailMatches, undoTrashMessageIds } from '@/lib/mail/gmailCleaner'

export default function MailCleanerPage() {
  const [selectedId, setSelectedId] = useState(GMAIL_PRESETS[0].id)
  const [connected, setConnected] = useState(() => gdriveAuth.isConnected())
  const [busy, setBusy] = useState(false)
  const [previewCount, setPreviewCount] = useState<number | null>(null)
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [error, setError] = useState('')
  const [movedIds, setMovedIds] = useState<string[]>([])

  const selected = useMemo(() => GMAIL_PRESETS.find((preset) => preset.id === selectedId) || GMAIL_PRESETS[0], [selectedId])

  const connect = async () => {
    setBusy(true)
    setError('')
    try {
      await gdriveAuth.connect()
      setConnected(true)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not connect Gmail')
    } finally {
      setBusy(false)
    }
  }

  const preview = async () => {
    setBusy(true)
    setError('')
    setPreviewCount(null)
    try {
      const result = await previewGmail(selected.query)
      setPreviewCount(result.estimate)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not preview mail')
    } finally {
      setBusy(false)
    }
  }

  const clean = async () => {
    if (previewCount === null || previewCount === 0) return
    if (!window.confirm(`${previewCount.toLocaleString()} messages will be moved to Gmail Trash. Continue?`)) return
    setBusy(true)
    setError('')
    try {
      const ids = await trashGmailMatches(selected.query, (done, total) => setProgress({ done, total }))
      setMovedIds(ids)
      setPreviewCount(0)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not clean mail')
    } finally {
      setBusy(false)
    }
  }

  const undo = async () => {
    if (movedIds.length === 0) return
    setBusy(true)
    setError('')
    try {
      await undoTrashMessageIds(movedIds)
      setMovedIds([])
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not undo')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-[720px] px-4 pb-28 pt-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-500">
          <Mail size={21} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[rgb(var(--fg))]">Mail Cleaner</h1>
          <p className="text-sm text-[rgb(var(--muted))]">Gmail cleanup with Trash and Undo</p>
        </div>
      </div>

      {!connected ? (
        <div className="rounded-3xl border border-[rgba(var(--border),0.6)] bg-[rgba(var(--border),0.08)] p-5">
          <h2 className="font-bold text-[rgb(var(--fg))]">Connect Google</h2>
          <p className="mt-1 text-sm leading-6 text-[rgb(var(--muted))]">Gmail permission is requested only for this cleaner. Messages stay in your Gmail account.</p>
          <button type="button" onClick={() => void connect()} disabled={busy} className="mt-4 h-12 w-full rounded-2xl bg-blue-600 font-bold text-white disabled:opacity-60">
            {busy ? <Loader2 className="mx-auto animate-spin" size={18} /> : 'Connect Gmail'}
          </button>
        </div>
      ) : (
        <>
          <div className="mb-3 flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-500">
            <CheckCircle2 size={17} /> Gmail connected
          </div>

          <div className="grid gap-3">
            {GMAIL_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => { setSelectedId(preset.id); setPreviewCount(null); setMovedIds([]) }}
                className={`rounded-2xl border p-4 text-left transition ${selectedId === preset.id ? 'border-blue-500/60 bg-blue-500/10' : 'border-[rgba(var(--border),0.6)] bg-[rgba(var(--border),0.07)]'}`}
              >
                <div className="font-bold text-[rgb(var(--fg))]">{preset.title}</div>
                <div className="mt-1 text-sm text-[rgb(var(--muted))]">{preset.description}</div>
              </button>
            ))}
          </div>

          <div className="mt-4 rounded-3xl border border-[rgba(var(--border),0.6)] bg-[rgba(var(--border),0.07)] p-4">
            {previewCount !== null && (
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm text-[rgb(var(--muted))]">Matching messages</span>
                <strong className="text-lg text-[rgb(var(--fg))]">{previewCount.toLocaleString()}</strong>
              </div>
            )}
            {progress.total > 0 && busy && (
              <div className="mb-3">
                <div className="mb-1 text-xs text-[rgb(var(--muted))]">Progress: {progress.done} / {progress.total}</div>
                <div className="h-2 overflow-hidden rounded-full bg-[rgba(var(--border),0.5)]">
                  <div className="h-full bg-blue-500 transition-all" style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }} />
                </div>
              </div>
            )}

            {movedIds.length > 0 ? (
              <button type="button" onClick={() => void undo()} disabled={busy} className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-emerald-500/30 text-sm font-bold text-emerald-500 disabled:opacity-60">
                {busy ? <Loader2 className="animate-spin" size={16} /> : <Undo2 size={16} />} Undo cleanup
              </button>
            ) : previewCount === null ? (
              <button type="button" onClick={() => void preview()} disabled={busy} className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 text-sm font-bold text-white disabled:opacity-60">
                {busy ? <Loader2 className="animate-spin" size={16} /> : <AlertTriangle size={16} />} Preview cleanup
              </button>
            ) : (
              <button type="button" onClick={() => void clean()} disabled={busy || previewCount === 0} className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-red-600 text-sm font-bold text-white disabled:opacity-60">
                {busy ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />} Move to Trash
              </button>
            )}
          </div>
        </>
      )}

      {error && <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-500">{error}</div>}
    </div>
  )
}
