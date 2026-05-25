'use client'

import { useEffect, useMemo, useState } from 'react'
import { Fingerprint, Lock, Unlock } from 'lucide-react'
import { useSettingsStore } from '@/features/settings/store/settingsStore'
import { verifyDeviceBiometric } from '@/features/settings/utils/biometricAuth'
import { verifyPin } from '@/features/settings/utils/security'

export default function AppLockGate() {
  const {
    language,
    pinEnabled,
    pinHash,
    biometricLockEnabled,
    autoLockEnabled,
    autoLockMinutes,
    _hydrated,
  } = useSettingsStore()
  const shouldLock = _hydrated && pinEnabled && !!pinHash
  const [locked, setLocked] = useState(false)
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [checkingBiometric, setCheckingBiometric] = useState(false)
  const [lastHiddenAt, setLastHiddenAt] = useState<number | null>(null)

  const copy = useMemo(() => {
    const bn = language === 'bn'
    return {
      title: bn ? 'অ্যাপ লকড' : 'App locked',
      sub: bn ? 'চালু করতে PIN অথবা ফোন লক ব্যবহার করুন' : 'Use your PIN or phone lock to continue',
      pinPlaceholder: '••••',
      unlock: bn ? 'আনলক' : 'Unlock',
      biometric: bn ? 'ফিঙ্গারপ্রিন্ট / ফোন লক' : 'Fingerprint / phone lock',
      wrongPin: bn ? 'ভুল PIN' : 'Wrong PIN',
    }
  }, [language])

  useEffect(() => {
    if (!shouldLock) {
      setLocked(false)
      return
    }
    setLocked(true)
  }, [shouldLock])

  useEffect(() => {
    if (!shouldLock) return

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        setLastHiddenAt(Date.now())
        return
      }

      if (!autoLockEnabled || lastHiddenAt === null) return
      const elapsedMinutes = (Date.now() - lastHiddenAt) / 60000
      if (elapsedMinutes >= autoLockMinutes) setLocked(true)
    }
    const handleBlur = () => setLastHiddenAt(Date.now())

    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('blur', handleBlur)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('blur', handleBlur)
    }
  }, [autoLockEnabled, autoLockMinutes, lastHiddenAt, shouldLock])

  useEffect(() => {
    if (!locked || !biometricLockEnabled) return
    void handleBiometricUnlock()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locked, biometricLockEnabled])

  if (!locked) return null

  const handlePinUnlock = () => {
    if (verifyPin(pin, pinHash)) {
      setError('')
      setPin('')
      setLocked(false)
      return
    }
    setError(copy.wrongPin)
  }

  async function handleBiometricUnlock() {
    setCheckingBiometric(true)
    const ok = await verifyDeviceBiometric()
    setCheckingBiometric(false)
    if (ok) {
      setError('')
      setPin('')
      setLocked(false)
    }
  }

  return (
    <div className="app-lock-backdrop" role="dialog" aria-modal="true" aria-labelledby="app-lock-title">
      <div className="app-lock-card">
        <div className="app-lock-icon">
          <Lock size={24} />
        </div>
        <h2 id="app-lock-title" className="app-lock-title">{copy.title}</h2>
        <p className="app-lock-sub">{copy.sub}</p>

        {biometricLockEnabled && (
          <button className="app-lock-biometric" onClick={handleBiometricUnlock} disabled={checkingBiometric}>
            <Fingerprint size={18} />
            {checkingBiometric ? 'Checking...' : copy.biometric}
          </button>
        )}

        <div className="app-lock-pin-row">
          <input
            className="app-lock-pin"
            type="password"
            inputMode="numeric"
            maxLength={8}
            placeholder={copy.pinPlaceholder}
            value={pin}
            onChange={(event) => {
              setError('')
              setPin(event.target.value.replace(/\D/g, ''))
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') handlePinUnlock()
            }}
            autoFocus
          />
          <button className="app-lock-unlock" onClick={handlePinUnlock} aria-label={copy.unlock}>
            <Unlock size={18} />
          </button>
        </div>
        {error && <p className="app-lock-error">{error}</p>}
      </div>

      <style>{`
        .app-lock-backdrop {
          position: fixed;
          inset: 0;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: radial-gradient(circle at 50% 0%, rgba(99, 102, 241, 0.18), transparent 35%), rgba(6, 8, 13, 0.92);
          backdrop-filter: blur(18px);
        }
        .app-lock-card {
          width: min(100%, 360px);
          border-radius: 22px;
          border: 1px solid rgba(255,255,255,0.1);
          background: linear-gradient(180deg, rgba(18, 23, 34, 0.96), rgba(9, 13, 22, 0.96));
          box-shadow: 0 24px 80px rgba(0,0,0,0.45);
          padding: 24px;
          color: #eef2ff;
          text-align: center;
        }
        .app-lock-icon {
          width: 54px;
          height: 54px;
          margin: 0 auto 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 18px;
          color: #8b5cf6;
          background: rgba(139, 92, 246, 0.14);
          border: 1px solid rgba(139, 92, 246, 0.28);
        }
        .app-lock-title {
          font-size: 20px;
          font-weight: 800;
          margin: 0;
        }
        .app-lock-sub {
          margin: 8px 0 18px;
          color: rgba(226, 232, 240, 0.66);
          font-size: 13px;
          line-height: 1.45;
        }
        .app-lock-biometric {
          width: 100%;
          min-height: 44px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          border-radius: 14px;
          border: 1px solid rgba(99, 102, 241, 0.34);
          background: rgba(99, 102, 241, 0.16);
          color: #c7d2fe;
          font-size: 13px;
          font-weight: 700;
          margin-bottom: 12px;
        }
        .app-lock-pin-row {
          display: grid;
          grid-template-columns: 1fr 46px;
          gap: 10px;
        }
        .app-lock-pin {
          height: 46px;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(15, 23, 42, 0.72);
          color: #f8fafc;
          padding: 0 14px;
          outline: none;
          letter-spacing: 5px;
          font-size: 20px;
          text-align: center;
        }
        .app-lock-pin:focus {
          border-color: rgba(99, 102, 241, 0.58);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.16);
        }
        .app-lock-unlock {
          height: 46px;
          border-radius: 14px;
          border: 1px solid rgba(34, 197, 94, 0.3);
          background: rgba(34, 197, 94, 0.14);
          color: #86efac;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .app-lock-error {
          margin: 10px 0 0;
          color: #fca5a5;
          font-size: 12px;
          font-weight: 600;
        }
      `}</style>
    </div>
  )
}
