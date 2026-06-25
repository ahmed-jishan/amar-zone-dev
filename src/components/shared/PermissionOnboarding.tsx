'use client'

import { useEffect, useMemo, useState } from 'react'
import { Camera, CheckCircle2, Loader2, MapPin, Mic, Settings, Bell, AlertCircle } from 'lucide-react'
import { requestLocationPermission, getCurrentPrayerLocation } from '@/lib/native/location'
import { requestAppNotificationPermission } from '@/lib/native/notifications'

type PermissionKey = 'location' | 'camera' | 'microphone' | 'notifications'
type PermissionState = 'idle' | 'requesting' | 'granted' | 'denied' | 'unsupported'

const STORAGE_KEY = 'selfsync-permission-onboarding-v1'

const PERMISSIONS: Array<{
  key: PermissionKey
  icon: React.ReactNode
  title: string
  body: string
}> = [
  {
    key: 'location',
    icon: <MapPin size={18} />,
    title: 'Location',
    body: 'Prayer times, Qibla and local experiences work best with location access.',
  },
  {
    key: 'camera',
    icon: <Camera size={18} />,
    title: 'Camera',
    body: 'Required for QR scan and Quick Transfer receiving.',
  },
  {
    key: 'microphone',
    icon: <Mic size={18} />,
    title: 'Microphone',
    body: 'Required for voice command and assistant listening.',
  },
  {
    key: 'notifications',
    icon: <Bell size={18} />,
    title: 'Notifications',
    body: 'Required for reminders, prayer alerts and important app signals.',
  },
]

export default function PermissionOnboarding() {
  const [visible, setVisible] = useState(false)
  const [requestingAll, setRequestingAll] = useState(false)
  const [states, setStates] = useState<Record<PermissionKey, PermissionState>>({
    location: 'idle',
    camera: 'idle',
    microphone: 'idle',
    notifications: 'idle',
  })

  useEffect(() => {
    try {
      if (window.localStorage.getItem(STORAGE_KEY) !== 'done') {
        const timer = window.setTimeout(() => setVisible(true), 550)
        return () => window.clearTimeout(timer)
      }
    } catch {
      setVisible(true)
    }
  }, [])

  const progress = useMemo(() => {
    const values = Object.values(states)
    const finished = values.filter((state) => state === 'granted' || state === 'denied' || state === 'unsupported').length
    return Math.round((finished / values.length) * 100)
  }, [states])

  const updateState = (key: PermissionKey, value: PermissionState) => {
    setStates((prev) => ({ ...prev, [key]: value }))
  }

  const requestPermission = async (key: PermissionKey) => {
    updateState(key, 'requesting')
    try {
      if (key === 'location') {
        const status = await requestLocationPermission()
        if (status === 'granted') {
          await getCurrentPrayerLocation().catch(() => undefined)
          updateState(key, 'granted')
        } else {
          updateState(key, status === 'unsupported' ? 'unsupported' : 'denied')
        }
        return
      }

      if (key === 'camera') {
        const granted = await requestMediaPermission({ video: { facingMode: { ideal: 'environment' } }, audio: false })
        updateState(key, granted ? 'granted' : 'denied')
        return
      }

      if (key === 'microphone') {
        const granted = await requestMediaPermission({ audio: true })
        updateState(key, granted ? 'granted' : 'denied')
        return
      }

      const permission = await requestAppNotificationPermission()
      updateState(key, permission === 'granted' ? 'granted' : 'denied')
    } catch {
      updateState(key, 'denied')
    }
  }

  const requestAll = async () => {
    setRequestingAll(true)
    for (const item of PERMISSIONS) {
      await requestPermission(item.key)
      await new Promise((resolve) => window.setTimeout(resolve, 180))
    }
    setRequestingAll(false)
  }

  const finish = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, 'done')
    } catch { /* noop */ }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[11000] flex items-end justify-center bg-black/55 px-3 pb-4 pt-12 backdrop-blur-sm sm:items-center sm:p-6">
      <div className="w-full max-w-[430px] overflow-hidden rounded-[28px] border border-white/15 bg-[rgb(var(--bg))] text-[rgb(var(--fg))] shadow-2xl shadow-black/30">
        <div className="border-b border-[rgba(var(--border),0.55)] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-400">
              <Settings size={20} />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold">Set up app permissions</h2>
              <p className="mt-0.5 text-xs leading-relaxed text-[rgb(var(--muted))]">
                Allow these once so scan, voice, reminders and location features work smoothly.
              </p>
            </div>
          </div>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[rgba(var(--border),0.45)]">
            <div className="h-full rounded-full bg-indigo-500 transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="space-y-2 px-4 py-4">
          {PERMISSIONS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => void requestPermission(item.key)}
              disabled={states[item.key] === 'requesting' || requestingAll}
              className="flex w-full items-center gap-3 rounded-2xl border border-[rgba(var(--border),0.55)] bg-[rgba(var(--border),0.12)] p-3 text-left transition active:scale-[0.99] disabled:opacity-75"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/12 text-indigo-400">
                {item.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold">{item.title}</span>
                <span className="mt-0.5 block text-xs leading-relaxed text-[rgb(var(--muted))]">{item.body}</span>
              </span>
              <PermissionBadge state={states[item.key]} />
            </button>
          ))}
        </div>

        <div className="space-y-2 border-t border-[rgba(var(--border),0.55)] px-4 py-4">
          <button
            type="button"
            onClick={() => void requestAll()}
            disabled={requestingAll}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-500 active:scale-[0.99] disabled:opacity-70"
          >
            {requestingAll ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
            Allow permissions
          </button>
          <button
            type="button"
            onClick={finish}
            className="h-11 w-full rounded-2xl border border-[rgba(var(--border),0.65)] text-sm font-semibold text-[rgb(var(--muted))] transition hover:bg-[rgba(var(--border),0.16)]"
          >
            Continue
          </button>
          {Object.values(states).some((state) => state === 'denied') && (
            <p className="flex items-start gap-2 px-1 text-[11px] leading-relaxed text-amber-500">
              <AlertCircle size={13} className="mt-0.5 shrink-0" />
              If a permission was denied permanently, open Android App Settings and allow it there.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function PermissionBadge({ state }: { state: PermissionState }) {
  if (state === 'requesting') return <Loader2 size={17} className="shrink-0 animate-spin text-indigo-400" />
  if (state === 'granted') return <CheckCircle2 size={18} className="shrink-0 text-emerald-500" />
  if (state === 'denied') return <span className="shrink-0 rounded-full bg-red-500/12 px-2 py-1 text-[10px] font-bold text-red-500">Denied</span>
  if (state === 'unsupported') return <span className="shrink-0 rounded-full bg-amber-500/12 px-2 py-1 text-[10px] font-bold text-amber-500">N/A</span>
  return <span className="shrink-0 rounded-full bg-[rgba(var(--border),0.35)] px-2 py-1 text-[10px] font-bold text-[rgb(var(--muted))]">Allow</span>
}

async function requestMediaPermission(constraints: MediaStreamConstraints): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) return false
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints)
    stream.getTracks().forEach((track) => track.stop())
    return true
  } catch {
    return false
  }
}
