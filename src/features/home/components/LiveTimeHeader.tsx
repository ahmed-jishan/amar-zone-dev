'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ─── Bangladesh Time Helpers ───
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
  if (hour < 5) return { text: 'Late Night', emoji: '🌙' }
  if (hour < 12) return { text: 'Good Morning', emoji: '🌅' }
  if (hour < 17) return { text: 'Good Afternoon', emoji: '☀️' }
  if (hour < 20) return { text: 'Good Evening', emoji: '🌆' }
  return { text: 'Good Night', emoji: '🌃' }
}

// ─── 3D Flip Digit Component ───
function FlipDigit({ digit, prevDigit, label }: { digit: string; prevDigit: string; label: string }) {
  const isFlipping = digit !== prevDigit

  return (
    <div className="flip-card-container">
      <div style={{ width: 36, height: 56 }} className="relative">
        <AnimatePresence mode="popLayout">
          {isFlipping ? (
            // Flipping animation: old digit rotates out, new digit rotates in
            <motion.div
              key={`flip-${digit}-${Date.now()}`}
              className="flip-card"
              initial={{ rotateX: 0 }}
              animate={{ rotateX: -180 }}
              exit={{ rotateX: -180 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              style={{ transformOrigin: 'center center' }}
            >
              {/* Top half — shows old digit before flip */}
              <div className="flip-card-face flip-card-face-top">
                <span className="premium-digit">{prevDigit}</span>
              </div>
              {/* Bottom half — shows old digit before flip */}
              <div className="flip-card-face flip-card-face-bottom">
                <span className="premium-digit">{prevDigit}</span>
              </div>
              {/* Back top — shows new digit after flip (180deg) */}
              <div className="flip-card-face flip-card-face-back flip-card-face-top">
                <span className="premium-digit">{digit}</span>
              </div>
              {/* Back bottom — shows new digit after flip (180deg) */}
              <div className="flip-card-face flip-card-face-back flip-card-face-bottom">
                <span className="premium-digit">{digit}</span>
              </div>
            </motion.div>
          ) : (
            // Static display
            <motion.div
              key={digit}
              className="flip-card"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            >
              <div className="flip-card-face flip-card-face-top">
                <span className="premium-digit">{digit}</span>
              </div>
              <div className="flip-card-face flip-card-face-bottom">
                <span className="premium-digit">{digit}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {label && <span className="clock-label">{label}</span>}
    </div>
  )
}

// ─── Colon Component with Soft Glow ───
function GlowingColon() {
  return (
    <motion.div
      className="premium-colon"
      animate={{ opacity: [1, 0.3, 1] }}
      transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
    >
      <div className="premium-colon-dot" />
    </motion.div>
  )
}

// ─── Bangladesh Flag SVG ───
function BangladeshFlag() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20">
      <rect width="30" height="20" fill="#006a4e" />
      <circle cx="13" cy="10" r="5.5" fill="#f42a41" />
    </svg>
  )
}

// ─── Main Component ───
export default function LiveTimeHeader() {
  const [now, setNow] = useState<Date>(getBDNow)
  const [mounted, setMounted] = useState(false)

  const prevSecondRef = useRef<string>('00')
  const prevMinuteRef = useRef<string>('00')
  const prevHourRef = useRef<string>('00')

  useEffect(() => {
    setMounted(true)
    const msToNextSec = 1000 - new Date().getMilliseconds()
    const timeout = setTimeout(() => {
      const bdNow = getBDNow()
      setNow(bdNow)
      const t = formatTime(bdNow)
      prevHourRef.current = t.hours
      prevMinuteRef.current = t.minutes
      prevSecondRef.current = t.seconds


      const interval = setInterval(() => {
        const next = getBDNow()
        setNow(next)
      }, 1000)
      ;(window as any).__clockInterval = interval
    }, msToNextSec)

    return () => {
      clearTimeout(timeout)
      if ((window as any).__clockInterval) {
        clearInterval((window as any).__clockInterval)
      }
    }
  }, [])

  // Track previous values for flip detection
  const prevTickRef = useRef<{ s: string; m: string; h: string }>({ s: '00', m: '00', h: '00' })

  const time = useMemo(() => {
    const t = formatTime(now)
    // Update prev references for flip animation
    prevTickRef.current = {
      s: prevSecondRef.current,
      m: prevMinuteRef.current,
      h: prevHourRef.current,
    }
    // Update current refs
    prevSecondRef.current = t.seconds
    prevMinuteRef.current = t.minutes
    prevHourRef.current = t.hours
    return t
  }, [now])

  const date = useMemo(() => formatDate(now), [now])
  const greeting = useMemo(() => getGreeting(now.getHours()), [now])
  if (!mounted) return null

  const prev = prevTickRef.current

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
        <motion.span
          className="greeting-emoji"
          key={greeting.emoji}
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 15 }}
        >
          {greeting.emoji}
        </motion.span>
        <span className="greeting-text">{greeting.text}</span>
      </motion.div>

      {/* Digital Clock with 3D Flip */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.15, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="clock-row"
      >
        {/* Hours */}
        <FlipDigit digit={time.hours.charAt(0)} prevDigit={prev.h.charAt(0)} label="" />
        <FlipDigit digit={time.hours.charAt(1)} prevDigit={prev.h.charAt(1)} label="" />

        {/* Colon */}
        <GlowingColon />

        {/* Minutes */}
        <FlipDigit digit={time.minutes.charAt(0)} prevDigit={prev.m.charAt(0)} label="" />
        <FlipDigit digit={time.minutes.charAt(1)} prevDigit={prev.m.charAt(1)} label="" />

        {/* Colon */}
        <GlowingColon />

        {/* Seconds */}
        <FlipDigit digit={time.seconds.charAt(0)} prevDigit={prev.s.charAt(0)} label="" />
        <FlipDigit digit={time.seconds.charAt(1)} prevDigit={prev.s.charAt(1)} label="" />

        {/* AM/PM Pill */}
        <motion.span
          className="premium-ampm"
          key={time.ampm}
          initial={{ opacity: 0, x: -5, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 200, damping: 20 }}
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