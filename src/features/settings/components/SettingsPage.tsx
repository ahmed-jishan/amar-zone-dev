// src/app/(tabs)/settings/page.tsx
'use client'

import { useState } from 'react'
import {
  Sun, Moon, Monitor, Globe, Lock, Download,
  Upload, Trash2, ChevronRight, Check, Shield,
  Info, Palette, Bell, Eye, EyeOff, X
} from 'lucide-react'
import { useSettingsStore, type Theme, type Language } from '@/features/settings/store/settingsStore'

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
    namazReminder: 'নামাজের রিমাইন্ডার',
    namazSub: 'সময় হলে জানাবে',
    security: 'নিরাপত্তা',
    pinLock: 'PIN লক',
    pinActive: 'সক্রিয় আছে ✓',
    pinInactive: 'নিষ্ক্রিয়',
    dataManage: 'ডেটা ব্যবস্থাপনা',
    backup: 'ব্যাকআপ করুন',
    backupSub: 'JSON ফাইলে সংরক্ষণ করুন',
    restore: 'ডেটা পুনরুদ্ধার করুন',
    restoreSub: 'JSON ফাইল থেকে লোড করুন',
    clearData: 'সব ডেটা মুছুন',
    clearSub: 'স্থায়ীভাবে সরিয়ে ফেলবে',
    about: 'অ্যাপ সম্পর্কে',
    version: 'সংস্করণ ১.০.০ · লোকাল-ফার্স্ট',
    storageUsed: 'স্টোরেজ ব্যবহার',
    localNote: 'সমস্ত ডেটা শুধু আপনার ডিভাইসে সংরক্ষিত। কোনো সার্ভারে পাঠানো হয় না।',
    backupTitle: 'ব্যাকআপ করুন',
    backupBody: 'সমস্ত ডেটা একটি JSON ফাইলে সংরক্ষিত হবে।',
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
    namazReminder: 'Prayer Reminders',
    namazSub: 'Notify at prayer times',
    security: 'Security',
    pinLock: 'PIN Lock',
    pinActive: 'Active ✓',
    pinInactive: 'Disabled',
    dataManage: 'Data Management',
    backup: 'Backup',
    backupSub: 'Save to JSON file',
    restore: 'Restore Data',
    restoreSub: 'Load from JSON file',
    clearData: 'Clear All Data',
    clearSub: 'Permanently remove',
    about: 'About',
    version: 'Version 1.0.0 · Local-first',
    storageUsed: 'Storage used',
    localNote: 'All data is stored only on your device. No data is sent to any server.',
    backupTitle: 'Backup',
    backupBody: 'All data will be saved as a JSON file.',
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
  }
}

// ==================== Helper ====================
function hashPin(pin: string): string {
  let hash = 0
  for (let i = 0; i < pin.length; i++) {
    const c = pin.charCodeAt(i)
    hash = (hash << 5) - hash + c
    hash |= 0
  }
  return String(hash)
}

function getStorageSize(): string {
  let total = 0
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && (key.startsWith('amar') || key.startsWith('money'))) {
      total += (localStorage.getItem(key) || '').length
    }
  }
  const kb = (total / 1024).toFixed(1)
  return `${kb} KB`
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
    notificationsEnabled,
    update
  } = useSettingsStore()

  const t = translations[language]

  const [showPinSetup, setShowPinSetup] = useState(false)
  const [showPinDisable, setShowPinDisable] = useState(false)
  const [showBackupModal, setShowBackupModal] = useState(false)
  const [showRestoreModal, setShowRestoreModal] = useState(false)
  const [showClearModal, setShowClearModal] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2800)
  }

  const handleBackup = () => {
    const allKeys = ['money_transactions', 'money_loans', 'amar-zone-tasks', 'amar-zone-namaz', 'amar-zone-settings']
    const backup: Record<string, any> = { _version: 1, _date: new Date().toISOString() }
    allKeys.forEach(k => {
      const v = localStorage.getItem(k)
      if (v) backup[k] = JSON.parse(v)
    })
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `amar-zone-backup-${new Date().toISOString().split('T')[0]}.json`
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
    const keys = ['money_transactions', 'money_loans', 'amar-zone-tasks', 'amar-zone-namaz']
    keys.forEach(k => localStorage.removeItem(k))
    showToast(t.toastDataCleared)
    setShowClearModal(false)
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
            label={t.namazReminder}
            sub={t.namazSub}
            value={notificationsEnabled}
            onChange={v => update({ notificationsEnabled: v })}
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
        </Section>

        {/* Data Management */}
        <Section icon={<Download size={15} />} title={t.dataManage}>
          <RowArrow label={t.backup} sub={t.backupSub} onClick={() => setShowBackupModal(true)} />
          <div className="st-divider" />
          <RowArrow label={t.restore} sub={t.restoreSub} onClick={() => setShowRestoreModal(true)} />
          <div className="st-divider" />
          <RowArrow label={t.clearData} sub={t.clearSub} danger onClick={() => setShowClearModal(true)} />
        </Section>

        {/* About */}
        <Section icon={<Info size={15} />} title={t.about}>
          <div className="st-about-card">
            <div className="st-about-logo">AZ</div>
            <div>
              <p className="st-about-name">Amar Zone</p>
              <p className="st-about-ver">{t.version}</p>
            </div>
          </div>
          <div className="st-divider" />
          <RowArrow label={t.storageUsed} sub={getStorageSize()} onClick={() => {}} noArrow />
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
          onClose={() => setShowPinSetup(false)}
          onSave={(pin) => {
            update({ pinEnabled: true, pinHash: hashPin(pin) })
            showToast(translations[language].toastPinSet)
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
            update({ pinEnabled: false, pinHash: undefined })
            showToast(translations[language].toastPinRemoved)
            setShowPinDisable(false)
          }}
        />
      )}
      {showBackupModal && (
        <ConfirmModal
          language={language}
          title={t.backupTitle}
          body={t.backupBody}
          confirmLabel={t.backupConfirm}
          confirmClass="mo-submit--neu"
          onConfirm={handleBackup}
          onClose={() => setShowBackupModal(false)}
          icon={<Download size={22} />}
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

      {toast && <div className="st-toast">{toast}</div>}

      <style>{CSS}</style>
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

// ==================== CSS ====================
const CSS = `
.st-root {
  --bg-primary: rgb(var(--bg));
  --bg-secondary: rgb(var(--card));
  --surface: rgb(var(--card));
  --text-primary: rgb(var(--fg));
  --text-secondary: rgb(var(--fg));
  --text-muted: rgb(var(--muted));
  --border: rgb(var(--border));
  --accent: #4ade80;
  --accent-glow: #4ade8040;
  --danger: #f87171;
  min-height: 100%;
  background: var(--bg-primary, #080c14);
  color: var(--text-primary, #e8eaf0);
  font-family: 'Siyam Rupali', 'Noto Sans Bengali', system-ui, sans-serif;
}

/* Professional light-mode palette */
html:not(.dark) .st-root {
  --bg-primary: #f6f8fc;
  --bg-secondary: #ffffff;
  --surface: #f8fbff;
  --text-primary: #0f172a;
  --text-secondary: #1f2937;
  --text-muted: #64748b;
  --border: #dbe3ef;
  --accent: #2563eb;
  --accent-glow: #2563eb22;
}

html:not(.dark) .st-header-bg {
  background: radial-gradient(ellipse 100% 120% at 0% 0%, #dce7ff 0%, var(--bg-primary) 68%);
}

html:not(.dark) .st-section {
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.04);
}

html:not(.dark) .st-row-btn:active {
  background: #f1f5ff;
}

html:not(.dark) .st-theme-btn {
  background: #fbfdff;
}

html:not(.dark) .st-theme-btn--on,
html:not(.dark) .st-toggle-opt--on {
  background: #eff6ff;
  border-color: #bfdbfe;
  color: #1d4ed8;
}

html:not(.dark) .st-theme-check {
  color: #ffffff;
}

html:not(.dark) .st-switch--on {
  background: #bfdbfe;
}

html:not(.dark) .st-switch--on .st-switch-thumb {
  background: #2563eb;
}

html:not(.dark) .st-about-logo {
  background: linear-gradient(135deg, #eaf2ff, #dbeafe);
  border-color: #bfdbfe;
  color: #1d4ed8;
}

html:not(.dark) .st-toast {
  background: #f8fbff;
  border-color: #bfdbfe;
  color: #1d4ed8;
}

html:not(.dark) .st-file-label {
  background: #eff6ff;
  border-color: #bfdbfe;
  color: #1d4ed8;
}

html:not(.dark) .st-file-label:active {
  background: #dbeafe;
}

html:not(.dark) .mo-backdrop {
  background: rgba(15, 23, 42, 0.45);
}

html:not(.dark) .mo-sheet {
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
}

html:not(.dark) .mo-submit--neu {
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  color: #ffffff;
}

@media (hover: hover) and (pointer: fine) {
  html:not(.dark) .mo-close:hover {
    background: #eff6ff;
    border-color: #bfdbfe;
    color: #1d4ed8;
  }

  html:not(.dark) .st-eye:hover {
    background: #eff6ff;
    border-color: #bfdbfe;
    color: #2563eb;
  }

  html:not(.dark) .st-file-label:hover {
    background: #dbeafe;
    border-color: #93c5fd;
    box-shadow: 0 10px 24px rgba(37, 99, 235, 0.18);
  }

  html:not(.dark) .mo-submit--neu:hover {
    box-shadow: 0 12px 26px rgba(37, 99, 235, 0.28);
  }

  html:not(.dark) .mo-submit--exp:hover {
    box-shadow: 0 12px 26px rgba(231, 76, 60, 0.24);
  }

  html:not(.dark) .mo-submit--cancel:hover {
    background: #eef2f7;
    color: #1f2937;
    box-shadow: 0 10px 22px rgba(15, 23, 42, 0.1);
  }
}

.st-header {
  position: relative;
  overflow: hidden;
  padding-bottom: 4px;
}
.st-header-bg {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse 100% 120% at 0% 0%, #1a2d1a 0%, var(--bg-primary) 65%);
}
.st-header-inner {
  position: relative;
  z-index: 1;
  padding: 32px 20px 24px;
}
.st-header-eyebrow {
  font-size: 10px;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--accent, #4ade80);
  opacity: 0.7;
  margin-bottom: 6px;
}
.st-header-title {
  font-size: 32px;
  font-weight: 800;
  color: var(--text-primary, #e8f4f0);
  letter-spacing: -1px;
  line-height: 1;
}
.st-header-sub {
  font-size: 13px;
  color: var(--text-muted, #556677);
  margin-top: 6px;
}

.st-body {
  padding: 8px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.st-section {
  background: var(--bg-secondary, #0f1520);
  border: 1px solid var(--border, #1a2535);
  border-radius: 20px;
  overflow: hidden;
  animation: stFade 0.35s ease-out both;
}
.st-section-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 13px 16px 11px;
  border-bottom: 1px solid var(--border, #1a2535);
}
.st-section-icon {
  color: var(--accent, #4ade80);
  opacity: 0.8;
  display: flex;
}
.st-section-title {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  color: var(--text-muted, #556677);
}

.st-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  width: 100%;
  text-align: left;
  background: transparent;
  border: none;
  cursor: default;
}
.st-row-btn {
  cursor: pointer;
  transition: background 0.15s;
}
.st-row-btn:active {
  background: var(--surface, #0a1018);
}
.st-row--danger:active {
  background: #1a0810;
}
.st-row-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.st-row-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary, #b8c8d8);
}
.st-row-sub {
  font-size: 11px;
  color: var(--text-muted, #556677);
}
.st-label--danger {
  color: var(--danger, #f87171) !important;
}
.st-label--accent {
  color: var(--accent, #4ade80) !important;
}
.st-row-arrow {
  color: var(--text-muted, #556677);
  flex-shrink: 0;
}

.st-divider {
  height: 1px;
  background: var(--border, #1a2535);
  margin: 0 16px;
}

.st-theme-grid {
  display: flex;
  gap: 10px;
  padding: 14px 16px;
}
.st-theme-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 14px 8px;
  border-radius: 14px;
  border: 1.5px solid var(--border, #1a2535);
  background: var(--bg-primary, #080c14);
  color: var(--text-muted, #556677);
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}
.st-theme-btn--on {
  border-color: var(--accent-glow, #4ade8060);
  background: var(--accent-glow, #0f2018);
  color: var(--accent, #4ade80);
}
.st-theme-icon {
  font-size: 20px;
  display: flex;
}
.st-theme-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.3px;
}
.st-theme-check {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--accent, #4ade80);
  color: var(--bg-primary, #080c14);
  display: flex;
  align-items: center;
  justify-content: center;
}

.st-toggle {
  display: flex;
  background: var(--bg-primary, #080c14);
  border: 1px solid var(--border, #1a2535);
  border-radius: 10px;
  overflow: hidden;
}
.st-toggle-opt {
  padding: 7px 12px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-muted, #556677);
  border: none;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s;
}
.st-toggle-opt--on {
  background: var(--accent-glow, #0f2018);
  color: var(--accent, #4ade80);
}

.st-switch {
  width: 44px;
  height: 26px;
  border-radius: 999px;
  background: var(--border, #1a2535);
  border: none;
  cursor: pointer;
  position: relative;
  transition: background 0.3s;
  flex-shrink: 0;
}
.st-switch--on {
  background: var(--accent-glow, #4ade8080);
}
.st-switch-thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--text-muted, #556677);
  transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1), background 0.3s;
}
.st-switch--on .st-switch-thumb {
  transform: translateX(18px);
  background: var(--accent, #4ade80);
}

.st-about-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
}
.st-about-logo {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: linear-gradient(135deg, #0f2018, #1a3828);
  border: 1px solid var(--accent-glow, #4ade8030);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 800;
  color: var(--accent, #4ade80);
  letter-spacing: -0.5px;
}
.st-about-name {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-secondary, #b8c8d8);
}
.st-about-ver {
  font-size: 11px;
  color: var(--text-muted, #556677);
  margin-top: 2px;
}
.st-local-note {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px 16px;
  font-size: 12px;
  color: var(--text-muted, #556677);
  line-height: 1.5;
}

.st-toast {
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--bg-secondary, #0f2018);
  border: 1px solid var(--accent-glow, #4ade8040);
  color: var(--accent, #4ade80);
  font-size: 13px;
  font-weight: 500;
  padding: 10px 20px;
  border-radius: 999px;
  white-space: nowrap;
  z-index: 1000;
  animation: toastIn 0.3s cubic-bezier(0.34,1.56,0.64,1);
}
@keyframes toastIn {
  from { transform: translateX(-50%) translateY(20px); opacity: 0; }
  to { transform: translateX(-50%) translateY(0); opacity: 1; }
}

.st-pin-wrap { }
.st-pin-hint {
  font-size: 13px;
  color: var(--text-muted, #556677);
  margin-bottom: 14px;
}
.st-pin-input-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}
.st-pin-input-row .mo-inp {
  margin-bottom: 0;
  flex: 1;
  letter-spacing: 4px;
  font-size: 20px;
}
.st-eye {
  width: 40px;
  height: 46px;
  background: var(--bg-secondary, #0f1520);
  border: 1.5px solid var(--border, #1a2535);
  border-radius: 12px;
  color: var(--text-muted, #556677);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.2s, border-color 0.2s, color 0.2s, transform 0.2s;
}
.st-error {
  font-size: 12px;
  color: var(--danger, #f87171);
  margin-bottom: 12px;
}

.st-confirm-body {
  text-align: center;
  padding: 12px 0 20px;
}
.st-confirm-icon {
  width: 56px;
  height: 56px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 14px;
}
.st-confirm-icon--gold {
  background: #c9a84c18;
  color: #c9a84c;
  border: 1px solid #c9a84c30;
}
.st-confirm-icon--danger {
  background: var(--danger, #ef4444)18;
  color: var(--danger, #f87171);
  border: 1px solid var(--danger, #ef4444)30;
}
.st-confirm-text {
  font-size: 14px;
  color: var(--text-muted, #667788);
  line-height: 1.6;
}

.st-restore-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 0 20px;
  gap: 12px;
}
.st-restore-icon {
  color: #c9a84c;
}
.st-restore-text {
  font-size: 14px;
  color: var(--text-muted, #667788);
}
.st-file-label {
  padding: 12px 24px;
  border-radius: 12px;
  background: #c9a84c18;
  border: 1.5px solid #c9a84c40;
  color: #c9a84c;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, transform 0.2s, box-shadow 0.2s, border-color 0.2s;
}
.st-file-label:active {
  background: #c9a84c25;
}
.st-restore-warn {
  font-size: 12px;
  color: var(--danger, #f87171);
}

.mo-backdrop {
  position: fixed;
  inset: 0;
  z-index: 300;
  background: rgba(4,7,12,0.85);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  animation: stFade 0.2s ease-out;
}
.mo-sheet {
  width: min(100%, 480px);
  background: linear-gradient(180deg, var(--bg-secondary, #0f1520) 0%, var(--surface, #0a1018) 100%);
  border: 1px solid var(--border, #1a2535);
  border-radius: 20px;
  padding: 8px 20px 20px;
  max-height: min(90vh, 720px);
  overflow-y: auto;
  animation: moZoomIn 0.22s cubic-bezier(0.2, 0.9, 0.3, 1);
}
.mo-notch {
  width: 36px;
  height: 4px;
  background: var(--text-muted, #1e2d40);
  border-radius: 999px;
  margin: 10px auto 18px;
}
.mo-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}
.mo-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary, #dde8f4);
}
.mo-close {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: var(--border, #1a2535);
  border: 1px solid var(--text-muted, #243040);
  color: var(--text-secondary, #556677);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s, color 0.2s, transform 0.2s;
}
.mo-inp {
  display: block;
  width: 100%;
  background: var(--bg-secondary, #0f1520);
  border: 1.5px solid var(--border, #1a2535);
  border-radius: 12px;
  padding: 13px 15px;
  color: var(--text-secondary, #c8d4e0);
  font-size: 14px;
  outline: none;
  margin-bottom: 10px;
  transition: border-color 0.2s;
  box-sizing: border-box;
}
.mo-inp:focus {
  border-color: var(--accent-glow, #4ade8060);
}
.mo-submit {
  width: 100%;
  padding: 15px;
  border-radius: 14px;
  font-size: 15px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: transform 0.2s, opacity 0.2s, box-shadow 0.2s, filter 0.2s;
}
.mo-submit:active {
  transform: scale(0.97);
}
.mo-submit--neu {
  background: linear-gradient(135deg, #c9a84c, #e8c56a);
  color: #080c14;
}
.mo-submit--exp {
  background: linear-gradient(135deg, #c0392b, #e74c3c);
  color: white;
}
.mo-submit--cancel {
  background: var(--border, #1a2535);
  color: var(--text-muted, #556677);
}

@media (hover: hover) and (pointer: fine) {
  .mo-close:hover {
    background: color-mix(in srgb, var(--border, #1a2535) 75%, white 25%);
    border-color: color-mix(in srgb, var(--border, #1a2535) 60%, var(--accent, #4ade80) 40%);
    color: var(--text-primary, #e8eaf0);
    transform: translateY(-1px);
  }

  .st-eye:hover {
    background: color-mix(in srgb, var(--bg-secondary, #0f1520) 80%, white 20%);
    border-color: color-mix(in srgb, var(--border, #1a2535) 60%, var(--accent, #4ade80) 40%);
    color: var(--accent, #4ade80);
  }

  .st-file-label:hover {
    background: #c9a84c24;
    border-color: #c9a84c66;
    box-shadow: 0 8px 20px rgba(201, 168, 76, 0.16);
    transform: translateY(-1px);
  }

  .mo-submit:hover {
    transform: translateY(-1px);
    filter: saturate(1.05);
  }

  .mo-submit--neu:hover {
    box-shadow: 0 10px 24px rgba(201, 168, 76, 0.28);
  }

  .mo-submit--exp:hover {
    box-shadow: 0 10px 24px rgba(231, 76, 60, 0.28);
  }

  .mo-submit--cancel:hover {
    background: color-mix(in srgb, var(--border, #1a2535) 72%, white 28%);
    color: var(--text-primary, #e8eaf0);
    box-shadow: 0 8px 18px rgba(15, 23, 42, 0.18);
  }
}
@keyframes stFade {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes moSlide {
  from { transform: translateY(80px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
@keyframes moZoomIn {
  from { transform: translateY(8px) scale(0.98); opacity: 0; }
  to { transform: translateY(0) scale(1); opacity: 1; }
}
`

export const dynamic = 'force-dynamic'
