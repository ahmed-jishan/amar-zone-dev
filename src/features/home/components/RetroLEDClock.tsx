'use client'

import { useEffect, useMemo, useRef, useState, memo } from 'react'

const BD_TIMEZONE = 'Asia/Dhaka'
const LOCALE = 'en-BD'

function getBDNow(): Date {
  const now = new Date()
  const bdStr = now.toLocaleString('en-US', { timeZone: BD_TIMEZONE })
  return new Date(bdStr)
}

function formatTime(date: Date): { h: string; m: string; s: string; ampm: string; h24: number } {
  const h = date.getHours()
  const m = date.getMinutes()
  const s = date.getSeconds()
  const h12 = h % 12 || 12
  return {
    h: h12.toString().padStart(2, '0'),
    m: m.toString().padStart(2, '0'),
    s: s.toString().padStart(2, '0'),
    ampm: h >= 12 ? 'PM' : 'AM',
    h24: h,
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

/* ─── Dot Matrix Pattern Data (5x7 grid per digit) ─── */
const DOT_PATTERNS: Record<string, number[]> = {
  '0': [
    0b01110,
    0b10001,
    0b10011,
    0b10101,
    0b11001,
    0b10001,
    0b01110,
  ],
  '1': [
    0b00100,
    0b01100,
    0b00100,
    0b00100,
    0b00100,
    0b00100,
    0b01110,
  ],
  '2': [
    0b01110,
    0b10001,
    0b00001,
    0b00010,
    0b00100,
    0b01000,
    0b11111,
  ],
  '3': [
    0b11111,
    0b00010,
    0b00100,
    0b00010,
    0b00001,
    0b10001,
    0b01110,
  ],
  '4': [
    0b00010,
    0b00110,
    0b01010,
    0b10010,
    0b11111,
    0b00010,
    0b00010,
  ],
  '5': [
    0b11111,
    0b10000,
    0b11110,
    0b00001,
    0b00001,
    0b10001,
    0b01110,
  ],
  '6': [
    0b00110,
    0b01000,
    0b10000,
    0b11110,
    0b10001,
    0b10001,
    0b01110,
  ],
  '7': [
    0b11111,
    0b00001,
    0b00010,
    0b00100,
    0b01000,
    0b01000,
    0b01000,
  ],
  '8': [
    0b01110,
    0b10001,
    0b10001,
    0b01110,
    0b10001,
    0b10001,
    0b01110,
  ],
  '9': [
    0b01110,
    0b10001,
    0b10001,
    0b01111,
    0b00001,
    0b00010,
    0b01100,
  ],
}

/* ─── Dot Matrix Digit (pure CSS dots) ─── */
function DotMatrixDigit({ digit, changed }: { digit: string; changed: boolean }) {
  const pattern = DOT_PATTERNS[digit] || DOT_PATTERNS['0']

  return (
    <div className={`dm-digit-box${changed ? ' dm-digit-flash' : ''}`}>
      {pattern.map((row, ri) => (
        <div key={ri} className="dm-row">
          {[4, 3, 2, 1, 0].map((bi) => (
            <div
              key={bi}
              className={`dm-dot ${(row & (1 << bi)) ? 'dm-dot-on' : 'dm-dot-off'}`}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

/* ─── Dot Matrix Digit Pair ─── */
const DotMatrixPair = memo(function DotMatrixPair({ value, prevValue }: { value: string; prevValue: string }) {
  return (
    <div className="dm-pair">
      <DotMatrixDigit digit={value.charAt(0)} changed={value.charAt(0) !== prevValue.charAt(0)} />
      <DotMatrixDigit digit={value.charAt(1)} changed={value.charAt(1) !== prevValue.charAt(1)} />
    </div>
  )
})

/* ─── Blinking Colon ─── */
function DotColon() {
  return (
    <div className="dm-colon">
      <div className="dm-colon-dot" />
      <div className="dm-colon-dot" />
    </div>
  )
}

/* ─── AM/PM ─── */
function DotAmPm({ value }: { value: string }) {
  return (
    <div className="dm-ampm">
      <span className={`dm-ampm-label ${value === 'AM' ? 'dm-ampm-active' : 'dm-ampm-dim'}`}>AM</span>
      <span className={`dm-ampm-label ${value === 'PM' ? 'dm-ampm-active' : 'dm-ampm-dim'}`}>PM</span>
    </div>
  )
}

/* ─── Bangladesh Flag ─── */
function BangladeshFlag() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20" className="dm-flag">
      <rect width="30" height="20" fill="#006a4e" />
      <circle cx="13" cy="10" r="5.5" fill="#f42a41" />
    </svg>
  )
}

/* ─── MAIN COMPONENT ─── */
export default function RetroLEDClock() {
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
    <div className="retro-led-clock animate-led-fade-in">
      <div className="dm-panel">
        {/* Dot Matrix Time */}
        <div className="dm-time-row">
          <DotMatrixPair value={time.h} prevValue={previous.h} />
          <DotColon />
          <DotMatrixPair value={time.m} prevValue={previous.m} />
          <DotColon />
          <DotMatrixPair value={time.s} prevValue={previous.s} />
          <DotAmPm value={time.ampm} />
        </div>

        {/* Info Row */}
        <div className="dm-info-row">
          <div className="dm-greeting">
            <span className="dm-greeting-emoji">{greeting.emoji}</span>
            <span className="dm-greeting-text">{greeting.text}</span>
          </div>
          <div className="dm-date">
            <span className="dm-date-text">
              {date.dayName}, {date.month} {date.day}
            </span>
          </div>
          <div className="dm-location">
            <BangladeshFlag />
            <span>BD</span>
          </div>
        </div>
      </div>
    </div>
  )
}