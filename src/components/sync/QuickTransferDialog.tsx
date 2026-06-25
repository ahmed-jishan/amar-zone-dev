'use client'

import { useState, useEffect, useRef, useMemo, useCallback, type RefObject } from 'react'
import {
  Loader2,
  CheckCircle2, AlertTriangle, XCircle, ArrowLeft,
  Lock, Eye, EyeOff, FileText, Smartphone,
  QrCode, ScanLine, Shield, Zap, Camera,
  CameraOff, CircleDot, Radio, Wifi,
  Pause, Play, RefreshCw, Signal,
} from 'lucide-react'
import { Modal } from '@/components/shared/Modal'
import { useSettingsStore, type Language } from '@/features/settings/store/settingsStore'
import {
  buildBackupEnvelope,
  readBackupFile,
  deserializeBackup,
  validateFullBackup,
  getBackupCounts,
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
import { compressText, decompressText } from '@/lib/utils/compress'
import QRCode from 'qrcode'
import type { BrowserQRCodeReader, IScannerControls } from '@zxing/browser'
import type { BackupEnvelope, BackupCounts, BackupPayload, RestoreStrategy } from '@/lib/backup'
import {
  createSenderPeer,
  createReceiverConnection,
  sendBackupViaWebRTC,
  receiveBackupViaWebRTC,
  type WebRTCTransferState,
  type WebRTCProgress,
  type WebRTCQRPayload,
} from '@/lib/sync/webrtc-transfer'

type Step = 'landing' | 'send-prepare' | 'send-qr' | 'send-webrtc' | 'receive-scan' | 'receive-webrtc' | 'receive-preview' | 'receive-merging' | 'receive-done'
type SendStage = 'preparing' | 'encrypting' | 'generating' | 'ready' | 'complete'
type MergeStage = 'merging' | 'finalizing' | 'complete' | 'error'
type ScanPhase = 'starting' | 'scanning' | 'detected' | 'transferring' | 'done' | 'failed'
type TransferMode = 'qr' | 'webrtc' | 'file'
type CameraPermissionState = 'unknown' | 'checking' | 'prompt' | 'granted' | 'denied'

// ─── Constants ───
const QR_CHUNK_SIZE = 2400
const QR_WIDTH = 340
const AUTO_ADVANCE_INTERVAL_MS = 3000  // 3 seconds per QR frame

// Fast base64 helper
function fastBtoa(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

function yieldToUI(): Promise<void> {
  return new Promise(r => requestAnimationFrame(() => setTimeout(r, 0)))
}

const tr = (lang: Language) => ({
  title: lang === 'bn' ? 'কুইক ট্রান্সফার' : 'Quick Transfer',
  // Tabs
  qrTransfer: lang === 'bn' ? 'QR ট্রান্সফার' : 'QR Transfer',
  webrtcTransfer: lang === 'bn' ? 'ফাস্ট ট্রান্সফার (WebRTC)' : 'Fast Transfer (WebRTC)',
  fileRestore: lang === 'bn' ? 'ফাইল রিস্টোর' : 'File Restore',
  qrDesc: lang === 'bn' ? 'একাধিক QR কোড — কোনো নেটওয়ার্ক লাগে না' : 'Multiple QR codes — no network needed',
  webrtcDesc: lang === 'bn' ? '১ বার স্ক্যান — যেকোনো সাইজ, দ্রুত' : 'One scan — any size, super fast',
  fileDesc: lang === 'bn' ? 'JSON ফাইল থেকে ডেটা রিস্টোর' : 'Restore from JSON backup file',
  qrSendAction: lang === 'bn' ? 'QR তৈরি করুন' : 'Show QR',
  qrReceiveAction: lang === 'bn' ? 'QR স্ক্যান করে নিন' : 'Receive',
  fastSendAction: lang === 'bn' ? 'Fast QR তৈরি করুন' : 'Send',
  fastScanAction: lang === 'bn' ? 'QR স্ক্যান করুন' : 'Scan',
  receiveScanHint: lang === 'bn' ? 'অন্য ডিভাইসের QR কোড ক্যামেরা দিয়ে স্ক্যান করুন' : 'Scan the QR code from the other device',
  // Common
  passphrase: lang === 'bn' ? 'পাসফ্রেজ' : 'Passphrase',
  passHint: lang === 'bn' ? 'কমপক্ষে ৮ অক্ষর' : 'At least 8 characters',
  cancel: lang === 'bn' ? 'বাতিল' : 'Cancel',
  // QR Send
  send: lang === 'bn' ? 'QR কোড দেখান' : 'Show QR Code',
  startTransfer: lang === 'bn' ? 'ট্রান্সফার শুরু করুন' : 'Start Transfer',
  preparing: lang === 'bn' ? 'ডেটা প্রস্তুত হচ্ছে...' : 'Preparing data...',
  encrypting: lang === 'bn' ? 'এনক্রিপ্ট হচ্ছে...' : 'Encrypting...',
  generating: lang === 'bn' ? 'QR কোড তৈরি হচ্ছে...' : 'Generating QR code...',
  scanReady: lang === 'bn' ? 'স্ক্যানের জন্য প্রস্তুত' : 'Ready to scan',
  qrHint: lang === 'bn' ? 'অন্য ডিভাইসে "QR Transfer → Receive" সিলেক্ট করে স্ক্যান করুন' : 'On the other device, select "QR Transfer → Receive" and scan',
  // QR Auto-Advance
  autoAdvance: lang === 'bn' ? 'অটো-এডভান্স' : 'Auto-Advance',
  autoPaused: lang === 'bn' ? 'থেমে গেছে' : 'Paused',
  frame: (c: number, t: number) => lang === 'bn' ? `${c}/${t} ফ্রেম` : `Frame ${c}/${t}`,
  nextIn: (s: number) => lang === 'bn' ? `পরবর্তী ${s}সে` : `Next in ${s}s`,
  // QR Receive
  receive: lang === 'bn' ? 'QR স্ক্যানার' : 'QR Scanner',
  cameraStarting: lang === 'bn' ? 'ক্যামেরা চালু হচ্ছে...' : 'Starting camera...',
  pointCamera: lang === 'bn' ? 'QR কোডের দিকে ক্যামেরা লক্ষ্য করুন' : 'Point camera at the QR code',
  scanning: lang === 'bn' ? 'স্ক্যান করা হচ্ছে...' : 'Scanning...',
  qrDetected: lang === 'bn' ? 'QR কোড শনাক্ত! ✓' : 'QR Code Detected! ✓',
  decrypting: lang === 'bn' ? 'ডিক্রিপ্ট হচ্ছে...' : 'Decrypting...',
  dataReady: lang === 'bn' ? 'ডেটা প্রস্তুত!' : 'Data ready!',
  cameraError: lang === 'bn' ? 'ক্যামেরা অ্যাক্সেস ব্যর্থ' : 'Camera access failed',
  cameraPermissionTitle: lang === 'bn' ? 'ক্যামেরা পারমিশন দরকার' : 'Camera permission needed',
  cameraPermissionBody: lang === 'bn' ? 'QR স্ক্যান করতে ক্যামেরা অ্যাক্সেস অনুমতি দিন। অনুমতি দিলে স্ক্যানার সাথে সাথে খুলবে।' : 'Allow camera access to scan the QR code. The scanner will open immediately after approval.',
  cameraDeniedBody: lang === 'bn' ? 'ক্যামেরা পারমিশন বন্ধ আছে। ফোনের App Settings থেকে Camera permission Allow করে আবার চেষ্টা করুন।' : 'Camera permission is blocked. Allow Camera from your phone App Settings, then try again.',
  tryAgain: lang === 'bn' ? 'পুনরায় চেষ্টা করুন' : 'Try Again',
  framesReceived: (r: number, t: number) => lang === 'bn' ? `${r}/${t} ফ্রেম পাওয়া গেছে` : `Received ${r}/${t} frames`,
  // WebRTC
  webrtcSend: lang === 'bn' ? 'ফাস্ট পাঠান' : 'Fast Send',
  webrtcReceive: lang === 'bn' ? 'ফাস্ট নিন' : 'Fast Receive',
  creatingPeer: lang === 'bn' ? 'কানেকশন তৈরি হচ্ছে...' : 'Creating connection...',
  waitingConnection: lang === 'bn' ? 'অন্য ডিভাইস কানেক্ট হওয়ার অপেক্ষায়...' : 'Waiting for other device to connect...',
  connecting: lang === 'bn' ? 'কানেক্ট হচ্ছে...' : 'Connecting...',
  connected: lang === 'bn' ? 'কানেক্টেড!' : 'Connected!',
  sending: lang === 'bn' ? 'ডেটা পাঠানো হচ্ছে...' : 'Sending data...',
  receiving: lang === 'bn' ? 'ডেটা আসছে...' : 'Receiving data...',
  webrtcDone: lang === 'bn' ? 'ট্রান্সফার সম্পূর্ণ!' : 'Transfer Complete!',
  webrtcFailed: lang === 'bn' ? 'কানেকশন ব্যর্থ' : 'Connection failed',
  webrtcTimeout: lang === 'bn' ? 'কানেকশন টাইম আউট। নেটওয়ার্ক চেক করুন অথবা QR মোড ব্যবহার করুন।' : 'Connection timed out. Check network or use QR mode.',
  webrtcFallback: lang === 'bn' ? 'QR মোডে সুইচ করুন' : 'Switch to QR mode',
  webrtcProgress: (p: WebRTCProgress) => {
    const pct = p.bytesTotal > 0 ? Math.round((p.bytesTransferred / p.bytesTotal) * 100) : 0
    const speed = p.speedBytesPerSecond ? ` · ${(p.speedBytesPerSecond / 1024).toFixed(1)} KB/s` : ''
    const eta = p.etaSeconds && p.etaSeconds > 1 ? ` · ${Math.ceil(p.etaSeconds)}s` : ''
    const retry = p.retries ? ` · ${p.retries} retry${p.retries > 1 ? 's' : ''}` : ''
    return `${pct}% (${(p.bytesTransferred / 1024).toFixed(1)}/${(p.bytesTotal / 1024).toFixed(1)} KB)${speed}${eta}${retry}`
  },
  webrtcScanInfo: (name: string) => lang === 'bn' ? `"${name}" কানেক্ট হবে — QR স্ক্যান করুন` : `Connect to "${name}" — scan the QR code`,
  // Preview
  records: lang === 'bn' ? 'রেকর্ড' : 'Records',
  merge: lang === 'bn' ? 'মার্জ (সুপারিশকৃত)' : 'Merge (Recommended)',
  mergeDesc: lang === 'bn' ? 'ব্যাকআপ ও বর্তমান ডেটা উভয়ই রাখে' : 'Keeps both backup and current data',
  replace: lang === 'bn' ? 'রিপ্লেস' : 'Replace',
  replaceDesc: lang === 'bn' ? 'বর্তমান ডেটা ব্যাকআপ দিয়ে প্রতিস্থাপন' : 'Replaces current data with backup',
  doneMsg: lang === 'bn' ? 'ট্রান্সফার সম্পূর্ণ!' : 'Transfer Complete!',
  refresh: lang === 'bn' ? 'রিফ্রেশ করুন' : 'Refresh',
  corrupted: lang === 'bn' ? 'ফাইল নষ্ট!' : 'Corrupted file!',
  rollbackOk: lang === 'bn' ? 'রোলব্যাক সফল। কোনো ডেটা হারায়নি।' : 'Rolled back. No data lost.',
  invalidPass: lang === 'bn' ? 'পাসফ্রেজ ভুল' : 'Invalid passphrase',
  differences: lang === 'bn' ? 'পার্থক্য' : 'Differences',
  syncReady: lang === 'bn' ? 'সিঙ্ক প্রস্তুত' : 'Sync Ready',
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
  encrypted: lang === 'bn' ? 'এনক্রিপ্টেড' : 'Encrypted',
  compressed: lang === 'bn' ? 'কম্প্রেসড' : 'Compressed',
  frames: (c: number) => lang === 'bn' ? `${c}টি ফ্রেম` : `${c} frame${c > 1 ? 's' : ''}`,
  startNow: lang === 'bn' ? 'এখনই স্ক্যান শুরু হবে' : 'Scanning will start automatically',
  mergingLabel: lang === 'bn' ? 'ডেটা মার্জ হচ্ছে...' : 'Merging data...',
  finalizing: lang === 'bn' ? 'চূড়ান্ত হচ্ছে...' : 'Finalizing...',
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
  const [showPass, setShowPass] = useState(false)

  // Module selection
  const [selectedModules, setSelectedModules] = useState({
    tasks: true, money: true, namaz: true, settings: true, prefs: true,
  })

  // ── QR Send ──
  const [sendStage, setSendStage] = useState<SendStage>('preparing')
  const [qrChunks, setQrChunks] = useState<string[]>([])
  const [qrIndex, setQrIndex] = useState(0)
  const [qrSessionId, setQrSessionId] = useState('')
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [originalSize, setOriginalSize] = useState(0)
  const [compressedSize, setCompressedSize] = useState(0)
  const [autoAdvance, setAutoAdvance] = useState(true)
  const [countdown, setCountdown] = useState(3)
  const autoAdvanceRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── QR Receive ──
  const [scanPhase, setScanPhase] = useState<ScanPhase>('starting')
  const [scanStatus, setScanStatus] = useState<{ total: number; received: number } | null>(null)
  const [scannedPayload, setScannedPayload] = useState<string | null>(null)
  const [detectedFlash, setDetectedFlash] = useState(false)
  const [cameraPermission, setCameraPermission] = useState<CameraPermissionState>('unknown')
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const scannerRef = useRef<BrowserQRCodeReader | null>(null)
  const scannerControlsRef = useRef<IScannerControls | null>(null)
  const scannedChunksRef = useRef(new Map<string, { total: number; parts: Map<number, string> }>())
  const cameraStartedRef = useRef(false)
  const receiveDataRef = useRef<(raw: string) => Promise<void>>(async () => undefined)
  const webRTCPeerIdRef = useRef<(peerId: string) => Promise<void>>(async () => undefined)

  // ── WebRTC ──
  const [webrtcState, setWebrtcState] = useState<WebRTCTransferState>('idle')
  const [webrtcProgress, setWebrtcProgress] = useState<WebRTCProgress | null>(null)
  const [webrtcQRPayload, setWebrtcQRPayload] = useState<WebRTCQRPayload | null>(null)
  const [webrtcQRDataUrl, setWebrtcQRDataUrl] = useState<string | null>(null)
  const webrtcPeerRef = useRef<ReturnType<typeof createSenderPeer> | null>(null)

  // File restore
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [envelope, setEnvelope] = useState<BackupEnvelope | null>(null)
  const [backupCounts, setBackupCounts] = useState<BackupCounts | null>(null)
  const [localCountsData, setLocalCountsData] = useState<BackupCounts | null>(null)
  const [differences, setDifferences] = useState<ReturnType<typeof computeDifferences> | null>(null)

  // Merge
  const [mergeStage, setMergeStage] = useState<MergeStage>('merging')

  // Error / message
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  // Local counts
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

  // ── Auto-advance timer ──
  useEffect(() => {
    if (step === 'send-qr' && sendStage === 'ready' && autoAdvance && qrChunks.length > 1) {
      setCountdown(AUTO_ADVANCE_INTERVAL_MS / 1000)
      autoAdvanceRef.current = setInterval(() => {
        setQrIndex((prev) => {
          const next = prev + 1
          if (next >= qrChunks.length) return 0 // loop back
          return next
        })
        setCountdown(AUTO_ADVANCE_INTERVAL_MS / 1000)
      }, AUTO_ADVANCE_INTERVAL_MS)

      // Countdown tick
      const countdownInterval = setInterval(() => {
        setCountdown((prev) => Math.max(0, prev - 1))
      }, 1000)

      return () => {
        if (autoAdvanceRef.current) clearInterval(autoAdvanceRef.current)
        clearInterval(countdownInterval)
      }
    }
  }, [step, sendStage, autoAdvance, qrChunks.length])

  // Update countdown reset when QR index changes manually
  useEffect(() => {
    if (autoAdvance && qrChunks.length > 1) {
      setCountdown(AUTO_ADVANCE_INTERVAL_MS / 1000)
    }
  }, [qrIndex, autoAdvance, qrChunks.length])

  // ── Camera management ──
  const stopScanner = useCallback(() => {
    scannerControlsRef.current?.stop()
    scannerControlsRef.current = null
    scannerRef.current = null
    if (videoRef.current) {
      if (videoRef.current.srcObject instanceof MediaStream) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop())
      }
      videoRef.current.srcObject = null
    }
    cameraStartedRef.current = false
  }, [])

  const startCamera = useCallback(async () => {
    if (cameraStartedRef.current) return
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('Camera not available on this device.')
    }
    setCameraPermission('checking')
    await ensureCameraPermission((state) => setCameraPermission(state))
    const video = await waitForVideoElement(videoRef)
    const mod = await import('@zxing/browser')
    const reader = new mod.BrowserQRCodeReader()
    scannerRef.current = reader

    const controls = await startQrDecodeWithRetry(reader, video, (text) => {
      const handshake = safeParseWebRTCHandshake(text)
      if (handshake) {
        try { navigator.vibrate?.([40, 30, 40]) } catch { /* noop */ }
        setDetectedFlash(true)
        setTimeout(() => setDetectedFlash(false), 400)
        setScanPhase('detected')
        stopScanner()
        void webRTCPeerIdRef.current(handshake.peerId)
        return
      }

      const parsed = safeParseChunk(text)
      if (!parsed) return

      try { navigator.vibrate?.(80) } catch { /* noop */ }

      setDetectedFlash(true)
      setTimeout(() => setDetectedFlash(false), 400)
      setScanPhase('detected')

      const entry = scannedChunksRef.current.get(parsed.id) || { total: parsed.total, parts: new Map<number, string>() }
      if (entry.total !== parsed.total || parsed.index < 0 || parsed.index >= parsed.total) {
        return
      }
      if (!entry.parts.has(parsed.index)) entry.parts.set(parsed.index, parsed.data)
      scannedChunksRef.current.set(parsed.id, entry)
      setScanStatus({ total: parsed.total, received: entry.parts.size })

      if (entry.parts.size === parsed.total) {
        const ordered = Array.from(entry.parts.entries()).sort((a, b) => a[0] - b[0]).map(([, d]) => d).join('')
        setScannedPayload(ordered)
        setScanPhase('transferring')
        stopScanner()
        void receiveDataRef.current(ordered)
      }
    })

    scannerControlsRef.current = controls
    await waitForVideoPlayback(video)
    cameraStartedRef.current = true
    setCameraPermission('granted')
    setScanPhase('scanning')
  }, [])

  // Auto-start camera when entering QR receive screen
  useEffect(() => {
    if (step === 'receive-scan') {
      setScanPhase('starting')
      setError('')
      setScannedPayload(null)
      setScanStatus(null)
      setCameraPermission('unknown')
      scannedChunksRef.current.clear()
      cameraStartedRef.current = false
      startCamera().catch((err) => {
        console.error('Camera start failed:', err)
        setScanPhase('failed')
        setError(cameraErrorMessage(err))
      })
    } else {
      stopScanner()
    }
  }, [step, startCamera, stopScanner])

  // Cleanup
  const cleanup = useCallback(() => {
    stopScanner()
    webrtcPeerRef.current = null
    setStep('landing')
    setError('')
    setMessage('')
    setPassphrase('')
    setQrChunks([])
    setQrIndex(0)
    setQrDataUrl(null)
    setScannedPayload(null)
    setScanStatus(null)
    setScanPhase('starting')
    setEnvelope(null)
    setBackupCounts(null)
    setLocalCountsData(null)
    setDifferences(null)
    setSendStage('preparing')
    setMergeStage('merging')
    setOriginalSize(0)
    setCompressedSize(0)
    setDetectedFlash(false)
    setAutoAdvance(true)
    setCountdown(3)
    setWebrtcState('idle')
    setWebrtcProgress(null)
    setWebrtcQRPayload(null)
    setWebrtcQRDataUrl(null)
    setSelectedModules({ tasks: true, money: true, namaz: true, settings: true, prefs: true })
    if (autoAdvanceRef.current) clearInterval(autoAdvanceRef.current)
  }, [stopScanner])

  useEffect(() => cleanup, [cleanup])

  // Generate QR image
  useEffect(() => {
    if (qrChunks.length === 0) { setQrDataUrl(null); return }
    const chunk = qrChunks[qrIndex]
    QRCode.toDataURL(
      JSON.stringify({ id: qrSessionId, index: qrIndex, total: qrChunks.length, data: chunk }),
      {
        errorCorrectionLevel: 'L',
        margin: 1,
        width: QR_WIDTH,
        color: { dark: '#000000', light: '#ffffff' },
      }
    ).then((url: string) => setQrDataUrl(url)).catch(() => setQrDataUrl(null))
  }, [qrChunks, qrIndex, qrSessionId])

  // Generate WebRTC QR code
  useEffect(() => {
    if (!webrtcQRPayload) { setWebrtcQRDataUrl(null); return }
    const qrContent = JSON.stringify({
      type: 'webrtc-handshake',
      peerId: webrtcQRPayload.peerId,
      deviceName: webrtcQRPayload.deviceName,
      appVersion: webrtcQRPayload.appVersion,
      protocolVersion: webrtcQRPayload.protocolVersion,
    })
    QRCode.toDataURL(
      qrContent,
      {
        errorCorrectionLevel: 'M',
        margin: 1,
        width: QR_WIDTH,
        color: { dark: '#000000', light: '#ffffff' },
      }
    ).then((url: string) => setWebrtcQRDataUrl(url)).catch(() => setWebrtcQRDataUrl(null))
  }, [webrtcQRPayload])

  // ── QR SEND ──
  const handleStartSend = async () => {
    if (passphrase.trim().length < 8) { setError(strings.passHint); return }
    setError('')
    setSendStage('preparing')
    setStep('send-qr')
    await yieldToUI()

    try {
      setSendStage('encrypting')
      const payload = collectBackupPayload()
      const filtered: BackupPayload = {
        tasks: selectedModules.tasks ? payload.tasks : { tasks: [] },
        money: selectedModules.money ? payload.money : {
          transactions: [], loans: [], budgets: [], savingsGoals: [],
          wallets: [], subscriptions: [], insights: [],
          categoryLimits: [], recurringTemplates: [], assets: [], netWorthHistory: [],
        },
        namaz: selectedModules.namaz ? payload.namaz : { records: [], settings: payload.namaz.settings },
        settings: selectedModules.settings ? payload.settings : { appSettings: payload.settings.appSettings },
        prefs: selectedModules.prefs ? payload.prefs : payload.prefs,
        notes: payload.notes,
        health: payload.health,
        namazExtras: payload.namazExtras,
      }

      setSendStage('generating')
      await yieldToUI()

      const backupEnvelope = await buildBackupEnvelope(filtered)
      const content = JSON.stringify(backupEnvelope)
      setOriginalSize(content.length)

      const compressed = compressText(content)
      setCompressedSize(compressed.length)

      const enc = new TextEncoder()
      const data = enc.encode(compressed)
      const salt = crypto.getRandomValues(new Uint8Array(16))
      const iv = crypto.getRandomValues(new Uint8Array(12))
      const key = await crypto.subtle.importKey('raw', enc.encode(passphrase.padEnd(16, ' ').slice(0, 16)), 'AES-GCM', false, ['encrypt'])
      const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data))

      const finalEncrypted = {
        v: 1 as const, alg: 'AES-GCM' as const, kdf: 'PBKDF2' as const,
        iterations: 150000,
        compressed: true as const,
        salt: fastBtoa(salt),
        iv: fastBtoa(iv),
        ciphertext: fastBtoa(ct),
      }

      const text = serializeEncryptedBackup(finalEncrypted)
      const chunks = chunkString(text, QR_CHUNK_SIZE)
      const sessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      setQrSessionId(sessionId)
      setQrChunks(chunks)
      setQrIndex(0)
      setSendStage('ready')
      await yieldToUI()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Transfer failed')
    }
  }

  // ── QR RECEIVE DATA ──
  const handleReceiveData = async (raw: string) => {
    try {
      const encrypted = parseEncryptedBackup(raw)
      await new Promise(r => setTimeout(r, 200))
      const decrypted = await decryptBackup(passphrase, encrypted)

      if (encrypted.compressed) {
        const decompressed = decompressText(decrypted as unknown as string)
        const parsed = deserializeBackup(decompressed)
        if (!parsed) { setError(strings.corrupted); setScanPhase('failed'); return }
        const validation = await validateFullBackup(parsed)
        if (!validation.valid) {
          setError(validation.errors.map((item) => item.message).join('\n'))
          setScanPhase('failed')
          return
        }
        setEnvelope(parsed)
        setBackupCounts(getBackupCounts(parsed.data))
        setLocalCountsData(getLocalCounts())
        setDifferences(computeDifferences(parsed.data))
        setScanPhase('done')
        setStep('receive-preview')
      } else {
        const parsed = deserializeBackup(decrypted as unknown as string)
        if (!parsed) { setError(strings.corrupted); setScanPhase('failed'); return }
        const validation = await validateFullBackup(parsed)
        if (!validation.valid) {
          setError(validation.errors.map((item) => item.message).join('\n'))
          setScanPhase('failed')
          return
        }
        setEnvelope(parsed)
        setBackupCounts(getBackupCounts(parsed.data))
        setLocalCountsData(getLocalCounts())
        setDifferences(computeDifferences(parsed.data))
        setScanPhase('done')
        setStep('receive-preview')
      }
    } catch {
      setScanPhase('failed')
      setError(strings.invalidPass)
    }
  }

  // ── WEBRTC SEND ──
  const handleWebRTCSend = async () => {
    if (passphrase.trim().length < 8) { setError(strings.passHint); return }
    setError('')
    setStep('send-webrtc')
    setWebrtcState('creating-peer')
    setWebrtcProgress(null)

    try {
      const { peer, qrPayload, whenConnected } = await createSenderPeer(
        (state) => setWebrtcState(state),
        (errMsg) => setError(errMsg),
      )

      setWebrtcQRPayload(qrPayload)

      // Wait for receiver to connect
      setWebrtcState('waiting-connection')
      const conn = await whenConnected

      // Prepare and encrypt backup data
      setWebrtcState('sending')
      const payload = collectBackupPayload()
      const backupEnvelope = await buildBackupEnvelope(payload)
      const content = JSON.stringify(backupEnvelope)
      const compressed = compressText(content)

      const enc = new TextEncoder()
      const data = enc.encode(compressed)
      const salt = crypto.getRandomValues(new Uint8Array(16))
      const iv = crypto.getRandomValues(new Uint8Array(12))
      const key = await crypto.subtle.importKey('raw', enc.encode(passphrase.padEnd(16, ' ').slice(0, 16)), 'AES-GCM', false, ['encrypt'])
      const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data))

      const encryptedData = JSON.stringify({
        v: 1, alg: 'AES-GCM', kdf: 'PBKDF2',
        iterations: 150000, compressed: true,
        salt: fastBtoa(salt), iv: fastBtoa(iv),
        ciphertext: fastBtoa(ct),
      })

      await sendBackupViaWebRTC(conn, encryptedData,
        (progress) => setWebrtcProgress(progress),
        (state) => setWebrtcState(state),
      )

      setMessage(strings.webrtcDone)
    } catch (e) {
      if (!error) setError(e instanceof Error ? e.message : 'WebRTC transfer failed')
    }
  }

  // ── WEBRTC RECEIVE ──
  const handleWebRTCPeerId = async (peerId: string) => {
    if (passphrase.trim().length < 8) { setError(strings.passHint); return }
    setError('')
    setStep('receive-webrtc')
    setWebrtcState('creating-peer')

    try {
      const conn = await createReceiverConnection(
        peerId,
        (state) => setWebrtcState(state),
        (errMsg) => setError(errMsg),
      )

      const data = await receiveBackupViaWebRTC(conn,
        (progress) => setWebrtcProgress(progress),
        (state) => setWebrtcState(state),
      )

      // Data received, now decrypt
      const encrypted = parseEncryptedBackup(data)
      const decrypted = await decryptBackup(passphrase, encrypted)

      if (encrypted.compressed) {
        const decompressed = decompressText(decrypted as unknown as string)
        const parsed = deserializeBackup(decompressed)
        if (!parsed) { setError(strings.corrupted); return }
        const validation = await validateFullBackup(parsed)
        if (!validation.valid) {
          setError(validation.errors.map((item) => item.message).join('\n'))
          return
        }
        setEnvelope(parsed)
        setBackupCounts(getBackupCounts(parsed.data))
        setLocalCountsData(getLocalCounts())
        setDifferences(computeDifferences(parsed.data))
        setStep('receive-preview')
      } else {
        const parsed = deserializeBackup(decrypted as unknown as string)
        if (!parsed) { setError(strings.corrupted); return }
        const validation = await validateFullBackup(parsed)
        if (!validation.valid) {
          setError(validation.errors.map((item) => item.message).join('\n'))
          return
        }
        setEnvelope(parsed)
        setBackupCounts(getBackupCounts(parsed.data))
        setLocalCountsData(getLocalCounts())
        setDifferences(computeDifferences(parsed.data))
        setStep('receive-preview')
      }
    } catch (e) {
      if (!error) setError(e instanceof Error ? e.message : 'WebRTC receive failed')
    }
  }

  useEffect(() => {
    receiveDataRef.current = handleReceiveData
    webRTCPeerIdRef.current = handleWebRTCPeerId
  })

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

  const qrSizeInfo = useMemo(() => {
    if (originalSize === 0) return ''
    const savings = originalSize - compressedSize
    const pct = ((savings / originalSize) * 100).toFixed(0)
    const qrCount = qrChunks.length
    const sizeKB = (originalSize / 1024).toFixed(1)
    return `${sizeKB} KB · ${strings.frames(qrCount)} · ${pct}% ${strings.compressed}`
  }, [originalSize, compressedSize, qrChunks.length, strings])

  const handleWebRTCReceiveScan = async () => {
    if (passphrase.trim().length < 8) { setError(strings.passHint); return }
    setError('')
    setStep('receive-scan')
    // After QR scan with webrtc type, handleWebRTCPeerId will be called
  }

  const beginQRSend = () => {
    if (passphrase.trim().length < 8) { setError(strings.passHint); return }
    setError('')
    setStep('send-prepare')
  }

  const beginQRReceive = () => {
    if (passphrase.trim().length < 8) { setError(strings.passHint); return }
    setError('')
    setStep('receive-scan')
  }

  const beginFastSend = () => {
    if (passphrase.trim().length < 8) { setError(strings.passHint); return }
    setError('')
    if (typeof window === 'undefined' || !navigator.onLine) {
      setError(lang === 'bn' ? 'ইন্টারনেট কানেকশন প্রয়োজন' : 'Internet connection required for Fast Transfer')
      return
    }
    void handleWebRTCSend()
  }

  return (
    <Modal open={open} onClose={() => { cleanup(); onClose() }} title={strings.title}>
      <div className="space-y-4">
        {error && (
          <div className="rounded-xl bg-[var(--st-danger-bg)] p-3 text-xs text-[var(--st-danger)] transition-all duration-300">
            <div className="flex items-start gap-2">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              <span className="whitespace-pre-wrap break-all">{error}</span>
            </div>
          </div>
        )}
        {message && (
          <div className="rounded-xl bg-[var(--st-success-bg)] p-3 text-xs text-[var(--st-success)] transition-all duration-300">
            <div className="flex items-center gap-2"><CheckCircle2 size={14} /><span>{message}</span></div>
          </div>
        )}

        {/* ═══ LANDING ═══ — 3 tabs */}
        {step === 'landing' && (
          <div className="space-y-3">
            {/* Security badge */}
            <div className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[var(--st-accent-bg)] to-[var(--st-success-bg)] p-2.5 text-xs">
              <Shield size={14} className="text-[var(--st-accent)] shrink-0" />
              <span className="font-semibold text-[var(--st-text-1)]">
                AES-256-GCM + gzip · {lang === 'bn' ? 'এন্ড-টু-এন্ড এনক্রিপ্টেড' : 'End-to-End Encrypted'}
              </span>
            </div>

            {/* Passphrase — once per session */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[var(--st-text-2)]">{strings.passphrase}</label>
              <div className="flex gap-2">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  className="mo-inp flex-1 mb-0"
                  placeholder={strings.passHint}
                  autoComplete="off"
                />
                <button onClick={() => setShowPass(!showPass)} className="st-eye" tabIndex={-1}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* QR Transfer */}
            <div className="rounded-2xl border border-[var(--st-border-strong)] p-3.5 transition-all hover:bg-[var(--st-surface-hover)]">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--st-accent-bg)] text-[var(--st-accent)] shrink-0"><QrCode size={18} /></div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-[var(--st-text-1)]">{strings.qrTransfer}</div>
                  <div className="text-xs text-[var(--st-text-3)] mt-0.5">{strings.qrDesc}</div>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  onClick={beginQRSend}
                  className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--st-accent)] px-3 text-xs font-bold text-white shadow-sm transition-all hover:brightness-110 active:scale-[0.98]"
                >
                  <QrCode size={14} /> {strings.qrSendAction}
                </button>
                <button
                  onClick={beginQRReceive}
                  className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[var(--st-accent-border)] bg-[var(--st-accent-bg)] px-3 text-xs font-bold text-[var(--st-accent)] transition-all hover:brightness-110 active:scale-[0.98]"
                >
                  <ScanLine size={14} /> {strings.qrReceiveAction}
                </button>
              </div>
            </div>

            {/* WebRTC Fast Transfer */}
            <div className="rounded-2xl border border-[var(--st-accent-border)] bg-[var(--st-accent-bg)] p-3.5 transition-all hover:brightness-105">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white shrink-0">
                  <Signal size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-[var(--st-accent)]">{strings.webrtcTransfer}</div>
                  <div className="text-xs text-[var(--st-text-3)] mt-0.5">{strings.webrtcDesc}</div>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  onClick={beginFastSend}
                  className="flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-3 text-xs font-bold text-white shadow-sm transition-all hover:brightness-110 active:scale-[0.98]"
                >
                  <Radio size={14} /> {strings.fastSendAction}
                </button>
                <button
                  onClick={handleWebRTCReceiveScan}
                  className="flex h-11 items-center justify-center gap-2 rounded-xl border border-blue-400/30 bg-white/10 px-3 text-xs font-bold text-[var(--st-accent)] transition-all hover:bg-white/15 active:scale-[0.98]"
                >
                  <Camera size={14} /> {strings.fastScanAction}
                </button>
              </div>
            </div>

            {/* Tab 3: File Restore */}
            <button
              onClick={() => {
                if (passphrase.trim().length < 8) { setError(strings.passHint); return }
                fileInputRef.current?.click()
              }}
              className="w-full flex items-center gap-3 rounded-2xl border border-[var(--st-border-strong)] p-3.5 text-left hover:bg-[var(--st-surface-hover)] transition-all active:scale-[0.99]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--st-gold-bg)] text-[var(--st-gold)] shrink-0"><FileText size={18} /></div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-[var(--st-text-1)]">{strings.fileRestore}</div>
                <div className="text-xs text-[var(--st-text-3)] mt-0.5">{strings.fileDesc}</div>
              </div>
              <ArrowLeft size={16} className="text-[var(--st-text-3)] shrink-0 rotate-180" />
            </button>
            <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)} />
          </div>
        )}

        {/* ═══ SEND: PREPARE (Module selection) ═══ */}
        {step === 'send-prepare' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[var(--st-accent-bg)] to-[var(--st-success-bg)] p-2.5 text-xs">
              <Lock size={14} className="text-[var(--st-accent)] shrink-0" />
              <span className="font-semibold text-[var(--st-text-1)]">AES-256-GCM · gzip {lang === 'bn' ? 'কম্প্রেশন' : 'Compression'}</span>
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

            <button onClick={handleStartSend} className="mo-submit mo-submit--neu flex items-center justify-center gap-2">
              <QrCode size={16} /> {strings.startTransfer}
            </button>
          </div>
        )}

        {/* ═══ SEND: QR (with auto-advance) ═══ */}
        {step === 'send-qr' && (
          <div className="space-y-4">
            {sendStage !== 'ready' && sendStage !== 'complete' && (
              <div className="flex flex-col items-center gap-4 py-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--st-accent-bg)] text-[var(--st-accent)]">
                  <Loader2 size={22} className="animate-spin" />
                </div>
                <p className="text-sm text-[var(--st-text-2)]">
                  {sendStage === 'preparing' ? strings.preparing : sendStage === 'encrypting' ? strings.encrypting : strings.generating}
                </p>
              </div>
            )}

            {sendStage === 'ready' && qrDataUrl && (
              <div className="flex flex-col items-center gap-3">
                {/* Status + Auto-advance indicator */}
                <div className="flex items-center justify-between w-full px-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
                    <span className="text-xs font-semibold text-emerald-500">{strings.scanReady}</span>
                  </div>
                  {qrChunks.length > 1 && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setAutoAdvance(!autoAdvance)}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold border border-[var(--st-border)] bg-[var(--st-surface-2)] hover:bg-[var(--st-surface-hover)] transition-colors"
                        title={autoAdvance ? strings.autoAdvance : strings.autoPaused}
                      >
                        {autoAdvance ? (
                          <><Pause size={10} /> {strings.autoAdvance}</>
                        ) : (
                          <><Play size={10} /> {strings.autoPaused}</>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* QR Code Card */}
                <div className="relative rounded-2xl bg-white shadow-lg border border-gray-100 overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-center justify-center">
                      <img
                        src={qrDataUrl}
                        alt="Quick Transfer QR Code"
                        className="w-[340px] h-[340px]"
                        style={{ imageRendering: 'pixelated' }}
                      />
                    </div>
                  </div>
                  <div className="border-t border-gray-100 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Lock size={11} className="text-[var(--st-text-3)]" />
                      <span className="text-[10px] text-[var(--st-text-3)] font-medium">{strings.encrypted}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Zap size={11} className="text-[var(--st-text-3)]" />
                      <span className="text-[10px] text-[var(--st-text-3)] font-medium">{qrSizeInfo}</span>
                    </div>
                  </div>
                </div>

                {/* Frame navigation + countdown */}
                {qrChunks.length > 1 && (
                  <div className="flex items-center justify-between w-full gap-2">
                    <button
                      onClick={() => {
                        setAutoAdvance(false)
                        setQrIndex(Math.max(0, qrIndex - 1))
                      }}
                      disabled={qrIndex === 0}
                      className="px-3 py-1.5 rounded-lg border border-[var(--st-border)] bg-[var(--st-surface-2)] text-[var(--st-text-2)] text-xs font-semibold disabled:opacity-30 transition-colors"
                    >
                      ← {lang === 'bn' ? 'আগে' : 'Prev'}
                    </button>

                    <div className="flex items-center gap-2">
                      {/* Frame dots */}
                      <div className="flex items-center gap-1">
                        {Array.from({ length: qrChunks.length }, (_, i) => (
                          <button
                            key={i}
                            onClick={() => { setAutoAdvance(false); setQrIndex(i) }}
                            className={`w-2 h-2 rounded-full transition-all ${
                              i === qrIndex
                                ? 'bg-[var(--st-accent)] w-4'
                                : 'bg-[var(--st-border-strong)] hover:bg-[var(--st-text-3)]'
                            }`}
                          />
                        ))}
                      </div>
                      {/* Countdown badge */}
                      {autoAdvance && (
                        <span className="text-[10px] text-[var(--st-text-3)] font-mono min-w-[48px] text-right">
                          {strings.nextIn(countdown)}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        setAutoAdvance(false)
                        setQrIndex(Math.min(qrChunks.length - 1, qrIndex + 1))
                      }}
                      disabled={qrIndex >= qrChunks.length - 1}
                      className="px-3 py-1.5 rounded-lg border border-[var(--st-border)] bg-[var(--st-surface-2)] text-[var(--st-text-2)] text-xs font-semibold disabled:opacity-30 transition-colors"
                    >
                      {lang === 'bn' ? 'পর' : 'Next'} →
                    </button>
                  </div>
                )}

                {/* Frame number */}
                {qrChunks.length > 1 && (
                  <div className="text-[10px] text-[var(--st-text-3)] font-semibold">
                    {strings.frame(qrIndex + 1, qrChunks.length)}
                  </div>
                )}

                <p className="text-[10px] text-[var(--st-text-3)] text-center px-4">
                  <Smartphone size={10} className="inline mr-1" />
                  {strings.qrHint}
                </p>
              </div>
            )}

            {sendStage === 'ready' && !qrDataUrl && (
              <div className="flex flex-col items-center gap-4 py-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--st-accent-bg)] text-[var(--st-accent)]">
                  <Loader2 size={22} className="animate-spin" />
                </div>
                <p className="text-sm text-[var(--st-text-2)]">{strings.generating}</p>
              </div>
            )}

            {sendStage === 'complete' && (
              <div className="flex flex-col items-center gap-4 py-8">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--st-success-bg)] text-[var(--st-success)]">
                  <CheckCircle2 size={28} />
                </div>
                <p className="text-sm font-bold text-[var(--st-success)]">{strings.doneMsg}</p>
              </div>
            )}

            <button onClick={goBack} className="mo-submit mo-submit--cancel">{strings.cancel}</button>
          </div>
        )}

        {/* ═══ SEND: WEBRTC ═══ */}
        {step === 'send-webrtc' && (
          <div className="space-y-4">
            {/* WebRTC header */}
            <div className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-2.5 text-xs border border-blue-200/30">
              <Signal size={14} className="text-blue-500 shrink-0" />
              <span className="font-semibold text-[var(--st-text-1)]">
                {lang === 'bn' ? 'ফাস্ট ট্রান্সফার — WebRTC' : 'Fast Transfer — WebRTC'}
              </span>
            </div>

            {/* State machine */}
            {webrtcState === 'creating-peer' && (
              <div className="flex flex-col items-center gap-4 py-8">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-blue-500">
                  <Loader2 size={26} className="animate-spin" />
                </div>
                <p className="text-sm font-semibold text-[var(--st-text-2)]">{strings.creatingPeer}</p>
              </div>
            )}

            {webrtcState === 'waiting-connection' && webrtcQRDataUrl && (
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_6px_rgba(59,130,246,0.6)]" />
                  <span className="text-xs font-semibold text-blue-500">{strings.waitingConnection}</span>
                </div>

                {/* QR Code Card */}
                <div className="rounded-2xl bg-white shadow-lg border border-gray-100 overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-center justify-center">
                      <img
                        src={webrtcQRDataUrl}
                        alt="WebRTC Handshake QR"
                        className="w-[340px] h-[340px]"
                        style={{ imageRendering: 'pixelated' }}
                      />
                    </div>
                  </div>
                  <div className="border-t border-gray-100 px-4 py-3 flex items-center justify-center">
                    <div className="flex items-center gap-1.5">
                      <Radio size={11} className="text-[var(--st-text-3)]" />
                      <span className="text-[10px] text-[var(--st-text-3)] font-medium">
                        {webrtcQRPayload && strings.webrtcScanInfo(webrtcQRPayload.deviceName)}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-[10px] text-[var(--st-text-3)] text-center px-4">
                  <Smartphone size={10} className="inline mr-1" />
                  {lang === 'bn'
                    ? 'অন্য ডিভাইসে "Fast Transfer → Scan" সিলেক্ট করে এই QR স্ক্যান করুন'
                    : 'On the other device, select "Fast Transfer" and scan this QR code'}
                </p>
              </div>
            )}

            {webrtcState === 'connected' && (
              <div className="flex flex-col items-center gap-4 py-8">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-500">
                  <Wifi size={26} />
                </div>
                <p className="text-sm font-bold text-emerald-500">{strings.connected}</p>
                {webrtcProgress && (
                  <p className="text-xs text-[var(--st-text-3)]">{strings.webrtcProgress(webrtcProgress)}</p>
                )}
              </div>
            )}

            {webrtcState === 'sending' && webrtcProgress && (
              <div className="flex flex-col items-center gap-4 py-8">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/20 text-blue-500">
                  <Loader2 size={26} className="animate-spin" />
                </div>
                <p className="text-sm font-semibold text-[var(--st-text-2)]">{strings.sending}</p>
                {/* Progress bar */}
                <div className="w-full max-w-[250px]">
                  <div className="flex justify-between text-xs text-[var(--st-text-3)] mb-1">
                    <span>{strings.webrtcProgress(webrtcProgress)}</span>
                    <span>{webrtcProgress.received}/{webrtcProgress.total} {lang === 'bn' ? 'খণ্ড' : 'chunks'}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[var(--st-border)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                      style={{ width: `${Math.min(100, (webrtcProgress.bytesTransferred / webrtcProgress.bytesTotal) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {webrtcState === 'complete' && (
              <div className="flex flex-col items-center gap-4 py-8">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-500">
                  <CheckCircle2 size={28} />
                </div>
                <p className="text-sm font-bold text-emerald-500">{strings.webrtcDone}</p>
              </div>
            )}

            {webrtcState === 'failed' && (
              <div className="flex flex-col items-center gap-4 py-8">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/20 text-red-500">
                  <XCircle size={28} />
                </div>
                <p className="text-sm font-semibold text-[var(--st-danger)]">{error || strings.webrtcFailed}</p>
                <div className="flex gap-2">
                  <button onClick={() => handleWebRTCSend()} className="px-4 py-2 rounded-xl bg-[var(--st-accent)] text-white text-xs font-semibold hover:brightness-110">
                    <RefreshCw size={12} className="inline mr-1" />{lang === 'bn' ? 'পুনরায় চেষ্টা' : 'Retry'}
                  </button>
                  <button onClick={goBack} className="px-4 py-2 rounded-xl border border-[var(--st-border)] text-[var(--st-text-2)] text-xs font-semibold">
                    {strings.webrtcFallback}
                  </button>
                </div>
              </div>
            )}

            {webrtcState === 'idle' && (
              <button onClick={handleWebRTCSend} className="mo-submit mo-submit--neu flex items-center justify-center gap-2">
                <Signal size={16} /> {lang === 'bn' ? 'ফাস্ট ট্রান্সফার শুরু করুন' : 'Start Fast Transfer'}
              </button>
            )}

            {(webrtcState === 'creating-peer' || webrtcState === 'waiting-connection') && (
              <button onClick={goBack} className="mo-submit mo-submit--cancel">{strings.cancel}</button>
            )}
          </div>
        )}

        {/* ═══ RECEIVE: QR SCAN ═══ */}
        {step === 'receive-scan' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[var(--st-accent-bg)] to-[var(--st-success-bg)] p-2.5 text-xs">
              <Shield size={14} className="text-[var(--st-accent)] shrink-0" />
              <span className="font-semibold text-[var(--st-text-1)]">AES-256-GCM · {lang === 'bn' ? 'এন্ড-টু-এন্ড এনক্রিপ্টেড' : 'End-to-End Encrypted'}</span>
            </div>

            <div
              className={`relative aspect-[3/4] w-full overflow-hidden rounded-2xl border-2 bg-black flex items-center justify-center transition-all duration-300 ${
                detectedFlash
                  ? 'border-emerald-400 shadow-[0_0_30px_rgba(52,211,153,0.5)]'
                  : 'border-[var(--st-border-strong)]'
              }`}
            >
              <video ref={videoRef} className="h-full w-full object-cover" autoPlay muted playsInline />

              {scanPhase === 'starting' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-10">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white mb-3">
                    <Camera size={22} className="animate-pulse" />
                  </div>
                  <p className="text-sm text-white/90 font-semibold">{strings.cameraStarting}</p>
                  <p className="text-xs text-white/60 mt-1 text-center px-5">
                    {cameraPermission === 'checking' || cameraPermission === 'prompt'
                      ? strings.cameraPermissionBody
                      : strings.pointCamera}
                  </p>
                </div>
              )}

              {scanPhase === 'failed' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm z-10">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/20 text-red-400 mb-3">
                    <CameraOff size={22} />
                  </div>
                  <p className="text-sm text-red-400 font-semibold">{cameraPermission === 'denied' ? strings.cameraPermissionTitle : strings.cameraError}</p>
                  <p className="mt-1 max-w-[280px] px-4 text-center text-xs leading-relaxed text-white/65">
                    {cameraPermission === 'denied' ? strings.cameraDeniedBody : (error || strings.cameraPermissionBody)}
                  </p>
                  <button
                    onClick={() => {
                      stopScanner()
                      cameraStartedRef.current = false
                      setScanPhase('starting')
                      setError('')
                      startCamera().catch((err) => {
                        setScanPhase('failed')
                        setError(cameraErrorMessage(err))
                      })
                    }}
                    className="mt-3 px-4 py-2 rounded-lg bg-white/10 text-white text-xs font-semibold hover:bg-white/20 transition-colors"
                  >
                    {strings.tryAgain}
                  </button>
                </div>
              )}

              {scanPhase === 'done' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm z-10">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 mb-2">
                    <CheckCircle2 size={28} />
                  </div>
                  <p className="text-sm text-white font-semibold">{strings.syncReady}</p>
                </div>
              )}

              {scanPhase === 'transferring' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm z-10">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white mb-3">
                    <Loader2 size={22} className="animate-spin" />
                  </div>
                  <p className="text-sm text-white/90 font-semibold">{strings.decrypting}</p>
                </div>
              )}

              {(scanPhase === 'scanning' || scanPhase === 'detected') && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="relative h-[65%] w-[80%] max-w-[300px] rounded-2xl border-2 border-white/60 shadow-[0_0_0_999px_rgba(0,0,0,0.45)] transition-all duration-300">
                    <div className={`absolute left-3 right-3 h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_14px_rgba(52,211,153,0.8)] transition-all duration-300 ${
                      scanPhase === 'detected' ? 'top-1/2 opacity-0' : 'top-1/2 animate-pulse'
                    }`} />
                    <div className="absolute -top-[2px] -left-[2px] w-8 h-8 rounded-tl-[18px] border-l-[3px] border-t-[3px] border-emerald-400" />
                    <div className="absolute -top-[2px] -right-[2px] w-8 h-8 rounded-tr-[18px] border-r-[3px] border-t-[3px] border-emerald-400" />
                    <div className="absolute -bottom-[2px] -left-[2px] w-8 h-8 rounded-bl-[18px] border-l-[3px] border-b-[3px] border-emerald-400" />
                    <div className="absolute -bottom-[2px] -right-[2px] w-8 h-8 rounded-br-[18px] border-r-[3px] border-b-[3px] border-emerald-400" />
                  </div>
                </div>
              )}

              {scanPhase === 'detected' && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20">
                  <div className="flex items-center gap-1.5 bg-emerald-500/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg animate-[bounce_0.3s_ease-out]">
                    <CheckCircle2 size={12} />
                    {strings.qrDetected}
                  </div>
                </div>
              )}

              {scanStatus && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20">
                  <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full">
                    <div className="flex gap-1">
                      {Array.from({ length: scanStatus.total }, (_, i) => (
                        <div
                          key={i}
                          className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                            i < scanStatus.received ? 'bg-emerald-400 scale-110' : 'bg-white/30'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="font-semibold">{strings.framesReceived(scanStatus.received, scanStatus.total)}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-xl bg-[var(--st-surface-2)] px-3 py-2.5 text-center transition-all duration-300">
              {scanPhase === 'starting' && (
                <div className="flex items-center justify-center gap-2 text-xs font-semibold text-[var(--st-text-2)]">
                  <Loader2 size={12} className="animate-spin" />
                  {strings.cameraStarting}
                </div>
              )}
              {scanPhase === 'scanning' && (
                <div className="flex items-center justify-center gap-2 text-xs font-semibold text-emerald-500">
                  <CircleDot size={12} className="animate-pulse" />
                  {strings.pointCamera}
                </div>
              )}
              {scanPhase === 'detected' && (
                <div className="flex items-center justify-center gap-2 text-xs font-semibold text-emerald-500 animate-[pulse_0.5s_ease-in-out]">
                  <CheckCircle2 size={12} />
                  {strings.qrDetected}
                </div>
              )}
              {scanPhase === 'transferring' && (
                <div className="flex items-center justify-center gap-2 text-xs font-semibold text-[var(--st-accent)]">
                  <Loader2 size={12} className="animate-spin" />
                  {strings.decrypting}
                </div>
              )}
              {scanPhase === 'done' && (
                <div className="flex items-center justify-center gap-2 text-xs font-semibold text-emerald-500">
                  <CheckCircle2 size={12} />
                  {strings.dataReady}
                </div>
              )}
              {scanPhase === 'failed' && (
                <span className="text-xs font-semibold text-[var(--st-danger)]">
                  {strings.cameraError}
                </span>
              )}
            </div>

            {/* Cancel button */}
            {scanPhase !== 'starting' && scanPhase !== 'transferring' && (
              <button onClick={goBack} className="mo-submit mo-submit--cancel">{strings.cancel}</button>
            )}
          </div>
        )}

        {/* ═══ RECEIVE: WEBRTC ═══ */}
        {step === 'receive-webrtc' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-2.5 text-xs border border-blue-200/30">
              <Signal size={14} className="text-blue-500 shrink-0" />
              <span className="font-semibold text-[var(--st-text-1)]">
                {lang === 'bn' ? 'ফাস্ট ট্রান্সফার — সংযোগ হচ্ছে' : 'Fast Transfer — Connecting'}
              </span>
            </div>

            {webrtcState === 'creating-peer' && (
              <div className="flex flex-col items-center gap-4 py-8">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-blue-500">
                  <Loader2 size={26} className="animate-spin" />
                </div>
                <p className="text-sm font-semibold text-[var(--st-text-2)]">{strings.creatingPeer}</p>
              </div>
            )}

            {webrtcState === 'connecting' && (
              <div className="flex flex-col items-center gap-4 py-8">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/20 text-blue-500">
                  <Wifi size={26} className="animate-pulse" />
                </div>
                <p className="text-sm font-semibold text-[var(--st-text-2)]">{strings.connecting}</p>
              </div>
            )}

            {webrtcState === 'connected' && (
              <div className="flex flex-col items-center gap-4 py-8">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-500">
                  <CheckCircle2 size={26} />
                </div>
                <p className="text-sm font-bold text-emerald-500">{strings.connected}</p>
              </div>
            )}

            {webrtcState === 'receiving' && webrtcProgress && (
              <div className="flex flex-col items-center gap-4 py-8">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/20 text-blue-500">
                  <Loader2 size={26} className="animate-spin" />
                </div>
                <p className="text-sm font-semibold text-[var(--st-text-2)]">{strings.receiving}</p>
                <div className="w-full max-w-[250px]">
                  <div className="flex justify-between text-xs text-[var(--st-text-3)] mb-1">
                    <span>{strings.webrtcProgress(webrtcProgress)}</span>
                    <span>{webrtcProgress.received}/{webrtcProgress.total} {lang === 'bn' ? 'খণ্ড' : 'chunks'}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[var(--st-border)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                      style={{ width: `${Math.min(100, (webrtcProgress.bytesTransferred / webrtcProgress.bytesTotal) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {webrtcState === 'complete' && (
              <div className="flex flex-col items-center gap-4 py-8">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-500">
                  <CheckCircle2 size={28} />
                </div>
                <p className="text-sm font-bold text-emerald-500">{strings.webrtcDone}</p>
              </div>
            )}

            {webrtcState === 'failed' && (
              <div className="flex flex-col items-center gap-4 py-8">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/20 text-red-500">
                  <XCircle size={28} />
                </div>
                <p className="text-sm font-semibold text-[var(--st-danger)]">{error || strings.webrtcFailed}</p>
                <div className="flex gap-2">
                  <button onClick={goBack} className="px-4 py-2 rounded-xl border border-[var(--st-border)] text-[var(--st-text-2)] text-xs font-semibold">
                    {strings.webrtcFallback}
                  </button>
                </div>
              </div>
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
        {step !== 'landing' && step !== 'receive-done' && step !== 'receive-merging' && step !== 'receive-scan' && step !== 'receive-webrtc' && (
          <button onClick={goBack} className="mo-submit mo-submit--cancel flex items-center justify-center gap-2">
            <ArrowLeft size={16} />{strings.cancel}
          </button>
        )}
        {/* Cancel for receive-webrtc */}
        {step === 'receive-webrtc' && webrtcState !== 'receiving' && webrtcState !== 'complete' && (
          <button onClick={goBack} className="mo-submit mo-submit--cancel">{strings.cancel}</button>
        )}
      </div>
    </Modal>
  )
}

// ─── Helpers ───

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

function safeParseWebRTCHandshake(text: string): { peerId: string; deviceName?: string; appVersion?: string; protocolVersion?: number } | null {
  try {
    const parsed = JSON.parse(text) as { type?: string; peerId?: string; deviceName?: string; appVersion?: string; protocolVersion?: number }
    if (parsed.type !== 'webrtc-handshake' || typeof parsed.peerId !== 'string') return null
    if (parsed.peerId.length < 8 || parsed.peerId.length > 128) return null
    if (parsed.protocolVersion && parsed.protocolVersion > 2) return null
    return {
      peerId: parsed.peerId,
      deviceName: parsed.deviceName,
      appVersion: parsed.appVersion,
      protocolVersion: parsed.protocolVersion,
    }
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

function waitForVideoPlayback(video: HTMLVideoElement, timeoutMs = 2500): Promise<void> {
  const started = Date.now()
  return new Promise((resolve, reject) => {
    const tick = () => {
      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.videoWidth > 0) {
        resolve()
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
  const constraintOptions: MediaStreamConstraints[] = [
    {
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    },
    { video: { facingMode: 'environment' }, audio: false },
  ]

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await reader.decodeFromConstraints(constraintOptions[attempt] ?? constraintOptions[constraintOptions.length - 1], video, (result) => {
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
    return 'Camera permission denied. Allow camera access from settings, then try again.'
  }
  if (name === 'NotFoundError' || name === 'OverconstrainedError') {
    return 'No usable camera was found. Try again or check device camera settings.'
  }
  if (name === 'NotReadableError') {
    return 'Camera is busy in another app. Close other camera apps and retry.'
  }
  return error instanceof Error ? error.message : 'Camera access failed. Please retry.'
}

async function ensureCameraPermission(onState: (state: CameraPermissionState) => void): Promise<void> {
  try {
    const permissions = navigator.permissions as Permissions | undefined
    const query = permissions?.query?.bind(permissions)
    if (query) {
      try {
        const status = await query({ name: 'camera' as PermissionName })
        if (status.state === 'granted') {
          onState('granted')
          return
        }
        if (status.state === 'denied') {
          onState('denied')
          throw new DOMException('Camera permission denied.', 'NotAllowedError')
        }
        onState('prompt')
      } catch {
        onState('prompt')
      }
    } else {
      onState('prompt')
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' } },
      audio: false,
    })
    stream.getTracks().forEach((track) => track.stop())
    onState('granted')
  } catch (error) {
    onState('denied')
    throw error
  }
}
