// ────────────────────────────────────────────────────────────────
// ╔══════════════════════════════════════════════════════════════╗
// ║   TaraweehTracker — Premium Taraweeh Prayer Log            ║
// ║   Track 8 or 20 rakats, mosque name, imam name            ║
// ╚══════════════════════════════════════════════════════════════╝
// ────────────────────────────────────────────────────────────────

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Moon, Book, MapPin, Users, CheckCircle2, ChevronDown } from 'lucide-react';
import { useModeEngine } from '../hooks/useModeEngine';
import { useSettingsStore } from '@/features/settings/store/settingsStore';
import { getRecommendedTaraweeh } from '../ramadan';
import type { TaraweehStatus } from '../types';
import { triggerHaptic } from '@/lib/native/haptics';

interface TaraweehTrackerProps {
  onStatusChange?: (status: TaraweehStatus) => void;
  onRakatChange?: (count: number) => void;
}

const TARAWEEH_STATUSES: TaraweehStatus[] = ['completed', 'partial', 'missed'];
const RAKAT_OPTIONS = [8, 20];

export default function TaraweehTracker({ onStatusChange, onRakatChange }: TaraweehTrackerProps) {
  const engine = useModeEngine();
  const { language } = useSettingsStore();
  const [status, setStatus] = useState<TaraweehStatus>('not_applicable');
  const [rakatCount, setRakatCount] = useState(20);
  const [mosqueName, setMosqueName] = useState('');

  const isTraveling = engine.activeModes.travelMode;
  const recommended = getRecommendedTaraweeh(isTraveling, language);

  const handleStatusChange = (newStatus: TaraweehStatus) => {
    triggerHaptic('medium');
    setStatus(newStatus);
    onStatusChange?.(newStatus);
  };

  const handleRakatChange = (count: number) => {
    setRakatCount(count);
    onRakatChange?.(count);
  };

  if (!engine.activeModes.ramadanMode) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-indigo-600/10 border border-indigo-500/15 shadow-lg mode-card-dark"
    >
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-bold text-indigo-300/90">
            <Moon size={16} />
            {language === 'bn' ? 'তারাবীহ ট্র্যাকার' : 'Taraweeh Tracker'}
          </h3>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400/60 bg-indigo-500/10 rounded-full px-2.5 py-1">
            {recommended.rakat} {language === 'bn' ? 'রাকাত' : 'rakat'}
          </span>
        </div>

        {/* Recommendation */}
        {isTraveling && (
          <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-2.5">
            <p className="text-[11px] font-medium text-amber-300/80">
              {recommended.description}
            </p>
          </div>
        )}

        {/* Rakat Selector */}
        <div>
          <p className="text-xs font-semibold text-indigo-300/60 mb-2">
            {language === 'bn' ? 'রাকাত সংখ্যা' : 'Rakat Count'}
          </p>
          <div className="flex gap-2">
            {RAKAT_OPTIONS.map((count) => (
              <motion.button
                key={count}
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={() => handleRakatChange(count)}
                className={`flex-1 rounded-xl py-2.5 text-center transition-all ${
                  rakatCount === count
                    ? 'bg-indigo-500/20 border border-indigo-400/30 shadow-sm'
                    : 'bg-white/5 border border-white/5 hover:bg-white/10'
                }`}
              >
                <p className={`text-base font-bold ${rakatCount === count ? 'text-indigo-300' : 'text-white/60'}`}>
                  {count}
                </p>
                <p className="text-[10px] text-white/40">{language === 'bn' ? 'রাকাত' : 'rakats'}</p>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Status Selector */}
        <div>
          <p className="text-xs font-semibold text-indigo-300/60 mb-2">
            {language === 'bn' ? 'আজকের অবস্থা' : 'Today\'s status'}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {TARAWEEH_STATUSES.map((s) => {
              const labels: Record<TaraweehStatus, { bn: string; en: string }> = {
                completed: { bn: 'পড়েছি', en: 'Completed' },
                partial: { bn: 'আংশিক', en: 'Partial' },
                missed: { bn: 'পড়িনি', en: 'Missed' },
                not_applicable: { bn: '', en: '' },
              };
              const isActive = status === s;
              return (
                <motion.button
                  key={s}
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleStatusChange(s)}
                  className={`rounded-xl py-2.5 text-center transition-all ${
                    isActive
                      ? 'bg-indigo-500/20 border border-indigo-400/30 shadow-sm'
                      : 'bg-white/5 border border-white/5 hover:bg-white/10'
                  }`}
                >
                  <p className={`text-xs font-bold ${isActive ? 'text-indigo-300' : 'text-white/60'}`}>
                    {language === 'bn' ? labels[s].bn : labels[s].en}
                  </p>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Optional: Mosque Name */}
        <div className="flex items-center gap-3">
          <MapPin size={14} className="text-indigo-300/50 shrink-0" />
          <input
            type="text"
            value={mosqueName}
            onChange={(e) => setMosqueName(e.target.value)}
            placeholder={language === 'bn' ? 'মসজিদের নাম (ঐচ্ছিক)' : 'Mosque name (optional)'}
            className="flex-1 bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-xs text-white/80 placeholder-white/30 outline-none focus:border-indigo-400/30 transition-colors"
          />
        </div>
      </div>
    </motion.div>
  );
}