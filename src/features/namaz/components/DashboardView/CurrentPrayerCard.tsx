'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BellRing, Clock, MapPin, UsersRound } from 'lucide-react';
import {
  buildPrayerDate,
  buildPrayerWindows,
  formatPrayerTime12h,
  formatRemaining,
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

// ---- Dynamic gradient based on time of day ----
function getTimeOfDayGradient(isTomorrow: boolean): string {
  if (isTomorrow) return 'linear-gradient(135deg, #0c1a2e 0%, #1a1a2e 50%, #16213e 100%)';
  const h = new Date().getHours();
  if (h >= 5 && h < 8)  return 'linear-gradient(135deg, #c94b4b 0%, #e8a87c 40%, #f5d6a8 100%)';        // Sunrise - soft gold/pink
  if (h >= 8 && h < 12) return 'linear-gradient(135deg, #0f4a3a 0%, #0f5a51 40%, #1a7a6a 100%)';         // Morning - fresh emerald
  if (h >= 12 && h < 16) return 'linear-gradient(135deg, #0f3d2e 0%, #0f5a51 45%, #2a7a6a 100%)';        // Noon - vibrant green
  if (h >= 16 && h < 19) return 'linear-gradient(135deg, #b85d19 0%, #d4873a 40%, #e8a04a 100%)';        // Sunset - warm amber
  return 'linear-gradient(135deg, #0c1a2e 0%, #1a1a3e 40%, #0f2a4a 100%)';                              // Night - deep blue
}

function getGradientLabel(lang: 'bn' | 'en'): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 8)  return lang === 'bn' ? '🌅 সকাল' : '🌅 Morning';
  if (h >= 8 && h < 12) return lang === 'bn' ? '☀️ পূর্বাহ্ন' : '☀️ Morning';
  if (h >= 12 && h < 16) return lang === 'bn' ? '🌤️ দুপুর' : '🌤️ Noon';
  if (h >= 16 && h < 19) return lang === 'bn' ? '🌇 সন্ধ্যা' : '🌇 Evening';
  return '🌙 রাত';
}

// ---- Circular progress component ----
function CircularProgress({ progress, size = 64, strokeWidth = 4, color = '#ffffff' }: { progress: number; size?: number; strokeWidth?: number; color?: string }) {
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (progress / 100) * c;

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={strokeWidth} />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={c}
        initial={{ strokeDashoffset: c }}
        animate={{ strokeDashoffset: offset }}
        transition={{ type: 'spring', stiffness: 60, damping: 15 }}
      />
    </svg>
  );
}

// ---- Animated Timer Digit ----
function TimerDigit({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative overflow-hidden rounded-xl bg-white/10 backdrop-blur-sm px-2.5 py-1.5 min-w-[3rem] text-center border border-white/10">
        <AnimatePresence mode="popLayout">
          <motion.span
            key={value}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="block text-2xl sm:text-3xl font-bold tabular-nums text-white"
          >
            {value}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="mt-1 text-[10px] font-semibold text-white/50 uppercase tracking-wider">{label}</span>
    </div>
  );
}

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
  const isAzanUpcoming = azanDate && azanDate.getTime() > nowMs;
  const isJamatUpcoming = jamatDate && jamatDate.getTime() > nowMs;
  const isPrayerActive = activeWindow?.status === 'active';

  const countdownSec = activeWindow?.remainingSeconds ?? 0;
  const cdH = Math.floor(countdownSec / 3600);
  const cdM = Math.floor((countdownSec % 3600) / 60);
  const cdS = countdownSec % 60;

  const azanCountdownSec = azanDate ? Math.max(0, Math.floor((azanDate.getTime() - nowMs) / 1000)) : 0;
  const azanH = Math.floor(azanCountdownSec / 3600);
  const azanM = Math.floor((azanCountdownSec % 3600) / 60);
  const azanS = azanCountdownSec % 60;

  const jamatCountdownSec = jamatDate ? Math.max(0, Math.floor((jamatDate.getTime() - nowMs) / 1000)) : 0;
  const jamatH = Math.floor(jamatCountdownSec / 3600);
  const jamatM = Math.floor((jamatCountdownSec % 3600) / 60);
  const jamatS = jamatCountdownSec % 60;

  const dateLabel = useMemo(() => {
    return new Intl.DateTimeFormat(language === 'bn' ? 'bn-BD' : 'en-US', {
      weekday: 'long', day: 'numeric', month: 'long',
      timeZone: prayerTimesResponse.timezone,
    }).format(now);
  }, [now, prayerTimesResponse.timezone, language]);

  const endSuffix = activeWindow?.endsTomorrow ? (language === 'bn' ? ' (কাল)' : '') : '';
  const prayerLabel = PRAYER_NAME_LABELS[activeName]?.[language] ?? activeName;

  // ---- Dynamic gradient ----
  const heroGradient = useMemo(() => getTimeOfDayGradient(isTomorrow), [isTomorrow]);
  const timeLabel = useMemo(() => getGradientLabel(language), [language]);

  // ---- Caption ----
  const caption = isAzanUpcoming
    ? (language === 'bn' ? `আজান হতে বাকি` : `Azan in`)
    : isJamatUpcoming && isPrayerActive
      ? (language === 'bn' ? `জামাত হতে বাকি` : `Jamat in`)
      : isPrayerActive
        ? (language === 'bn' ? `শেষ হতে বাকি` : `Ends in`)
        : (language === 'bn' ? `শুরু হতে বাকি` : `Starts in`);

  const helperText = useMemo(() => {
    if (isAzanUpcoming) return language === 'bn' ? 'শান্তিতে অপেক্ষা করুন...' : 'Waiting peacefully...';
    if (isJamatUpcoming && isPrayerActive) return language === 'bn' ? 'জামাতে যোগ দিন 🕌' : 'Join the congregation 🕌';
    if (!activeWindow) return language === 'bn' ? 'প্রস্তুতি নিন' : 'Prepare calmly';
    if (activeWindow.status === 'active') {
      if (countdownSec <= 10 * 60) return language === 'bn' ? 'সময় কম — শান্তভাবে শেষ করুন 🌿' : 'Time is short — finish calmly 🌿';
      if (countdownSec <= 30 * 60) return language === 'bn' ? 'মনোযোগ ধরে রাখুন 💎' : 'Stay focused 💎';
      return language === 'bn' ? 'জামাতে নামাজ পড়ার চেষ্টা করুন 🤲' : 'Try to pray in congregation 🤲';
    }
    if (countdownSec <= 10 * 60) return language === 'bn' ? 'সময় কম — ওযু ও প্রস্তুতি নিন' : 'Time is short — make wudu';
    return language === 'bn' ? 'ওযু করে প্রস্তুত থাকুন' : 'Make wudu and be ready';
  }, [activeWindow, countdownSec, language, isAzanUpcoming, isJamatUpcoming, isPrayerActive]);

  // ---- Prayer time progress for circular ring ----
  const prayerProgress = useMemo(() => {
    if (!activeWindow || activeWindow.status !== 'active' || !activeWindow.start || !activeWindow.end) return 0;
    const total = (activeWindow.end.getTime() - activeWindow.start.getTime()) / 1000;
    if (total <= 0) return 0;
    const elapsed = total - activeWindow.remainingSeconds;
    return (elapsed / total) * 100;
  }, [activeWindow]);

  // ---- Show 5 prayer time dots ----
  const completedCount = PRAYER_ORDER.filter(
    (p) => ['onTime', 'late', 'jamaat'].includes(prayerTimes[p].status)
  ).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      className="relative overflow-hidden rounded-3xl shadow-2xl"
    >
      {/* Glassmorphism base */}
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

        {/* Time-of-day badge */}
        <div className="relative mb-4 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/80 backdrop-blur-sm">
          <span>{timeLabel}</span>
        </div>

        {/* Main content */}
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          {/* Left: Prayer info */}
          <div className="flex-1">
            {/* Status badge */}
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white/85 backdrop-blur-sm">
              <Clock size={12} />
              {activeWindow?.status === 'active'
                ? (language === 'bn' ? 'বর্তমান ওয়াক্ত' : 'Current prayer')
                : isTomorrow
                  ? (language === 'bn' ? 'কাল ফজর' : 'Tomorrow Fajr')
                  : (language === 'bn' ? 'পরবর্তী নামাজ' : 'Next prayer')}
            </div>

            {/* Prayer name */}
            <h2 className="mt-1 text-4xl sm:text-5xl font-bold leading-none text-white tracking-tight">
              {prayerLabel}
            </h2>

            {/* Time badges row */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
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
            </div>
          </div>

          {/* Right: Circular Timer */}
          <div className="flex flex-col items-center gap-3">
            {isPrayerActive && (
              <div className="relative flex items-center justify-center">
                <CircularProgress progress={prayerProgress} size={72} strokeWidth={4} color="rgba(255,255,255,0.8)" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-white/70">{Math.round(prayerProgress)}%</span>
                </div>
              </div>
            )}
            <div className="text-[10px] font-semibold text-white/50">{caption}</div>
          </div>
        </div>

        {/* ---- Timer digits row ---- */}
        <div className="relative mt-6 flex items-end justify-between gap-2">
          {/* Primary countdown */}
          {isAzanUpcoming ? (
            <div className="flex gap-2">
              <TimerDigit value={pad2(azanH, language)} label={language === 'bn' ? 'ঘ' : 'Hr'} />
              <span className="pb-3 text-xl font-bold text-white/30">:</span>
              <TimerDigit value={pad2(azanM, language)} label={language === 'bn' ? 'মি' : 'Min'} />
              <span className="pb-3 text-xl font-bold text-white/30">:</span>
              <TimerDigit value={pad2(azanS, language)} label={language === 'bn' ? 'সে' : 'Sec'} />
            </div>
          ) : isJamatUpcoming && isPrayerActive ? (
            <div className="flex gap-2">
              <TimerDigit value={pad2(jamatH, language)} label={language === 'bn' ? 'ঘ' : 'Hr'} />
              <span className="pb-3 text-xl font-bold text-amber-300/50">:</span>
              <TimerDigit value={pad2(jamatM, language)} label={language === 'bn' ? 'মি' : 'Min'} />
              <span className="pb-3 text-xl font-bold text-amber-300/50">:</span>
              <TimerDigit value={pad2(jamatS, language)} label={language === 'bn' ? 'সে' : 'Sec'} />
            </div>
          ) : (
            <div className="flex gap-2">
              <TimerDigit value={pad2(cdH, language)} label={language === 'bn' ? 'ঘ' : 'Hr'} />
              <span className="pb-3 text-xl font-bold text-white/30">:</span>
              <TimerDigit value={pad2(cdM, language)} label={language === 'bn' ? 'মি' : 'Min'} />
              <span className="pb-3 text-xl font-bold text-white/30">:</span>
              <TimerDigit value={pad2(cdS, language)} label={language === 'bn' ? 'সে' : 'Sec'} />
            </div>
          )}

          {/* Helper text */}
          <div className="text-right">
            <p className="text-xs font-medium text-white/60 leading-relaxed">{helperText}</p>
          </div>
        </div>

        {/* ---- 5 prayer pills strip ---- */}
        <div className="relative mt-5 flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {PRAYER_ORDER.map((name, index) => {
            const window = windows.find((w) => w.prayer === LEGACY_TO_CANONICAL[name]);
            const isActivePrayer = window?.status === 'active';
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
                className={`flex min-w-[68px] flex-shrink-0 flex-col items-center gap-1 rounded-xl border px-2.5 py-2 transition-all duration-300 ${
                  isTarget ? 'border-white/40 bg-white/15 shadow-lg' : 'border-white/10 bg-white/5'
                }`}
                style={{ opacity: isEnded && !isTarget ? 0.45 : 1 }}
              >
                <span className="text-[9px] font-bold uppercase tracking-wider text-white/50">{label}</span>
                {/* Dot indicator */}
                <div
                  className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${
                    isActivePrayer ? 'bg-emerald-300 shadow-lg shadow-emerald-300/50' : 
                    isEnded ? 'bg-white/20' : 'bg-white/30'
                  }`}
                  style={{
                    boxShadow: isActivePrayer ? '0 0 8px rgba(110, 231, 183, 0.5)' : 'none',
                  }}
                />
                <span className="text-[8px] font-semibold text-white/40">{language === 'bn' ? 'আজান' : 'Azan'}</span>
                <span className="text-[10px] font-bold tabular-nums text-white/80">
                  {formatPrayerTime12h(conf.azanTime, { banglaDigits: false, padHour: true })}
                </span>
                <span className="text-[8px] font-semibold text-amber-300/60">{language === 'bn' ? 'জামাত' : 'Jamat'}</span>
                <span className="text-[10px] font-bold tabular-nums text-amber-200/80">
                  {formatPrayerTime12h(conf.jamatTime, { banglaDigits: false, padHour: true })}
                </span>
              </motion.div>
            );
          })}
        </div>

        {/* ---- Bottom: Location + Date ---- */}
        <div className="relative mt-4 flex flex-col gap-1.5 border-t border-white/10 pt-3 text-xs font-medium sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-1.5 text-white/50">
            <MapPin size={12} />
            <span>{locationLabel || (language === 'bn' ? 'লোকেশন সিঙ্ক হচ্ছে' : 'Location syncing')}</span>
          </div>
          <span className="text-white/40">{dateLabel}</span>
        </div>
      </div>
    </motion.div>
  );
}