'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

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

// Optimized: CSS flip animation instead of Framer Motion AnimatePresence
function FlipDigit({ digit, prevDigit, label }: { digit: string; prevDigit: string; label: string }) {
  const isFlipping = digit !== prevDigit

  return (
    <div className="flip-card-container">
      <div style={{ width: 36, height: 56 }} className="relative flip-card-wrapper">
        <div className="flip-card">
          <div className="flip-card-face flip-card-face-top">
            <span className="premium-digit">{digit}</span>
          </div>
          <div className="flip-card-face flip-card-face-bottom">
            <span className="premium-digit">{digit}</span>
          </div>
          {isFlipping && (
            <>
              <div
                key={`old-${prevDigit}-${digit}`}
                className="flip-flap flip-flap-top flip-anim-top"
              >
                <span className="premium-digit">{prevDigit}</span>
              </div>
              <div
                key={`new-${prevDigit}-${digit}`}
                className="flip-flap flip-flap-bottom flip-anim-bottom"
              >
                <span className="premium-digit">{digit}</span>
              </div>
            </>
          )}
        </div>
      </div>
      {label && <span className="clock-label">{label}</span>}
    </div>
  )
}

// Optimized: CSS-only glowing colon animation
function GlowingColon() {
  return (
    <div className="premium-colon premium-colon-css">
      <div className="premium-colon-dot" />
    </div>
  )
}

function BangladeshFlag() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20" style={{ width: 18, height: 12, verticalAlign: 'middle', marginRight: 4 }}>
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
    <div className="live-time-header animate-header-in">
      <div className="greeting-row animate-greeting-in">
        <span className="greeting-emoji">{greeting.emoji}</span>
        <span className="greeting-text">{greeting.text}</span>
      </div>

      <div className="clock-row animate-clock-in">
        <FlipDigit digit={time.hours.charAt(0)} prevDigit={previous.hours.charAt(0)} label="" />
        <FlipDigit digit={time.hours.charAt(1)} prevDigit={previous.hours.charAt(1)} label="" />
        <GlowingColon />
        <FlipDigit digit={time.minutes.charAt(0)} prevDigit={previous.minutes.charAt(0)} label="" />
        <FlipDigit digit={time.minutes.charAt(1)} prevDigit={previous.minutes.charAt(1)} label="" />
        <GlowingColon />
        <FlipDigit digit={time.seconds.charAt(0)} prevDigit={previous.seconds.charAt(0)} label="" />
        <FlipDigit digit={time.seconds.charAt(1)} prevDigit={previous.seconds.charAt(1)} label="" />
        <span className="premium-ampm">{time.ampm}</span>
      </div>

      <div className="date-row animate-date-in">
        <span className="date-dayname">{date.dayName}</span>
        <span className="date-sep">,</span>
        <span className="date-full">{date.month} {date.day}, {date.year}</span>
        <span className="date-bd-flag">
          <BangladeshFlag />
          Bangladesh
        </span>
      </div>
    </div>
  )
}