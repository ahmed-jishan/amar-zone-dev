'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ─── Bangladesh Time Helpers ───
const BD_TIMEZONE = 'Asia/Dhaka'
const LOCALE = 'en-BD'

function getBDNow(): Date {
  const now = new Date()
  // Format in BD timezone then parse back — ensures correct local time
  const bdStr = now.toLocaleString('en-US', { timeZone: BD_TIMEZONE })
  return new Date(bdStr)
}

function formatTime(date: Date): { hours: string; minutes: string; seconds: string; ampm: string } {
  const h = date.getHours()
  const m = date.getMinutes()
  const s = date.getSeconds()
  const h12 = h % 12 || 12  // convert to 12‑hour format (0 → 12)
  return {
    hours: h12.toString().padStart(2, '0'),
    minutes: m.toString().padStart(2, '0'),
    seconds: s.toString().padStart(2, '0'),
    ampm: h >= 12 ? 'PM' : 'AM',
  }
}

function formatDate(date: Date): { dayName: string; day: string; month: string; year: string; bnDate?: string } {
  const dayName = date.toLocaleDateString(LOCALE, { weekday: 'long', timeZone: BD_TIMEZONE })
  const day = date.toLocaleDateString(LOCALE, { day: 'numeric', timeZone: BD_TIMEZONE })
  const month = date.toLocaleDateString(LOCALE, { month: 'long', timeZone: BD_TIMEZONE })
  const year = date.toLocaleDateString(LOCALE, { year: 'numeric', timeZone: BD_TIMEZONE })
  return { dayName, day, month, year }
}

function getGreeting(hour: number): { text: string; emoji: string } {
  if (hour < 5) return { text: 'Late Night', emoji: '🌙' }
  if (hour < 12) return { text: 'Good Morning', emoji: '🌅' }
  if (hour < 17) return { text: 'Good Afternoon', emoji: '☀️' }
  if (hour < 20) return { text: 'Good Evening', emoji: '🌆' }
  return { text: 'Good Night', emoji: '🌃' }
}

// ─── Digit Flip Animation ───
function FlipDigit({ digit, label }: { digit: string; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative overflow-hidden">
        <AnimatePresence mode="popLayout">
          <motion.span
            key={digit}
            initial={{ y: 20, opacity: 0, rotateX: -90 }}
            animate={{ y: 0, opacity: 1, rotateX: 0 }}
            exit={{ y: -20, opacity: 0, rotateX: 90 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20, mass: 0.8 }}
            className="clock-digit"
          >
            {digit}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="clock-label">{label}</span>
    </div>
  )
}

export default function LiveTimeHeader() {
  const [now, setNow] = useState<Date>(getBDNow)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Sync to next second boundary for smooth start
    const msToNextSec = 1000 - new Date().getMilliseconds()
    const timeout = setTimeout(() => {
      setNow(getBDNow())
      const interval = setInterval(() => {
        setNow(getBDNow())
      }, 1000)
      // Store interval ref for cleanup
      ;(window as any).__clockInterval = interval
    }, msToNextSec)

    return () => {
      clearTimeout(timeout)
      if ((window as any).__clockInterval) {
        clearInterval((window as any).__clockInterval)
      }
    }
  }, [])

  const time = useMemo(() => formatTime(now), [now])
  const date = useMemo(() => formatDate(now), [now])
  const greeting = useMemo(() => getGreeting(now.getHours()), [now])

  if (!mounted) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="live-time-header"
    >
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="greeting-row"
      >
        <span className="greeting-emoji">{greeting.emoji}</span>
        <span className="greeting-text">{greeting.text}</span>
      </motion.div>

      {/* Digital Clock */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.15, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="clock-row"
      >
        <FlipDigit digit={time.hours.charAt(0)} label="" />
        <FlipDigit digit={time.hours.charAt(1)} label="" />
        <motion.span
          className="clock-colon"
          animate={{ opacity: [1, 0.2, 1] }}
          transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
        >
          :
        </motion.span>
        <FlipDigit digit={time.minutes.charAt(0)} label="" />
        <FlipDigit digit={time.minutes.charAt(1)} label="" />
        <motion.span
          className="clock-colon"
          animate={{ opacity: [1, 0.2, 1] }}
          transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        >
          :
        </motion.span>
        <FlipDigit digit={time.seconds.charAt(0)} label="" />
        <FlipDigit digit={time.seconds.charAt(1)} label="" />
        <motion.span
          className="clock-ampm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {time.ampm}
        </motion.span>
      </motion.div>

      {/* Date */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4 }}
        className="date-row"
      >
        <span className="date-dayname">{date.dayName}</span>
        <span className="date-sep">, </span>
        <span className="date-full">{date.month} {date.day}, {date.year}</span>
        <span className="date-bd">🇧🇩 Bangladesh</span>
      </motion.div>
    </motion.div>
  )
}