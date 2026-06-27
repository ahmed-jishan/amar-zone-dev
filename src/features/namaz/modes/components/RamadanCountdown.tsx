// ────────────────────────────────────────────────────────────────
// ╔══════════════════════════════════════════════════════════════╗
// ║   RamadanCountdown — Next Ramadan State Machine Display     ║
// ║   Apple/Google-grade adaptive card that shows:             ║
// ║   1. Far from Ramadan → "Next Ramadan in X months"         ║
// ║   2. Approaching (60 days) → "Ramadan is coming!" + Prep   ║
// ║   3. Active → Full Iftar/Fasting/Taraweeh                  ║
// ╚══════════════════════════════════════════════════════════════╝
// ────────────────────────────────────────────────────────────────

'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Calendar, Target, BookOpen, Bell, Sparkles, ChevronRight } from 'lucide-react';
import { useSettingsStore } from '@/features/settings/store/settingsStore';
import { usePrefsStore } from '../../store/prefsStore';
import { getNextRamadan, formatNextRamadanDate, formatDaysString, formatLastRamadanDate, formatNextRamadanShort, type NextRamadanInfo } from '../nextRamadan';
import { triggerHaptic } from '@/lib/native/haptics';

interface RamadanCountdownProps {
  /** When true, auto-detected Ramadan is active */
  isRamadanActive?: boolean;
  /** Current Hijri day of Ramadan (if active) */
  ramadanDay?: number | null;
  /** Called to open settings/preferences */
  onOpenSettings?: () => void;
}

/**
 * RamadanCountdown — Smart adaptive card that shows the appropriate
 * content based on how far/close the next Ramadan is.
 * 
 * States:
 * - 'far': Next Ramadan in X months, progress bar
 * - 'approaching': Coming soon, preparation checklist
 * - 'active': Hidden (IftarCountdown handles this)
 * - When user manually enables Ramadan outside season: preparation card
 */
export default function RamadanCountdown({
  isRamadanActive,
  ramadanDay,
  onOpenSettings,
}: RamadanCountdownProps) {
  const { language } = useSettingsStore();
  const ramadanMode = usePrefsStore((s) => s.ramadanMode);
  const [tick, setTick] = useState(0);

  // Update countdown daily
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60_000); // every minute
    return () => clearInterval(interval);
  }, []);

  // Compute next Ramadan info
  const ramadanInfo = useMemo(() => getNextRamadan(), [tick]);

  // If Ramadan is active via API or mode, don't show countdown (IftarCountdown handles it)
  if (isRamadanActive || (ramadanInfo.isCurrentlyRamadan)) {
    return null;
  }

  // If user manually enabled Ramadan outside the season → show preparation card
  if (ramadanMode && !isRamadanActive && !ramadanInfo.isCurrentlyRamadan) {
    return (
      <RamadanPreparationCard
        ramadanInfo={ramadanInfo}
        language={language}
        onOpenSettings={onOpenSettings}
      />
    );
  }

  // Determine which variant to show
  const { season, daysUntilRamadan } = ramadanInfo;

  if (daysUntilRamadan <= 0) return null;

  // Show regular countdown
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
            {language === 'bn' ? 'পরবর্তী রমজান' : 'Next Ramadan'}
          </h3>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400/60 bg-emerald-500/10 rounded-full px-2.5 py-1">
            {ramadanInfo.nextHijriYear} AH
          </span>
        </div>

        {/* Season indicator */}
        <div className="flex items-center gap-3">
          <div className={`rounded-full px-3 py-1 text-xs font-bold ${
            season === 'approaching' 
              ? 'bg-amber-500/20 text-amber-300' 
              : 'bg-emerald-500/10 text-emerald-300/70'
          }`}>
            {season === 'approaching' 
              ? (language === 'bn' ? 'আসছে!' : 'Coming Soon!')
              : (language === 'bn' ? 'অপেক্ষায়' : 'Awaited')}
          </div>
        </div>

        {/* Main countdown */}
        <div className="text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={daysUntilRamadan > 60 ? 'far' : 'near'}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              <p className="text-4xl sm:text-5xl font-black text-white font-mono tabular-nums tracking-tight">
                {formatDaysString(daysUntilRamadan, language)}
              </p>
              <p className="text-sm text-white/50">
                {formatNextRamadanDate(ramadanInfo, language)}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Progress bar: Ramadan cycle with Hijri years */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] text-white/40">
            <span>{formatLastRamadanDate(ramadanInfo, language) || (language === 'bn' ? 'গত রমজান' : 'Last')}</span>
            <span>{formatNextRamadanShort(ramadanInfo, language)}</span>
          </div>
          <div className="relative h-2 rounded-full bg-white/5 overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400"
              initial={{ width: '0%' }}
              animate={{ width: `${ramadanInfo.progressPercent}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Approaching season: show preparation actions */}
        {season === 'approaching' && daysUntilRamadan <= 60 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-2 pt-2 border-t border-white/5"
          >
            <p className="text-xs font-semibold text-amber-300/80 flex items-center gap-2">
              <Sparkles size={12} />
              {language === 'bn' ? 'প্রস্তুতি নিন:' : 'Prepare:'}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  onOpenSettings?.();
                }}
                className="rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 p-2.5 text-left transition-all"
              >
                <Target size={14} className="text-emerald-300 mb-1" />
                <p className="text-[10px] font-bold text-white/80">
                  {language === 'bn' ? 'রোজার লক্ষ্য নির্ধারণ' : 'Set Fasting Goal'}
                </p>
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  window.dispatchEvent(new CustomEvent('namaz:open-quran'));
                }}
                className="rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 p-2.5 text-left transition-all"
              >
                <BookOpen size={14} className="text-amber-300 mb-1" />
                <p className="text-[10px] font-bold text-white/80">
                  {language === 'bn' ? 'কুরআন খতম প্ল্যান' : 'Quran Khatam Plan'}
                </p>
              </button>
            </div>
          </motion.div>
        )}

        {/* Show date info at bottom */}
        <div className="flex items-center justify-center gap-2 text-[10px] text-white/30">
          <Calendar size={10} />
          <span>
            {language === 'bn' 
              ? `${Math.round(daysUntilRamadan / 7)} সপ্তাহ ${daysUntilRamadan % 7} দিন বাকি`
              : `${Math.floor(daysUntilRamadan / 7)} weeks ${daysUntilRamadan % 7} days remaining`}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * RamadanPreparationCard — Shown when user manually enables Ramadan
 * mode outside the actual Ramadan season.
 * Shows preparation tools instead of Iftar/Fasting.
 */
function RamadanPreparationCard({
  ramadanInfo,
  language,
  onOpenSettings,
}: {
  ramadanInfo: NextRamadanInfo;
  language: 'bn' | 'en';
  onOpenSettings?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-amber-600/10 border border-amber-500/15 shadow-lg mode-card-dark"
    >
      <div className="p-4 space-y-4 [&_.dark-text]:text-white/90">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
            <Moon size={18} className="text-amber-300" />
          </div>
          <div>
            <p className="text-xs font-bold text-amber-300/80 dark-text">
              {language === 'bn' ? 'রমজানের প্রস্তুতি' : 'Ramadan Preparation'}
            </p>
            <p className="text-[10px] text-amber-200/50 dark-text">
              {formatNextRamadanDate(ramadanInfo, language)}
            </p>
          </div>
        </div>

        {/* Days remaining — BIG DISPLAY */}
        <div className="text-center py-2">
          <p className="text-4xl sm:text-5xl font-black text-amber-200 font-mono tabular-nums tracking-tight">
            {formatDaysString(ramadanInfo.daysUntilRamadan, language)}
          </p>
          <p className="text-sm text-amber-200/60 mt-1">
            {language === 'bn' ? 'বাকি' : 'remaining'}
          </p>
        </div>

        {/* Notice */}
        <div className="rounded-xl bg-amber-500/5 border border-amber-500/10 p-3">
          <p className="text-xs font-medium text-amber-200/80">
            {language === 'bn'
              ? `আগামী রমজান শুরু হবে ${formatNextRamadanDate(ramadanInfo, language)}`
              : `Next Ramadan starts ${formatNextRamadanDate(ramadanInfo, language)}`}
          </p>
        </div>

        {/* Preparation checklist */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-amber-300/60">
            {language === 'bn' ? 'প্রস্তুতি তালিকা' : 'Preparation Checklist'}
          </p>

          <PrepItem
            icon={<BookOpen size={14} />}
            label={language === 'bn' ? 'কুরআন খতমের পরিকল্পনা' : 'Quran Khatam Plan'}
            description={language === 'bn' ? '৩০ দিনে কুরআন খতমের প্ল্যান তৈরি করুন' : 'Create a 30-day Quran completion plan'}
          />
          <PrepItem
            icon={<Bell size={14} />}
            label={language === 'bn' ? 'সেহরি/ইফতার রিমাইন্ডার' : 'Sehri/Iftar Reminders'}
            description={language === 'bn' ? 'রমজানের জন্য নোটিফিকেশন কনফিগার করুন' : 'Configure Ramadan notifications'}
          />
          <PrepItem
            icon={<Target size={14} />}
            label={language === 'bn' ? 'রোজার লক্ষ্য' : 'Fasting Goal'}
            description={language === 'bn' ? 'আপনার রোজার জন্য লক্ষ্য নির্ধারণ করুন' : 'Set your fasting goals for Ramadan'}
          />
          <PrepItem
            icon={<Sparkles size={14} />}
            label={language === 'bn' ? 'ইবাদতের লক্ষ্য' : 'Worship Goals'}
            description={language === 'bn' ? 'তারাবীহ, তাহাজ্জুদ ও অন্যান্য ইবাদতের লক্ষ্য' : 'Set Taraweeh, Tahajjud & other worship goals'}
          />
        </div>

        {/* Action button */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic('medium');
            onOpenSettings?.();
          }}
          className="w-full rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 py-3 text-sm font-bold text-amber-300 transition-all flex items-center justify-center gap-2"
        >
          <span>{language === 'bn' ? 'সেটিংসে যান' : 'Go to Settings'}</span>
          <ChevronRight size={14} />
        </button>
      </div>
    </motion.div>
  );
}

function PrepItem({
  icon,
  label,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-amber-500/5 p-2.5">
      <div className="text-amber-300/60 shrink-0">{icon}</div>
      <div>
        <p className="text-xs font-bold text-amber-100/90">{label}</p>
        <p className="text-[10px] text-amber-200/50">{description}</p>
      </div>
    </div>
  );
}
