// src/app/(tabs)/settings/page.tsx
'use client'

import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import {
  Sun, Moon, Monitor, Globe, Lock, Download,
  Upload, Trash2, ChevronDown, Check, Shield,
  Info, Palette, Bell, Eye, EyeOff, X, ExternalLink,
  Smartphone, Clock, ShieldCheck, ShieldAlert, HardDrive,
  DownloadCloud, UploadCloud, FileSpreadsheet, Database,
  Key, Share2, RefreshCw, Search, MoonStar, Sun as SunIcon,
  ShieldBan, Fingerprint, Wifi, Activity, BatteryFull,
  Server, HardDrive as HDD, User, ChevronRight, ChevronLeft,
  Heart, Cloud
} from 'lucide-react'
import { useSettingsStore, type Theme, type Language } from '@/features/settings/store/settingsStore'
import { usePrefsStore } from '@/features/namaz/store/prefsStore'
import { useNamazStore } from '@/features/namaz/store/namazStore'
import { useTaskStore } from '@/lib/store/taskStore'
import { useMoneyStore } from '@/features/money/store/moneyStore'
import { NAMAZ_STORAGE_KEYS } from '@/features/namaz/constants/storageKeys'
import '@/features/settings/settings.css'
import { getBiometricStatus } from '@/features/settings/utils/biometricAuth'
import { hashPin } from '@/features/settings/utils/security'
import CloudSyncCard from '@/components/settings/CloudSyncCard'
import BackupManagerDialog from '@/components/settings/BackupManagerDialog'
import QuickTransferDialog from '@/components/sync/QuickTransferDialog'
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
    voiceToggle: 'ভয়েস কমান্ড',
    voiceSub: 'স্ক্রিনে ভয়েস আইকন দেখাবে',
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
    greetingMorning: 'সুপ্রভাত',
    greetingAfternoon: 'শুভ অপরাহ্ন',
    greetingEvening: 'শুভ সন্ধ্যা',
    secNotifications: 'আপনার সতর্কতা ও রিমাইন্ডার নিয়ন্ত্রণ করুন',
    secSecurity: 'PIN ও বায়োমেট্রিক দিয়ে অ্যাপ সুরক্ষিত করুন',
    secData: 'ব্যাকআপ, রিস্টোর ও ডেটা এক্সপোর্ট',
    secAbout: 'অ্যাপ সংক্রান্ত তথ্য',
    searchPlaceholder: 'সেটিংস খুঁজুন...',
    healthScore: 'ডেটা হেল্থ',
    healthDesc: 'আপনার ডেটা সুরক্ষিত এবং ব্যাকআপ করা আছে',
    darkMode: 'ডার্ক মোড',
    quickTheme: 'থিম',
    quickSecurity: 'সুরক্ষা',
    quickNotifications: 'নোটিফিকেশন',
    dataHealth: 'ডেটা হেল্থ',
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
    voiceToggle: 'Voice Commands',
    voiceSub: 'Show voice mic button on screen',
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
    greetingMorning: 'Good Morning',
    greetingAfternoon: 'Good Afternoon',
    greetingEvening: 'Good Evening',
    secNotifications: 'Manage your alerts & reminders',
    secSecurity: 'Secure your app with PIN & biometric',
    secData: 'Backup, restore & export your data',
    secAbout: 'App information & privacy',
    searchPlaceholder: 'Search settings...',
    healthScore: 'Data Health',
    healthDesc: 'Your data is secured and backed up',
    darkMode: 'Dark Mode',
    quickTheme: 'Theme',
    quickSecurity: 'Security',
    quickNotifications: 'Notifications',
    dataHealth: 'Data Health',
  }
}

// ==================== Section Definitions ====================
interface SectionDef {
  id: string
  icon: React.ReactNode
  titleKey: string
  descKey?: string
}

const sectionDefs = (t: typeof translations.en): SectionDef[] => [
  { id: 'theme', icon: <Palette size={16} />, titleKey: t.theme },
  { id: 'lang', icon: <Globe size={16} />, titleKey: t.langCurrency },
  { id: 'notifications', icon: <Bell size={16} />, titleKey: t.notifications, descKey: t.secNotifications },
  { id: 'security', icon: <Shield size={16} />, titleKey: t.security, descKey: t.secSecurity },
  { id: 'data', icon: <Download size={16} />, titleKey: t.dataManage, descKey: t.secData },
  { id: 'about', icon: <Info size={16} />, titleKey: t.about, descKey: t.secAbout },
]

// ==================== Helper ====================
function getStorageSize(): string {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return '0.0 KB'
  }
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

function getStorageSizeBytes(): number {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return 0
  }
  let total = 0
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && (key.startsWith('selfsync') || key.startsWith('namaz') || key.startsWith('money_') || key.startsWith('amar'))) {
      total += (localStorage.getItem(key) || '').length
    }
  }
  return total / 1024
}

function getGreeting(language: Language): string {
  const hour = new Date().getHours()
  const t = translations[language]
  if (hour < 12) return t.greetingMorning
  if (hour < 17) return t.greetingAfternoon
  return t.greetingEvening
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
    voiceEnabled,
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
  const greeting = getGreeting(language)

  const [showPinSetup, setShowPinSetup] = useState(false)
  const [showPinDisable, setShowPinDisable] = useState(false)
  const [enableBiometricAfterPin, setEnableBiometricAfterPin] = useState(false)
  const [biometricChecking, setBiometricChecking] = useState(false)
  const [showBackupModal, setShowBackupModal] = useState(false)
  const [showRestoreModal, setShowRestoreModal] = useState(false)
  const [showClearModal, setShowClearModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [showBackupManager, setShowBackupManager] = useState(false)
  const [showQuickTransfer, setShowQuickTransfer] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())
  const [showSearch, setShowSearch] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

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

  // Compute storage
  const storageKB = getStorageSizeBytes()
  const storagePercent = Math.min(storageKB / 500, 1) // assume ~500KB max for ring

  // Compute health score
  const healthScore = useMemo(() => {
    let score = 0
    if (pinEnabled) score += 30
    if (biometricLockEnabled) score += 10
    if (notificationsEnabled) score += 10
    if (tasks.length > 0) score += 10
    if (namazRecords.length > 0) score += 10
    if (transactions.length > 0) score += 10
    // backup check - if any data exists
    if (tasks.length > 0 || transactions.length > 0 || namazRecords.length > 0) score += 20
    return Math.min(score, 100)
  }, [pinEnabled, biometricLockEnabled, notificationsEnabled, tasks.length, namazRecords.length, transactions.length])

  const healthRingColor = healthScore >= 80 ? 'var(--st-success)' : healthScore >= 50 ? 'var(--st-gold)' : 'var(--st-danger)'
  const healthRingOffset = 188.5 - (188.5 * healthScore / 100)
  const healthRingCircumference = 188.5

  // Storage ring circumference
  const storageRingOffset = 188.5 - (188.5 * storagePercent)

  // Toggle section collapse
  const toggleSection = (id: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Spotlight search
  const sectionDefsList = useMemo(() => sectionDefs(t), [t])
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return []
    const q = searchQuery.toLowerCase()
    return sectionDefsList.filter(s => {
      const title = s.titleKey.toLowerCase()
      const desc = s.descKey?.toLowerCase() || ''
      return title.includes(q) || desc.includes(q)
    })
  }, [searchQuery, sectionDefsList])

  const handleSearchSelect = (id: string) => {
    setSearchQuery('')
    setShowSearch(false)
    // Scroll to section
    const el = document.getElementById(`st-section-${id}`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleQuickSearch = () => {
    setShowSearch(true)
    setTimeout(() => searchRef.current?.focus(), 100)
  }

  return (
    <div className="st-root">
      {/* SVG Defs for gradients */}
      <svg className="st-svg-defs" aria-hidden="true">
        <defs>
          <linearGradient id="st-ring-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--st-accent)" />
            <stop offset="100%" stopColor="var(--st-accent-2)" />
          </linearGradient>
          <linearGradient id="st-health-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={healthScore >= 80 ? 'var(--st-success)' : healthScore >= 50 ? 'var(--st-gold)' : 'var(--st-danger)'} />
            <stop offset="100%" stopColor={healthScore >= 80 ? '#34d399' : healthScore >= 50 ? '#dbb85c' : '#ef4444'} />
          </linearGradient>
        </defs>
      </svg>

      {/* Header */}
      <div className="st-header">
        <div className="st-header-bg" />
        <div className="st-header-inner">
          <p className="st-header-eyebrow">{t.customize}</p>
          <h1 className="st-header-title">{t.settings}</h1>
          <p className="st-header-sub">{t.sub}</p>
        </div>
      </div>

      {/* Premium Profile Hub with Integrated Search (moved into .st-body) */}

      <div className="st-body">
        {/* Quick Toggle Dock */}
        <div className="st-quick-dock">
          <button
            className={`st-quick-dock-pill ${theme === 'dark' ? 'st-quick-dock-pill--active' : ''}`}
            onClick={() => update({ theme: theme === 'dark' ? 'light' : 'dark' as Theme })}
          >
            {theme === 'dark' ? <MoonStar size={14} /> : <SunIcon size={14} />}
            {t.quickTheme}
          </button>
          <button
            className={`st-quick-dock-pill ${pinEnabled ? 'st-quick-dock-pill--active' : ''}`}
            onClick={() => pinEnabled ? setShowPinDisable(true) : setShowPinSetup(true)}
          >
            <Shield size={14} />
            {t.quickSecurity}
          </button>
          <button
            className={`st-quick-dock-pill ${notificationsEnabled ? 'st-quick-dock-pill--active' : ''}`}
            onClick={() => update({ notificationsEnabled: !notificationsEnabled })}
          >
            <Bell size={14} />
            {t.quickNotifications}
          </button>
          <button
            className="st-quick-dock-pill"
            onClick={handleQuickSearch}
          >
            <Search size={14} />
            {language === 'bn' ? 'খুঁজুন' : 'Search'}
          </button>
        </div>
        {/* Premium Profile Hub with Integrated Search */}
        <div className="st-profile-hub">
          <div className="st-profile-hub-top">
            <div className="st-profile-avatar-wrap">
              <div className="st-profile-avatar">
                <span>AJ</span>
              </div>
              <div className="st-profile-avatar-badge" />
            </div>
            <div className="st-profile-info">
              <div className="st-profile-greeting">{greeting} 👋</div>
              <div className="st-profile-sub">{language === 'bn' ? 'আপনার সেটিংস, আপনার পছন্দ' : 'Your settings, your way'}</div>
            </div>
            <div className="st-profile-stats">
              <div className="st-profile-stat-badge">
                <Database size={9} />
                {language === 'bn' ? 'স্থানীয়' : 'Local'}
              </div>
            </div>
          </div>
          
          {/* Search integrated inside profile hub */}
          <div className="st-profile-search">
            <div className="st-spotlight-input-wrap">
              <span className="st-spotlight-icon">
                <Search size={14} />
              </span>
              <input
                ref={searchRef}
                className="st-spotlight-input"
                type="text"
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setShowSearch(true)
                }}
                onFocus={() => setShowSearch(true)}
                onBlur={() => setTimeout(() => setShowSearch(false), 200)}
              />
              <button
                className={`st-spotlight-clear ${searchQuery ? 'st-spotlight-clear--visible' : ''}`}
                onClick={() => {
                  setSearchQuery('')
                  setShowSearch(false)
                }}
                aria-label="Clear search"
              >
                <X size={12} />
              </button>
            </div>
            {showSearch && searchQuery && (
              <div className="st-spotlight-results">
                {searchResults.length > 0 ? (
                  searchResults.map((s) => (
                    <button
                      key={s.id}
                      className="st-spotlight-result-item"
                      onMouseDown={() => handleSearchSelect(s.id)}
                    >
                      <span className="st-spotlight-result-icon">
                        {s.icon}
                      </span>
                      <span>{s.titleKey}</span>
                    </button>
                  ))
                ) : (
                  <div className="st-spotlight-no-results">
                    {language === 'bn' ? 'কোনো ফলাফল পাওয়া যায়নি' : 'No results found'}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        {/* Theme */}
        <Section
          id="theme"
          icon={<Palette size={16} />}
          title={t.theme}
          collapsed={collapsedSections.has('theme')}
          onToggle={() => toggleSection('theme')}
        >
          <div className="st-theme-grid">
            {[
              { val: 'light' as Theme, icon: <Sun size={22} />, label: t.themeLight },
              { val: 'dark' as Theme,  icon: <Moon size={22} />, label: t.themeDark },
              { val: 'system' as Theme, icon: <Monitor size={22} />, label: t.themeSystem },
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
        <Section
          id="lang"
          icon={<Globe size={16} />}
          title={t.langCurrency}
          collapsed={collapsedSections.has('lang')}
          onToggle={() => toggleSection('lang')}
        >
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
        <Section
          id="notifications"
          icon={<Bell size={16} />}
          title={t.notifications}
          desc={t.secNotifications}
          collapsed={collapsedSections.has('notifications')}
          onToggle={() => toggleSection('notifications')}
        >
          <RowSwitch
            icon={<Bell size={14} />}
            iconType="accent"
            label={t.appNotifications}
            sub={t.appNotificationsSub}
            value={notificationsEnabled}
            onChange={v => update({ notificationsEnabled: v })}
          />
          <div className="st-divider" />
          <RowSwitch
            icon={<Bell size={14} />}
            iconType="accent"
            label={t.taskAlerts}
            sub={t.taskAlertsSub}
            value={notificationCategories.tasks}
            onChange={v => update({ notificationCategories: { ...notificationCategories, tasks: v } })}
          />
          <div className="st-divider" />
          <RowSwitch
            icon={<Bell size={14} />}
            iconType="accent"
            label={t.moneyAlerts}
            sub={t.moneyAlertsSub}
            value={notificationCategories.money}
            onChange={v => update({ notificationCategories: { ...notificationCategories, money: v } })}
          />
          <div className="st-divider" />
          <RowSwitch
            icon={<Bell size={14} />}
            iconType="accent"
            label={t.namazReminder}
            sub={t.namazSub}
            value={remindersEnabled}
            onChange={handlePrayerReminderToggle}
          />
          <div className="st-divider" />
          <RowSwitch
            icon={<Clock size={14} />}
            iconType="neutral"
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
            icon={<Smartphone size={14} />}
            iconType="neutral"
            label={t.calculatorToggle}
            sub={t.calculatorSub}
            value={calculatorEnabled}
            onChange={v => update({ calculatorEnabled: v })}
          />
          <div className="st-divider" />
          <RowSwitch
            icon={<Smartphone size={14} />}
            iconType="neutral"
            label={t.voiceToggle}
            sub={t.voiceSub}
            value={voiceEnabled}
            onChange={v => update({ voiceEnabled: v })}
          />
        </Section>

        {/* Security */}
        <Section
          id="security"
          icon={<Shield size={16} />}
          title={t.security}
          desc={t.secSecurity}
          collapsed={collapsedSections.has('security')}
          onToggle={() => toggleSection('security')}
        >
          {/* Security Status Card */}
          <div className="st-security-card">
            <div className={`st-security-icon-box ${pinEnabled ? 'st-security-icon-box--locked' : 'st-security-icon-box--unlocked'}`}>
              {pinEnabled ? <ShieldCheck size={22} /> : <ShieldAlert size={22} />}
            </div>
            <div className="st-security-info">
              <div className="st-security-label">
                {pinEnabled
                  ? (language === 'bn' ? 'সুরক্ষিত' : 'Protected')
                  : (language === 'bn' ? 'সুরক্ষিত নয়' : 'Not Protected')}
              </div>
              <div className="st-security-status">
                <span className={`st-security-dot ${pinEnabled ? 'st-security-dot--active' : 'st-security-dot--inactive'}`} />
                {pinEnabled
                  ? (language === 'bn' ? 'PIN & বায়োমেট্রিক সক্রিয়' : 'PIN & biometric active')
                  : (language === 'bn' ? 'কোনো PIN সেট করা নেই' : 'No PIN set')}
              </div>
            </div>
          </div>
          <RowArrow
            icon={<Key size={14} />}
            iconType="accent"
            label={t.pinLock}
            sub={pinEnabled ? t.pinActive : t.pinInactive}
            accent={pinEnabled}
            onClick={() => pinEnabled ? setShowPinDisable(true) : setShowPinSetup(true)}
          />
          <div className="st-divider" />
          <RowSwitch
            icon={<Smartphone size={14} />}
            iconType="accent"
            label={t.biometricLock}
            sub={biometricChecking ? 'Checking...' : biometricLockEnabled ? t.biometricActive : t.biometricInactive}
            value={biometricLockEnabled}
            onChange={handleBiometricToggle}
          />
          <div className="st-divider" />
          <RowSwitch
            icon={<Clock size={14} />}
            iconType="neutral"
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

        {/* Data Health Score - Premium Ring */}
        <Section
          id="health"
          icon={<Heart size={16} />}
          title={t.dataHealth}
          desc={t.healthDesc}
          collapsed={collapsedSections.has('health')}
          onToggle={() => toggleSection('health')}
        >
          <div className="st-health-score">
            <div className="st-health-score-ring">
              <svg viewBox="0 0 65 65">
                <circle className="st-health-score-ring-bg" cx="32.5" cy="32.5" r="30" />
                <circle
                  className="st-health-score-ring-fill"
                  cx="32.5"
                  cy="32.5"
                  r="30"
                  stroke={healthRingColor}
                  style={{ strokeDashoffset: healthRingOffset }}
                />
              </svg>
              <div className="st-health-score-ring-center">{healthScore}</div>
            </div>
            <div className="st-health-score-info">
              <div className="st-health-score-title">{t.dataHealth}</div>
              <div className="st-health-score-desc">
                {healthScore >= 80 ? (language === 'bn' ? 'চমৎকার! সবকিছু সুরক্ষিত' : 'Excellent! Everything is secure')
                  : healthScore >= 50 ? (language === 'bn' ? 'ভালো, কিন্তু আরও উন্নতি সম্ভব' : 'Good, but can improve')
                  : (language === 'bn' ? 'একটি PIN সেট করুন এবং ব্যাকআপ নিন' : 'Set a PIN and take a backup')}
              </div>
            </div>
          </div>
        </Section>

        {/* Cloud & Sync */}
        <Section
          id="cloud"
          icon={<Cloud size={16} />}
          title={language === 'bn' ? 'ক্লাউড ও সিঙ্ক' : 'Cloud & Sync'}
          desc={language === 'bn' ? 'গুগল ড্রাইভ সিঙ্ক ও ব্যাকআপ ম্যানেজমেন্ট' : 'Google Drive sync & backup management'}
          collapsed={collapsedSections.has('cloud')}
          onToggle={() => toggleSection('cloud')}
        >
          <CloudSyncCard />
        </Section>

        {/* Data Management */}
        <Section
          id="data"
          icon={<Download size={16} />}
          title={t.dataManage}
          desc={t.secData}
          collapsed={collapsedSections.has('data')}
          onToggle={() => toggleSection('data')}
        >
          <RowArrow
            icon={<Share2 size={14} />}
            iconType="accent"
            label={language === 'bn' ? '⚡ কুইক ট্রান্সফার' : '⚡ Quick Transfer'}
            sub={language === 'bn' ? 'QR এর মাধ্যমে ডিভাইসে ডেটা স্থানান্তর' : 'Transfer data between devices via QR'}
            onClick={() => setShowQuickTransfer(true)}
          />
          <div className="st-divider" />
          <RowArrow
            icon={<UploadCloud size={14} />}
            iconType="gold"
            label={t.backup}
            sub={t.backupSub}
            onClick={() => setShowBackupModal(true)}
          />
          <div className="st-divider" />
          <RowArrow
            icon={<DownloadCloud size={14} />}
            iconType="gold"
            label={t.restore}
            sub={t.restoreSub}
            onClick={() => setShowRestoreModal(true)}
          />
          <div className="st-divider" />
          <RowArrow
            icon={<FileSpreadsheet size={14} />}
            iconType="neutral"
            label={t.exportCsv}
            sub={t.exportCsvSub}
            onClick={() => setShowExportModal(true)}
          />
          <div className="st-divider" />
          <RowArrow
            icon={<Trash2 size={14} />}
            iconType="danger"
            label={t.clearData}
            sub={t.clearSub}
            danger
            onClick={() => setShowClearModal(true)}
          />
          <div className="st-divider" />
          <RowArrow
            icon={<RefreshCw size={14} />}
            iconType="accent"
            label={language === 'bn' ? '💼 অ্যাডভান্সড ব্যাকআপ' : '💼 Advanced Backup'}
            sub={language === 'bn' ? 'ভ্যালিডেট, মার্জ, রিপ্লেস, স্ন্যাপশট' : 'Validate, Merge, Replace, Snapshot'}
            onClick={() => setShowBackupManager(true)}
          />
        </Section>

        {/* About */}
        <Section
          id="about"
          icon={<Info size={16} />}
          title={t.about}
          desc={t.secAbout}
          collapsed={collapsedSections.has('about')}
          onToggle={() => toggleSection('about')}
        >
          <div className="st-about-card">
            <img src="/icons/app-icon.png" alt="SelfSync" className="st-about-logo-img" />
            <div>
              <p className="st-about-name">SelfSync</p>
              <p className="st-about-ver">{t.version}</p>
            </div>
          </div>

          {/* Storage Ring (replaces bar) */}
          <div className="st-storage-ring-section">
            <div className="st-storage-ring">
              <svg viewBox="0 0 65 65">
                <circle className="st-storage-ring-bg" cx="32.5" cy="32.5" r="30" />
                <circle
                  className={`st-storage-ring-fill ${storagePercent > 0.7 ? 'st-storage-ring-fill--high' : ''} ${storagePercent > 0.9 ? 'st-storage-ring-fill--full' : 'st-storage-ring-fill--default'}`}
                  cx="32.5"
                  cy="32.5"
                  r="30"
                  style={{ strokeDashoffset: storageRingOffset }}
                />
              </svg>
              <div className="st-storage-ring-center">{Math.round(storagePercent * 100)}%</div>
            </div>
            <div className="st-storage-ring-info">
              <div className="st-storage-ring-label">
                <HardDrive size={14} />
                {' '}{t.storageUsed}
              </div>
              <div className="st-storage-ring-value">{getStorageSize()}</div>
              <div className="st-storage-breakdown">
                <span className="st-storage-tag">
                  <span className="st-storage-tag-dot" style={{ background: 'var(--st-accent)' }} />
                  {t.dataSummary}
                </span>
                <span className="st-storage-tag">{dataSummary}</span>
              </div>
            </div>
          </div>

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

      {showBackupManager && (
        <BackupManagerDialog
          open={showBackupManager}
          onClose={() => setShowBackupManager(false)}
        />
      )}

      {showQuickTransfer && (
        <QuickTransferDialog
          open={showQuickTransfer}
          onClose={() => setShowQuickTransfer(false)}
        />
      )}

      {toast && <div className="st-toast">{toast}</div>}
    </div>
  )
}

// ==================== Sub-components ====================
function Section({ id, icon, title, desc, children, collapsed, onToggle }: {
  id?: string;
  icon: React.ReactNode;
  title: string;
  desc?: string;
  children: React.ReactNode;
  collapsed?: boolean;
  onToggle?: () => void;
}) {
  return (
    <div className="st-section" id={id ? `st-section-${id}` : undefined}>
      <div
        className={`st-section-head ${onToggle ? 'st-section-head--clickable' : ''}`}
        onClick={onToggle}
      >
        <span className="st-section-icon">{icon}</span>
        <div className="st-section-title-group">
          <span className="st-section-title">{title}</span>
          {desc && <span className="st-section-desc">{desc}</span>}
        </div>
        {onToggle && (
          <span className={`st-section-chevron ${collapsed ? '' : 'st-section-chevron--open'}`}>
            <ChevronDown size={16} />
          </span>
        )}
      </div>
      <div className={`st-section-body ${collapsed ? 'st-section-body--collapsed' : 'st-section-body--expanded'}`}>
        <div className="st-section-body-inner">
          {children}
        </div>
      </div>
    </div>
  )
}

function RowSwitch({ icon, iconType, label, sub, value, onChange }: {
  icon?: React.ReactNode;
  iconType?: 'accent' | 'success' | 'danger' | 'gold' | 'neutral';
  label: string;
  sub?: string;
  value: boolean;
  onChange: (v: boolean) => void
}) {
  return (
    <div className="st-row">
      {icon && (
        <span className={`st-row-icon st-row-icon--${iconType || 'neutral'}`}>
          {icon}
        </span>
      )}
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

function RowArrow({ icon, iconType, label, sub, onClick, danger, accent, noArrow }: {
  icon?: React.ReactNode;
  iconType?: 'accent' | 'success' | 'danger' | 'gold' | 'neutral';
  label: string;
  sub?: string;
  onClick: () => void;
  danger?: boolean;
  accent?: boolean;
  noArrow?: boolean
}) {
  return (
    <button className={`st-row st-row-btn ${danger ? 'st-row--danger' : ''}`} onClick={onClick}>
      {icon && (
        <span className={`st-row-icon st-row-icon--${iconType || 'neutral'}`}>
          {icon}
        </span>
      )}
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
    >
      <span className="st-row-icon st-row-icon--neutral">
        <ExternalLink size={14} />
      </span>
      <div className="st-row-info">
        <span className="st-row-label">{label}</span>
        {sub && <span className="st-row-sub">{sub}</span>}
      </div>
      <ExternalLink size={13} className="st-row-arrow" />
    </a>
  )
}

// ==================== Modal Components ====================
function PinSetupModal({ language, onClose, onSave }: { language: Language; onClose: () => void; onSave: (pin: string) => void }) {
  const t = translations[language]
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [step, setStep] = useState(0)
  const [error, setError] = useState('')
  const [showPin, setShowPin] = useState(false)

  const handleNext = () => {
    if (pin.length < 4) {
      setError(t.pinErrorShort)
      return
    }
    setError('')
    setStep(1)
  }

  const handleSave = () => {
    if (pin !== confirmPin) {
      setError(t.pinErrorMismatch)
      return
    }
    onSave(pin)
  }

  return (
    <div className="mo-backdrop" onClick={onClose}>
      <div className="mo-sheet" onClick={e => e.stopPropagation()}>
        <div className="mo-notch" />
        <div className="mo-head">
          <span className="mo-title">{step === 0 ? t.pinSetupTitle : t.pinConfirm}</span>
          <button className="mo-close" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="st-pin-wrap">
          <p className="st-pin-hint">{step === 0 ? t.pinEnter : t.pinConfirm}</p>
          <div className="st-pin-input-row">
            <input
              className="mo-inp"
              type={showPin ? 'text' : 'password'}
              inputMode="numeric"
              maxLength={6}
              placeholder="••••"
              value={step === 0 ? pin : confirmPin}
              onChange={e => {
                step === 0 ? setPin(e.target.value) : setConfirmPin(e.target.value)
                setError('')
              }}
              autoFocus
            />
            <button className="st-eye" onClick={() => setShowPin(!showPin)} aria-label="Toggle PIN visibility">
              {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {error && <p className="st-error">{error}</p>}
          <button
            className="mo-submit mo-submit--neu"
            onClick={step === 0 ? handleNext : handleSave}
          >
            {step === 0 ? t.pinNext : t.pinSave}
          </button>
        </div>
      </div>
    </div>
  )
}

function PinDisableModal({ language, pinHash, onClose, onConfirm }: { language: Language; pinHash?: string; onClose: () => void; onConfirm: () => void }) {
  const t = translations[language]
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [showPin, setShowPin] = useState(false)

  const handleConfirm = () => {
    if (hashPin(pin) !== pinHash) {
      setError(t.pinErrorWrong)
      return
    }
    onConfirm()
  }

  return (
    <div className="mo-backdrop" onClick={onClose}>
      <div className="mo-sheet" onClick={e => e.stopPropagation()}>
        <div className="mo-notch" />
        <div className="mo-head">
          <span className="mo-title">{t.pinDisableTitle}</span>
          <button className="mo-close" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="st-pin-wrap">
          <p className="st-pin-hint">{t.pinDisableConfirm}</p>
          <div className="st-pin-input-row">
            <input
              className="mo-inp"
              type={showPin ? 'text' : 'password'}
              inputMode="numeric"
              maxLength={6}
              placeholder="••••"
              value={pin}
              onChange={e => { setPin(e.target.value); setError('') }}
              autoFocus
            />
            <button className="st-eye" onClick={() => setShowPin(!showPin)} aria-label="Toggle PIN visibility">
              {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {error && <p className="st-error">{error}</p>}
          <button className="mo-submit mo-submit--exp" onClick={handleConfirm}>
            {t.pinDisableBtn}
          </button>
        </div>
      </div>
    </div>
  )
}

function BackupModal({ language, title, body, summaryTitle, items, confirmLabel, onConfirm, onClose }: {
  language: Language; title: string; body: string; summaryTitle: string; items: { label: string; value: number }[]; confirmLabel: string; onConfirm: () => void; onClose: () => void
}) {
  return (
    <div className="mo-backdrop" onClick={onClose}>
      <div className="mo-sheet" onClick={e => e.stopPropagation()}>
        <div className="mo-notch" />
        <div className="mo-head">
          <span className="mo-title">{title}</span>
          <button className="mo-close" onClick={onClose}><X size={16} /></button>
        </div>
        <p style={{ fontSize: 13, color: 'var(--st-text-3)', marginBottom: 8, lineHeight: 1.5 }}>{body}</p>
        <div className="st-confirm-body">
          <div className="st-confirm-icon st-confirm-icon--gold">
            <Download size={24} />
          </div>
          <div className="st-backup-block">
            <div className="st-backup-title">{summaryTitle}</div>
            <div className="st-backup-list">
              {items.map((item) => (
                <div key={item.label} className="st-backup-row">
                  <span>{item.label}</span>
                  <span className="st-backup-value">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
          <button className="mo-submit mo-submit--neu" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

function RestoreModal({ language, onClose, onRestore }: { language: Language; onClose: () => void; onRestore: (file: File) => void }) {
  const t = translations[language]
  const fileRef = useRef<HTMLInputElement>(null)

  return (
    <div className="mo-backdrop" onClick={onClose}>
      <div className="mo-sheet" onClick={e => e.stopPropagation()}>
        <div className="mo-notch" />
        <div className="mo-head">
          <span className="mo-title">{t.restoreTitle}</span>
          <button className="mo-close" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="st-restore-body">
          <Upload size={40} className="st-restore-icon" />
          <p className="st-restore-text">{t.restoreBody}</p>
          <p className="st-restore-warn">{t.restoreWarn}</p>
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={e => {
              const file = e.target.files?.[0]
              if (file) onRestore(file)
            }}
          />
          <button className="st-file-label" onClick={() => fileRef.current?.click()}>
            <UploadCloud size={16} />
            {' '}{t.restoreSelect}
          </button>
        </div>
      </div>
    </div>
  )
}

function ConfirmModal({ language, title, body, confirmLabel, confirmClass, onConfirm, onClose, icon, danger }: {
  language: Language; title: string; body: string; confirmLabel: string; confirmClass?: string; onConfirm: () => void; onClose: () => void; icon: React.ReactNode; danger?: boolean
}) {
  return (
    <div className="mo-backdrop" onClick={onClose}>
      <div className="mo-sheet" onClick={e => e.stopPropagation()}>
        <div className="mo-notch" />
        <div className="mo-head">
          <span className="mo-title">{title}</span>
          <button className="mo-close" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="st-confirm-body">
          <div className={`st-confirm-icon ${danger ? 'st-confirm-icon--danger' : 'st-confirm-icon--gold'}`}>
            {icon}
          </div>
          <p className="st-confirm-text">{body}</p>
        </div>
        <button className={`mo-submit ${confirmClass || 'mo-submit--neu'}`} onClick={onConfirm}>
          {confirmLabel}
        </button>
        <button className="mo-submit mo-submit--cancel" onClick={onClose} style={{ marginTop: 8 }}>
          {translations[language].cancel}
        </button>
      </div>
    </div>
  )
}

function ExportCsvModal({ language, onClose, onExportTasks, onExportMoney }: {
  language: Language; onClose: () => void; onExportTasks: () => void; onExportMoney: () => void
}) {
  const t = translations[language]
  return (
    <div className="mo-backdrop" onClick={onClose}>
      <div className="mo-sheet" onClick={e => e.stopPropagation()}>
        <div className="mo-notch" />
        <div className="mo-head">
          <span className="mo-title">{t.exportTitle}</span>
          <button className="mo-close" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="st-export-body">
          <button className="st-export-btn" onClick={onExportTasks}>
            <FileSpreadsheet size={18} className="st-export-btn-icon" />
            {t.exportTasks}
          </button>
          <button className="st-export-btn" onClick={onExportMoney}>
            <FileSpreadsheet size={18} className="st-export-btn-icon" />
            {t.exportMoney}
          </button>
        </div>
      </div>
    </div>
  )
}
