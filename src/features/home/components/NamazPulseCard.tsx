'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useNamazStore } from '@/features/namaz/store/namazStore'
import { useRouter } from 'next/navigation'
import StreakFlame from '@/components/ui/StreakFlame'
import TierBadge from '@/components/ui/TierBadge'
import type { PrayerName, PrayerRecord, PrayerStatus } from '@/lib/types'

const PRAYER_ORDER: PrayerName[] = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']

const PRAYER_ICONS: Record<PrayerName, string> = {
  Fajr: '🌅',
  Dhuhr: '☀️',
  Asr: '🌤️',
  Maghrib: '🌇',
  Isha: '🌙',
}

const STATUS_CONFIG: Record<PrayerStatus, { color: string; label: string; dotColor: string }> = {
  pending: { color: 'var(--hm-amber)', label: 'Pending', dotColor: '#f59e0b' },
  prayed: { color: 'var(--hm-green)', label: 'Prayed', dotColor: '#10b981' },
  missed: { color: 'var(--hm-red)', label: 'Missed', dotColor: '#ef4444' },
  qaza: { color: '#8b5cf6', label: 'Qaza', dotColor: '#8b5cf6' },
}

// Approximate prayer times for Dhaka (will be refined with actual calculation)
function getPrayerTimes(date: Date): Record<PrayerName, Date> {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = d.getMonth()
  const day = d.getDate()
  return {
    Fajr: new Date(year, month, day, 4, 15),
    Dhuhr: new Date(year, month, day, 12, 0),
    Asr: new Date(year, month, day, 15, 45),
    Maghrib: new Date(year, month, day, 17, 55),
    Isha: new Date(year, month, day, 19, 15),
  }
}

function getNextPrayer(now: Date): { name: PrayerName; time: Date; isCurrent: boolean } | null {
  const times = getPrayerTimes(now)
  for (const name of PRAYER_ORDER) {
    if (now < times[name]) {
      return { name, time: times[name], isCurrent: false }
    }
  }
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowTimes = getPrayerTimes(tomorrow)
  return { name: 'Fajr', time: tomorrowTimes.Fajr, isCurrent: false }
}

function getCountdown(now: Date, target: Date): string {
  const diff = target.getTime() - now.getTime()
  if (diff <= 0) return 'Now'
  const hours = Math.floor(diff / 3600000)
  const minutes = Math.floor((diff % 3600000) / 60000)
  const seconds = Math.floor((diff % 60000) / 1000)
  if (hours > 0) return `${hours}h ${minutes}m`
  if (minutes > 0) return `${minutes}m ${seconds}s`
  return `${seconds}s`
}

function getWeeklyStreak(records: { date: string; prayers: Record<PrayerName, PrayerStatus> }[]): number {
  const today = new Date().toISOString().split('T')[0]
  let streak = 0
  for (let i = 0; i < 7; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    const record = records.find((r) => r.date === dateStr)
    if (!record) break
    const allPrayed = PRAYER_ORDER.every((p) => record.prayers[p] === 'prayed')
    if (allPrayed) streak++
    else break
  }
  return streak
}

// Mini day labels for timeline
const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object'
}

function isPrayerRecord(value: unknown): value is PrayerRecord {
  return isRecord(value) && typeof value.date === 'string' && isRecord(value.prayers)
}

function asArray<T>(value: unknown, guard: (item: unknown) => item is T): T[] {
  return Array.isArray(value) ? value.filter(guard) : []
}

export default function NamazPulseCard() {
  const router = useRouter()
  const records = useNamazStore((s) => asArray(s.records, isPrayerRecord))
  const today = new Date().toISOString().split('T')[0]
  const todayRecord = records.find((r) => r.date === today)

  const stats = useMemo(() => {
    const now = new Date()
    const next = getNextPrayer(now)
    const countdown = next ? getCountdown(now, next.time) : '—'
    const prayedCount = todayRecord
      ? PRAYER_ORDER.filter((p) => todayRecord.prayers[p] === 'prayed').length
      : 0
    const totalCount = PRAYER_ORDER.length
    const progress = Math.round((prayedCount / totalCount) * 100)
    const streak = getWeeklyStreak(records)
    return { next, countdown, prayedCount, totalCount, progress, streak }
  }, [records, todayRecord])

  // Mini timeline data (last 7 days — simulated from records)
  const timelineDays = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toISOString().split('T')[0];
      const record = records.find((r) => r.date === dateStr);
      const count = record
        ? PRAYER_ORDER.filter((p) => record.prayers[p] === 'prayed').length
        : 0;
      return {
        label: DAY_LABELS[d.getDay()],
        value: count,
        isToday: i === 6,
      };
    });
  }, [records]);

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      onClick={() => router.push('/namaz')}
      className="hm-glass-card w-full text-left cursor-pointer"
      whileHover={{ scale: 1.01, y: -2 }}
      whileTap={{ scale: 0.99 }}
    >
      {/* Header with animated flame */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">🕌</span>
          <span className="card-title">Prayer Tracker</span>
        </div>
        <div className="flex items-center gap-2">
          <TierBadge streak={stats.streak} language="en" size="sm" showProgress={false} />
          <div className="flex items-center gap-1">
            <StreakFlame streak={stats.streak} size={16} />
            <span className="text-sm font-bold" style={{ color: stats.streak >= 7 ? '#059669' : 'var(--hm-amber)' }}>
              {stats.streak}
            </span>
          </div>
        </div>
      </div>

      {/* Next Prayer Countdown */}
      {stats.next && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="next-prayer-banner"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="prayer-icon-large">{PRAYER_ICONS[stats.next.name]}</span>
              <div>
                <div className="next-prayer-label">Next: {stats.next.name}</div>
                <div className="next-prayer-time">
                  {stats.next.time.toLocaleTimeString('en-BD', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Dhaka' })}
                </div>
              </div>
            </div>
            <div className="countdown-box">
              <motion.span
                key={stats.countdown}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="countdown-value"
              >
                {stats.countdown}
              </motion.span>
              <span className="countdown-label">remaining</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Prayer Status Dots */}
      <div className="prayer-dots-row">
        {PRAYER_ORDER.map((prayer, i) => {
          const status = todayRecord?.prayers[prayer] || 'pending'
          const config = STATUS_CONFIG[status]
          return (
            <motion.div
              key={prayer}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.05 }}
              className="prayer-dot-item"
            >
              <div
                className="prayer-dot"
                style={{
                  backgroundColor: config.dotColor,
                  boxShadow: `0 0 8px ${config.dotColor}60`,
                }}
              />
              <span className="prayer-dot-label">{prayer}</span>
              <span className="prayer-dot-status" style={{ color: config.dotColor }}>
                {config.label}
              </span>
            </motion.div>
          )
        })}
      </div>

      {/* Premium Progress Bar with glow */}
      <div className="progress-bar-container">
        <div className="progress-bar-track">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${stats.progress}%` }}
            transition={{ delay: 0.5, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="progress-bar-fill"
            style={{
              background: `linear-gradient(90deg, #10b981, ${stats.streak >= 7 ? '#059669' : '#34d399'})`,
              boxShadow: stats.progress === 100 ? '0 0 8px rgba(16,185,129,0.5)' : 'none',
            }}
          />
        </div>
        <span className="progress-bar-text">{stats.prayedCount}/{stats.totalCount} prayed</span>
      </div>

      {/* Mini timeline (last 7 days) */}
      <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--hm-border)' }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--hm-muted)' }}>
            Weekly
          </span>
          {stats.streak >= 7 && (
            <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/20 rounded-full px-2 py-0.5">
              ✦ Perfect Week
            </span>
          )}
        </div>
        <div className="flex gap-1.5">
          {timelineDays.map((day, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full rounded-sm transition-all"
                style={{
                  height: `${Math.max(day.value * 6, 3)}px`,
                  background: day.isToday
                    ? 'linear-gradient(180deg, #10b981, #059669)'
                    : day.value >= 5
                      ? '#10b981'
                      : day.value >= 3
                        ? 'rgba(16,185,129,0.5)'
                        : day.value > 0
                          ? 'rgba(16,185,129,0.2)'
                          : 'rgba(0,0,0,0.06)',
                  opacity: day.isToday ? 1 : 0.75,
                }}
              />
              <span className="text-[7px] font-semibold uppercase" style={{ color: 'var(--hm-muted)' }}>
                {day.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.button>
  )
}
