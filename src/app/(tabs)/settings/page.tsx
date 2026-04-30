'use client'

import { useState, useEffect } from 'react'
import {
  Sun, Moon, Monitor, Globe, Lock, Download,
  Upload, Trash2, ChevronRight, Check, Shield,
  Smartphone, Info, Palette, Bell, Eye, EyeOff, X
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────
type Theme = 'light' | 'dark' | 'system'
type Language = 'bn' | 'en'

interface AppSettings {
  theme: Theme
  language: Language
  currency: 'BDT' | 'USD'
  currency_symbol: string
  pinEnabled: boolean
  pinHash?: string
  onboardingComplete: boolean
  notificationsEnabled: boolean
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  language: 'bn',
  currency: 'BDT',
  currency_symbol: '৳',
  pinEnabled: false,
  onboardingComplete: true,
  notificationsEnabled: true,
}

// ─── Store ───────────────────────────────────────────────
function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('amar-zone-settings')
    if (saved) {
      try { setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) }) }
      catch { setSettings(DEFAULT_SETTINGS) }
    }
    setReady(true)
  }, [])

  const update = (patch: Partial<AppSettings>) => {
    const next = { ...settings, ...patch }
    setSettings(next)
    localStorage.setItem('amar-zone-settings', JSON.stringify(next))
    // Apply theme immediately
    if (patch.theme) applyTheme(patch.theme)
  }

  return { settings, update, ready }
}

function applyTheme(theme: Theme) {
  const root = document.documentElement
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const isDark = theme === 'dark' || (theme === 'system' && prefersDark)
  root.classList.toggle('dark', isDark)
}

// ─── Helpers ─────────────────────────────────────────────
function hashPin(pin: string): string {
  let hash = 0
  for (let i = 0; i < pin.length; i++) {
    const c = pin.charCodeAt(i)
    hash = (hash << 5) - hash + c
    hash |= 0
  }
  return String(hash)
}

// ─── Main Page ───────────────────────────────────────────
export default function SettingsPage() {
  const { settings, update, ready } = useSettings()
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
    showToast('ব্যাকআপ সংরক্ষিত হয়েছে ✓')
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
        showToast('ডেটা পুনরুদ্ধার হয়েছে। রিফ্রেশ করুন।')
        setShowRestoreModal(false)
      } catch {
        showToast('ফাইল পড়তে সমস্যা হয়েছে')
      }
    }
    reader.readAsText(file)
  }

  const handleClearData = () => {
    const keys = ['money_transactions', 'money_loans', 'amar-zone-tasks', 'amar-zone-namaz']
    keys.forEach(k => localStorage.removeItem(k))
    showToast('সব ডেটা মুছে ফেলা হয়েছে')
    setShowClearModal(false)
  }

  if (!ready) return null

  return (
    <div className="st-root">
      {/* Header */}
      <div className="st-header">
        <div className="st-header-bg" />
        <div className="st-header-inner">
          <p className="st-header-eyebrow">কাস্টমাইজ করুন</p>
          <h1 className="st-header-title">সেটিংস</h1>
          <p className="st-header-sub">অ্যাপের পছন্দ ও ডেটা নিয়ন্ত্রণ করুন</p>
        </div>
      </div>

      <div className="st-body">

        {/* ─ Theme ───────────────────────────────────────── */}
        <Section icon={<Palette size={15} />} title="থিম">
          <div className="st-theme-grid">
            {([
              { val: 'light' as Theme, icon: <Sun size={18} />, label: 'আলো' },
              { val: 'dark' as Theme,  icon: <Moon size={18} />, label: 'অন্ধকার' },
              { val: 'system' as Theme, icon: <Monitor size={18} />, label: 'সিস্টেম' },
            ]).map(({ val, icon, label }) => (
              <button
                key={val}
                className={`st-theme-btn ${settings.theme === val ? 'st-theme-btn--on' : ''}`}
                onClick={() => update({ theme: val })}
              >
                <span className="st-theme-icon">{icon}</span>
                <span className="st-theme-label">{label}</span>
                {settings.theme === val && <span className="st-theme-check"><Check size={10} /></span>}
              </button>
            ))}
          </div>
        </Section>

        {/* ─ Language ────────────────────────────────────── */}
        <Section icon={<Globe size={15} />} title="ভাষা ও মুদ্রা">
          <RowToggle
            label="ভাষা"
            left="বাংলা" right="English"
            active={settings.language === 'bn'}
            onLeft={() => update({ language: 'bn' })}
            onRight={() => update({ language: 'en' })}
          />
          <div className="st-divider" />
          <RowToggle
            label="মুদ্রা"
            left="৳ BDT" right="$ USD"
            active={settings.currency === 'BDT'}
            onLeft={() => update({ currency: 'BDT', currency_symbol: '৳' })}
            onRight={() => update({ currency: 'USD', currency_symbol: '$' })}
          />
        </Section>

        {/* ─ Notifications ───────────────────────────────── */}
        <Section icon={<Bell size={15} />} title="নোটিফিকেশন">
          <RowSwitch
            label="নামাজের রিমাইন্ডার"
            sub="সময় হলে জানাবে"
            value={settings.notificationsEnabled}
            onChange={v => update({ notificationsEnabled: v })}
          />
        </Section>

        {/* ─ Security ────────────────────────────────────── */}
        <Section icon={<Shield size={15} />} title="নিরাপত্তা">
          <RowArrow
            label="PIN লক"
            sub={settings.pinEnabled ? 'সক্রিয় আছে ✓' : 'নিষ্ক্রিয়'}
            accent={settings.pinEnabled}
            onClick={() => settings.pinEnabled ? setShowPinDisable(true) : setShowPinSetup(true)}
          />
        </Section>

        {/* ─ Data ────────────────────────────────────────── */}
        <Section icon={<Download size={15} />} title="ডেটা ব্যবস্থাপনা">
          <RowArrow
            label="ব্যাকআপ করুন"
            sub="JSON ফাইলে সংরক্ষণ করুন"
            onClick={() => setShowBackupModal(true)}
          />
          <div className="st-divider" />
          <RowArrow
            label="ডেটা পুনরুদ্ধার করুন"
            sub="JSON ফাইল থেকে লোড করুন"
            onClick={() => setShowRestoreModal(true)}
          />
          <div className="st-divider" />
          <RowArrow
            label="সব ডেটা মুছুন"
            sub="স্থায়ীভাবে সরিয়ে ফেলবে"
            danger
            onClick={() => setShowClearModal(true)}
          />
        </Section>

        {/* ─ About ───────────────────────────────────────── */}
        <Section icon={<Info size={15} />} title="অ্যাপ সম্পর্কে">
          <div className="st-about-card">
            <div className="st-about-logo">AZ</div>
            <div>
              <p className="st-about-name">Amar Zone</p>
              <p className="st-about-ver">সংস্করণ ১.০.০ · লোকাল-ফার্স্ট</p>
            </div>
          </div>
          <div className="st-divider" />
          <RowArrow label="স্টোরেজ ব্যবহার" sub={getStorageSize()} onClick={() => {}} noArrow />
          <div className="st-divider" />
          <div className="st-local-note">
            <Lock size={11} />
            সমস্ত ডেটা শুধু আপনার ডিভাইসে সংরক্ষিত। কোনো সার্ভারে পাঠানো হয় না।
          </div>
        </Section>

        <div style={{ height: 40 }} />
      </div>

      {/* ─── Modals ──────────────────────────────────────── */}
      {showPinSetup && <PinSetupModal onClose={() => setShowPinSetup(false)} onSave={(pin) => { update({ pinEnabled: true, pinHash: hashPin(pin) }); showToast('PIN সেট হয়েছে ✓'); setShowPinSetup(false) }} />}
      {showPinDisable && <PinDisableModal pinHash={settings.pinHash} onClose={() => setShowPinDisable(false)} onConfirm={() => { update({ pinEnabled: false, pinHash: undefined }); showToast('PIN মুছে ফেলা হয়েছে'); setShowPinDisable(false) }} />}

      {showBackupModal && (
        <ConfirmModal
          title="ব্যাকআপ করুন"
          body="সমস্ত ডেটা একটি JSON ফাইলে সংরক্ষিত হবে।"
          confirmLabel="ডাউনলোড করুন" confirmClass="mo-submit--neu"
          onConfirm={handleBackup} onClose={() => setShowBackupModal(false)}
          icon={<Download size={22} />}
        />
      )}

      {showRestoreModal && (
        <RestoreModal onClose={() => setShowRestoreModal(false)} onRestore={handleRestore} />
      )}

      {showClearModal && (
        <ConfirmModal
          title="সব ডেটা মুছুন?"
          body="এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না। সমস্ত লেনদেন, ধার, এবং নামাজের রেকর্ড মুছে যাবে।"
          confirmLabel="মুছে ফেলুন" confirmClass="mo-submit--exp"
          onConfirm={handleClearData} onClose={() => setShowClearModal(false)}
          icon={<Trash2 size={22} />} danger
        />
      )}

      {/* Toast */}
      {toast && <div className="st-toast">{toast}</div>}

      <style>{CSS}</style>
    </div>
  )
}

// ─── Utility ─────────────────────────────────────────────
function getStorageSize(): string {
  let total = 0
  for (let k in localStorage) {
    if (localStorage.hasOwnProperty(k) && k.startsWith('amar') || k.startsWith('money')) {
      total += (localStorage.getItem(k) || '').length
    }
  }
  const kb = (total / 1024).toFixed(1)
  return `~${kb} KB ব্যবহৃত`
}

// ─── Sub-components ───────────────────────────────────────
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

// ─── Modals ───────────────────────────────────────────────
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

function PinSetupModal({ onClose, onSave }: { onClose: () => void; onSave: (pin: string) => void }) {
  const [step, setStep] = useState<'enter' | 'confirm'>('enter')
  const [pin, setPin] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')

  const handleNext = () => {
    if (pin.length < 4) { setError('কমপক্ষে ৪ সংখ্যা দিন'); return }
    setStep('confirm'); setError('')
  }
  const handleConfirm = () => {
    if (pin !== confirm) { setError('PIN মেলেনি'); return }
    onSave(pin)
  }

  return (
    <ModalShell title="PIN সেট করুন" onClose={onClose}>
      <div className="st-pin-wrap">
        {step === 'enter' ? (
          <>
            <p className="st-pin-hint">নতুন PIN দিন (কমপক্ষে ৪ সংখ্যা)</p>
            <div className="st-pin-input-row">
              <input className="mo-inp" type={show ? 'text' : 'password'} inputMode="numeric" maxLength={8} placeholder="••••" value={pin} onChange={e => setPin(e.target.value.replace(/\D/, ''))} autoFocus />
              <button className="st-eye" onClick={() => setShow(!show)}>{show ? <EyeOff size={16} /> : <Eye size={16} />}</button>
            </div>
            {error && <p className="st-error">{error}</p>}
            <button className="mo-submit mo-submit--neu" onClick={handleNext}>পরবর্তী</button>
          </>
        ) : (
          <>
            <p className="st-pin-hint">আবার PIN দিন (নিশ্চিত করুন)</p>
            <input className="mo-inp" type={show ? 'text' : 'password'} inputMode="numeric" maxLength={8} placeholder="••••" value={confirm} onChange={e => setConfirm(e.target.value.replace(/\D/, ''))} autoFocus />
            {error && <p className="st-error">{error}</p>}
            <button className="mo-submit mo-submit--neu" onClick={handleConfirm}>সংরক্ষণ করুন</button>
          </>
        )}
      </div>
    </ModalShell>
  )
}

function PinDisableModal({ pinHash, onClose, onConfirm }: { pinHash?: string; onClose: () => void; onConfirm: () => void }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const handleCheck = () => {
    if (hashPin(pin) === pinHash) onConfirm()
    else setError('ভুল PIN')
  }
  return (
    <ModalShell title="PIN বন্ধ করুন" onClose={onClose}>
      <p className="st-pin-hint">বর্তমান PIN দিয়ে নিশ্চিত করুন</p>
      <input className="mo-inp" type="password" inputMode="numeric" maxLength={8} placeholder="••••" value={pin} onChange={e => setPin(e.target.value.replace(/\D/, ''))} autoFocus />
      {error && <p className="st-error">{error}</p>}
      <button className="mo-submit mo-submit--exp" onClick={handleCheck}>PIN বন্ধ করুন</button>
    </ModalShell>
  )
}

function ConfirmModal({ title, body, confirmLabel, confirmClass, onConfirm, onClose, icon, danger }: { title: string; body: string; confirmLabel: string; confirmClass: string; onConfirm: () => void; onClose: () => void; icon?: React.ReactNode; danger?: boolean }) {
  return (
    <ModalShell title={title} onClose={onClose}>
      <div className="st-confirm-body">
        {icon && <div className={`st-confirm-icon ${danger ? 'st-confirm-icon--danger' : 'st-confirm-icon--gold'}`}>{icon}</div>}
        <p className="st-confirm-text">{body}</p>
      </div>
      <button className={`mo-submit ${confirmClass}`} onClick={onConfirm}>{confirmLabel}</button>
      <button className="mo-submit mo-submit--cancel" onClick={onClose} style={{ marginTop: 8 }}>বাতিল করুন</button>
    </ModalShell>
  )
}

function RestoreModal({ onClose, onRestore }: { onClose: () => void; onRestore: (f: File) => void }) {
  return (
    <ModalShell title="ডেটা পুনরুদ্ধার করুন" onClose={onClose}>
      <div className="st-restore-body">
        <Upload size={30} className="st-restore-icon" />
        <p className="st-restore-text">ব্যাকআপ JSON ফাইল নির্বাচন করুন</p>
        <label className="st-file-label">
          ফাইল নির্বাচন করুন
          <input type="file" accept=".json" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) onRestore(f) }} />
        </label>
        <p className="st-restore-warn">⚠ বিদ্যমান ডেটা প্রতিস্থাপিত হবে</p>
      </div>
    </ModalShell>
  )
}

// ─── CSS ──────────────────────────────────────────────────
const CSS = `
/* root */
.st-root { min-height: 100%; background: #080c14; color: #e8eaf0; font-family: 'Siyam Rupali', 'Noto Sans Bengali', system-ui, sans-serif; }

/* header */
.st-header { position: relative; overflow: hidden; padding-bottom: 4px; }
.st-header-bg { position: absolute; inset: 0; background: radial-gradient(ellipse 100% 120% at 0% 0%, #1a2d1a 0%, #080c14 65%); }
.st-header-inner { position: relative; z-index: 1; padding: 32px 20px 24px; }
.st-header-eyebrow { font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: #4ade80; opacity: 0.7; margin-bottom: 6px; }
.st-header-title { font-size: 32px; font-weight: 800; color: #e8f4f0; letter-spacing: -1px; line-height: 1; }
.st-header-sub { font-size: 13px; color: #334a3a; margin-top: 6px; }

/* body */
.st-body { padding: 8px 16px; display: flex; flex-direction: column; gap: 10px; }

/* section */
.st-section {
  background: #0f1520; border: 1px solid #1a2535; border-radius: 20px; overflow: hidden;
  animation: stFade 0.35s ease-out both;
}
.st-section-head {
  display: flex; align-items: center; gap: 8px;
  padding: 13px 16px 11px;
  border-bottom: 1px solid #1a2535;
}
.st-section-icon { color: #4ade80; opacity: 0.8; display: flex; }
.st-section-title { font-size: 11px; font-weight: 700; letter-spacing: 1.2px; text-transform: uppercase; color: #3a5a4a; }
.st-section-body { }

/* row */
.st-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 16px; width: 100%; text-align: left;
  background: transparent; border: none; cursor: default;
}
.st-row-btn { cursor: pointer; transition: background 0.15s; }
.st-row-btn:active { background: #0a1018; }
.st-row--danger:active { background: #1a0810; }
.st-row-info { display: flex; flex-direction: column; gap: 3px; }
.st-row-label { font-size: 14px; font-weight: 500; color: #b8c8d8; }
.st-row-sub { font-size: 11px; color: #334455; }
.st-label--danger { color: #f87171 !important; }
.st-label--accent { color: #4ade80 !important; }
.st-row-arrow { color: #2a3d4a; flex-shrink: 0; }

.st-divider { height: 1px; background: #1a2535; margin: 0 16px; }

/* theme grid */
.st-theme-grid { display: flex; gap: 10px; padding: 14px 16px; }
.st-theme-btn {
  flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px;
  padding: 14px 8px; border-radius: 14px;
  border: 1.5px solid #1a2535; background: #080c14;
  color: #445566; cursor: pointer; transition: all 0.2s;
  position: relative;
}
.st-theme-btn--on { border-color: #4ade8060; background: #0f2018; color: #4ade80; }
.st-theme-icon { font-size: 20px; display: flex; }
.st-theme-label { font-size: 11px; font-weight: 600; letter-spacing: 0.3px; }
.st-theme-check {
  position: absolute; top: 6px; right: 6px;
  width: 16px; height: 16px; border-radius: 50%;
  background: #4ade80; color: #080c14;
  display: flex; align-items: center; justify-content: center;
}

/* toggle */
.st-toggle { display: flex; background: #080c14; border: 1px solid #1a2535; border-radius: 10px; overflow: hidden; }
.st-toggle-opt { padding: 7px 12px; font-size: 12px; font-weight: 500; color: #445566; border: none; background: transparent; cursor: pointer; transition: all 0.2s; }
.st-toggle-opt--on { background: #0f2018; color: #4ade80; }

/* switch */
.st-switch {
  width: 44px; height: 26px; border-radius: 999px;
  background: #1a2535; border: none; cursor: pointer;
  position: relative; transition: background 0.3s; flex-shrink: 0;
}
.st-switch--on { background: #4ade8080; }
.st-switch-thumb {
  position: absolute; top: 3px; left: 3px;
  width: 20px; height: 20px; border-radius: 50%;
  background: #445566; transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1), background 0.3s;
}
.st-switch--on .st-switch-thumb { transform: translateX(18px); background: #4ade80; }

/* about */
.st-about-card { display: flex; align-items: center; gap: 14px; padding: 14px 16px; }
.st-about-logo {
  width: 44px; height: 44px; border-radius: 14px;
  background: linear-gradient(135deg, #0f2018, #1a3828);
  border: 1px solid #4ade8030;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; font-weight: 800; color: #4ade80; letter-spacing: -0.5px;
}
.st-about-name { font-size: 15px; font-weight: 700; color: #b8c8d8; }
.st-about-ver { font-size: 11px; color: #334455; margin-top: 2px; }
.st-local-note {
  display: flex; align-items: flex-start; gap: 8px;
  padding: 12px 16px; font-size: 12px; color: #334455; line-height: 1.5;
}

/* toast */
.st-toast {
  position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%);
  background: #0f2018; border: 1px solid #4ade8040;
  color: #4ade80; font-size: 13px; font-weight: 500;
  padding: 10px 20px; border-radius: 999px;
  white-space: nowrap; z-index: 1000;
  animation: toastIn 0.3s cubic-bezier(0.34,1.56,0.64,1);
}
@keyframes toastIn { from { transform: translateX(-50%) translateY(20px); opacity: 0; } to { transform: translateX(-50%) translateY(0); opacity: 1; } }

/* pin modal */
.st-pin-wrap { }
.st-pin-hint { font-size: 13px; color: #556677; margin-bottom: 14px; }
.st-pin-input-row { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.st-pin-input-row .mo-inp { margin-bottom: 0; flex: 1; letter-spacing: 4px; font-size: 20px; }
.st-eye { width: 40px; height: 46px; background: #0f1520; border: 1.5px solid #1a2535; border-radius: 12px; color: #556677; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; }
.st-error { font-size: 12px; color: #f87171; margin-bottom: 12px; }

/* confirm modal */
.st-confirm-body { text-align: center; padding: 12px 0 20px; }
.st-confirm-icon { width: 56px; height: 56px; border-radius: 18px; display: flex; align-items: center; justify-content: center; margin: 0 auto 14px; }
.st-confirm-icon--gold { background: #c9a84c18; color: #c9a84c; border: 1px solid #c9a84c30; }
.st-confirm-icon--danger { background: #ef444418; color: #f87171; border: 1px solid #ef444430; }
.st-confirm-text { font-size: 14px; color: #667788; line-height: 1.6; }

/* restore modal */
.st-restore-body { display: flex; flex-direction: column; align-items: center; padding: 16px 0 20px; gap: 12px; }
.st-restore-icon { color: #c9a84c; }
.st-restore-text { font-size: 14px; color: #667788; }
.st-file-label {
  padding: 12px 24px; border-radius: 12px;
  background: #c9a84c18; border: 1.5px solid #c9a84c40;
  color: #c9a84c; font-size: 14px; font-weight: 600; cursor: pointer;
  transition: background 0.15s;
}
.st-file-label:active { background: #c9a84c25; }
.st-restore-warn { font-size: 12px; color: #f87171; }

/* shared modal */
.mo-backdrop { position: fixed; inset: 0; z-index: 300; background: rgba(4,7,12,0.85); backdrop-filter: blur(8px); display: flex; align-items: flex-end; justify-content: center; animation: stFade 0.2s ease-out; }
.mo-sheet { width: 100%; max-width: 480px; background: linear-gradient(180deg, #0f1520 0%, #0a1018 100%); border: 1px solid #1a2535; border-bottom: none; border-radius: 24px 24px 0 0; padding: 8px 20px 48px; max-height: 90vh; overflow-y: auto; animation: moSlide 0.35s cubic-bezier(0.32,1.5,0.6,1); }
.mo-notch { width: 36px; height: 4px; background: #1e2d40; border-radius: 999px; margin: 10px auto 18px; }
.mo-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
.mo-title { font-size: 18px; font-weight: 700; color: #dde8f4; }
.mo-close { width: 32px; height: 32px; border-radius: 10px; background: #1a2535; border: 1px solid #243040; color: #556677; display: flex; align-items: center; justify-content: center; cursor: pointer; }
.mo-inp { display: block; width: 100%; background: #0f1520; border: 1.5px solid #1a2535; border-radius: 12px; padding: 13px 15px; color: #c8d4e0; font-size: 14px; outline: none; margin-bottom: 10px; transition: border-color 0.2s; box-sizing: border-box; }
.mo-inp:focus { border-color: #4ade8060; }
.mo-submit { width: 100%; padding: 15px; border-radius: 14px; font-size: 15px; font-weight: 700; border: none; cursor: pointer; transition: transform 0.15s, opacity 0.15s; }
.mo-submit:active { transform: scale(0.97); }
.mo-submit--neu { background: linear-gradient(135deg, #c9a84c, #e8c56a); color: #080c14; }
.mo-submit--exp { background: linear-gradient(135deg, #c0392b, #e74c3c); color: white; }
.mo-submit--cancel { background: #1a2535; color: #556677; }

@keyframes stFade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
@keyframes moSlide { from { transform: translateY(80px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
`