'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

const BD_TIMEZONE = 'Asia/Dhaka'
const LOCALE = 'en-BD'

function getBDNow(): Date {
  const now = new Date()
  const bdStr = now.toLocaleString('en-US', { timeZone: BD_TIMEZONE })
  return new Date(bdStr)
}

function formatTime(date: Date): { hours: string; minutes: string; seconds: string; ampm: string } {
  const h = date.getHours()
  const m = date.getMinutes()
  const s = date.getSeconds()
  const h12 = h % 12 || 12
  return {
    hours: h12.toString().padStart(2, '0'),
    minutes: m.toString().padStart(2, '0'),
    seconds: s.toString().padStart(2, '0'),
    ampm: h >= 12 ? 'PM' : 'AM',
  }
}

function formatDate(date: Date): { dayName: string; day: string; month: string; year: string } {
  const dayName = date.toLocaleDateString(LOCALE, { weekday: 'long', timeZone: BD_TIMEZONE })
  const day = date.toLocaleDateString(LOCALE, { day: 'numeric', timeZone: BD_TIMEZONE })
  const month = date.toLocaleDateString(LOCALE, { month: 'long', timeZone: BD_TIMEZONE })
  const year = date.toLocaleDateString(LOCALE, { year: 'numeric', timeZone: BD_TIMEZONE })
  return { dayName, day, month, year }
}

function getGreeting(hour: number): { text: string; emoji: string } {
  if (hour < 5) return { text: 'Late Night', emoji: '\u{1F319}' }
  if (hour < 12) return { text: 'Good Morning', emoji: '\u{1F305}' }
  if (hour < 17) return { text: 'Good Afternoon', emoji: '\u2600\uFE0F' }
  if (hour < 20) return { text: 'Good Evening', emoji: '\u{1F306}' }
  return { text: 'Good Night', emoji: '\u{1F303}' }
}

function FlipDigit({ digit, prevDigit, label }: { digit: string; prevDigit: string; label: string }) {
  const isFlipping = digit !== prevDigit

  return (
    <div className="flip-card-container">
      <div style={{ width: 36, height: 56 }} className="relative">
        <div className="flip-card">
          <div className="flip-card-face flip-card-face-top">
            <span className="premium-digit">{digit}</span>
          </div>
          <div className="flip-card-face flip-card-face-bottom">
            <span className="premium-digit">{digit}</span>
          </div>
          <AnimatePresence>
            {isFlipping && (
              <>
                <motion.div
                  key={`old-${prevDigit}-${digit}`}
                  className="flip-flap flip-flap-top"
                  initial={{ rotateX: 0, opacity: 1 }}
                  animate={{ rotateX: -86, opacity: 0.68 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                >
                  <span className="premium-digit">{prevDigit}</span>
                </motion.div>
                <motion.div
                  key={`new-${prevDigit}-${digit}`}
                  className="flip-flap flip-flap-bottom"
                  initial={{ rotateX: 86, opacity: 0.68 }}
                  animate={{ rotateX: 0, opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
                >
                  <span className="premium-digit">{digit}</span>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
      {label && <span className="clock-label">{label}</span>}
    </div>
  )
}

function GlowingColon() {
  return (
    <motion.div
      className="premium-colon"
      animate={{ opacity: [1, 0.42, 1] }}
      transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
    >
      <div className="premium-colon-dot" />
    </motion.div>
  )
}

function BangladeshFlag() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20">
      <rect width="30" height="20" fill="#006a4e" />
      <circle cx="13" cy="10" r="5.5" fill="#f42a41" />
    </svg>
  )
}

export default function LiveTimeHeader() {
  const [now, setNow] = useState<Date>(getBDNow)
  const [mounted, setMounted] = useState(false)
  const previousRef = useRef(formatTime(getBDNow()))

  useEffect(() => {
    setMounted(true)
    let interval: ReturnType<typeof setInterval> | undefined
    const timeout = setTimeout(() => {
      setNow(getBDNow())
      interval = setInterval(() => setNow(getBDNow()), 1000)
    }, 1000 - new Date().getMilliseconds())

    return () => {
      clearTimeout(timeout)
      if (interval) clearInterval(interval)
    }
  }, [])

  const previous = previousRef.current
  const time = useMemo(() => formatTime(now), [now])

  useEffect(() => {
    previousRef.current = time
  }, [time])

  const date = useMemo(() => formatDate(now), [now])
  const greeting = useMemo(() => getGreeting(now.getHours()), [now])
  if (!mounted) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
      className="live-time-header"
    >
      <motion.div
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.08, duration: 0.32 }}
        className="greeting-row"
      >
        <motion.span
          className="greeting-emoji"
          key={greeting.emoji}
          initial={{ scale: 0.9, rotate: -8 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18 }}
        >
          {greeting.emoji}
        </motion.span>
        <span className="greeting-text">{greeting.text}</span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.12, duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
        className="clock-row"
      >
        <FlipDigit digit={time.hours.charAt(0)} prevDigit={previous.hours.charAt(0)} label="" />
        <FlipDigit digit={time.hours.charAt(1)} prevDigit={previous.hours.charAt(1)} label="" />
        <GlowingColon />
        <FlipDigit digit={time.minutes.charAt(0)} prevDigit={previous.minutes.charAt(0)} label="" />
        <FlipDigit digit={time.minutes.charAt(1)} prevDigit={previous.minutes.charAt(1)} label="" />
        <GlowingColon />
        <FlipDigit digit={time.seconds.charAt(0)} prevDigit={previous.seconds.charAt(0)} label="" />
        <FlipDigit digit={time.seconds.charAt(1)} prevDigit={previous.seconds.charAt(1)} label="" />
        <motion.span
          className="premium-ampm"
          key={time.ampm}
          initial={{ opacity: 0, x: -4, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 220, damping: 20 }}
        >
          {time.ampm}
        </motion.span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18, duration: 0.32 }}
        className="date-row"
      >
        <span className="date-dayname">{date.dayName}</span>
        <span className="date-sep">,</span>
        <span className="date-full">{date.month} {date.day}, {date.year}</span>
        <span className="date-bd-flag">
          <BangladeshFlag />
          Bangladesh
        </span>
      </motion.div>
    </motion.div>
  )
}
