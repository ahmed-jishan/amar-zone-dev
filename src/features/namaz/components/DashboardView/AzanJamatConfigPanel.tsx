'use client';

import { useCallback } from 'react';
import { motion } from 'framer-motion';
import { BellRing, CheckCircle2, Clock3, SlidersHorizontal, UsersRound, Sunrise, Sun, Sunset, Moon } from 'lucide-react';
import { usePrefsStore, type ConfigurablePrayerName } from '../../store/prefsStore';
import { CONFIGURABLE_PRAYERS, PRAYER_CONFIG_LABELS, computePrayerTimeConfig } from '../../utils/azanJamatConfig';
import type { PrayerTimesResponse } from '../../types/prayer.types';

interface Props {
  prayerTimesResponse: PrayerTimesResponse;
}

const PRAYER_ICONS: Record<string, React.ReactNode> = {
  fajr: <Sunrise size={15} className="text-emerald-400" />,
  dhuhr: <Sun size={15} className="text-amber-400" />,
  asr: <Sun size={15} className="text-amber-500" />,
  maghrib: <Sunset size={15} className="text-rose-400" />,
  isha: <Moon size={15} className="text-sky-400" />,
};

// ─── Segmented Control ───
function SegmentedControl({
  value,
  onChange,
}: {
  value: 'offset' | 'fixed';
  onChange: (v: 'offset' | 'fixed') => void;
}) {
  return (
    <div className="relative flex rounded-xl bg-slate-100/80 p-0.5 dark:bg-slate-800/60 ring-1 ring-slate-200/50 dark:ring-slate-700/30">
      <div
        className="absolute top-0.5 bottom-0.5 rounded-[10px] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08)] dark:bg-slate-700 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
        style={{
          width: 'calc(50% - 0.125rem)',
          left: value === 'offset' ? '0.125rem' : '50%',
        }}
      />
      {(['offset', 'fixed'] as const).map((opt) => (
        <button
          key={opt}
          type="button"
          aria-pressed={value === opt}
          onClick={() => onChange(opt)}
          className={`relative z-10 flex-1 rounded-[10px] px-3 py-1.5 text-[11px] font-bold capitalize tracking-wide transition-colors duration-200 ${
            value === opt
              ? 'text-slate-800 dark:text-slate-100'
              : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'
          }`}
        >
          {opt === 'offset' ? 'Auto' : 'Fixed'}
        </button>
      ))}
    </div>
  );
}

// ─── Format 24h time to HH:MM string for <input type="time"> ───
function formatTimeForInput(value: string): string {
  if (!value) return '00:00';
  const parts = value.split(':');
  const h = String(Math.min(23, Math.max(0, parseInt(parts[0], 10) || 0))).padStart(2, '0');
  const m = String(Math.min(59, Math.max(0, parseInt(parts[1], 10) || 0))).padStart(2, '0');
  return `${h}:${m}`;
}

// ─── Time Row ───
function TimeRow({
  label,
  icon,
  mode,
  offsetMinutes,
  fixedTime,
  onModeChange,
  onOffsetChange,
  onFixedTimeChange,
}: {
  label: string;
  icon: React.ReactNode;
  mode: 'offset' | 'fixed';
  offsetMinutes: number;
  fixedTime: string;
  onModeChange: (v: 'offset' | 'fixed') => void;
  onOffsetChange: (v: number) => void;
  onFixedTimeChange: (v: string) => void;
}) {
  return (
    <div className="group space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 dark:text-slate-500">{icon}</span>
          <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">{label}</span>
        </div>
        <SegmentedControl value={mode} onChange={onModeChange} />
      </div>

      {mode === 'offset' ? (
        <div className="flex items-center gap-3 rounded-xl bg-slate-50/60 dark:bg-slate-800/40 px-3.5 py-2.5 ring-1 ring-slate-200/40 dark:ring-slate-700/30">
          <div className="flex-1 flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOffsetChange(Math.max(0, offsetMinutes - 5))}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-200/60 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 text-sm font-bold hover:bg-slate-300/60 dark:hover:bg-slate-600/50 transition-colors"
            >
              −
            </button>
            <div className="flex-1 text-center">
              <span className="text-[17px] font-bold tabular-nums text-slate-800 dark:text-slate-100">{offsetMinutes}</span>
              <span className="ml-1 text-[11px] font-medium text-slate-400 dark:text-slate-500">min</span>
            </div>
            <button
              type="button"
              onClick={() => onOffsetChange(Math.min(180, offsetMinutes + 5))}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-200/60 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 text-sm font-bold hover:bg-slate-300/60 dark:hover:bg-slate-600/50 transition-colors"
            >
              +
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-xl bg-slate-50/60 dark:bg-slate-800/40 px-3.5 py-2 ring-1 ring-slate-200/40 dark:ring-slate-700/30">
          <input
            type="time"
            value={formatTimeForInput(fixedTime)}
            onChange={(e) => onFixedTimeChange(e.target.value)}
            className="w-full bg-transparent text-[17px] font-bold tabular-nums text-slate-800 dark:text-slate-100 outline-none text-center [color-scheme:light] dark:[color-scheme:dark]"
          />
        </div>
      )}
    </div>
  );
}

// ─── Preview Strip ───
function PreviewStrip({
  start,
  azan,
  jamat,
  errors,
}: {
  start: string;
  azan: string;
  jamat: string;
  errors: string[];
}) {
  return (
    <div className="rounded-xl bg-gradient-to-r from-emerald-50/40 via-amber-50/30 to-slate-50/40 dark:from-emerald-950/20 dark:via-amber-950/15 dark:to-slate-950/20 p-3 ring-1 ring-slate-200/30 dark:ring-slate-700/20">
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 text-center">
          <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">Start</p>
          <p className="mt-0.5 text-[13px] font-bold tabular-nums text-slate-700 dark:text-slate-300">{start}</p>
        </div>
        <div className="h-8 w-px bg-slate-200/50 dark:bg-slate-700/30" />
        <div className="flex-1 text-center">
          <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-emerald-500/70 dark:text-emerald-400/70">Azan</p>
          <p className="mt-0.5 text-[13px] font-bold tabular-nums text-emerald-700 dark:text-emerald-300">{azan}</p>
        </div>
        <div className="h-8 w-px bg-slate-200/50 dark:bg-slate-700/30" />
        <div className="flex-1 text-center">
          <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-amber-500/70 dark:text-amber-400/70">Jamat</p>
          <p className="mt-0.5 text-[13px] font-bold tabular-nums text-amber-700 dark:text-amber-300">{jamat}</p>
        </div>
      </div>
      {errors.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-2 pt-2 border-t border-red-200/50 dark:border-red-800/30"
        >
          {errors.map((error) => (
            <p key={error} className="text-[10px] font-semibold text-red-500 dark:text-red-400 leading-relaxed">⚠ {error}</p>
          ))}
        </motion.div>
      )}
    </div>
  );
}

// ─── Preference Card (NO local state, NO useState, NO useMemo, bulletproof) ───
function PreferenceCard({
  prayer,
  startTime,
}: {
  prayer: ConfigurablePrayerName;
  startTime: string;
}) {
  const preference = usePrefsStore((s) => s.prayerTimePreferences[prayer]);
  const updatePref = usePrefsStore((s) => s.updatePrayerTimePreference);

  // Safety: if preference is undefined (corrupted data), use a safe fallback
  const safePreference = preference ?? {
    azanMode: 'offset' as const,
    azanOffsetMinutes: 0,
    azanFixedTime: startTime,
    jamatMode: 'offset' as const,
    jamatOffsetMinutes: 10,
    jamatFixedTime: startTime,
  };

  // Compute preview inline — no useMemo to avoid reference-type dependency issues
  const preview = computePrayerTimeConfig(startTime, safePreference);
  const isValid = preview.errors.length === 0;

  // Stable callbacks
  const setAzanMode = useCallback((v: 'offset' | 'fixed') => updatePref(prayer, { azanMode: v }), [prayer, updatePref]);
  const setAzanOffset = useCallback((v: number) => updatePref(prayer, { azanOffsetMinutes: v }), [prayer, updatePref]);
  const setAzanTime = useCallback((v: string) => updatePref(prayer, { azanFixedTime: v }), [prayer, updatePref]);
  const setJamatMode = useCallback((v: 'offset' | 'fixed') => updatePref(prayer, { jamatMode: v }), [prayer, updatePref]);
  const setJamatOffset = useCallback((v: number) => updatePref(prayer, { jamatOffsetMinutes: v }), [prayer, updatePref]);
  const setJamatTime = useCallback((v: string) => updatePref(prayer, { jamatFixedTime: v }), [prayer, updatePref]);

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 25 }}
      className="rounded-2xl border border-slate-200/40 dark:border-slate-700/30 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-[0_1px_3px_rgba(0,0,0,0.03),0_4px_12px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.1),0_4px_12px_rgba(0,0,0,0.15)] overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 ring-1 ring-slate-200/50 dark:ring-slate-700/30">
            {PRAYER_ICONS[prayer]}
          </div>
          <div>
            <h4 className="text-[15px] font-bold text-slate-800 dark:text-slate-100">{PRAYER_CONFIG_LABELS[prayer]}</h4>
            <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500">{preview.prayerStartDisplay}</p>
          </div>
        </div>
        <div className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${
          isValid
            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 ring-1 ring-emerald-200/50 dark:ring-emerald-800/30'
            : 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 ring-1 ring-red-200/50 dark:ring-red-800/30'
        }`}>
          <CheckCircle2 size={10} />
          {isValid ? 'Saved' : 'Fix time'}
        </div>
      </div>

      {/* Controls */}
      <div className="px-4 pb-3 space-y-3">
        <TimeRow
          label="Azan"
          icon={<BellRing size={13} className="text-emerald-500 dark:text-emerald-400" />}
          mode={safePreference.azanMode}
          offsetMinutes={safePreference.azanOffsetMinutes}
          fixedTime={safePreference.azanFixedTime}
          onModeChange={setAzanMode}
          onOffsetChange={setAzanOffset}
          onFixedTimeChange={setAzanTime}
        />
        <TimeRow
          label="Jamat"
          icon={<UsersRound size={13} className="text-amber-500 dark:text-amber-400" />}
          mode={safePreference.jamatMode}
          offsetMinutes={safePreference.jamatOffsetMinutes}
          fixedTime={safePreference.jamatFixedTime}
          onModeChange={setJamatMode}
          onOffsetChange={setJamatOffset}
          onFixedTimeChange={setJamatTime}
        />
      </div>

      {/* Preview Strip */}
      <div className="px-4 pb-3.5">
        <PreviewStrip
          start={preview.prayerStartDisplay}
          azan={preview.azanDisplay}
          jamat={preview.jamatDisplay}
          errors={preview.errors}
        />
      </div>
    </motion.article>
  );
}

// ─── Main Component ───
export default function AzanJamatConfigPanel({ prayerTimesResponse }: Props) {
  return (
    <section className="space-y-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 25 }}
        className="flex items-end justify-between gap-3 px-1"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/10 to-amber-500/10 dark:from-emerald-500/20 dark:to-amber-500/20 ring-1 ring-emerald-200/30 dark:ring-emerald-800/30">
            <SlidersHorizontal size={16} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-emerald-600 dark:text-emerald-400">Azan & Jamat</p>
            <h3 className="text-[17px] font-bold text-slate-800 dark:text-slate-100 -mt-0.5">Prayer time configuration</h3>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 ring-1 ring-slate-200/50 dark:ring-slate-700/30">
          <Clock3 size={10} /> Live preview
        </span>
      </motion.div>

      {/* Cards Grid */}
      <div className="grid gap-3 lg:grid-cols-2">
        {CONFIGURABLE_PRAYERS.map((prayer, idx) => {
          const prayerData = prayerTimesResponse.timings[prayer];
          if (!prayerData || !prayerData.time) return null;
          return (
            <motion.div
              key={prayer}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05, type: 'spring', stiffness: 200, damping: 25 }}
            >
              <PreferenceCard prayer={prayer} startTime={prayerData.time} />
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}