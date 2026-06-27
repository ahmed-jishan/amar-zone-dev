// ────────────────────────────────────────────────────────────────
// ╔══════════════════════════════════════════════════════════════╗
// ║   ModeBanner — Premium Dynamic Top Banner                  ║
// ║   Apple-style glass morphism banner for active modes       ║
// ╚══════════════════════════════════════════════════════════════╝
// ────────────────────────────────────────────────────────────────

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Navigation, Sparkles, X, ChevronDown } from 'lucide-react';
import { useModeEngine } from '../hooks/useModeEngine';
import { getModeLabel, getModeDescription } from '../types';
import { usePrefsStore } from '../../store/prefsStore';
import { useSettingsStore } from '@/features/settings/store/settingsStore';
import { triggerHaptic } from '@/lib/native/haptics';

interface ModeBannerProps {
  onOpenSettings?: () => void;
}

export default function ModeBanner({ onOpenSettings }: ModeBannerProps) {
  const engine = useModeEngine();
  const { language } = useSettingsStore();
  const setSpecialMode = usePrefsStore((s) => s.setSpecialMode);
  const { ramadanMode, travelMode } = engine.activeModes;

  const isAnyModeActive = ramadanMode || travelMode;

  if (!isAnyModeActive) return null;

  const handleDismiss = (mode: 'ramadanMode' | 'travelMode') => {
    triggerHaptic('light');
    setSpecialMode(mode, false);
  };

  const getBannerStyle = () => {
    if (ramadanMode && travelMode) return 'ramadan-travel';
    if (ramadanMode) return 'ramadan';
    return 'travel';
  };

  const bannerTheme = getBannerStyle();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className={`mode-banner mode-banner--${bannerTheme} rounded-2xl overflow-hidden mb-4`}
      >
        <div className="relative p-4">
          {/* Glass overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 pointer-events-none" />

          <div className="relative z-10">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                {ramadanMode && (
                  <span className="mode-badge mode-badge--ramadan">
                    <Moon size={14} />
                    <span>{getModeLabel('ramadanMode', language)}</span>
                  </span>
                )}
                {travelMode && (
                  <span className="mode-badge mode-badge--travel">
                    <Navigation size={14} />
                    <span>{getModeLabel('travelMode', language)}</span>
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('medium');
                  onOpenSettings?.();
                }}
                className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold text-white/80 hover:text-white transition-colors"
              >
                <Sparkles size={12} />
                <span>{language === 'bn' ? 'সেটিংস' : 'Settings'}</span>
              </button>
            </div>

            {/* Content */}
            <div className="space-y-2">
              {ramadanMode && (
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <Moon size={18} className="text-amber-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white">
                      {language === 'bn' ? 'রমজান মোড সক্রিয়' : 'Ramadan Mode Active'}
                    </p>
                    <p className="text-xs text-white/70 mt-0.5">
                      {getRamadanBannerText(engine, language)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDismiss('ramadanMode')}
                    className="shrink-0 rounded-full p-1 hover:bg-white/10 transition-colors"
                    aria-label={language === 'bn' ? 'বন্ধ করুন' : 'Dismiss'}
                  >
                    <X size={14} className="text-white/60" />
                  </button>
                </div>
              )}

              {travelMode && (
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <Navigation size={18} className="text-sky-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white">
                      {language === 'bn' ? 'ভ্রমণ মোড সক্রিয়' : 'Travel Mode Active'}
                    </p>
                    <p className="text-xs text-white/70 mt-0.5">
                      {getTravelBannerText(engine, language)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDismiss('travelMode')}
                    className="shrink-0 rounded-full p-1 hover:bg-white/10 transition-colors"
                    aria-label={language === 'bn' ? 'বন্ধ করুন' : 'Dismiss'}
                  >
                    <X size={14} className="text-white/60" />
                  </button>
                </div>
              )}
            </div>

            {/* Quick action chips — only show Iftar info if ACTUALLY in Ramadan month */}
            <div className="mt-3 flex flex-wrap gap-2">
              {ramadanMode && engine.ramadanData.dayOfRamadan && engine.ramadanData.iftarSehri && (
                <div className="rounded-full px-3 py-1 bg-white/10 text-xs font-semibold text-white/90 backdrop-blur-sm">
                  {engine.ramadanData.iftarSehri.iftarLabel}
                  {engine.iftarCountdownString && ` • ${engine.iftarCountdownString}`}
                </div>
              )}
              {ramadanMode && !engine.ramadanData.dayOfRamadan && (
                <div className="rounded-full px-3 py-1 bg-white/10 text-xs font-semibold text-white/90 backdrop-blur-sm">
                  {language === 'bn' ? 'প্রস্তুতি মোড' : 'Preparation Mode'}
                </div>
              )}
              {travelMode && (
                <div className="rounded-full px-3 py-1 bg-white/10 text-xs font-semibold text-white/90 backdrop-blur-sm">
                  {language === 'bn'
                    ? `কসর: ${engine.prayerAdjustments.qasrPrayers.length} ওয়াক্ত`
                    : `Qasr: ${engine.prayerAdjustments.qasrPrayers.length} prayers`}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function getRamadanBannerText(engine: ReturnType<typeof useModeEngine>, language: 'bn' | 'en'): string {
  const { dayOfRamadan, isLastTenDays, isLaylatulQadrLikely } = engine.ramadanData;

  if (isLaylatulQadrLikely) {
    return language === 'bn'
      ? '📿 আজ লাইলাতুল কদরের সম্ভাবনা — বেশি বেশি ইবাদত করুন!'
      : '📿 Laylatul Qadr likely tonight — increase worship!';
  }
  if (isLastTenDays) {
    return language === 'bn'
      ? '🕌 রমজানের শেষ ১০ দিন — ইবাদতের শ্রেষ্ঠ সময়'
      : '🕌 Last 10 days of Ramadan — best time for worship';
  }
  if (dayOfRamadan) {
    return language === 'bn'
      ? `🌙 রমজানের ${dayOfRamadan}তম দিন — রোজা ও তারাবীহ চালিয়ে যান`
      : `🌙 Ramadan day ${dayOfRamadan} — continue fasting & Taraweeh`;
  }
  return language === 'bn'
    ? '🌙 রমজান মোড — রোজা, তারাবীহ ও ইফতার ট্র্যাকিং'
    : '🌙 Ramadan Mode — Fasting, Taraweeh & Iftar tracking';
}

function getTravelBannerText(engine: ReturnType<typeof useModeEngine>, language: 'bn' | 'en'): string {
  const combo = engine.prayerAdjustments.combination;
  if (combo === 'dhuhr_asr') {
    return language === 'bn'
      ? '🧳 যোহর+আসর জমা ও কসর — সরলীকৃত UI সক্রিয়'
      : '🧳 Dhuhr+Asr combined & Qasr — simplified UI active';
  }
  return language === 'bn'
    ? '🧳 ভ্রমণে নামাজের সময় ও কসর ট্র্যাকিং সক্রিয়'
    : '🧳 Travel prayer times & Qasr tracking active';
}