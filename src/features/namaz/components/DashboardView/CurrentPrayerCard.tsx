'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BellRing, Clock, MapPin, Timer, CheckCircle2, UsersRound } from 'lucide-react';
import {
  buildPrayerDate,
  buildPrayerWindows,
  formatPrayerTime12h,
  getCurrentOrNextPrayer,
} from '../../utils/prayerSchedule';
import { computePrayerTimeConfig } from '../../utils/azanJamatConfig';
import type { PrayerTimesResponse } from '../../types/prayer.types';
import type { ConfigurablePrayerName, PrayerTimePreferences } from '../../store/prefsStore';
import { PRAYER_NAME_LABELS } from '../../constants/prayerNames';

interface PrayerEntry {
  adhan: string;
  jamaat: string;
  endTime: string;
  status: string;
}

interface PrayerTimes {
  Fajr: PrayerEntry;
  Dhuhr: PrayerEntry;
  Asr: PrayerEntry;
  Maghrib: PrayerEntry;
  Isha: PrayerEntry;
}

interface Props {
  prayerTimes: PrayerTimes;
  prayerTimesResponse: PrayerTimesResponse;
  locationLabel?: string;
  language: 'bn' | 'en';
  prayerTimePreferences: PrayerTimePreferences;
}

const PRAYER_ORDER = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const;
const CANONICAL_TO_LEGACY = {
  fajr: 'Fajr', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha',
} as const;
const LEGACY_TO_CANONICAL = {
  Fajr: 'fajr', Dhuhr: 'dhuhr', Asr: 'asr', Maghrib: 'maghrib', Isha: 'isha',
} as const;
const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
const toBN = (value: number | string) =>
  String(value).replace(/\d/g, (d) => BN_DIGITS[Number(d)] ?? d);
const pad2 = (value: number, lang: 'bn' | 'en') => {
  const raw = String(value).padStart(2, '0');
  return lang === 'bn' ? toBN(raw) : raw;
};

// ─── Premium light-tone gradient — Apple-inspired muted palette ───
function getTimeOfDayGradient(isTomorrow: boolean): string {
  if (isTomorrow) return 'linear-gradient(135deg, #1e3830 0%, #2a4d3e 50%, #3a5d4a 100%)';
  const h = new Date().getHours();
  if (h >= 5 && h < 8)  return 'linear-gradient(135deg, #4a7a60 0%, #689a78 40%, #88ba8e 100%)';
  if (h >= 8 && h < 12) return 'linear-gradient(135deg, #3a6a50 0%, #4a8a62 40%, #6aaa78 100%)';
  if (h >= 12 && h < 16) return 'linear-gradient(135deg, #2a5a40 0%, #3a7a52 45%, #5a9a68 100%)';
  if (h >= 16 && h < 19) return 'linear-gradient(135deg, #3a6048 0%, #4a8058 40%, #6a9a70 100%)';
  return 'linear-gradient(135deg, #1e3830 0%, #2a4d3e 40%, #3a5d4a 100%)';
}

function getGradientLabel(lang: 'bn' | 'en'): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 8)  return lang === 'bn' ? '🌅 সকাল' : '🌅 Morning';
  if (h >= 8 && h < 12) return lang === 'bn' ? '☀️ পূর্বাহ্ন' : '☀️ Morning';
  if (h >= 12 && h < 16) return lang === 'bn' ? '🌤️ দুপুর' : '🌤️ Noon';
  if (h >= 16 && h < 19) return lang === 'bn' ? '🌇 সন্ধ্যা' : '🌇 Evening';
  return '🌙 রাত';
}

// ─── Premium Timer Digit (Apple-style glass) ───
function TimerDigit({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative overflow-hidden rounded-2xl bg-white/10 backdrop-blur-2xl px-3 py-3 sm:px-4 sm:py-3 min-w-[3.5rem] sm:min-w-[4.2rem] text-center border border-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.25),inset_0_-1px_0_rgba(0,0,0,0.08)]">
        <AnimatePresence mode="popLayout">
          <motion.span
            key={value}
            initial={{ y: 24, opacity: 0, scale: 0.8 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -24, opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28, mass: 0.8 }}
            className="block text-2xl sm:text-4xl font-bold tabular-nums text-white tracking-tight drop-shadow-sm"
          >
            {value}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="mt-2 text-[9px] font-semibold text-white/50 uppercase tracking-[0.15em]">{label}</span>
    </div>
  );
}

// ─── Timer Card (Right side) ───
function TimerCard({
  caption,
  hours,
  minutes,
  seconds,
  lang,
  helperText,
  isUrgent,
  timeLabel,
  isCompleted,
  completedText,
}: {
  caption: string;
  hours: string;
  minutes: string;
  seconds: string;
  lang: 'bn' | 'en';
  helperText?: string;
  isUrgent?: boolean;
  timeLabel?: string;
  isCompleted?: boolean;
  completedText?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, x: 20 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.15 }}
      className="flex flex-col items-center gap-4 rounded-2xl bg-white/10 backdrop-blur-2xl border border-white/15 px-5 py-5 min-w-[150px] shadow-[0_2px_8px_rgba(0,0,0,0.04),0_8px_28px_rgba(0,0,0,0.08),0_24px_60px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.15)]"
    >
      {/* Time-of-day badge */}
      {timeLabel && (
        <div className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-semibold text-white/80 backdrop-blur-sm">
          <span>{timeLabel}</span>
        </div>
      )}

      {/* Caption badge */}
      {isCompleted ? (
        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
          <CheckCircle2 size={10} />
          {lang === 'bn' ? 'সম্পন্ন' : 'Completed'}
        </div>
      ) : (
        <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
          isUrgent
            ? 'bg-amber-400/20 text-amber-300 border border-amber-400/20'
            : 'bg-white/10 text-white/60 border border-white/10'
        }`}>
          <Timer size={10} className={isUrgent ? 'text-amber-300' : ''} />
          {caption}
        </div>
      )}

      {/* Timer Digits */}
      {isCompleted && completedText ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-1 py-3"
        >
          <CheckCircle2 size={32} className="text-emerald-400 mb-1" />
          <span className="text-base font-bold text-white/80 tracking-tight">{completedText}</span>
          <span className="text-[10px] text-white/40">{lang === 'bn' ? 'পরবর্তী অপেক্ষায়' : 'Waiting for next'}</span>
        </motion.div>
      ) : (
        <div className="flex items-center gap-1.5">
          <TimerDigit value={hours} label={lang === 'bn' ? 'ঘ' : 'Hr'} />
          <span className="text-2xl font-bold text-white/20 mb-6">:</span>
          <TimerDigit value={minutes} label={lang === 'bn' ? 'মি' : 'Min'} />
          <span className="text-2xl font-bold text-white/20 mb-6">:</span>
          <TimerDigit value={seconds} label={lang === 'bn' ? 'সে' : 'Sec'} />
        </div>
      )}

      {/* Helper text */}
      {helperText && !isCompleted && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-[10px] text-white/40 text-center leading-relaxed max-w-[140px]"
        >
          {helperText}
        </motion.p>
      )}
    </motion.div>
  );
}

// ─── Main Component ───
export default function CurrentPrayerCard({ prayerTimes, prayerTimesResponse, locationLabel, language, prayerTimePreferences }: Props) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const activeWindow = useMemo(
    () => getCurrentOrNextPrayer(prayerTimesResponse, now),
    [now, prayerTimesResponse]
  );
  const windows = useMemo(
    () => buildPrayerWindows(prayerTimesResponse, now),
    [now, prayerTimesResponse]
  );

  const activeName = activeWindow ? CANONICAL_TO_LEGACY[activeWindow.prayer] : 'Fajr';
  const activeEntry = prayerTimes[activeName];
  const activeIdx = Math.max(0, PRAYER_ORDER.indexOf(activeName));
  const isTomorrow = Boolean(activeWindow?.prayer === 'fajr' && activeWindow.start.toDateString() !== now.toDateString());

  const activeCanonical = LEGACY_TO_CANONICAL[activeName as keyof typeof LEGACY_TO_CANONICAL];
  const prayerConfig = useMemo(() => {
    if (!prayerTimesResponse) return null;
    const rawTime = prayerTimesResponse.rawTimings[activeName as keyof typeof prayerTimesResponse.rawTimings];
    if (!rawTime) return null;
    return computePrayerTimeConfig(rawTime, prayerTimePreferences[activeCanonical as ConfigurablePrayerName]);
  }, [prayerTimesResponse, prayerTimePreferences, activeCanonical, activeName]);

  const azanDate = useMemo(() => {
    if (!prayerConfig || !prayerTimesResponse || !activeWindow) return null;
    const tz = prayerTimesResponse.timezone;
    const azanDt = buildPrayerDate(prayerConfig.azanTime, activeWindow.start, tz);
    if (azanDt.getTime() < activeWindow.start.getTime() - 3600000) {
      const retry = buildPrayerDate(prayerConfig.azanTime, now, tz);
      if (retry.getTime() > now.getTime() - 86400000) return retry;
    }
    return azanDt;
  }, [prayerConfig, prayerTimesResponse, activeWindow, now]);

  const jamatDate = useMemo(() => {
    if (!prayerConfig || !prayerTimesResponse || !activeWindow) return null;
    const tz = prayerTimesResponse.timezone;
    const jamatDt = buildPrayerDate(prayerConfig.jamatTime, activeWindow.start, tz);
    if (jamatDt.getTime() < activeWindow.start.getTime() - 3600000) {
      const retry = buildPrayerDate(prayerConfig.jamatTime, now, tz);
      if (retry.getTime() > now.getTime() - 86400000) return retry;
    }
    return jamatDt;
  }, [prayerConfig, prayerTimesResponse, activeWindow, now]);

  const nowMs = now.getTime();

  // ─── 3-stage flow ───
  // Stage 1: Countdown to Azan
  // Stage 2: Countdown to Jamat (Azan passed)
  // Stage 3: Countdown to End (Jamat passed)
  // Stage 4: This prayer fully passed → wait for next
  const azanPassed = azanDate ? azanDate.getTime() <= nowMs : false;
  const jamatPassed = jamatDate ? jamatDate.getTime() <= nowMs : false;
  const prayerEnded = activeWindow?.status === 'ended';

  const currentStage: 'azan' | 'jamat' | 'end' | 'next' = 
    prayerEnded ? 'next' :
    !azanPassed ? 'azan' :
    azanPassed && !jamatPassed ? 'jamat' :
    'end';

  const isPrayerActive = currentStage !== 'next';

  // Countdown seconds for each stage
  const azanCountdownSec = azanDate ? Math.max(0, Math.floor((azanDate.getTime() - nowMs) / 1000)) : 0;
  const azanH = Math.floor(azanCountdownSec / 3600);
  const azanM = Math.floor((azanCountdownSec % 3600) / 60);
  const azanS = azanCountdownSec % 60;

  const jamatCountdownSec = jamatDate ? Math.max(0, Math.floor((jamatDate.getTime() - nowMs) / 1000)) : 0;
  const jamatH = Math.floor(jamatCountdownSec / 3600);
  const jamatM = Math.floor((jamatCountdownSec % 3600) / 60);
  const jamatS = jamatCountdownSec % 60;

  // For end stage: countdown uses the active window's remaining seconds
  const endCountdownSec = activeWindow?.remainingSeconds ?? 0;
  const endH = Math.floor(endCountdownSec / 3600);
  const endM = Math.floor((endCountdownSec % 3600) / 60);
  const endS = endCountdownSec % 60;

  // ─── Determine timer values based on current stage ───
  const timerDisplay = useMemo(() => {
    if (currentStage === 'azan') {
      return { hours: pad2(azanH, language), minutes: pad2(azanM, language), seconds: pad2(azanS, language), sec: azanCountdownSec };
    }
    if (currentStage === 'jamat') {
      return { hours: pad2(jamatH, language), minutes: pad2(jamatM, language), seconds: pad2(jamatS, language), sec: jamatCountdownSec };
    }
    if (currentStage === 'end') {
      return { hours: pad2(endH, language), minutes: pad2(endM, language), seconds: pad2(endS, language), sec: endCountdownSec };
    }
    // 'next' stage — show 00:00:00
    return { hours: pad2(0, language), minutes: pad2(0, language), seconds: pad2(0, language), sec: 0 };
  }, [currentStage, azanH, azanM, azanS, jamatH, jamatM, jamatS, endH, endM, endS, azanCountdownSec, jamatCountdownSec, endCountdownSec, language]);

  const dateLabel = useMemo(() => {
    return new Intl.DateTimeFormat(language === 'bn' ? 'bn-BD' : 'en-US', {
      weekday: 'long', day: 'numeric', month: 'long',
      timeZone: prayerTimesResponse.timezone,
    }).format(now);
  }, [now, prayerTimesResponse.timezone, language]);

  const endSuffix = activeWindow?.endsTomorrow ? (language === 'bn' ? ' (কাল)' : '') : '';
  const prayerLabel = PRAYER_NAME_LABELS[activeName]?.[language] ?? activeName;

  const heroGradient = useMemo(() => getTimeOfDayGradient(isTomorrow), [isTomorrow]);
  const timeLabel = useMemo(() => getGradientLabel(language), [language]);

  // ─── Caption logic ───
  const caption = currentStage === 'azan'
    ? (language === 'bn' ? 'আজান বাকি' : 'Azan in')
    : currentStage === 'jamat'
      ? (language === 'bn' ? 'জামাত শেষ হতে' : 'Jamat ends in')
      : currentStage === 'end'
        ? (language === 'bn' ? 'ওয়াক্ত শেষ হতে' : 'Waqt ends in')
        : (language === 'bn' ? 'সমাপ্ত' : 'Completed');

  const isCompleted = currentStage === 'next';
  const completedText = activeEntry
    ? (language === 'bn' ? `জামাত ${activeEntry.jamaat}` : `Jamat ${activeEntry.jamaat}`)
    : undefined;

  const helperText = useMemo(() => {
    if (currentStage === 'azan') return language === 'bn' ? 'শান্তিতে অপেক্ষা করুন...' : 'Waiting peacefully...';
    if (currentStage === 'jamat') {
      const mins = Math.floor(jamatCountdownSec / 60);
      if (mins > 5) return language === 'bn' ? `জামাতে যোগ দিন 🕌 (${mins} মিনিট)` : `Join the congregation 🕌 (${mins} min)`;
      if (mins > 0) return language === 'bn' ? `জামাত শুরু হবে ${mins} মিনিটে 🤲` : `Jamat starts in ${mins} min 🤲`;
      return language === 'bn' ? 'জামাত শুরু হবে যেকোনো মুহূর্তে 🤲' : 'Jamat starting any moment 🤲';
    }
    if (currentStage === 'end') {
      if (endCountdownSec <= 600) return language === 'bn' ? 'সময় কম — শান্তভাবে শেষ করুন 🌿' : 'Time is short — finish calmly 🌿';
      if (endCountdownSec <= 1800) return language === 'bn' ? 'মনোযোগ ধরে রাখুন 💎' : 'Stay focused 💎';
      return language === 'bn' ? 'জামাতে নামাজ পড়ার চেষ্টা করুন 🤲' : 'Try to pray in congregation 🤲';
    }
    return language === 'bn' ? 'পরবর্তী ওয়াক্তের অপেক্ষায়...' : 'Waiting for next prayer...';
  }, [currentStage, jamatCountdownSec, endCountdownSec, language]);

  const isUrgent = timerDisplay.sec > 0 && timerDisplay.sec <= 600;

  // ─── Format location ───
  const displayLocation = locationLabel || (language === 'bn' ? 'লোকেশন সিঙ্ক হচ্ছে' : 'Location syncing');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      className="relative overflow-hidden rounded-3xl shadow-[0_2px_8px_rgba(0,0,0,0.04),0_8px_28px_rgba(0,0,0,0.08),0_24px_60px_rgba(0,0,0,0.04)]"
    >
      <div
        className="relative overflow-hidden px-5 py-6 sm:px-7 sm:py-8"
        style={{ background: heroGradient }}
      >
        {/* Animated gradient orbs */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-white/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-white/5 blur-2xl" />

        {/* Subtle pattern */}
        <svg
          className="pointer-events-none absolute right-0 top-0 opacity-[0.07]"
          width="200" height="200" viewBox="0 0 160 160" fill="none" aria-hidden
        >
          <path d="M80 8L152 80L80 152L8 80L80 8z" stroke="white" strokeWidth="1" />
          <path d="M80 28L132 80L80 132L28 80L80 28z" stroke="white" strokeWidth="0.6" />
          <circle cx="80" cy="80" r="30" stroke="white" strokeWidth="0.6" />
        </svg>

        {/* ─── Main Content: Left (Prayer Info) + Right (Timer) ─── */}
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          {/* LEFT: Clean Prayer Information */}
          <div className="flex-1 min-w-0">
            {/* Status badge */}
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 150, damping: 20, delay: 0.05 }}
              className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white/85 backdrop-blur-md"
            >
              <Clock size={12} />
              {currentStage === 'next'
                ? (language === 'bn' ? 'সমাপ্ত' : 'Completed')
                : isTomorrow
                  ? (language === 'bn' ? 'কাল ফজর' : 'Tomorrow Fajr')
                  : (language === 'bn' ? 'বর্তমান ওয়াক্ত' : 'Current prayer')}
            </motion.div>

            {/* Prayer name */}
            <motion.h2
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 150, damping: 20, delay: 0.1 }}
              className="text-4xl sm:text-5xl font-bold leading-none text-white tracking-tight"
            >
              {prayerLabel}
            </motion.h2>

            {/* Premium Badges: Azan · Jamat · Ends */}
            {isPrayerActive && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mt-4 flex flex-wrap items-center gap-2"
              >
                <div className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/10 px-3 py-1.5 backdrop-blur-sm">
                  <BellRing size={13} className="text-white/70" />
                  <span className="text-xs font-semibold text-white/60">{language === 'bn' ? 'আজান' : 'Azan'}</span>
                  <span className="text-sm font-bold text-white">
                    {formatPrayerTime12h(activeEntry.adhan, { banglaDigits: language === 'bn', padHour: true })}
                  </span>
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300/25 bg-amber-400/15 px-3 py-1.5 backdrop-blur-sm">
                  <UsersRound size={13} className="text-amber-300" />
                  <span className="text-xs font-semibold text-amber-200">{language === 'bn' ? 'জামাত' : 'Jamat'}</span>
                  <span className="text-sm font-bold text-amber-100">
                    {formatPrayerTime12h(activeEntry.jamaat, { banglaDigits: language === 'bn', padHour: true })}
                  </span>
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 backdrop-blur-sm">
                  <Clock size={13} className="text-white/70" />
                  <span className="text-xs font-semibold text-white/60">{language === 'bn' ? 'শেষ' : 'Ends'}</span>
                  <span className="text-sm font-bold text-white">
                    {formatPrayerTime12h(activeEntry.endTime, { banglaDigits: language === 'bn', padHour: true })}{endSuffix}
                  </span>
                </div>
              </motion.div>
            )}

          </div>

          {/* RIGHT: Timer Card */}
          <div className="flex-shrink-0 flex items-center justify-center">
            <TimerCard
              caption={caption}
              hours={timerDisplay.hours}
              minutes={timerDisplay.minutes}
              seconds={timerDisplay.seconds}
              lang={language}
              helperText={helperText}
              isUrgent={isUrgent}
              timeLabel={timeLabel}
              isCompleted={isCompleted}
              completedText={completedText}
            />
          </div>
        </div>

        {/* ─── 5 Premium Prayer Time Cards (Apple-style) ─── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 100, damping: 20 }}
          className="relative mt-6 flex gap-2 overflow-x-auto pb-1 scrollbar-none"
        >
          {PRAYER_ORDER.map((name, index) => {
            const window = windows.find((w) => w.prayer === LEGACY_TO_CANONICAL[name]);
            const isTarget = index === activeIdx;
            const isEnded = window?.status === 'ended';
            const label = PRAYER_NAME_LABELS[name]?.[language] ?? name;
            const rawTime = prayerTimesResponse?.rawTimings[name as keyof typeof prayerTimesResponse.rawTimings] ?? '00:00';
            const conf = computePrayerTimeConfig(
              rawTime, prayerTimePreferences[LEGACY_TO_CANONICAL[name] as ConfigurablePrayerName]
            );

            return (
              <motion.div
                key={name}
                whileTap={{ scale: 0.95 }}
                className={`flex min-w-[85px] flex-shrink-0 flex-col items-center rounded-2xl border px-3 py-2 transition-all duration-300 ${
                  isTarget 
                    ? 'border-white/40 bg-white/15 shadow-[0_2px_8px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.2)]' 
                    : 'border-white/8 bg-white/5'
                }`}
                style={{ opacity: isEnded && !isTarget ? 0.4 : 1 }}
              >
                <span className={`text-[10px] font-bold uppercase tracking-[0.08em] ${
                  isTarget ? 'text-white/90' : 'text-white/50'
                }`}>
                  {label}
                </span>

                <div className="mt-2 w-full border-t border-white/8" />

                <div className="mt-1.5 flex w-full items-center justify-between gap-1">
                  <span className="text-[8px] font-semibold tracking-wider text-white/45 uppercase">
                    {language === 'bn' ? 'আ.' : 'Az'}
                  </span>
                  <span className="text-[11px] font-bold tabular-nums text-white/85 tracking-tight">
                    {formatPrayerTime12h(conf.azanTime, { banglaDigits: false, padHour: true })}
                  </span>
                </div>

                <div className="flex w-full items-center justify-between gap-1">
                  <span className="text-[8px] font-semibold tracking-wider text-amber-300/60 uppercase">
                    {language === 'bn' ? 'জা.' : 'Jm'}
                  </span>
                  <span className="text-[11px] font-bold tabular-nums text-amber-200/90 tracking-tight">
                    {formatPrayerTime12h(conf.jamatTime, { banglaDigits: false, padHour: true })}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* ─── Location + Date Footer ─── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="relative mt-5 pt-4"
        >
          {/* Subtle gradient divider that blends with card color */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <div className="flex items-center gap-1.5 text-white/50">
              <MapPin size={11} className="flex-shrink-0 text-white/40" />
              <span className="text-[11px] font-medium leading-relaxed text-white/65">{displayLocation}</span>
            </div>
            <div className="flex items-center gap-1.5 text-white/40">
              <span className="text-[11px] font-medium tabular-nums text-white/60">{dateLabel}</span>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}