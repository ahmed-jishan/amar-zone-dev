'use client'

import { useState, useEffect, useRef, useMemo, useCallback, type RefObject } from 'react'
import {
  ArrowUpFromLine, ArrowDownToLine, Loader2,
  CheckCircle2, AlertTriangle, XCircle, ArrowLeft, ArrowRight,
  Lock, Eye, EyeOff, FileText, Smartphone,
  QrCode, ScanLine,
} from 'lucide-react'
import { Modal } from '@/components/shared/Modal'
import { useSettingsStore, type Language } from '@/features/settings/store/settingsStore'
import {
  buildBackupEnvelope,
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
import {
  decryptBackup,
  serializeEncryptedBackup,
  parseEncryptedBackup,
} from '@/lib/utils/encryptedBackup'
import QRCode from 'qrcode'
import type { BrowserQRCodeReader, IScannerControls } from '@zxing/browser'
import type { BackupEnvelope, BackupCounts, BackupPayload, RestoreStrategy } from '@/lib/backup'

type Step = 'landing' | 'send-prepare' | 'send-qr' | 'receive-scan' | 'receive-preview' | 'receive-merging' | 'receive-done'
type SendStage = 'preparing' | 'encrypting' | 'generating' | 'scanning' | 'complete'
type MergeStage = 'merging' | 'finalizing' | 'complete' | 'error'

const tr = (lang: Language) => ({
  title: lang === 'bn' ? 'কুইক ট্রান্সফার' : 'Quick Transfer',
  send: lang === 'bn' ? '📤 অন্য ডিভাইসে পাঠান' : '📤 Send To Another Device',
  sendSub: lang === 'bn' ? 'QR কোড স্ক্যান করে ডেটা ট্রান্সফার' : 'Transfer data by scanning QR codes',
  receive: lang === 'bn' ? '📥 অন্য ডিভাইস থেকে নিন' : '📥 Receive From Another Device',
  receiveSub: lang === 'bn' ? 'পাঠানো ডিভাইসের QR কোড স্ক্যান করুন' : 'Scan QR code from the sending device',
  restoreFile: lang === 'bn' ? '📂 ব্যাকআপ ফাইল থেকে রিস্টোর' : '📂 Restore From Backup File',
  restoreSub: lang === 'bn' ? 'JSON ব্যাকআপ ফাইল নির্বাচন করুন' : 'Select a JSON backup file',
  passphrase: lang === 'bn' ? 'পাসফ্রেজ' : 'Passphrase',
  confirmPass: lang === 'bn' ? 'পাসফ্রেজ নিশ্চিত করুন' : 'Confirm Passphrase',
  passHint: lang === 'bn' ? 'কমপক্ষে ৮ অক্ষর' : 'At least 8 characters',
  encryptBadge: lang === 'bn' ? 'AES-256 এনক্রিপশন সক্রিয়' : 'AES-256 Encryption Active',
  modules: lang === 'bn' ? 'যা যা ট্রান্সফার হবে' : 'Modules to Transfer',
  selectAll: lang === 'bn' ? 'সব নির্বাচন' : 'Select All',
  tasks: lang === 'bn' ? 'টাস্ক' : 'Tasks',
  transactions: lang === 'bn' ? 'লেনদেন' : 'Transactions',
  loans: lang === 'bn' ? 'লোন' : 'Loans',
  budgets: lang === 'bn' ? 'বাজেট' : 'Budgets',
  goals: lang === 'bn' ? 'সেভিংস' : 'Goals',
  wallets: lang === 'bn' ? 'ওয়ালেট' : 'Wallets',
  subscriptions: lang === 'bn' ? 'সাবস্ক্রিপশন' : 'Subscriptions',
  namaz: lang === 'bn' ? 'নামাজ লগ' : 'Namaz Logs',
  namazDays: lang === 'bn' ? 'নামাজের দিন' : 'Prayer Days',
  size: lang === 'bn' ? 'সাইজ' : 'Size',
  startTransfer: lang === 'bn' ? 'ট্রান্সফার শুরু করুন' : 'Start Transfer',
  cancel: lang === 'bn' ? 'বাতিল' : 'Cancel',
  startScanning: lang === 'bn' ? 'স্ক্যান শুরু করুন' : 'Start Scanning',
  stopScan: lang === 'bn' ? 'স্ক্যান বন্ধ করুন' : 'Stop Scanning',
  frame: (c: number, t: number) => lang === 'bn' ? `ফ্রেম ${c}/${t}` : `Frame ${c}/${t}`,
  autoCycle: lang === 'bn' ? 'অটো-সাইক্লিং চলছে' : 'Auto-cycling active',
  scanReady: lang === 'bn' ? 'স্ক্যানের জন্য প্রস্তুত' : 'Ready to scan',
  preparing: lang === 'bn' ? 'ডেটা প্রস্তুত হচ্ছে...' : 'Preparing data...',
  encrypting: lang === 'bn' ? 'এনক্রিপ্ট হচ্ছে...' : 'Encrypting...',
  generating: lang === 'bn' ? 'QR ফ্রেম তৈরি হচ্ছে...' : 'Generating QR frames...',
  mergingLabel: lang === 'bn' ? 'ডেটা মার্জ হচ্ছে...' : 'Merging data...',
  finalizing: lang === 'bn' ? 'চূড়ান্ত হচ্ছে...' : 'Finalizing...',
  merge: lang === 'bn' ? '🔄 মার্জ (সুপারিশকৃত)' : '🔄 Merge (Recommended)',
  mergeDesc: lang === 'bn' ? 'ব্যাকআপ ও বর্তমান ডেটা উভয়ই রাখে' : 'Keeps both backup and current data',
  replace: lang === 'bn' ? '⬇️ রিপ্লেস' : '⬇️ Replace',
  replaceDesc: lang === 'bn' ? 'বর্তমান ডেটা ব্যাকআপ দিয়ে প্রতিস্থাপন' : 'Replaces current data with backup',
  doneMsg: lang === 'bn' ? '✅ ট্রান্সফার সম্পূর্ণ!' : '✅ Transfer Complete!',
  refresh: lang === 'bn' ? 'রিফ্রেশ করুন' : 'Refresh',
  corrupted: lang === 'bn' ? 'ফাইল নষ্ট!' : 'Corrupted file!',
  rollbackOk: lang === 'bn' ? 'রোলব্যাক সফল। কোনো ডেটা হারায়নি।' : 'Rolled back. No data lost.',
  invalidPass: lang === 'bn' ? 'পাসফ্রেজ ভুল' : 'Invalid passphrase',
  passMismatch: lang === 'bn' ? 'পাসফ্রেজ মেলেনি' : 'Passphrases do not match',
  verifying: lang === 'bn' ? 'ভেরিফাই হচ্ছে...' : 'Verifying...',
  records: lang === 'bn' ? 'রেকর্ড' : 'Records',
  differences: lang === 'bn' ? 'পার্থক্য' : 'Differences',
})

interface QuickTransferProps {
  open: boolean
  onClose: () => void
}

export default function QuickTransferDialog({ open, onClose }: QuickTransferProps) {
  const lang = useSettingsStore((s) => s.language)
  const strings = useMemo(() => tr(lang), [lang])

  // Navigation
  const [step, setStep] = useState<Step>('landing')

  // Passphrase
  const [passphrase, setPassphrase] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [showPass, setShowPass] = useState(false)

  // Module selection
  const [selectedModules, setSelectedModules] = useState({
    tasks: true, money: true, namaz: true, settings: true, prefs: true,
  })

  // Send flow
  const [sendStage, setSendStage] = useState<SendStage>('preparing')
  const [qrChunks, setQrChunks] = useState<string[]>([])
  const [qrIndex, setQrIndex] = useState(0)
  const [qrSessionId, setQrSessionId] = useState('')
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [autoCycleEnabled, setAutoCycleEnabled] = useState(true)
  const qrIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Receive flow
  const [scanActive, setScanActive] = useState(false)
  const [scanStatus, setScanStatus] = useState<{ total: number; received: number } | null>(null)
  const [scannedPayload, setScannedPayload] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const scannerRef = useRef<BrowserQRCodeReader | null>(null)
  const scannerControlsRef = useRef<IScannerControls | null>(null)
  const scannerStreamRef = useRef<MediaStream | null>(null)
  const scannedChunksRef = useRef(new Map<string, { total: number; parts: Map<number, string> }>())

  // File restore
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [envelope, setEnvelope] = useState<BackupEnvelope | null>(null)
  const [backupCounts, setBackupCounts] = useState<BackupCounts | null>(null)
  const [localCountsData, setLocalCountsData] = useState<BackupCounts | null>(null)
  const [differences, setDifferences] = useState<ReturnType<typeof computeDifferences> | null>(null)

  // Merge stage
  const [mergeStage, setMergeStage] = useState<MergeStage>('merging')

  // Error / message
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  // Local counts for send preview
  const localCounts = useMemo(() => {
    const p = collectBackupPayload()
    return { counts: getBackupCounts(p), payload: p }
  }, [])

  const backupSizeStr = useMemo(() => {
    try {
      const json = JSON.stringify(localCounts.payload)
      const bytes = new Blob([json]).size
      return bytes < 1024 ? `${bytes} B` : bytes < 1048576 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1048576).toFixed(1)} MB`
    } catch { return '0 B' }
  }, [localCounts])

  // Cleanup
  const cleanup = useCallback(() => {
    if (qrIntervalRef.current) clearInterval(qrIntervalRef.current)
    stopScanner()
    setStep('landing')
    setError('')
    setMessage('')
    setPassphrase('')
    setConfirmPass('')
    setQrChunks([])
    setQrIndex(0)
    setQrDataUrl(null)
    setScannedPayload(null)
    setScanStatus(null)
    setEnvelope(null)
    setBackupCounts(null)
    setLocalCountsData(null)
    setDifferences(null)
    setSendStage('preparing')
    setMergeStage('merging')
    setSelectedModules({ tasks: true, money: true, namaz: true, settings: true, prefs: true })
  }, [])

  useEffect(() => cleanup, [cleanup])

  // Auto-cycle QR frames
  useEffect(() => {
    if (qrChunks.length > 0 && autoCycleEnabled && !qrIntervalRef.current) {
      qrIntervalRef.current = setInterval(() => {
        setQrIndex((prev) => (prev + 1 >= qrChunks.length ? 0 : prev + 1))
      }, 5000)
    }
    if (!autoCycleEnabled && qrIntervalRef.current) {
      clearInterval(qrIntervalRef.current)
      qrIntervalRef.current = null
    }
    return () => {
      if (qrIntervalRef.current) { clearInterval(qrIntervalRef.current); qrIntervalRef.current = null }
    }
  }, [qrChunks.length, autoCycleEnabled])

  // Generate QR image when chunk changes
  useEffect(() => {
    if (qrChunks.length === 0) { setQrDataUrl(null); return }
    const chunk = qrChunks[qrIndex]
    QRCode.toDataURL(
      JSON.stringify({ id: qrSessionId, index: qrIndex, total: qrChunks.length, data: chunk }),
      { errorCorrectionLevel: 'H', margin: 2, width: 280 }
    ).then((url: string) => setQrDataUrl(url)).catch(() => setQrDataUrl(null))
  }, [qrChunks, qrIndex, qrSessionId])

  const stopScanner = useCallback(() => {
    scannerControlsRef.current?.stop()
    scannerControlsRef.current = null
    scannerRef.current = null
    scannerStreamRef.current?.getTracks().forEach((track) => track.stop())
    scannerStreamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setScanActive(false)
  }, [])

  // ── SEND ──
  const handleStartSend = async () => {
    if (passphrase.trim().length < 8) { setError(strings.passHint); return }
    if (passphrase !== confirmPass) { setError(strings.passMismatch); return }
    setError('')
    setSendStage('preparing')
    setStep('send-qr')

    try {
      setSendStage('encrypting')
      const payload = collectBackupPayload()
      const filtered: BackupPayload = {
        tasks: selectedModules.tasks ? payload.tasks : { tasks: [] },
        money: selectedModules.money ? payload.money : {
          transactions: [], loans: [], budgets: [], savingsGoals: [],
          wallets: [], subscriptions: [], insights: [],
        },
        namaz: selectedModules.namaz ? payload.namaz : { records: [], settings: payload.namaz.settings },
        settings: selectedModules.settings ? payload.settings : { appSettings: payload.settings.appSettings },
        prefs: selectedModules.prefs ? payload.prefs : payload.prefs,
      }

      setSendStage('generating')
      const backupEnvelope = await buildBackupEnvelope(filtered)
      const content = JSON.stringify(backupEnvelope)

      // Encrypt the envelope content with AES-GCM
      const enc = new TextEncoder()
      const data = enc.encode(content)
      const salt = crypto.getRandomValues(new Uint8Array(16))
      const iv = crypto.getRandomValues(new Uint8Array(12))
      const key = await crypto.subtle.importKey('raw', enc.encode(passphrase.padEnd(16, ' ').slice(0, 16)), 'AES-GCM', false, ['encrypt'])
      const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data))

      const toBase64 = (bytes: Uint8Array) => btoa(Array.from(bytes).map(b => String.fromCharCode(b)).join(''))
      const finalEncrypted = {
        v: 1 as const, alg: 'AES-GCM' as const, kdf: 'PBKDF2' as const,
        iterations: 150000,
        salt: toBase64(salt),
        iv: toBase64(iv),
        ciphertext: toBase64(ct),
      }

      const text = serializeEncryptedBackup(finalEncrypted)
      const chunks = chunkString(text, 700)
      setQrSessionId(`${Date.now()}-${Math.random().toString(36).slice(2, 7)}`)
      setQrChunks(chunks)
      setQrIndex(0)
      setSendStage('scanning')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Transfer failed')
    }
  }

  // ── RECEIVE SCAN ──
  const startScanning = async () => {
    if (scanActive) return
    if (passphrase.trim().length < 8) { setError(strings.passHint); return }
    setError('')
    setScannedPayload(null)
    setScanStatus(null)
    scannedChunksRef.current.clear()
    setScanActive(true)
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera is not available on this device.')
      }

      const video = await waitForVideoElement(videoRef)
      const permissionStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      })
      scannerStreamRef.current = permissionStream
      permissionStream.getTracks().forEach((track) => track.stop())
      scannerStreamRef.current = null

      const mod = await import('@zxing/browser')
      const reader = new mod.BrowserQRCodeReader()
      scannerRef.current = reader
      const controls = await startQrDecodeWithRetry(reader, video, (text) => {
        const parsed = safeParseChunk(text)
        if (!parsed) return
        const entry = scannedChunksRef.current.get(parsed.id) || { total: parsed.total, parts: new Map<number, string>() }
        if (entry.total !== parsed.total || parsed.index < 0 || parsed.index >= parsed.total) {
          console.warn('Quick Transfer ignored invalid QR frame metadata', parsed)
          return
        }
        if (!entry.parts.has(parsed.index)) entry.parts.set(parsed.index, parsed.data)
        scannedChunksRef.current.set(parsed.id, entry)
        setScanStatus({ total: parsed.total, received: entry.parts.size })
        if (entry.parts.size === parsed.total) {
          const ordered = Array.from(entry.parts.entries()).sort((a, b) => a[0] - b[0]).map(([, d]) => d).join('')
          setScannedPayload(ordered)
          stopScanner()
          void handleReceiveData(ordered)
        }
      })
      scannerControlsRef.current = controls
    } catch (error) {
      console.error('Quick Transfer scanner startup failed:', error)
      setError(cameraErrorMessage(error))
      stopScanner()
      setScanActive(false)
    }
  }

  // ── RECEIVE DATA ──
  const handleReceiveData = async (raw: string) => {
    try {
      const encrypted = parseEncryptedBackup(raw)
      const decrypted = await decryptBackup(passphrase, encrypted)
      const parsed = deserializeBackup(decrypted as unknown as string)
      if (!parsed) { setError(strings.corrupted); return }
      setEnvelope(parsed)
      setBackupCounts(getBackupCounts(parsed.data))
      setLocalCountsData(getLocalCounts())
      setDifferences(computeDifferences(parsed.data))
      setStep('receive-preview')
    } catch {
      setError(strings.invalidPass)
    }
  }

  // ── RESTORE ──
  const handleRestoreAction = async (strategy: RestoreStrategy) => {
    if (!envelope) return
    setStep('receive-merging')
    setMergeStage('merging')
    try {
      let payload = envelope.data
      if (strategy === 'merge') {
        const local = collectBackupPayload()
        payload = mergeBackup(envelope.data, local)
      }
      const result = await restoreBackup(payload, { strategy })
      if (result.success) {
        setMessage(strings.doneMsg)
        setMergeStage('finalizing')
        setTimeout(() => { setMergeStage('complete'); setStep('receive-done') }, 500)
      } else {
        setError(result.rolledBack ? strings.rollbackOk : (result.error || 'Restore failed'))
        setMergeStage('error')
      }
    } catch {
      setError('Restore failed')
      setMergeStage('error')
    }
  }

  // ── FILE RESTORE ──
  const handleFileSelect = async (file: File | null) => {
    if (!file) return
    setError('')
    try {
      const text = await readBackupFile(file)
      const parsed = deserializeBackup(text)
      if (!parsed) { setError(strings.corrupted); return }
      const validation = await validateFullBackup(parsed)
      if (!validation.valid) { setError(validation.errors.map(e => e.message).join('\n')); return }
      setEnvelope(parsed)
      setBackupCounts(getBackupCounts(parsed.data))
      setLocalCountsData(getLocalCounts())
      setDifferences(computeDifferences(parsed.data))
      setStep('receive-preview')
    } catch {
      setError(strings.corrupted)
    }
  }

  const goBack = () => {
    stopScanner()
    if (qrIntervalRef.current) { clearInterval(qrIntervalRef.current); qrIntervalRef.current = null }
    setStep('landing')
    setError('')
    setMessage('')
  }

  const toggleModule = (key: keyof typeof selectedModules) => {
    setSelectedModules(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const renderCountRow = (label: string, backup: number, local: number) => (
    <div className="grid grid-cols-3 gap-2 py-1.5 text-xs border-b border-[var(--st-border)] last:border-0 items-center">
      <span className="text-[var(--st-text-2)]">{label}</span>
      <span className="text-right font-semibold text-[var(--st-accent)]">{backup}</span>
      <span className="text-right font-semibold text-[var(--st-text-1)]">{local}</span>
    </div>
  )

  return (
    <Modal open={open} onClose={() => { cleanup(); onClose() }} title={strings.title}>
      <div className="space-y-4">
        {error && (
          <div className="rounded-xl bg-[var(--st-danger-bg)] p-3 text-xs text-[var(--st-danger)]">
            <div className="flex items-start gap-2">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              <span className="whitespace-pre-wrap">{error}</span>
            </div>
          </div>
        )}
        {message && (
          <div className="rounded-xl bg-[var(--st-success-bg)] p-3 text-xs text-[var(--st-success)]">
            <div className="flex items-center gap-2"><CheckCircle2 size={14} /><span>{message}</span></div>
          </div>
        )}

        {/* ═══ LANDING ═══ */}
        {step === 'landing' && (
          <div className="space-y-4">
            <div className="rounded-xl bg-[var(--st-accent-bg)] p-3 text-xs text-[var(--st-accent)] flex items-center gap-2">
              <Lock size={14} /><span className="font-semibold">{strings.encryptBadge}</span>
            </div>

            <button onClick={() => setStep('send-prepare')} className="w-full flex items-center gap-3 rounded-2xl border border-[var(--st-border-strong)] p-4 text-left hover:bg-[var(--st-surface-hover)] transition-colors">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--st-accent-bg)] text-[var(--st-accent)] shrink-0"><ArrowUpFromLine size={20} /></div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-[var(--st-text-1)]">{strings.send}</div>
                <div className="text-xs text-[var(--st-text-3)] mt-0.5">{strings.sendSub}</div>
              </div>
              <ArrowRight size={16} className="text-[var(--st-text-3)] shrink-0" />
            </button>

            <button onClick={() => setStep('receive-scan')} className="w-full flex items-center gap-3 rounded-2xl border border-[var(--st-border-strong)] p-4 text-left hover:bg-[var(--st-surface-hover)] transition-colors">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--st-success-bg)] text-[var(--st-success)] shrink-0"><ArrowDownToLine size={20} /></div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-[var(--st-text-1)]">{strings.receive}</div>
                <div className="text-xs text-[var(--st-text-3)] mt-0.5">{strings.receiveSub}</div>
              </div>
              <ArrowRight size={16} className="text-[var(--st-text-3)] shrink-0" />
            </button>

            <button onClick={() => { fileInputRef.current?.click() }} className="w-full flex items-center gap-3 rounded-2xl border border-[var(--st-border-strong)] p-4 text-left hover:bg-[var(--st-surface-hover)] transition-colors">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--st-gold-bg)] text-[var(--st-gold)] shrink-0"><FileText size={20} /></div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-[var(--st-text-1)]">{strings.restoreFile}</div>
                <div className="text-xs text-[var(--st-text-3)] mt-0.5">{strings.restoreSub}</div>
              </div>
              <ArrowRight size={16} className="text-[var(--st-text-3)] shrink-0" />
            </button>
            <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)} />
          </div>
        )}

        {/* ═══ SEND: PREPARE ═══ */}
        {step === 'send-prepare' && (
          <div className="space-y-4">
            <div className="rounded-xl bg-[var(--st-accent-bg)] p-3 text-xs text-[var(--st-accent)] flex items-center gap-2">
              <Lock size={14} /><span className="font-semibold">AES-256 · Passphrase Protected</span>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-[var(--st-text-2)]">{strings.passphrase}</label>
              <div className="flex gap-2">
                <input type={showPass ? 'text' : 'password'} value={passphrase} onChange={(e) => setPassphrase(e.target.value)} className="mo-inp flex-1 mb-0" placeholder={strings.passHint} />
                <button onClick={() => setShowPass(!showPass)} className="st-eye">{showPass ? <EyeOff size={16} /> : <Eye size={16} />}</button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[var(--st-text-2)]">{strings.confirmPass}</label>
              <input type={showPass ? 'text' : 'password'} value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} className="mo-inp" placeholder={strings.passHint} />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase text-[var(--st-text-2)]">{strings.modules}</span>
                <button onClick={() => { const all = Object.values(selectedModules).every(Boolean); setSelectedModules({ tasks: !all, money: !all, namaz: !all, settings: !all, prefs: !all }) }} className="text-xs text-[var(--st-accent)] font-semibold">{strings.selectAll}</button>
              </div>
              <div className="st-cloud-breakdown">
                {(['tasks', 'money', 'namaz', 'settings', 'prefs'] as const).map((key) => (
                  <button key={key} onClick={() => toggleModule(key)} className="st-cloud-breakdown-row px-3 py-2.5 cursor-pointer hover:bg-[var(--st-surface-hover)] transition-colors">
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${selectedModules[key] ? 'border-[var(--st-accent)] bg-[var(--st-accent)]' : 'border-[var(--st-text-3)]'}`}>
                        {selectedModules[key] && <CheckCircle2 size={10} className="text-white" />}
                      </div>
                      <span className="capitalize">{key}</span>
                    </div>
                    <span className="font-semibold">
                      {key === 'tasks' && localCounts.counts.tasks}
                      {key === 'money' && localCounts.counts.transactions}
                      {key === 'namaz' && localCounts.counts.namazDays}
                      {key === 'settings' && '✓'}
                      {key === 'prefs' && '✓'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--st-border-strong)] p-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-[var(--st-text-3)]">{strings.tasks}:</span> <span className="font-semibold">{localCounts.counts.tasks}</span></div>
                <div><span className="text-[var(--st-text-3)]">{strings.transactions}:</span> <span className="font-semibold">{localCounts.counts.transactions}</span></div>
                <div><span className="text-[var(--st-text-3)]">{strings.namaz}:</span> <span className="font-semibold">{localCounts.counts.namazDays}</span></div>
                <div><span className="text-[var(--st-text-3)]">{strings.size}:</span> <span className="font-semibold">{backupSizeStr}</span></div>
              </div>
            </div>

            <button onClick={handleStartSend} className="mo-submit mo-submit--neu flex items-center justify-center gap-2"><QrCode size={16} /> {strings.startTransfer}</button>
          </div>
        )}

        {/* ═══ SEND: QR ═══ */}
        {step === 'send-qr' && (
          <div className="space-y-4">
            {sendStage !== 'scanning' && sendStage !== 'complete' && (
              <div className="flex flex-col items-center gap-4 py-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--st-accent-bg)] text-[var(--st-accent)]"><Loader2 size={22} className="animate-spin" /></div>
                <p className="text-sm text-[var(--st-text-2)]">{sendStage === 'preparing' ? strings.preparing : sendStage === 'encrypting' ? strings.encrypting : sendStage === 'generating' ? strings.generating : ''}</p>
              </div>
            )}
            {sendStage === 'scanning' && qrDataUrl && (
              <div className="flex flex-col items-center gap-3">
                <div className="text-xs text-[var(--st-text-3)] flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-[var(--st-accent)] animate-pulse" />
                  <Smartphone size={12} />
                  {strings.scanReady}
                </div>
                <div className="relative w-72 h-72 rounded-2xl border-2 border-[var(--st-border-strong)] bg-white p-2 shadow-lg flex items-center justify-center">
                  {/* Outer glow ring */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[var(--st-accent)]/5 via-transparent to-[var(--st-success)]/5 pointer-events-none" />
                  <div className="relative w-full h-full rounded-xl bg-white flex items-center justify-center">
                    <img src={qrDataUrl} alt="QR" className="w-56 h-56" />
                    {/* Center mark — SS brand logo */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-9 h-9 rounded-lg bg-white shadow-md border border-gray-200 flex items-center justify-center">
                        <span className="text-[11px] font-extrabold text-[#0a0e18] tracking-tight">SS</span>
                      </div>
                    </div>
                  </div>
                  {/* Corner decorations */}
                  <div className="absolute -top-1 -left-1 w-3 h-3 rounded-full bg-[var(--st-accent)]/20" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[var(--st-success)]/20" />
                  <div className="absolute -bottom-1 -left-1 w-3 h-3 rounded-full bg-[var(--st-success)]/20" />
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-[var(--st-accent)]/20" />
                </div>
                {/* Auto/Manual Toggle */}
                <button
                  onClick={() => setAutoCycleEnabled(!autoCycleEnabled)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
                    autoCycleEnabled
                      ? 'bg-[var(--st-accent-bg)] text-[var(--st-accent)] border-[var(--st-accent-border)]'
                      : 'bg-[var(--st-surface-2)] text-[var(--st-text-3)] border-[var(--st-border)]'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${autoCycleEnabled ? 'bg-[var(--st-accent)] animate-pulse' : 'bg-[var(--st-text-3)]'}`} />
                  {autoCycleEnabled ? (lang === 'bn' ? 'অটো' : 'Auto') : (lang === 'bn' ? 'ম্যানুয়াল' : 'Manual')}
                </button>
                {/* Prev/Next controls */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQrIndex(Math.max(0, qrIndex - 1))}
                    disabled={qrIndex === 0}
                    className="px-3 py-1.5 rounded-lg border border-[var(--st-border)] bg-[var(--st-surface-2)] text-[var(--st-text-2)] text-xs font-semibold disabled:opacity-30 transition-colors hover:border-[var(--st-accent-border)]"
                  >
                    ← {lang === 'bn' ? 'আগে' : 'Prev'}
                  </button>
                  <div className="text-xs font-semibold text-[var(--st-text-1)] min-w-[60px] text-center">
                    {strings.frame(qrIndex + 1, qrChunks.length)}
                  </div>
                  <button
                    onClick={() => setQrIndex(Math.min(qrChunks.length - 1, qrIndex + 1))}
                    disabled={qrIndex >= qrChunks.length - 1}
                    className="px-3 py-1.5 rounded-lg border border-[var(--st-border)] bg-[var(--st-surface-2)] text-[var(--st-text-2)] text-xs font-semibold disabled:opacity-30 transition-colors hover:border-[var(--st-accent-border)]"
                  >
                    {lang === 'bn' ? 'পর' : 'Next'} →
                  </button>
                </div>
              </div>
            )}
            {sendStage === 'scanning' && !qrDataUrl && (
              <div className="flex flex-col items-center gap-4 py-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--st-accent-bg)] text-[var(--st-accent)]"><Loader2 size={22} className="animate-spin" /></div>
                <p className="text-sm text-[var(--st-text-2)]">{strings.generating}</p>
              </div>
            )}
            {sendStage === 'complete' && (
              <div className="flex flex-col items-center gap-4 py-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--st-success-bg)] text-[var(--st-success)]"><CheckCircle2 size={28} /></div>
                <p className="text-sm font-bold text-[var(--st-success)]">{strings.doneMsg}</p>
              </div>
            )}
            <button onClick={goBack} className="mo-submit mo-submit--cancel">{strings.cancel}</button>
          </div>
        )}

        {/* ═══ RECEIVE: SCAN ═══ */}
        {step === 'receive-scan' && (
          <div className="space-y-4">
            <div className="rounded-xl bg-[var(--st-accent-bg)] p-3 text-xs text-[var(--st-accent)] flex items-center gap-2">
              <Lock size={14} /><span className="font-semibold">AES-256 · End-to-End Encrypted</span>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[var(--st-text-2)]">{strings.passphrase}</label>
              <input type="password" value={passphrase} onChange={(e) => setPassphrase(e.target.value)} className="mo-inp" placeholder={strings.passHint} />
            </div>
            <div className="relative rounded-2xl overflow-hidden border border-[var(--st-border-strong)] bg-black/5 min-h-[200px] flex items-center justify-center">
              {scanActive ? <video ref={videoRef} className="w-full max-h-[260px]" /> : (
                <div className="flex flex-col items-center gap-3 py-8 text-[var(--st-text-3)]"><ScanLine size={40} /><p className="text-sm">{strings.startScanning}</p></div>
              )}
            </div>
            {scanStatus && <div className="text-xs text-center text-[var(--st-text-2)]">{strings.frame(scanStatus.received, scanStatus.total)}</div>}
            {!scanActive ? (
              <button onClick={startScanning} className="mo-submit mo-submit--neu flex items-center justify-center gap-2"><ScanLine size={16} />{strings.startScanning}</button>
            ) : (
              <button onClick={() => { stopScanner(); }} className="mo-submit mo-submit--cancel">{strings.stopScan}</button>
            )}
          </div>
        )}

        {/* ═══ RECEIVE: PREVIEW ═══ */}
        {step === 'receive-preview' && envelope && backupCounts && localCountsData && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-[var(--st-border-strong)] p-4">
              <div className="text-xs font-bold text-[var(--st-text-2)] mb-3 uppercase tracking-wider">{strings.records}</div>
              {renderCountRow(strings.tasks, backupCounts.tasks, localCountsData.tasks)}
              {renderCountRow(strings.transactions, backupCounts.transactions, localCountsData.transactions)}
              {renderCountRow(strings.loans, backupCounts.loans, localCountsData.loans)}
              {renderCountRow(strings.budgets, backupCounts.budgets, localCountsData.budgets)}
              {renderCountRow(strings.goals, backupCounts.savingsGoals, localCountsData.savingsGoals)}
              {renderCountRow(strings.wallets, backupCounts.wallets, localCountsData.wallets)}
              {renderCountRow(strings.subscriptions, backupCounts.subscriptions, localCountsData.subscriptions)}
              {renderCountRow(strings.namaz, backupCounts.namazRecords, localCountsData.namazRecords)}
              {renderCountRow(strings.namazDays, backupCounts.namazDays, localCountsData.namazDays)}
            </div>

            {differences && (differences.newerLocalTransactions > 0 || differences.newerLocalTasks > 0) && (
              <div className="rounded-2xl border border-[var(--st-gold-border)] bg-[var(--st-gold-bg)] p-4">
                <div className="text-xs font-bold text-[var(--st-gold)] mb-2 uppercase">{strings.differences}</div>
                <div className="space-y-1 text-xs text-[var(--st-gold)]">
                  {differences.newerLocalTransactions > 0 && <p>📄 {differences.newerLocalTransactions} new transactions on this device</p>}
                  {differences.newerLocalTasks > 0 && <p>📋 {differences.newerLocalTasks} new tasks on this device</p>}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <button onClick={() => handleRestoreAction('merge')} className="w-full text-left rounded-2xl border border-[var(--st-accent-border)] bg-[var(--st-accent-bg)] p-4 hover:bg-[var(--st-accent-bg-hover)] transition-colors">
                <div className="font-bold text-sm text-[var(--st-accent)]">{strings.merge}</div>
                <div className="text-xs text-[var(--st-text-3)] mt-1">{strings.mergeDesc}</div>
              </button>
              <button onClick={() => handleRestoreAction('replace')} className="w-full text-left rounded-2xl border border-[var(--st-danger-border)] bg-[var(--st-danger-bg)] p-4 hover:opacity-80 transition-colors">
                <div className="font-bold text-sm text-[var(--st-danger)]">{strings.replace}</div>
                <div className="text-xs text-[var(--st-text-3)] mt-1">{strings.replaceDesc}</div>
              </button>
              <button onClick={goBack} className="w-full mo-submit mo-submit--cancel">{strings.cancel}</button>
            </div>
          </div>
        )}

        {/* ═══ RECEIVE: MERGING ═══ */}
        {step === 'receive-merging' && (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-4 py-6">
              {mergeStage === 'merging' || mergeStage === 'finalizing' ? (
                <>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--st-accent-bg)] text-[var(--st-accent)]"><Loader2 size={22} className="animate-spin" /></div>
                  <p className="text-sm text-[var(--st-text-2)]">{mergeStage === 'merging' ? strings.mergingLabel : strings.finalizing}</p>
                </>
              ) : mergeStage === 'complete' ? (
                <>
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--st-success-bg)] text-[var(--st-success)]"><CheckCircle2 size={28} /></div>
                  <p className="text-sm font-bold text-[var(--st-success)]">{strings.doneMsg}</p>
                  <button onClick={() => window.location.reload()} className="mo-submit mo-submit--neu">{strings.refresh}</button>
                </>
              ) : (
                <>
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--st-danger-bg)] text-[var(--st-danger)]"><XCircle size={28} /></div>
                  <p className="text-sm text-[var(--st-danger)]">{error}</p>
                </>
              )}
            </div>
          </div>
        )}

        {/* ═══ DONE ═══ */}
        {step === 'receive-done' && (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--st-success-bg)] text-[var(--st-success)]"><CheckCircle2 size={28} /></div>
            <p className="text-sm font-bold text-[var(--st-success)]">{strings.doneMsg}</p>
            <p className="text-xs text-[var(--st-text-3)]">{lang === 'bn' ? 'অ্যাপ রিফ্রেশ করুন' : 'Refresh the app'}</p>
            <button onClick={() => window.location.reload()} className="mo-submit mo-submit--neu">{strings.refresh}</button>
          </div>
        )}

        {/* Back/Cancel */}
        {step !== 'landing' && step !== 'receive-done' && step !== 'receive-merging' && (
          <button onClick={goBack} className="mo-submit mo-submit--cancel flex items-center justify-center gap-2"><ArrowLeft size={16} />{strings.cancel}</button>
        )}
      </div>
    </Modal>
  )
}

function chunkString(value: string, size: number): string[] {
  const out: string[] = []
  for (let i = 0; i < value.length; i += size) out.push(value.slice(i, i + size))
  return out
}

function safeParseChunk(text: string): { id: string; index: number; total: number; data: string } | null {
  try {
    const parsed = JSON.parse(text) as { id: string; index: number; total: number; data: string }
    if (!parsed || typeof parsed.id !== 'string' || typeof parsed.index !== 'number' || typeof parsed.total !== 'number' || typeof parsed.data !== 'string') return null
    return parsed
  } catch { return null }
}

function waitForVideoElement(ref: RefObject<HTMLVideoElement>, timeoutMs = 1500): Promise<HTMLVideoElement> {
  const started = Date.now()
  return new Promise((resolve, reject) => {
    const tick = () => {
      if (ref.current) {
        ref.current.setAttribute('playsinline', 'true')
        ref.current.muted = true
        resolve(ref.current)
        return
      }
      if (Date.now() - started > timeoutMs) {
        reject(new Error('Camera preview did not initialize.'))
        return
      }
      window.requestAnimationFrame(tick)
    }
    tick()
  })
}

async function startQrDecodeWithRetry(
  reader: BrowserQRCodeReader,
  video: HTMLVideoElement,
  onText: (text: string) => void,
  attempts = 2
) {
  let lastError: unknown
  const constraints: MediaStreamConstraints = {
    video: {
      facingMode: { ideal: 'environment' },
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
    audio: false,
  }

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await reader.decodeFromConstraints(constraints, video, (result) => {
        if (result) onText(result.getText())
      })
    } catch (error) {
      lastError = error
      await new Promise((resolve) => window.setTimeout(resolve, 250 * (attempt + 1)))
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Camera access failed')
}

function cameraErrorMessage(error: unknown) {
  const name = error instanceof DOMException ? error.name : ''
  if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
    return 'Camera permission denied. Allow camera access for SelfSync from Android app settings, then try again.'
  }
  if (name === 'NotFoundError' || name === 'OverconstrainedError') {
    return 'No usable camera was found. Try again or check device camera settings.'
  }
  if (name === 'NotReadableError') {
    return 'Camera is busy in another app. Close other camera apps and retry.'
  }
  return error instanceof Error ? error.message : 'Camera access failed. Please retry.'
}
