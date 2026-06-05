// src/app/(tabs)/settings/page.tsx
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Sun, Moon, Monitor, Globe, Lock, Download,
  Upload, Trash2, ChevronRight, Check, Shield,
  Info, Palette, Bell, Eye, EyeOff, X, ExternalLink
} from 'lucide-react'
import { useSettingsStore, type Theme, type Language } from '@/features/settings/store/settingsStore'
import { usePrefsStore } from '@/features/namaz/store/prefsStore'
import { useNamazStore } from '@/features/namaz/store/namazStore'
import { useTaskStore } from '@/lib/store/taskStore'
import { useMoneyStore } from '@/features/money/store/moneyStore'
import { NAMAZ_STORAGE_KEYS } from '@/features/namaz/constants/storageKeys'
import {
  buildBackupPayload,
  decryptBackup,
  encryptBackup,
  mergeBackupPayload,
  parseEncryptedBackup,
  serializeEncryptedBackup,
} from '@/lib/utils/encryptedBackup'
import QRCode from 'qrcode'
import type { BrowserQRCodeReader, IScannerControls } from '@zxing/browser'
import '@/features/settings/settings.css'
import { getBiometricStatus } from '@/features/settings/utils/biometricAuth'
import { hashPin } from '@/features/settings/utils/security'
import CloudSyncCard from '@/components/settings/CloudSyncCard'
import BackupManagerDialog from '@/components/settings/BackupManagerDialog'
import { requestAppNotificationPermission } from '@/lib/native/notifications'

const PRIVACY_URL = "https://ahmed-jishan.github.io/selfsync-privacy/";

// ==================== Translations ====================
const translations = {
  bn: {
    customize: 'কাস্টমাইজ করুন',
    settings: 'সেটিংস',
    sub: 'অ্যাপের পছন্দ ও ডেটা নিয়ন্ত্রণ করুন',
    theme: 'থিম',
    themeLight: 'আলো',
    themeDark: 'অন্ধকার',
    themeSystem: 'সিস্টেম',
    langCurrency: 'ভাষা ও মুদ্রা',
    language: 'ভাষা',
    bnLabel: 'বাংলা',
    enLabel: 'English',
    currency: 'মুদ্রা',
    bdtLabel: '৳ BDT',
    usdLabel: '$ USD',
    notifications: 'নোটিফিকেশন',
    appNotifications: 'অ্যাপ নোটিফিকেশন',
    appNotificationsSub: 'টাস্ক ও মানি অ্যালার্ট দেখাবে',
    namazReminder: 'নামাজের রিমাইন্ডার',
    namazSub: 'সময় হলে জানাবে',
    taskAlerts: 'টাস্ক রিমাইন্ডার',
    taskAlertsSub: 'ডেডলাইন হলে জানাবে',
    moneyAlerts: 'মানি অ্যালার্ট',
    moneyAlertsSub: 'বাজেট, লোন, সাবস্ক্রিপশন',
    quietHours: 'কুইয়েট আওয়ার্স',
    quietHoursSub: 'এই সময়ে নোটিফিকেশন নীরব থাকবে',
    quietStart: 'শুরু',
    quietEnd: 'শেষ',
    calculatorToggle: 'ফ্লোটিং ক্যালকুলেটর',
    calculatorSub: 'স্ক্রিনে ক্যালকুলেটর আইকন দেখাবে',
    security: 'নিরাপত্তা',
    pinLock: 'PIN লক',
    pinActive: 'সক্রিয় আছে ✓',
    pinInactive: 'নিষ্ক্রিয়',
    biometricLock: 'Fingerprint lock',
    biometricActive: 'Phone biometric ready',
    biometricInactive: 'Use fingerprint / phone lock',
    biometricNeedsPin: 'Fingerprint er jonno age PIN set korun',
    biometricUnavailable: 'Native biometric APK install korle check hobe',
    toastBiometricOn: 'Fingerprint lock on hoyeche',
    toastBiometricOff: 'Fingerprint lock off hoyeche',
    autoLock: 'অটো লক',
    autoLockSub: 'নির্দিষ্ট সময় নিষ্ক্রিয় থাকলে লক হবে',
    dataManage: 'ডেটা ব্যবস্থাপনা',
    backup: 'ব্যাকআপ করুন',
    backupSub: 'JSON ফাইলে সংরক্ষণ করুন',
    exportCsv: 'CSV এক্সপোর্ট',
    exportCsvSub: 'টাস্ক ও মানি ডেটা বের করুন',
    restore: 'ডেটা পুনরুদ্ধার করুন',
    restoreSub: 'JSON ফাইল থেকে লোড করুন',
    clearData: 'সব ডেটা মুছুন',
    clearSub: 'স্থায়ীভাবে সরিয়ে ফেলবে',
    about: 'অ্যাপ সম্পর্কে',
    privacyPolicy: 'Privacy Policy',
    privacyPolicySub: 'Open app privacy details',
    version: 'সংস্করণ ১.০.০ · লোকাল-ফার্স্ট',
    storageUsed: 'স্টোরেজ ব্যবহার',
    dataSummary: 'ডেটা সারাংশ',
    localNote: 'সমস্ত ডেটা শুধু আপনার ডিভাইসে সংরক্ষিত। কোনো সার্ভারে পাঠানো হয় না।',
    backupSync: 'এনক্রিপ্টেড ব্যাকআপ ও সিঙ্ক',
    backupSyncSub: 'QR ভিত্তিক এনক্রিপ্টেড ট্রান্সফার',
    backupSyncTitle: 'এনক্রিপ্টেড ব্যাকআপ ও সিঙ্ক',
    backupPassphrase: 'পাসফ্রেজ',
    backupPassphraseConfirm: 'পাসফ্রেজ নিশ্চিত করুন',
    backupPassphraseHint: 'কমপক্ষে ৮ অক্ষর দিন',
    backupExport: 'এনক্রিপ্টেড ব্যাকআপ ডাউনলোড',
    backupImport: 'এনক্রিপ্টেড ব্যাকআপ ইম্পোর্ট',
    backupImportHint: 'JSON ব্যাকআপ ফাইল নির্বাচন করুন',
    backupExported: 'এনক্রিপ্টেড ব্যাকআপ ডাউনলোড হয়েছে ✓',
    backupMergeSuccess: 'ব্যাকআপ মর্জ হয়েছে ✓',
    backupDecryptError: 'ডিক্রিপ্ট করতে সমস্যা হয়েছে',
    backupPassMismatch: 'পাসফ্রেজ মেলেনি',
    backupDrive: 'গুগল ড্রাইভ (শিগগিরই)',
    driveConnect: 'ড্রাইভ কানেক্ট করুন',
    driveConnected: 'ড্রাইভ কানেক্টেড',
    driveUpload: 'ড্রাইভে আপলোড',
    driveDownload: 'ড্রাইভ থেকে রিস্টোর',
    driveMissing: 'ড্রাইভ সংযুক্ত নেই',
    backupQrTitle: 'QR ট্রান্সফার',
    backupQrGenerate: 'QR তৈরি করুন',
    backupQrScan: 'QR স্ক্যান করুন',
    backupQrNext: 'পরের',
    backupQrPrev: 'আগের',
    backupQrProgress: 'QR অগ্রগতি',
    backupQrReady: 'স্ক্যান শেষ। ইম্পোর্ট করতে ডিক্রিপ্ট করুন',
    backupQrStop: 'স্ক্যান বন্ধ করুন',
    backupTitle: 'ব্যাকআপ করুন',
    backupBody: 'সমস্ত ডেটা একটি JSON ফাইলে সংরক্ষিত হবে।',
    backupIncludes: 'যা যা সংরক্ষিত হবে',
    exportTitle: 'CSV এক্সপোর্ট',
    exportTasks: 'টাস্ক CSV ডাউনলোড',
    exportMoney: 'মানি CSV ডাউনলোড',
    backupConfirm: 'ডাউনলোড করুন',
    restoreTitle: 'ডেটা পুনরুদ্ধার করুন',
    restoreBody: 'ব্যাকআপ JSON ফাইল নির্বাচন করুন',
    restoreSelect: 'ফাইল নির্বাচন করুন',
    restoreWarn: '⚠ বিদ্যমান ডেটা প্রতিস্থাপিত হবে',
    clearTitle: 'সব ডেটা মুছুন?',
    clearBody: 'এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না। সমস্ত লেনদেন, ধার, এবং নামাজের রেকর্ড মুছে যাবে।',
    clearConfirm: 'মুছে ফেলুন',
    cancel: 'বাতিল করুন',
    pinSetupTitle: 'PIN সেট করুন',
    pinEnter: 'নতুন PIN দিন (কমপক্ষে ৪ সংখ্যা)',
    pinConfirm: 'আবার PIN দিন (নিশ্চিত করুন)',
    pinNext: 'পরবর্তী',
    pinSave: 'সংরক্ষণ করুন',
    pinDisableTitle: 'PIN বন্ধ করুন',
    pinDisableConfirm: 'বর্তমান PIN দিন',
    pinDisableBtn: 'PIN বন্ধ করুন',
    pinErrorShort: 'কমপক্ষে ৪ সংখ্যা দিন',
    pinErrorMismatch: 'PIN মেলেনি',
    pinErrorWrong: 'ভুল PIN',
    toastBackup: 'ব্যাকআপ সংরক্ষিত হয়েছে ✓',
    toastPinSet: 'PIN সেট হয়েছে ✓',
    toastPinRemoved: 'PIN মুছে ফেলা হয়েছে',
    toastDataCleared: 'সব ডেটা মুছে ফেলা হয়েছে',
    toastRestore: 'ডেটা পুনরুদ্ধার হয়েছে। রিফ্রেশ করুন।',
    toastRestoreError: 'ফাইল পড়তে সমস্যা হয়েছে',
    toastNotifBlocked: 'ব্রাউজার নোটিফিকেশন অনুমতি দেয়নি',
  },
  en: {
    customize: 'Customize',
    settings: 'Settings',
    sub: 'Control app preferences & data',
    theme: 'Theme',
    themeLight: 'Light',
    themeDark: 'Dark',
    themeSystem: 'System',
    langCurrency: 'Language & Currency',
    language: 'Language',
    bnLabel: 'বাংলা',
    enLabel: 'English',
    currency: 'Currency',
    bdtLabel: '৳ BDT',
    usdLabel: '$ USD',
    notifications: 'Notifications',
    appNotifications: 'App notifications',
    appNotificationsSub: 'Task & money alerts',
    namazReminder: 'Prayer Reminders',
    namazSub: 'Notify at prayer times',
    taskAlerts: 'Task reminders',
    taskAlertsSub: 'Notify when tasks are due',
    moneyAlerts: 'Money alerts',
    moneyAlertsSub: 'Budget, loans, subscriptions',
    quietHours: 'Quiet hours',
    quietHoursSub: 'Silence notifications during this window',
    quietStart: 'Start',
    quietEnd: 'End',
    calculatorToggle: 'Floating Calculator',
    calculatorSub: 'Show calculator icon on screen',
    security: 'Security',
    pinLock: 'PIN Lock',
    pinActive: 'Active ✓',
    pinInactive: 'Disabled',
    biometricLock: 'Fingerprint lock',
    biometricActive: 'Phone biometric ready',
    biometricInactive: 'Use fingerprint / phone lock',
    biometricNeedsPin: 'Set a PIN first to keep fallback unlock available',
    biometricUnavailable: 'Native biometric can only be checked inside the installed app',
    toastBiometricOn: 'Fingerprint lock enabled',
    toastBiometricOff: 'Fingerprint lock disabled',
    autoLock: 'Auto lock',
    autoLockSub: 'Lock after inactivity',
    dataManage: 'Data Management',
    backup: 'Backup',
    backupSub: 'Save to JSON file',
    exportCsv: 'Export CSV',
    exportCsvSub: 'Download tasks & money data',
    restore: 'Restore Data',
    restoreSub: 'Load from JSON file',
    clearData: 'Clear All Data',
    clearSub: 'Permanently remove',
    about: 'About',
    privacyPolicy: 'Privacy Policy',
    privacyPolicySub: 'Open app privacy details',
    version: 'Version 1.0.0 · Local-first',
    storageUsed: 'Storage used',
    dataSummary: 'Data summary',
    localNote: 'All data is stored only on your device. No data is sent to any server.',
    backupSync: 'Encrypted Backup & Sync',
    backupSyncSub: 'Optional, QR-based encrypted transfer',
    backupSyncTitle: 'Encrypted Backup & Sync',
    backupPassphrase: 'Passphrase',
    backupPassphraseConfirm: 'Confirm passphrase',
    backupPassphraseHint: 'Use at least 8 characters',
    backupExport: 'Download encrypted backup',
    backupImport: 'Import encrypted backup',
    backupImportHint: 'Select encrypted JSON backup',
    backupExported: 'Encrypted backup downloaded ✓',
    backupMergeSuccess: 'Backup merged ✓',
    backupDecryptError: 'Failed to decrypt backup',
    backupPassMismatch: 'Passphrases do not match',
    backupDrive: 'Google Drive',
    driveConnect: 'Connect Drive',
    driveConnected: 'Drive connected',
    driveUpload: 'Upload to Drive',
    driveDownload: 'Restore from Drive',
    driveMissing: 'Drive is not connected',
    backupQrTitle: 'QR Transfer',
    backupQrGenerate: 'Generate QR',
    backupQrScan: 'Scan QR',
    backupQrNext: 'Next',
    backupQrPrev: 'Previous',
    backupQrProgress: 'QR progress',
    backupQrReady: 'Scan complete. Decrypt to import',
    backupQrStop: 'Stop scanning',
    backupTitle: 'Backup',
    backupBody: 'All data will be saved as a JSON file.',
    backupIncludes: 'What will be included',
    exportTitle: 'Export CSV',
    exportTasks: 'Download tasks CSV',
    exportMoney: 'Download money CSV',
    backupConfirm: 'Download',
    restoreTitle: 'Restore Data',
    restoreBody: 'Select a backup JSON file',
    restoreSelect: 'Select file',
    restoreWarn: '⚠ Existing data will be replaced',
    clearTitle: 'Clear all data?',
    clearBody: 'This action cannot be undone. All transactions, loans, and prayer records will be lost.',
    clearConfirm: 'Delete',
    cancel: 'Cancel',
    pinSetupTitle: 'Set PIN',
    pinEnter: 'Enter new PIN (at least 4 digits)',
    pinConfirm: 'Confirm PIN',
    pinNext: 'Next',
    pinSave: 'Save',
    pinDisableTitle: 'Disable PIN',
    pinDisableConfirm: 'Enter current PIN',
    pinDisableBtn: 'Disable PIN',
    pinErrorShort: 'At least 4 digits required',
    pinErrorMismatch: 'PINs do not match',
    pinErrorWrong: 'Wrong PIN',
    toastBackup: 'Backup saved ✓',
    toastPinSet: 'PIN set ✓',
    toastPinRemoved: 'PIN removed',
    toastDataCleared: 'All data cleared',
    toastRestore: 'Data restored. Refresh the page.',
    toastRestoreError: 'Failed to read file',
    toastNotifBlocked: 'Browser notification permission denied',
  }
}

// ==================== Helper ====================
function getStorageSize(): string {
  let total = 0
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && (key.startsWith('selfsync') || key.startsWith('namaz') || key.startsWith('money_') || key.startsWith('amar'))) {
      total += (localStorage.getItem(key) || '').length
    }
  }
  const kb = (total / 1024).toFixed(1)
  return `${kb} KB`
}

const csvEscape = (value: string) => {
  if (value.includes('"') || value.includes(',') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

const buildCsv = (rows: string[][]) => rows.map((row) => row.map(csvEscape).join(',')).join('\n')

const downloadCsv = (filename: string, rows: string[][]) => {
  const blob = new Blob([buildCsv(rows)], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ==================== Main Page ====================
export default function SettingsPage() {
  const {
    language,
    theme,
    currency,
    currency_symbol,
    pinEnabled,
    pinHash,
    biometricLockEnabled,
    notificationsEnabled,
    calculatorEnabled,
    notificationCategories,
    quietHoursEnabled,
    quietHoursStart,
    quietHoursEnd,
    autoLockEnabled,
    autoLockMinutes,
    update
  } = useSettingsStore()

  const remindersEnabled = usePrefsStore((s) => s.remindersEnabled)
  const setReminderPrefs = usePrefsStore((s) => s.setReminderPrefs)

  const tasks = useTaskStore((s) => s.tasks)
  const transactions = useMoneyStore((s) => s.transactions)
  const loans = useMoneyStore((s) => s.loans)
  const budgets = useMoneyStore((s) => s.budgets)
  const savingsGoals = useMoneyStore((s) => s.savingsGoals)
  const subscriptions = useMoneyStore((s) => s.subscriptions)
  const namazRecords = useNamazStore((s) => s.records)

  const t = translations[language]

  const [showPinSetup, setShowPinSetup] = useState(false)
  const [showPinDisable, setShowPinDisable] = useState(false)
  const [enableBiometricAfterPin, setEnableBiometricAfterPin] = useState(false)
  const [biometricChecking, setBiometricChecking] = useState(false)
  const [showBackupModal, setShowBackupModal] = useState(false)
  const [showRestoreModal, setShowRestoreModal] = useState(false)
  const [showClearModal, setShowClearModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [showBackupSyncModal, setShowBackupSyncModal] = useState(false)
  const [showBackupManager, setShowBackupManager] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2800)
  }

  const handleBiometricToggle = async (next: boolean) => {
    if (!next) {
      update({ biometricLockEnabled: false })
      showToast(t.toastBiometricOff)
      return
    }

    if (!pinEnabled || !pinHash) {
      setEnableBiometricAfterPin(true)
      setShowPinSetup(true)
      showToast(t.biometricNeedsPin)
      return
    }

    setBiometricChecking(true)
    const status = await getBiometricStatus()
    setBiometricChecking(false)
    update({ biometricLockEnabled: true })
    showToast(status.available ? t.toastBiometricOn : t.biometricUnavailable)
  }

  const handleBackup = () => {
    const allKeys = [
      'money_transactions',
      'money_loans',
      'selfsync-tasks',
      'selfsync-namaz',
      'selfsync-settings',
      'selfsync-money-v2',
      NAMAZ_STORAGE_KEYS.settings,
    ]
    const backup: Record<string, any> = {
      _version: 1,
      _date: new Date().toISOString(),
      _status: {
        tasks: tasks.length,
        transactions: transactions.length,
        loans: loans.length,
        budgets: budgets.length,
        savingsGoals: savingsGoals.length,
        subscriptions: subscriptions.length,
        namazLogs: namazRecords.length,
      },
    }
    allKeys.forEach(k => {
      const v = localStorage.getItem(k)
      if (v) backup[k] = JSON.parse(v)
    })
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const now = new Date()
    const dateStr = `${now.getMonth() + 1}-${now.getDate()}-${now.getFullYear()}`
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
    const countStr = [
      tasks.length > 0 ? `task-${tasks.length}` : '',
      transactions.length > 0 ? `money-${transactions.length}` : '',
      loans.length > 0 ? `loan-${loans.length}` : '',
      budgets.length > 0 ? `budget-${budgets.length}` : '',
      savingsGoals.length > 0 ? `goal-${savingsGoals.length}` : '',
      subscriptions.length > 0 ? `sub-${subscriptions.length}` : '',
      namazRecords.length > 0 ? `namaz-${namazRecords.length}` : '',
    ].filter(Boolean).join('-')
    a.download = `selfsync-backup-${dateStr}-${timeStr}${countStr ? `-${countStr}` : ''}.json`
    a.click()
    URL.revokeObjectURL(url)
    showToast(t.toastBackup)
    setShowBackupModal(false)
  }

  const handleRestore = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        Object.keys(data).forEach(k => {
          if (!k.startsWith('_')) localStorage.setItem(k, JSON.stringify(data[k]))
        })
        showToast(t.toastRestore)
        setShowRestoreModal(false)
        setTimeout(() => window.location.reload(), 1000)
      } catch {
        showToast(t.toastRestoreError)
      }
    }
    reader.readAsText(file)
  }

  const handleClearData = () => {
    const keys = ['money_transactions', 'money_loans', 'selfsync-tasks', 'selfsync-namaz', 'selfsync-money-v2']
    keys.forEach(k => localStorage.removeItem(k))
    showToast(t.toastDataCleared)
    setShowClearModal(false)
  }

  const dataSummary = useMemo(() => {
    const taskCount = tasks.length
    const moneyCount = transactions.length + loans.length + budgets.length + savingsGoals.length + subscriptions.length
    const namazCount = namazRecords.length
    return language === 'bn'
      ? `টাস্ক ${taskCount} · মানি ${moneyCount} · নামাজ লগ ${namazCount}`
      : `Tasks ${taskCount} · Money ${moneyCount} · Namaz logs ${namazCount}`
  }, [budgets.length, language, loans.length, namazRecords.length, savingsGoals.length, subscriptions.length, tasks.length, transactions.length])

  const backupItems = useMemo(() => (
    [
      { label: language === 'bn' ? 'টাস্ক' : 'Tasks', value: tasks.length },
      { label: language === 'bn' ? 'ট্রান্স্যাকশন' : 'Transactions', value: transactions.length },
      { label: language === 'bn' ? 'লোন' : 'Loans', value: loans.length },
      { label: language === 'bn' ? 'বাজেট' : 'Budgets', value: budgets.length },
      { label: language === 'bn' ? 'সেভিংস গোল' : 'Goals', value: savingsGoals.length },
      { label: language === 'bn' ? 'সাবস্ক্রিপশন' : 'Subscriptions', value: subscriptions.length },
      { label: language === 'bn' ? 'নামাজ লগ' : 'Namaz logs', value: namazRecords.length },
    ]
  ), [budgets.length, language, loans.length, namazRecords.length, savingsGoals.length, subscriptions.length, tasks.length, transactions.length])

  const handleExportTasksCsv = () => {
    const rows: string[][] = [
      ['title', 'priority', 'status', 'completed', 'dueDate', 'createdAt', 'updatedAt'],
      ...tasks.map((task) => [
        task.title,
        task.priority,
        task.status,
        String(task.completed),
        task.dueDate || '',
        task.createdAt,
        task.updatedAt,
      ]),
    ]
    downloadCsv(`selfsync-tasks-${new Date().toISOString().split('T')[0]}.csv`, rows)
    setShowExportModal(false)
  }

  const handleExportMoneyCsv = () => {
    const rows: string[][] = [
      ['date', 'type', 'amount', 'category', 'note', 'walletId'],
      ...transactions.map((txn) => [
        txn.date,
        txn.type,
        String(txn.amount),
        txn.category,
        txn.note || '',
        txn.walletId || '',
      ]),
    ]
    downloadCsv(`selfsync-money-${new Date().toISOString().split('T')[0]}.csv`, rows)
    setShowExportModal(false)
  }

  const handlePrayerReminderToggle = async (next: boolean) => {
    if (!next) {
      setReminderPrefs(false)
      return
    }
    const permission = await requestAppNotificationPermission()
    if (permission !== 'granted') {
      showToast(t.toastNotifBlocked)
      return
    }
    setReminderPrefs(true)
  }

  return (
    <div className="st-root">
      <div className="st-header">
        <div className="st-header-bg" />
        <div className="st-header-inner">
          <p className="st-header-eyebrow">{t.customize}</p>
          <h1 className="st-header-title">{t.settings}</h1>
          <p className="st-header-sub">{t.sub}</p>
        </div>
      </div>

      <div className="st-body">
        {/* Theme */}
        <Section icon={<Palette size={15} />} title={t.theme}>
          <div className="st-theme-grid">
            {[
              { val: 'light' as Theme, icon: <Sun size={18} />, label: t.themeLight },
              { val: 'dark' as Theme,  icon: <Moon size={18} />, label: t.themeDark },
              { val: 'system' as Theme, icon: <Monitor size={18} />, label: t.themeSystem },
            ].map(({ val, icon, label }) => (
              <button
                key={val}
                className={`st-theme-btn ${theme === val ? 'st-theme-btn--on' : ''}`}
                onClick={() => update({ theme: val })}
              >
                <span className="st-theme-icon">{icon}</span>
                <span className="st-theme-label">{label}</span>
                {theme === val && <span className="st-theme-check"><Check size={10} /></span>}
              </button>
            ))}
          </div>
        </Section>

        {/* Language & Currency */}
        <Section icon={<Globe size={15} />} title={t.langCurrency}>
          <RowToggle
            label={t.language}
            left={t.bnLabel}
            right={t.enLabel}
            active={language === 'bn'}
            onLeft={() => update({ language: 'bn' })}
            onRight={() => update({ language: 'en' })}
          />
          <div className="st-divider" />
          <RowToggle
            label={t.currency}
            left={t.bdtLabel}
            right={t.usdLabel}
            active={currency === 'BDT'}
            onLeft={() => update({ currency: 'BDT', currency_symbol: '৳' })}
            onRight={() => update({ currency: 'USD', currency_symbol: '$' })}
          />
        </Section>

        {/* Notifications */}
        <Section icon={<Bell size={15} />} title={t.notifications}>
          <RowSwitch
            label={t.appNotifications}
            sub={t.appNotificationsSub}
            value={notificationsEnabled}
            onChange={v => update({ notificationsEnabled: v })}
          />
          <div className="st-divider" />
          <RowSwitch
            label={t.taskAlerts}
            sub={t.taskAlertsSub}
            value={notificationCategories.tasks}
            onChange={v => update({ notificationCategories: { ...notificationCategories, tasks: v } })}
          />
          <div className="st-divider" />
          <RowSwitch
            label={t.moneyAlerts}
            sub={t.moneyAlertsSub}
            value={notificationCategories.money}
            onChange={v => update({ notificationCategories: { ...notificationCategories, money: v } })}
          />
          <div className="st-divider" />
          <RowSwitch
            label={t.namazReminder}
            sub={t.namazSub}
            value={remindersEnabled}
            onChange={handlePrayerReminderToggle}
          />
          <div className="st-divider" />
          <RowSwitch
            label={t.quietHours}
            sub={t.quietHoursSub}
            value={quietHoursEnabled}
            onChange={v => update({ quietHoursEnabled: v })}
          />
          {quietHoursEnabled && (
            <div className="st-time-row">
              <div className="st-time-label">{t.quietStart}</div>
              <input
                className="st-time-input"
                type="time"
                value={quietHoursStart}
                onChange={(e) => update({ quietHoursStart: e.target.value })}
              />
              <div className="st-time-label">{t.quietEnd}</div>
              <input
                className="st-time-input"
                type="time"
                value={quietHoursEnd}
                onChange={(e) => update({ quietHoursEnd: e.target.value })}
              />
            </div>
          )}
          <div className="st-divider" />
          <RowSwitch
            label={t.calculatorToggle}
            sub={t.calculatorSub}
            value={calculatorEnabled}
            onChange={v => update({ calculatorEnabled: v })}
          />
        </Section>

        {/* Security */}
        <Section icon={<Shield size={15} />} title={t.security}>
          <RowArrow
            label={t.pinLock}
            sub={pinEnabled ? t.pinActive : t.pinInactive}
            accent={pinEnabled}
            onClick={() => pinEnabled ? setShowPinDisable(true) : setShowPinSetup(true)}
          />
          <div className="st-divider" />
          <RowSwitch
            label={t.biometricLock}
            sub={biometricChecking ? 'Checking...' : biometricLockEnabled ? t.biometricActive : t.biometricInactive}
            value={biometricLockEnabled}
            onChange={handleBiometricToggle}
          />
          <div className="st-divider" />
          <RowSwitch
            label={t.autoLock}
            sub={t.autoLockSub}
            value={autoLockEnabled}
            onChange={v => update({ autoLockEnabled: v })}
          />
          {autoLockEnabled && (
            <RowChoice
              label=""
              options={[5, 10, 15, 30]}
              value={autoLockMinutes}
              onChange={(value) => update({ autoLockMinutes: value })}
            />
          )}
        </Section>

        <CloudSyncCard />

        {/* Data Management */}
        <Section icon={<Download size={15} />} title={t.dataManage}>
          <RowArrow label={t.backupSync} sub={t.backupSyncSub} onClick={() => setShowBackupSyncModal(true)} />
          <div className="st-divider" />
          <RowArrow label={t.backup} sub={t.backupSub} onClick={() => setShowBackupModal(true)} />
          <div className="st-divider" />
          <RowArrow label={t.exportCsv} sub={t.exportCsvSub} onClick={() => setShowExportModal(true)} />
          <div className="st-divider" />
          <RowArrow label={t.restore} sub={t.restoreSub} onClick={() => setShowRestoreModal(true)} />
          <div className="st-divider" />
          <RowArrow label={t.clearData} sub={t.clearSub} danger onClick={() => setShowClearModal(true)} />
          <div className="st-divider" />
          <RowArrow
            label={language === 'bn' ? '💼 অ্যাডভান্সড ব্যাকআপ' : '💼 Advanced Backup'}
            sub={language === 'bn' ? 'ভ্যালিডেট, মার্জ, রিপ্লেস, স্ন্যাপশট' : 'Validate, Merge, Replace, Snapshot'}
            onClick={() => setShowBackupManager(true)}
          />
        </Section>

        {/* About */}
        <Section icon={<Info size={15} />} title={t.about}>
          <div className="st-about-card">
            <div className="st-about-logo">SS</div>
            <div>
              <p className="st-about-name">SelfSync</p>
              <p className="st-about-ver">{t.version}</p>
            </div>
          </div>
          <div className="st-divider" />
          <RowArrow label={t.storageUsed} sub={getStorageSize()} onClick={() => {}} noArrow />
          <div className="st-divider" />
          <RowArrow label={t.dataSummary} sub={dataSummary} onClick={() => {}} noArrow />
          <div className="st-divider" />
          <RowExternalLink label={t.privacyPolicy} sub={t.privacyPolicySub} href={PRIVACY_URL} />
          <div className="st-divider" />
          <div className="st-local-note">
            <Lock size={11} />
            {t.localNote}
          </div>
        </Section>

        <div style={{ height: 40 }} />
      </div>

      {/* Modals */}
      {showPinSetup && (
        <PinSetupModal
          language={language}
          onClose={() => {
            setEnableBiometricAfterPin(false)
            setShowPinSetup(false)
          }}
          onSave={(pin) => {
            update({ pinEnabled: true, pinHash: hashPin(pin), biometricLockEnabled: enableBiometricAfterPin ? true : biometricLockEnabled })
            showToast(translations[language].toastPinSet)
            if (enableBiometricAfterPin) showToast(translations[language].toastBiometricOn)
            setEnableBiometricAfterPin(false)
            setShowPinSetup(false)
          }}
        />
      )}
      {showPinDisable && (
        <PinDisableModal
          language={language}
          pinHash={pinHash}
          onClose={() => setShowPinDisable(false)}
          onConfirm={() => {
            update({ pinEnabled: false, pinHash: undefined, biometricLockEnabled: false })
            showToast(translations[language].toastPinRemoved)
            setShowPinDisable(false)
          }}
        />
      )}
      {showBackupModal && (
        <BackupModal
          language={language}
          title={t.backupTitle}
          body={t.backupBody}
          summaryTitle={t.backupIncludes}
          items={backupItems}
          confirmLabel={t.backupConfirm}
          onConfirm={handleBackup}
          onClose={() => setShowBackupModal(false)}
        />
      )}
      {showRestoreModal && (
        <RestoreModal
          language={language}
          onClose={() => setShowRestoreModal(false)}
          onRestore={handleRestore}
        />
      )}
      {showClearModal && (
        <ConfirmModal
          language={language}
          title={t.clearTitle}
          body={t.clearBody}
          confirmLabel={t.clearConfirm}
          confirmClass="mo-submit--exp"
          onConfirm={handleClearData}
          onClose={() => setShowClearModal(false)}
          icon={<Trash2 size={22} />}
          danger
        />
      )}

      {showExportModal && (
        <ExportCsvModal
          language={language}
          onClose={() => setShowExportModal(false)}
          onExportTasks={handleExportTasksCsv}
          onExportMoney={handleExportMoneyCsv}
        />
      )}

      {showBackupSyncModal && (
        <EncryptedBackupModal
          language={language}
          onClose={() => setShowBackupSyncModal(false)}
          onToast={showToast}
        />
      )}

      {showBackupManager && (
        <BackupManagerDialog
          open={showBackupManager}
          onClose={() => setShowBackupManager(false)}
        />
      )}

      {toast && <div className="st-toast">{toast}</div>}
    </div>
  )
}

// ==================== Sub-components ====================
function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="st-section">
      <div className="st-section-head">
        <span className="st-section-icon">{icon}</span>
        <span className="st-section-title">{title}</span>
      </div>
      <div className="st-section-body">{children}</div>
    </div>
  )
}

function RowSwitch({ label, sub, value, onChange }: { label: string; sub?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="st-row">
      <div className="st-row-info">
        <span className="st-row-label">{label}</span>
        {sub && <span className="st-row-sub">{sub}</span>}
      </div>
      <button className={`st-switch ${value ? 'st-switch--on' : ''}`} onClick={() => onChange(!value)} aria-label={label}>
        <span className="st-switch-thumb" />
      </button>
    </div>
  )
}

function RowToggle({ label, left, right, active, onLeft, onRight }: { label: string; left: string; right: string; active: boolean; onLeft: () => void; onRight: () => void }) {
  return (
    <div className="st-row">
      <span className="st-row-label">{label}</span>
      <div className="st-toggle">
        <button className={`st-toggle-opt ${active ? 'st-toggle-opt--on' : ''}`} onClick={onLeft}>{left}</button>
        <button className={`st-toggle-opt ${!active ? 'st-toggle-opt--on' : ''}`} onClick={onRight}>{right}</button>
      </div>
    </div>
  )
}

function RowChoice({ label, options, value, onChange }: { label: string; options: number[]; value: number; onChange: (v: number) => void }) {
  return (
    <div className="st-row">
      <span className="st-row-label">{label}</span>
      <div className="st-toggle">
        {options.map((opt) => (
          <button
            key={opt}
            className={`st-toggle-opt ${value === opt ? 'st-toggle-opt--on' : ''}`}
            onClick={() => onChange(opt)}
            aria-pressed={value === opt}
          >
            {opt}m
          </button>
        ))}
      </div>
    </div>
  )
}

function RowArrow({ label, sub, onClick, danger, accent, noArrow }: { label: string; sub?: string; onClick: () => void; danger?: boolean; accent?: boolean; noArrow?: boolean }) {
  return (
    <button className={`st-row st-row-btn ${danger ? 'st-row--danger' : ''}`} onClick={onClick}>
      <div className="st-row-info">
        <span className={`st-row-label ${danger ? 'st-label--danger' : ''} ${accent ? 'st-label--accent' : ''}`}>{label}</span>
        {sub && <span className="st-row-sub">{sub}</span>}
      </div>
      {!noArrow && <ChevronRight size={15} className="st-row-arrow" />}
    </button>
  )
}

function RowExternalLink({ label, sub, href }: { label: string; sub?: string; href: string }) {
  return (
    <a
      className="st-row st-row-btn"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${label} (opens in a new tab)`}
    >
      <div className="st-row-info">
        <span className="st-row-label">{label}</span>
        {sub && <span className="st-row-sub">{sub}</span>}
      </div>
      <ExternalLink size={15} className="st-row-arrow" aria-hidden="true" />
    </a>
  )
}


function EncryptedBackupModal({ language, onClose, onToast }: { language: Language; onClose: () => void; onToast: (msg: string) => void }) {
  const t = translations[language]
  const [passphrase, setPassphrase] = useState('')
  const [confirmPassphrase, setConfirmPassphrase] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [qrSessionId, setQrSessionId] = useState('')
  const [qrChunks, setQrChunks] = useState<string[]>([])
  const [qrIndex, setQrIndex] = useState(0)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [scanActive, setScanActive] = useState(false)
  const [scanStatus, setScanStatus] = useState<{ id: string; total: number; received: number } | null>(null)
  const [scannedPayload, setScannedPayload] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const scannerRef = useRef<BrowserQRCodeReader | null>(null)
  const scannerControlsRef = useRef<IScannerControls | null>(null)
  const scannedChunksRef = useRef(new Map<string, { total: number; parts: Map<number, string> }>())

  useEffect(() => {
    if (qrChunks.length === 0) {
      setQrDataUrl(null)
      return
    }
    const chunk = qrChunks[qrIndex]
    const payload = JSON.stringify({
      id: qrSessionId,
      index: qrIndex,
      total: qrChunks.length,
      data: chunk,
    })
    QRCode.toDataURL(payload, { errorCorrectionLevel: 'H', margin: 2, width: 220 })
      .then((url: string) => setQrDataUrl(url))
      .catch(() => setQrDataUrl(null))
  }, [qrChunks, qrIndex, qrSessionId])


  useEffect(() => () => stopScan(), [])

  const validatePassphrase = () => {
    if (passphrase.trim().length < 8) {
      setError(t.backupPassphraseHint)
      return false
    }
    return true
  }

  const handleImportText = async (text: string) => {
    setError('')
    if (!validatePassphrase()) return
    setBusy(true)
    try {
      const encrypted = parseEncryptedBackup(text)
      const payload = await decryptBackup(passphrase, encrypted)
      mergeBackupPayload(payload)
      onToast(t.backupMergeSuccess)
      setTimeout(() => window.location.reload(), 600)
    } catch (e) {
      setError(t.backupDecryptError)
    } finally {
      setBusy(false)
    }
  }

  const handleGenerateQr = async () => {
    setError('')
    if (!validatePassphrase()) return
    if (confirmPassphrase && passphrase !== confirmPassphrase) {
      setError(t.backupPassMismatch)
      return
    }
    setBusy(true)
    try {
      const payload = buildBackupPayload()
      const encrypted = await encryptBackup(passphrase, payload)
      const text = serializeEncryptedBackup(encrypted)
      const chunks = chunkString(text, 900)
      setQrSessionId(generateQrSessionId())
      setQrChunks(chunks)
      setQrIndex(0)
      setScannedPayload(null)
      setScanStatus(null)
    } catch (e) {
      setError(t.backupDecryptError)
    } finally {
      setBusy(false)
    }
  }

  const startScan = async () => {
    if (scanActive) return
    setError('')
    setScannedPayload(null)
    setScanStatus(null)
    setScanActive(true)
    try {
      const mod = await import('@zxing/browser')
      const reader = new mod.BrowserQRCodeReader()
      scannerRef.current = reader
      if (!videoRef.current) return
      const controls = await reader.decodeFromVideoDevice(undefined, videoRef.current, (result) => {
        if (!result) return
        const text = result.getText()
        const parsed = safeParseQrChunk(text)
        if (!parsed) return
        const entry = scannedChunksRef.current.get(parsed.id) || { total: parsed.total, parts: new Map<number, string>() }
        if (!entry.parts.has(parsed.index)) entry.parts.set(parsed.index, parsed.data)
        scannedChunksRef.current.set(parsed.id, entry)
        setScanStatus({ id: parsed.id, total: parsed.total, received: entry.parts.size })
        if (entry.parts.size === parsed.total) {
          const ordered = Array.from(entry.parts.entries())
            .sort((a, b) => a[0] - b[0])
            .map(([, data]) => data)
            .join('')
          setScannedPayload(ordered)
          stopScan()
        }
      })
      scannerControlsRef.current = controls
    } catch (e) {
      setError(t.backupDecryptError)
      setScanActive(false)
    }
  }

  const stopScan = () => {
    scannerControlsRef.current?.stop()
    scannerControlsRef.current = null
    scannerRef.current = null
    setScanActive(false)
  }

  const handleImportScanned = async () => {
    if (!scannedPayload) return
    await handleImportText(scannedPayload)
  }

  return (
    <ModalShell title={t.backupSyncTitle} onClose={onClose}>
      <div className="st-backup-sync">
        <div className="st-backup-field">
          <label className="st-backup-label">{t.backupPassphrase}</label>
          <input
            className="mo-inp"
            type="password"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            placeholder={t.backupPassphraseHint}
          />
        </div>
        <div className="st-backup-field">
          <label className="st-backup-label">{t.backupPassphraseConfirm}</label>
          <input
            className="mo-inp"
            type="password"
            value={confirmPassphrase}
            onChange={(e) => setConfirmPassphrase(e.target.value)}
            placeholder={t.backupPassphraseHint}
          />
        </div>

        {error && <p className="st-error">{error}</p>}


        <div className="st-backup-qr">
          <div className="st-backup-qr-head">
            <span>{t.backupQrTitle}</span>
            <div className="st-backup-qr-actions">
              <button className="st-qr-btn" onClick={handleGenerateQr} disabled={busy}>{t.backupQrGenerate}</button>
              <button className="st-qr-btn" onClick={scanActive ? stopScan : startScan}>{scanActive ? t.backupQrStop : t.backupQrScan}</button>
            </div>
          </div>

          {qrDataUrl && (
            <div className="st-qr-preview">
              <div className="st-qr-frame">
                <img src={qrDataUrl} alt="QR" />
                <div className="st-qr-mark" aria-hidden="true">JA</div>
              </div>
              <div className="st-qr-nav">
                <button className="st-qr-nav-btn" onClick={() => setQrIndex(Math.max(0, qrIndex - 1))} disabled={qrIndex === 0}>{t.backupQrPrev}</button>
                <span>{t.backupQrProgress}: {qrIndex + 1}/{qrChunks.length}</span>
                <button className="st-qr-nav-btn" onClick={() => setQrIndex(Math.min(qrChunks.length - 1, qrIndex + 1))} disabled={qrIndex >= qrChunks.length - 1}>{t.backupQrNext}</button>
              </div>
            </div>
          )}

          {scanActive && (
            <div className="st-qr-scan">
              <video ref={videoRef} className="st-qr-video" />
              {scanStatus && (
                <div className="st-qr-status">
                  {t.backupQrProgress}: {scanStatus.received}/{scanStatus.total}
                </div>
              )}
            </div>
          )}

          {scannedPayload && (
            <div className="st-qr-ready">
              <p>{t.backupQrReady}</p>
              <button className="mo-submit mo-submit--neu" onClick={handleImportScanned} disabled={busy}>{t.backupImport}</button>
            </div>
          )}
        </div>
      </div>
      <button className="mo-submit mo-submit--cancel" onClick={onClose}>{t.cancel}</button>
    </ModalShell>
  )
}

function chunkString(value: string, size: number): string[] {
  const out: string[] = []
  for (let i = 0; i < value.length; i += size) {
    out.push(value.slice(i, i + size))
  }
  return out
}

function generateQrSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function safeParseQrChunk(text: string): { id: string; index: number; total: number; data: string } | null {
  try {
    const parsed = JSON.parse(text) as { id: string; index: number; total: number; data: string }
    if (!parsed || typeof parsed.id !== 'string' || typeof parsed.index !== 'number' || typeof parsed.total !== 'number' || typeof parsed.data !== 'string') {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

// ==================== Modals ====================
function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="mo-backdrop" onClick={onClose}>
      <div className="mo-sheet" onClick={e => e.stopPropagation()}>
        <div className="mo-notch" />
        <div className="mo-head">
          <h2 className="mo-title">{title}</h2>
          <button className="mo-close" onClick={onClose}><X size={16} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

function PinSetupModal({ language, onClose, onSave }: { language: Language; onClose: () => void; onSave: (pin: string) => void }) {
  const t = translations[language]
  const [step, setStep] = useState<'enter' | 'confirm'>('enter')
  const [pin, setPin] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')

  const handleNext = () => {
    if (pin.length < 4) { setError(t.pinErrorShort); return }
    setStep('confirm'); setError('')
  }
  const handleConfirm = () => {
    if (pin !== confirm) { setError(t.pinErrorMismatch); return }
    onSave(pin)
  }

  return (
    <ModalShell title={t.pinSetupTitle} onClose={onClose}>
      <div className="st-pin-wrap">
        {step === 'enter' ? (
          <>
            <p className="st-pin-hint">{t.pinEnter}</p>
            <div className="st-pin-input-row">
              <input className="mo-inp" type={show ? 'text' : 'password'} inputMode="numeric" maxLength={8} placeholder="••••" value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ''))} autoFocus />
              <button className="st-eye" onClick={() => setShow(!show)}>{show ? <EyeOff size={16} /> : <Eye size={16} />}</button>
            </div>
            {error && <p className="st-error">{error}</p>}
            <button className="mo-submit mo-submit--neu" onClick={handleNext}>{t.pinNext}</button>
          </>
        ) : (
          <>
            <p className="st-pin-hint">{t.pinConfirm}</p>
            <input className="mo-inp" type={show ? 'text' : 'password'} inputMode="numeric" maxLength={8} placeholder="••••" value={confirm} onChange={e => setConfirm(e.target.value.replace(/\D/g, ''))} autoFocus />
            {error && <p className="st-error">{error}</p>}
            <button className="mo-submit mo-submit--neu" onClick={handleConfirm}>{t.pinSave}</button>
          </>
        )}
      </div>
    </ModalShell>
  )
}

function PinDisableModal({ language, pinHash, onClose, onConfirm }: { language: Language; pinHash?: string; onClose: () => void; onConfirm: () => void }) {
  const t = translations[language]
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const handleCheck = () => {
    if (hashPin(pin) === pinHash) onConfirm()
    else setError(t.pinErrorWrong)
  }
  return (
    <ModalShell title={t.pinDisableTitle} onClose={onClose}>
      <p className="st-pin-hint">{t.pinDisableConfirm}</p>
      <input className="mo-inp" type="password" inputMode="numeric" maxLength={8} placeholder="••••" value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ''))} autoFocus />
      {error && <p className="st-error">{error}</p>}
      <button className="mo-submit mo-submit--exp" onClick={handleCheck}>{t.pinDisableBtn}</button>
    </ModalShell>
  )
}

function ConfirmModal({ language, title, body, confirmLabel, confirmClass, onConfirm, onClose, icon, danger }: { language: Language; title: string; body: string; confirmLabel: string; confirmClass: string; onConfirm: () => void; onClose: () => void; icon?: React.ReactNode; danger?: boolean }) {
  const t = translations[language]
  return (
    <ModalShell title={title} onClose={onClose}>
      <div className="st-confirm-body">
        {icon && <div className={`st-confirm-icon ${danger ? 'st-confirm-icon--danger' : 'st-confirm-icon--gold'}`}>{icon}</div>}
        <p className="st-confirm-text">{body}</p>
      </div>
      <button className={`mo-submit ${confirmClass}`} onClick={onConfirm}>{confirmLabel}</button>
      <button className="mo-submit mo-submit--cancel" onClick={onClose} style={{ marginTop: 8 }}>{t.cancel}</button>
    </ModalShell>
  )
}

function BackupModal({
  language,
  title,
  body,
  summaryTitle,
  items,
  confirmLabel,
  onConfirm,
  onClose,
}: {
  language: Language
  title: string
  body: string
  summaryTitle: string
  items: Array<{ label: string; value: number }>
  confirmLabel: string
  onConfirm: () => void
  onClose: () => void
}) {
  const t = translations[language]
  return (
    <ModalShell title={title} onClose={onClose}>
      <div className="st-confirm-body">
        <div className="st-confirm-icon st-confirm-icon--gold">
          <Download size={22} />
        </div>
        <p className="st-confirm-text">{body}</p>
      </div>
      <div className="st-backup-block">
        <p className="st-backup-title">{summaryTitle}</p>
        <div className="st-backup-list">
          {items.map((item) => (
            <div key={item.label} className="st-backup-row">
              <span>{item.label}</span>
              <span className="st-backup-value">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
      <button className="mo-submit mo-submit--neu" onClick={onConfirm}>{confirmLabel}</button>
      <button className="mo-submit mo-submit--cancel" onClick={onClose} style={{ marginTop: 8 }}>{t.cancel}</button>
    </ModalShell>
  )
}

function ExportCsvModal({ language, onClose, onExportTasks, onExportMoney }: { language: Language; onClose: () => void; onExportTasks: () => void; onExportMoney: () => void }) {
  const t = translations[language]
  return (
    <ModalShell title={t.exportTitle} onClose={onClose}>
      <div className="st-export-body">
        <button className="st-export-btn" onClick={onExportTasks}>{t.exportTasks}</button>
        <button className="st-export-btn" onClick={onExportMoney}>{t.exportMoney}</button>
      </div>
      <button className="mo-submit mo-submit--cancel" onClick={onClose}>{t.cancel}</button>
    </ModalShell>
  )
}

function RestoreModal({ language, onClose, onRestore }: { language: Language; onClose: () => void; onRestore: (f: File) => void }) {
  const t = translations[language]
  return (
    <ModalShell title={t.restoreTitle} onClose={onClose}>
      <div className="st-restore-body">
        <Upload size={30} className="st-restore-icon" />
        <p className="st-restore-text">{t.restoreBody}</p>
        <label className="st-file-label">
          {t.restoreSelect}
          <input type="file" accept=".json" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) onRestore(f) }} />
        </label>
        <p className="st-restore-warn">{t.restoreWarn}</p>
      </div>
    </ModalShell>
  )
}

export const dynamic = 'force-dynamic'
