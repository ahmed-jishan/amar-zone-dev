'use client'

import { useState, useMemo, useRef, useCallback } from 'react'
import { Download, Upload, RotateCw, AlertTriangle, CheckCircle, XCircle, FileText, Database, ArrowLeft, ArrowRight } from 'lucide-react'
import { Modal } from '@/components/shared/Modal'
import { useSettingsStore, type Language } from '@/features/settings/store/settingsStore'
import {
  buildBackupEnvelope,
  downloadBackupFile,
  readBackupFile,
  deserializeBackup,
  validateFullBackup,
  getBackupCounts,
  getTotalAmount,
  restoreBackup,
  mergeBackup,
  computeDifferences,
  getLocalCounts,
  collectBackupPayload,
} from '@/lib/backup'
import type { BackupEnvelope, BackupCounts, ValidationResult, RestorePreview, RestoreStrategy } from '@/lib/backup'

// ─── Translations ───
const t = (lang: Language) => ({
  title: lang === 'bn' ? 'ব্যাকআপ ম্যানেজার' : 'Backup Manager',
  exportBtn: lang === 'bn' ? 'নতুন ব্যাকআপ নিন' : 'Create Backup',
  importBtn: lang === 'bn' ? 'ব্যাকআপ ইম্পোর্ট' : 'Import Backup',
  created: lang === 'bn' ? 'তৈরির তারিখ' : 'Created',
  size: lang === 'bn' ? 'সাইজ' : 'Size',
  records: lang === 'bn' ? 'রেকর্ড' : 'Records',
  tasks: lang === 'bn' ? 'টাস্ক' : 'Tasks',
  transactions: lang === 'bn' ? 'লেনদেন' : 'Transactions',
  loans: lang === 'bn' ? 'লোন' : 'Loans',
  budgets: lang === 'bn' ? 'বাজেট' : 'Budgets',
  goals: lang === 'bn' ? 'সেভিংস' : 'Goals',
  wallets: lang === 'bn' ? 'ওয়ালেট' : 'Wallets',
  subscriptions: lang === 'bn' ? 'সাবস্ক্রিপশন' : 'Subscriptions',
  namaz: lang === 'bn' ? 'নামাজ' : 'Namaz',
  namazDays: lang === 'bn' ? 'নামাজের দিন' : 'Prayer Days',
  merge: lang === 'bn' ? '🔄 মার্জ (সুপারিশকৃত)' : '🔄 Merge (Recommended)',
  mergeDesc: lang === 'bn' ? 'ব্যাকআপ ও বর্তমান ডেটা উভয়ই রাখে, ডুপ্লিকেট দূর করে' : 'Keeps both backup and current data, removes duplicates',
  replace: lang === 'bn' ? '⬇️ রিপ্লেস' : '⬇️ Replace',
  replaceDesc: lang === 'bn' ? 'সমস্ত ডেটা ব্যাকআপ দিয়ে প্রতিস্থাপন করে' : 'Replaces all data with backup',
  cancel: lang === 'bn' ? '❌ বাতিল' : '❌ Cancel',
  cancelBtn: lang === 'bn' ? 'বাতিল' : 'Cancel',
  validating: lang === 'bn' ? 'ভ্যালিডেটিং...' : 'Validating...',
  valid: lang === 'bn' ? '✅ ব্যাকআপ বৈধ' : '✅ Backup is valid',
  invalid: lang === 'bn' ? '❌ ব্যাকআপ অবৈধ' : '❌ Backup is invalid',
  corrupted: lang === 'bn' ? 'ব্যাকআপ ফাইল নষ্ট! অনুগ্রহ করে অন্যটি ব্যবহার করুন।' : 'Backup file corrupted! Please use a different file.',
  restoring: lang === 'bn' ? 'পুনরুদ্ধার হচ্ছে...' : 'Restoring...',
  restored: lang === 'bn' ? '✅ ডেটা পুনরুদ্ধার হয়েছে!' : '✅ Data restored successfully!',
  restoreFailed: lang === 'bn' ? 'পুনরুদ্ধার ব্যর্থ!' : 'Restore failed!',
  rolledBack: lang === 'bn' ? 'ইমার্জেন্সি স্ন্যাপশট থেকে রোলব্যাক করা হয়েছে। কোনো ডেটা হারায়নি।' : 'Rolled back from emergency snapshot. No data lost.',
  diffTransactions: (n: number) => lang === 'bn' ? `আপনার ${n}টি নতুন লেনদেন আছে` : `You have ${n} newer transactions`,
  diffTasks: (n: number) => lang === 'bn' ? `আপনার ${n}টি নতুন টাস্ক আছে` : `You have ${n} newer tasks`,
  diffLoans: (n: number) => lang === 'bn' ? `আপনার ${n}টি নতুন লোন আছে` : `You have ${n} newer loans`,
  diffGoals: (n: number) => lang === 'bn' ? `আপনার ${n}টি নতুন সেভিংস গোল আছে` : `You have ${n} newer savings goals`,
  stepExport: lang === 'bn' ? 'এক্সপোর্ট' : 'Export',
  stepImport: lang === 'bn' ? 'ইম্পোর্ট' : 'Import',
  stepPreview: lang === 'bn' ? 'প্রিভিউ' : 'Preview',
  stepRestore: lang === 'bn' ? 'রিস্টোর' : 'Restore',
  noFile: lang === 'bn' ? 'কোনো ফাইল নির্বাচন করেননি' : 'No file selected',
  selectFile: lang === 'bn' ? 'ফাইল নির্বাচন করুন' : 'Select a backup file',
  backupSummary: lang === 'bn' ? 'ব্যাকআপ সারাংশ' : 'Backup Summary',
  currentData: lang === 'bn' ? 'বর্তমান ডেটা' : 'Current Data',
  differences: lang === 'bn' ? 'পার্থক্য' : 'Differences',
})

type Step = 'menu' | 'export' | 'import'
type ImportStep = 'select' | 'validate' | 'preview' | 'restoring' | 'done'

export default function BackupManagerDialog({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const lang = useSettingsStore((s) => s.language)
  const strings = useMemo(() => t(lang), [lang])
  const [step, setStep] = useState<Step>('menu')
  const [importStep, setImportStep] = useState<ImportStep>('select')
  const [envelope, setEnvelope] = useState<BackupEnvelope | null>(null)
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [diff, setDiff] = useState<ReturnType<typeof computeDifferences> | null>(null)
  const [localCounts, setLocalCounts] = useState<BackupCounts | null>(null)
  const [backupCounts, setBackupCounts] = useState<BackupCounts | null>(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [strategy, setStrategy] = useState<RestoreStrategy | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const resetImport = useCallback(() => {
    setImportStep('select')
    setEnvelope(null)
    setValidation(null)
    setDiff(null)
    setLocalCounts(null)
    setBackupCounts(null)
    setError('')
    setMessage('')
    setStrategy(null)
  }, [])

  const handleBack = useCallback(() => {
    setStep('menu')
    resetImport()
  }, [resetImport])

  const handleExport = useCallback(async () => {
    setStep('export')
    try {
      const env = await buildBackupEnvelope()
      downloadBackupFile(env)
    } catch {
      setError('Failed to create backup')
    }
  }, [])

  const handleFileSelect = useCallback(async (file: File | null) => {
    if (!file) return
    setError('')
    setImportStep('validate')

    try {
      const text = await readBackupFile(file)
      const parsed = deserializeBackup(text)
      if (!parsed) {
        setError(strings.corrupted)
        return
      }

      setEnvelope(parsed)
      const result = await validateFullBackup(parsed)
      setValidation(result)

      if (!result.valid) {
        setError(result.errors.map(e => e.message).join('\n'))
        return
      }

      // Compute diff
      const backupCountsData = getBackupCounts(parsed.data)
      setBackupCounts(backupCountsData)
      const localCountsData = getLocalCounts()
      setLocalCounts(localCountsData)
      const differences = computeDifferences(parsed.data)
      setDiff(differences)

      setImportStep('preview')
    } catch {
      setError(strings.corrupted)
    }
  }, [strings])

  const handleRestore = useCallback(async (strat: RestoreStrategy) => {
    if (!envelope) return
    setStrategy(strat)
    setImportStep('restoring')
    setError('')
    
    try {
      let payload = envelope.data
      
      if (strat === 'merge') {
        const localPayload = collectBackupPayload()
        const { mergeBackup } = await import('@/lib/backup')
        payload = mergeBackup(envelope.data, localPayload)
      }

      const result = await restoreBackup(payload, { strategy: strat })
      
      if (result.success) {
        setMessage(strings.restored)
        setImportStep('done')
      } else {
        setError(result.rolledBack ? strings.rolledBack : (result.error || strings.restoreFailed))
      }
    } catch {
      setError(strings.restoreFailed)
    }
  }, [envelope, strings])

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const renderCountRow = (label: string, backup: number, local: number) => (
    <div className="grid grid-cols-3 gap-2 py-1.5 text-xs border-b border-[var(--st-border)] last:border-0">
      <span className="text-[var(--st-text-2)]">{label}</span>
      <span className="text-right font-semibold text-[var(--st-accent)]">{backup}</span>
      <span className="text-right font-semibold text-[var(--st-text-1)]">{local}</span>
    </div>
  )

  return (
    <Modal open={open} onClose={onClose} title={step === 'menu' ? strings.title : step === 'export' ? strings.stepExport : strings.stepImport}>
      <div className="space-y-4">
        {/* ERROR */}
        {error && (
          <div className="rounded-xl bg-[var(--st-danger-bg)] p-3 text-xs text-[var(--st-danger)]">
            <div className="flex items-start gap-2">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              <span className="whitespace-pre-wrap">{error}</span>
            </div>
          </div>
        )}

        {/* MESSAGE */}
        {message && (
          <div className="rounded-xl bg-[var(--st-success-bg)] p-3 text-xs text-[var(--st-success)]">
            <div className="flex items-center gap-2">
              <CheckCircle size={14} />
              <span>{message}</span>
            </div>
          </div>
        )}

        {/* ── MENU ── */}
        {step === 'menu' && (
          <div className="space-y-3">
            <button onClick={handleExport} className="w-full flex items-center gap-3 rounded-2xl border border-[var(--st-border-strong)] p-4 text-left hover:bg-[var(--st-surface-hover)] transition-colors">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--st-accent-bg)] text-[var(--st-accent)]">
                <Download size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-[var(--st-text-1)]">{strings.exportBtn}</div>
                <div className="text-xs text-[var(--st-text-3)]">V{/* Will be filled from import */}2.0.0 · All data included</div>
              </div>
              <ArrowRight size={16} className="text-[var(--st-text-3)]" />
            </button>

            <button onClick={() => { resetImport(); setStep('import') }} className="w-full flex items-center gap-3 rounded-2xl border border-[var(--st-border-strong)] p-4 text-left hover:bg-[var(--st-surface-hover)] transition-colors">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--st-gold-bg)] text-[var(--st-gold)]">
                <Upload size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-[var(--st-text-1)]">{strings.importBtn}</div>
                <div className="text-xs text-[var(--st-text-3)]">Validate · Preview · Merge/Replace</div>
              </div>
              <ArrowRight size={16} className="text-[var(--st-text-3)]" />
            </button>
          </div>
        )}

        {/* ── EXPORT (just confirmation) ── */}
        {step === 'export' && (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--st-success-bg)] text-[var(--st-success)] animate-bounce">
              <Download size={28} />
            </div>
            <p className="text-sm text-[var(--st-text-2)] text-center">
              {lang === 'bn' ? 'ব্যাকআপ ডাউনলোড শুরু হয়েছে!' : 'Backup download started!'}
            </p>
            <button onClick={handleBack} className="mo-submit mo-submit--cancel">{strings.cancelBtn}</button>
          </div>
        )}

        {/* ── IMPORT: Select ── */}
        {step === 'import' && importStep === 'select' && (
          <div className="flex flex-col items-center gap-4 py-6">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
            />
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--st-accent-bg)] text-[var(--st-accent)]">
              <FileText size={28} />
            </div>
            <p className="text-sm text-[var(--st-text-2)] text-center">{strings.selectFile}</p>
            <button onClick={() => fileInputRef.current?.click()} className="mo-submit mo-submit--neu flex items-center justify-center gap-2">
              <Upload size={16} />
              {strings.selectFile}
            </button>
          </div>
        )}

        {/* ── IMPORT: Validate ── */}
        {step === 'import' && importStep === 'validate' && (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--st-accent-bg)] text-[var(--st-accent)]">
              <RotateCw size={22} className="animate-spin" />
            </div>
            <p className="text-sm text-[var(--st-text-2)]">{strings.validating}</p>
          </div>
        )}

        {/* ── IMPORT: Preview ── */}
        {step === 'import' && importStep === 'preview' && envelope && backupCounts && localCounts && (
          <div className="space-y-4">
            {/* Validation status */}
            {validation?.valid && (
              <div className="rounded-xl bg-[var(--st-success-bg)] p-3 text-xs text-[var(--st-success)]">
                <div className="flex items-center gap-2">
                  <CheckCircle size={14} />
                  <span className="font-semibold">{strings.valid}</span>
                </div>
              </div>
            )}
            {validation?.warnings?.map((w, i) => (
              <div key={i} className="rounded-xl bg-[var(--st-gold-bg)] p-3 text-xs text-[var(--st-gold)]">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={14} />
                  <span>{w}</span>
                </div>
              </div>
            ))}

            {/* Backup summary */}
            <div className="rounded-2xl border border-[var(--st-border-strong)] p-4">
              <div className="text-xs font-bold text-[var(--st-text-2)] mb-3 uppercase tracking-wider">{strings.backupSummary}</div>
              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                <div><span className="text-[var(--st-text-3)]">{strings.created}:</span> <span className="font-semibold text-[var(--st-text-1)]">{new Date(envelope.createdAt).toLocaleString()}</span></div>
                <div><span className="text-[var(--st-text-3)]">{strings.size}:</span> <span className="font-semibold text-[var(--st-text-1)]">{formatSize(new Blob([JSON.stringify(envelope)]).size)}</span></div>
              </div>

              <div className="text-xs font-bold text-[var(--st-text-2)] mb-2 uppercase tracking-wider">{strings.records}</div>
              {renderCountRow(strings.tasks, backupCounts.tasks, localCounts.tasks)}
              {renderCountRow(strings.transactions, backupCounts.transactions, localCounts.transactions)}
              {renderCountRow(strings.loans, backupCounts.loans, localCounts.loans)}
              {renderCountRow(strings.budgets, backupCounts.budgets, localCounts.budgets)}
              {renderCountRow(strings.goals, backupCounts.savingsGoals, localCounts.savingsGoals)}
              {renderCountRow(strings.wallets, backupCounts.wallets, localCounts.wallets)}
              {renderCountRow(strings.subscriptions, backupCounts.subscriptions, localCounts.subscriptions)}
              {renderCountRow(strings.namaz, backupCounts.namazRecords, localCounts.namazRecords)}
              {renderCountRow(strings.namazDays, backupCounts.namazDays, localCounts.namazDays)}
            </div>

            {/* Differences */}
            {diff && (diff.newerLocalTransactions > 0 || diff.newerLocalTasks > 0 || diff.newerLocalLoans > 0 || diff.newerLocalSavingsGoals > 0) && (
              <div className="rounded-2xl border border-[var(--st-gold-border)] bg-[var(--st-gold-bg)] p-4">
                <div className="text-xs font-bold text-[var(--st-gold)] mb-2 uppercase tracking-wider">{strings.differences}</div>
                <div className="space-y-1 text-xs text-[var(--st-gold)]">
                  {diff.newerLocalTransactions > 0 && <p>{strings.diffTransactions(diff.newerLocalTransactions)}</p>}
                  {diff.newerLocalTasks > 0 && <p>{strings.diffTasks(diff.newerLocalTasks)}</p>}
                  {diff.newerLocalLoans > 0 && <p>{strings.diffLoans(diff.newerLocalLoans)}</p>}
                  {diff.newerLocalSavingsGoals > 0 && <p>{strings.diffGoals(diff.newerLocalSavingsGoals)}</p>}
                </div>
              </div>
            )}

            {/* Strategy buttons */}
            <div className="space-y-2">
              <button onClick={() => handleRestore('merge')} className="w-full text-left rounded-2xl border border-[var(--st-accent-border)] bg-[var(--st-accent-bg)] p-4 hover:bg-[var(--st-accent-bg-hover)] transition-colors">
                <div className="font-bold text-sm text-[var(--st-accent)]">{strings.merge}</div>
                <div className="text-xs text-[var(--st-text-3)] mt-1">{strings.mergeDesc}</div>
              </button>

              <button onClick={() => handleRestore('replace')} className="w-full text-left rounded-2xl border border-[var(--st-danger-border)] bg-[var(--st-danger-bg)] p-4 hover:opacity-80 transition-colors">
                <div className="font-bold text-sm text-[var(--st-danger)]">{strings.replace}</div>
                <div className="text-xs text-[var(--st-text-3)] mt-1">{strings.replaceDesc}</div>
              </button>

              <button onClick={handleBack} className="w-full mo-submit mo-submit--cancel">{strings.cancelBtn}</button>
            </div>
          </div>
        )}

        {/* ── IMPORT: Restoring ── */}
        {step === 'import' && importStep === 'restoring' && (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--st-accent-bg)] text-[var(--st-accent)]">
              <RotateCw size={22} className="animate-spin" />
            </div>
            <p className="text-sm text-[var(--st-text-2)]">{strings.restoring}</p>
          </div>
        )}

        {/* ── IMPORT: Done ── */}
        {step === 'import' && importStep === 'done' && (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--st-success-bg)] text-[var(--st-success)]">
              <CheckCircle size={28} />
            </div>
            <p className="text-sm font-bold text-[var(--st-success)]">{strings.restored}</p>
            <p className="text-xs text-[var(--st-text-3)] text-center">{lang === 'bn' ? 'অ্যাপ রিফ্রেশ করুন' : 'Refresh the app'}</p>
            <button onClick={() => { window.location.reload() }} className="mo-submit mo-submit--neu">
              {lang === 'bn' ? 'রিফ্রেশ করুন' : 'Refresh'}
            </button>
          </div>
        )}

        {/* Navigation */}
        {step !== 'menu' && importStep !== 'done' && importStep !== 'restoring' && step !== 'export' && (
          <button onClick={handleBack} className="mo-submit mo-submit--cancel flex items-center justify-center gap-2">
            <ArrowLeft size={16} />
            {strings.cancelBtn}
          </button>
        )}
      </div>
    </Modal>
  )
}