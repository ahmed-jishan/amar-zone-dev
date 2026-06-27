// ────────────────────────────────────────────────────────────────
// ╔══════════════════════════════════════════════════════════════╗
// ║   IftarCountdown — Premium Real-time Countdown             ║
// ║   Apple-style glass card showing live Iftar/Sehri timer    ║
// ║   Updates every second with smooth spring animations       ║
// ╚══════════════════════════════════════════════════════════════╝
// ────────────────────────────────────────────────────────────────

'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, Clock, Coffee, Utensils } from 'lucide-react';
import { useModeEngine } from '../hooks/useModeEngine';
import { useSettingsStore } from '@/features/settings/store/settingsStore';
import { computeIftarSehriTimes, formatIftarCountdown } from '../ramadan';
import { usePrayerTimes } from '../../hooks/usePrayerTimes';
import type { IftarSehriTimes } from '../types';

interface IftarCountdownProps {
  variant?: 'compact' | 'full';
}

/**
 * IftarCountdown — Premium live countdown to Iftar & Sehri
 * 
 * Shows:
 * - Time remaining until Iftar (Maghrib)
 * - Time remaining until Sehri ends (Fajr) — only during Sehri window
 * - Iftar/Sehri dua options
 * - Progress ring showing elapsed time
 */
export default function IftarCountdown({ variant = 'full' }: IftarCountdownProps) {
  const { language } = useSettingsStore();
  const { data: prayerTimes } = usePrayerTimes();
  const engine = useModeEngine();
  
  // Live second tick for real-time countdown
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // Fresh computed times on every tick (for real-time accuracy)
  const times = useMemo(() => computeIftarSehriTimes(prayerTimes), [tick, prayerTimes]);

  if (!times || !engine.activeModes.ramadanMode) return null;

  const { iftarRemaining, sehriRemaining, isSehriWindow, isIftarSoon } = times;

  // Countdown strings
  const iftarStr = formatIftarCountdown(iftarRemaining, language);
  
  // Iftar has passed?
  const isIftarPassed = iftarRemaining <= 0;

  // Progress: percentage of day elapsed (for ring visualization)
  const now = new Date();
  const dayProgress = ((now.getHours() * 60 + now.getMinutes()) / 1440) * 100;

  if (variant === 'compact') {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      className="rounded-2xl overflow-hidden bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/20 mode-card-dark"
      >
        <div className="p-3 flex items-center gap-3">
          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
              {isIftarPassed ? <Moon size={18} className="text-amber-300" /> : <Sun size={18} className="text-amber-300" />}
            </div>
            {isIftarSoon && !isIftarPassed && (
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-400 animate-ping" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-amber-300/80 uppercase tracking-wider">
              {isIftarPassed
                ? (language === 'bn' ? 'ইফতার হয়েছে' : 'Iftar done')
                : (language === 'bn' ? 'ইফতার বাকি' : 'Iftar in')}
            </p>
            <p className="text-lg font-bold text-white font-mono tabular-nums">
              {isIftarPassed ? (language === 'bn' ? 'আলহামদুলিল্লাহ' : 'Alhamdulillah') : iftarStr}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-amber-300/60">{times.iftarTime}</p>
            {!isIftarPassed && (
              <button
                type="button"
                className="mt-1 rounded-full px-2.5 py-1 bg-amber-500/20 text-xs font-semibold text-amber-300 hover:bg-amber-500/30 transition-colors"
                onClick={() => {
                  // Copy iftar dua
                  const dua = language === 'bn'
                    ? 'اللهم لك صمت و على رزقك أفطرت'
                    : 'Allahumma laka sumtu wa \'ala rizq-ika aftartu';
                  navigator.clipboard.writeText(dua);
                }}
              >
                {language === 'bn' ? 'দোয়া' : 'Du\'a'}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  // Full variant
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-amber-600/10 border border-amber-500/15 shadow-lg mode-card-dark"
    >
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-bold text-amber-300/90">
            <Moon size={16} />
            {language === 'bn' ? 'ইফতার কাউন্টডাউন' : 'Iftar Countdown'}
          </h3>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400/60 bg-amber-500/10 rounded-full px-2.5 py-1">
            {engine.ramadanData.dayOfRamadan 
              ? (language === 'bn' ? `রমজান ${engine.ramadanData.dayOfRamadan}` : `Ramadan ${engine.ramadanData.dayOfRamadan}`)
              : (language === 'bn' ? 'রমজান' : 'Ramadan')}
          </span>
        </div>

        {/* Main Countdown */}
        <div className="text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={isIftarPassed ? 'done' : 'counting'}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-1"
            >
              <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-300/50">
                {isIftarPassed
                  ? (language === 'bn' ? 'আজকের ইফতার সমাপ্ত' : 'Today\'s Iftar Complete')
                  : (language === 'bn' ? `ইফতার সময় ${times.iftarTime}` : `Iftar at ${times.iftarTime}`)}
              </p>
              <p className="text-4xl sm:text-5xl font-black text-white font-mono tabular-nums tracking-tight">
                {isIftarPassed ? (language === 'bn' ? 'আলহামদুলিল্লাহ' : '✓ Complete') : iftarStr}
              </p>
              {isIftarSoon && !isIftarPassed && (
                <motion.p
                  initial={{ scale: 0.8 }}
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="text-sm font-bold text-amber-400"
                >
                  {language === 'bn' ? '⏰ ইফতারের সময় ঘনিয়ে এসেছে!' : '⏰ Iftar time is near!'}
                </motion.p>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Progress Bar */}
        <div className="relative h-1.5 rounded-full bg-white/5 overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-amber-400 to-orange-400"
            initial={{ width: '0%' }}
            animate={{ width: `${Math.min(dayProgress, 100)}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Info Row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-white/5 p-3">
            <div className="flex items-center gap-2 mb-1">
              <Utensils size={12} className="text-amber-300/60" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-300/50">
                {language === 'bn' ? 'ইফতার' : 'Iftar'}
              </span>
            </div>
            <p className="text-sm font-bold text-white">{times.iftarTime}</p>
            <p className="text-[10px] text-white/40">
              {language === 'bn' ? 'মাগরিব' : 'Maghrib'}
            </p>
          </div>
          <div className="rounded-xl bg-white/5 p-3">
            <div className="flex items-center gap-2 mb-1">
              <Coffee size={12} className="text-sky-300/60" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-sky-300/50">
                {language === 'bn' ? 'সেহরির শেষ' : 'Sehri ends'}
              </span>
            </div>
            <p className="text-sm font-bold text-white">{times.sehriEnd}</p>
            <p className="text-[10px] text-white/40">
              {language === 'bn' ? 'ফজর' : 'Fajr'}
            </p>
          </div>
        </div>

        {/* Iftar Dua */}
        <div className="rounded-xl bg-amber-500/5 border border-amber-500/10 p-3">
          <p className="text-center text-sm text-amber-200/80 font-arabic" dir="rtl">
            ٱللَّٰهُمَّ لَكَ صُمْتُ وَعَلَىٰ رِزْقِكَ أَفْطَرْتُ
          </p>
          <p className="text-center text-[10px] text-amber-300/50 mt-1">
            {language === 'bn' ? 'ইফতারের দোয়া' : 'Iftar Du\'a'}
          </p>
        </div>

        {/* Last 10 days badge */}
        {engine.ramadanData.isLastTenDays && (
          <div className="rounded-xl bg-gradient-to-r from-purple-500/10 to-amber-500/10 border border-purple-500/20 p-3">
            <p className="text-center text-xs font-bold text-purple-300">
              {engine.ramadanData.isLaylatulQadrLikely
                ? (language === 'bn'
                    ? '🌙 লাইলাতুল কদরের সম্ভাবনা — শেষ ১০ দিনের বেজোড় রাত'
                    : '🌙 Laylatul Qadr likely — Last 10 odd night')
                : (language === 'bn'
                    ? '🕌 রমজানের শেষ ১০ দিন — বেশি বেশি ইবাদত করুন'
                    : '🕌 Last 10 days of Ramadan — increase worship')}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}