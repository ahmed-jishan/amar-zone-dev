// ────────────────────────────────────────────────────────────────
// ╔══════════════════════════════════════════════════════════════╗
// ║   FastingTracker — Premium Daily Fasting Log               ║
// ║   Apple-style health card for Ramadan fasting tracking     ║
// ╚══════════════════════════════════════════════════════════════╝
// ────────────────────────────────────────────────────────────────

'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Flame, Target, RefreshCw, CheckCircle2, XCircle, Calendar } from 'lucide-react';
import { useModeEngine } from '../hooks/useModeEngine';
import { useSettingsStore } from '@/features/settings/store/settingsStore';
import { getFastingDisplayInfo } from '../ramadan';
import type { FastingStatus } from '../types';
import { triggerHaptic } from '@/lib/native/haptics';

interface FastingTrackerProps {
  /** Called when user updates fasting status */
  onFastingUpdate?: (status: FastingStatus) => void;
  /** Current fasting status from store */
  todayStatus?: FastingStatus;
  /** Custom fasting stats (for future fastingStore integration) */
  streakOverride?: number;
  totalFastedOverride?: number;
}

const FASTING_STATUSES: FastingStatus[] = ['fasting', 'not_fasting', 'qada', 'excused'];

export default function FastingTracker({
  onFastingUpdate,
  todayStatus: externalStatus,
  streakOverride,
  totalFastedOverride,
}: FastingTrackerProps) {
  const engine = useModeEngine();
  const { language } = useSettingsStore();
  const [localStatus, setLocalStatus] = useState<FastingStatus>('unspecified');

  const currentStatus = externalStatus ?? localStatus;
  const streak = streakOverride ?? engine.fastingState.streakDays;
  const totalFasted = totalFastedOverride ?? engine.fastingState.totalFasted;
  const dayOfRamadan = engine.ramadanData.dayOfRamadan;

  const handleStatusChange = (status: FastingStatus) => {
    triggerHaptic('medium');
    setLocalStatus(status);
    onFastingUpdate?.(status);
  };

  const currentInfo = getFastingDisplayInfo(currentStatus, language);

  // Progress: day X of 30
  const progressPercent = dayOfRamadan ? Math.round((dayOfRamadan / 30) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-emerald-600/10 border border-emerald-500/15 shadow-lg mode-card-dark"
    >
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-bold text-emerald-300/90">
            <Moon size={16} />
            {language === 'bn' ? 'রোজা ট্র্যাকার' : 'Fasting Tracker'}
          </h3>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400/60 bg-emerald-500/10 rounded-full px-2.5 py-1">
            {dayOfRamadan
              ? (language === 'bn' ? `দিন ${dayOfRamadan}/৩০` : `Day ${dayOfRamadan}/30`)
              : (language === 'bn' ? 'রমজান' : 'Ramadan')}
          </span>
        </div>

        {/* Progress Ring + Stats */}
        <div className="flex items-center gap-6">
          {/* Circular progress */}
          <div className="relative w-20 h-20 shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="5" />
              <motion.circle
                cx="40" cy="40" r="32"
                fill="none"
                stroke="url(#fasting-gradient)"
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 32}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 32 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 32 * (1 - progressPercent / 100) }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
              <defs>
                <linearGradient id="fasting-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#34d399" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-black text-white">{dayOfRamadan ?? '—'}</span>
              <span className="text-[8px] text-white/40 font-semibold uppercase">
                {language === 'bn' ? 'দিন' : 'Days'}
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex-1 grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-white/5 p-2.5">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Flame size={10} className="text-emerald-300/60" />
                <span className="text-[9px] font-semibold uppercase text-emerald-300/50">
                  {language === 'bn' ? 'স্ট্রিক' : 'Streak'}
                </span>
              </div>
              <p className="text-lg font-black text-white">{streak}</p>
              <p className="text-[9px] text-white/40">
                {language === 'bn' ? 'ধারাবাহিক' : 'consecutive'}
              </p>
            </div>
            <div className="rounded-xl bg-white/5 p-2.5">
              <div className="flex items-center gap-1.5 mb-0.5">
                <CheckCircle2 size={10} className="text-emerald-300/60" />
                <span className="text-[9px] font-semibold uppercase text-emerald-300/50">
                  {language === 'bn' ? 'মোট' : 'Total'}
                </span>
              </div>
              <p className="text-lg font-black text-white">{totalFasted}</p>
              <p className="text-[9px] text-white/40">
                {language === 'bn' ? 'রোজা রাখা' : 'fasted'}
              </p>
            </div>
          </div>
        </div>

        {/* Status Selector */}
        <div>
          <p className="text-xs font-semibold text-emerald-300/60 mb-2">
            {language === 'bn' ? 'আজকের রোজার অবস্থা' : 'Today\'s fasting status'}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {FASTING_STATUSES.map((status) => {
              const info = getFastingDisplayInfo(status, language);
              const isActive = currentStatus === status;
              return (
                <motion.button
                  key={status}
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleStatusChange(status)}
                  className={`rounded-xl px-3 py-2.5 text-left transition-all ${
                    isActive
                      ? 'bg-emerald-500/20 border border-emerald-400/30 shadow-sm'
                      : 'bg-white/5 border border-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{info.icon}</span>
                    <div>
                      <p className={`text-xs font-bold ${isActive ? 'text-emerald-300' : 'text-white/70'}`}>
                        {info.label}
                      </p>
                    </div>
                    {isActive && <CheckCircle2 size={12} className="ml-auto text-emerald-400" />}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}