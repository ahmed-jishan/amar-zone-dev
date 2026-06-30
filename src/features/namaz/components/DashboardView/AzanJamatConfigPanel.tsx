'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { BellRing, CheckCircle2, Clock3, SlidersHorizontal, UsersRound, Sunrise, Sun, Sunset, Moon } from 'lucide-react';
import { usePrefsStore, type ConfigurablePrayerName, type PrayerTimePreference } from '../../store/prefsStore';
import { CONFIGURABLE_PRAYERS, PRAYER_CONFIG_LABELS, computePrayerTimeConfig } from '../../utils/azanJamatConfig';
import type { PrayerTimesResponse } from '../../types/prayer.types';

interface Props {
  prayerTimesResponse: PrayerTimesResponse;
}

const PRAYER_ICONS = {
  fajr: <Sunrise size={15} className="text-emerald-400" />,
  dhuhr: <Sun size={15} className="text-amber-400" />,
  asr: <Sun size={15} className="text-amber-500" />,
  maghrib: <Sunset size={15} className="text-rose-400" />,
  isha: <Moon size={15} className="text-sky-400" />,
} as const;

// ─── Premium Segmented Control (Apple-style) ───
function SegmentedControl({
  value,
  onChange,
  options,
}: {
  value: 'offset' | 'fixed';
  onChange: (value: 'offset' | 'fixed') => void;
  options: { value: 'offset' | 'fixed'; label: string }[];
}) {
  return (
    <div className="relative flex rounded-xl bg-slate-100/80 p-0.5 dark:bg-slate-800/60 ring-1 ring-slate-200/50 dark:ring-slate-700/30">
      <div
        className="absolute top-0.5 bottom-0.5 rounded-[10px] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08)] dark:bg-slate-700 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
        style={{
          width: `calc(50% - 0.125rem)`,
          left: value === 'offset' ? '0.125rem' : '50%',
        }}
      />
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          aria-pressed={value === opt.value}
          onClick={() => onChange(opt.value)}
          className={`relative z-10 flex-1 rounded-[10px] px-3 py-1.5 text-[11px] font-bold capitalize tracking-wide transition-colors duration-200 ${
            value === opt.value
              ? 'text-slate-800 dark:text-slate-100'
              : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ─── Premium Time Row ───
function TimeRow({
  label,
  icon,
  mode,
  offsetMinutes,
  fixedTime,
  onModeChange,
  onOffsetChange,
  onFixedTimeChange,
  accentColor,
}: {
  label: string;
  icon: React.ReactNode;
  mode: 'offset' | 'fixed';
  offsetMinutes: number;
  fixedTime: string;
  onModeChange: (mode: 'offset' | 'fixed') => void;
  onOffsetChange: (minutes: number) => void;
  onFixedTimeChange: (time: string) => void;
  accentColor: string;
}) {
  return (
    <div className="group space-y-2.5">
      {/* Label + Segmented Control */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 dark:text-slate-500">{icon}</span>
          <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">{label}</span>
        </div>
        <SegmentedControl
          value={mode}
          onChange={onModeChange}
          options={[
            { value: 'offset', label: 'Auto' },
            { value: 'fixed', label: 'Fixed' },
          ]}
        />
      </div>

      {/* Input */}
      {mode === 'offset' ? (
        <div className="flex items-center gap-3 rounded-xl bg-slate-50/60 dark:bg-slate-800/40 px-3.5 py-2.5 ring-1 ring-slate-200/40 dark:ring-slate-700/30 transition-all duration-200 focus-within:ring-2 focus-within:ring-emerald-400/40 dark:focus-within:ring-emerald-500/30">
          <div className="flex-1 flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOffsetChange(Math.max(0, offsetMinutes - 5))}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-200/60 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 text-sm font-bold hover:bg-slate-300/60 dark:hover:bg-slate-600/50 transition-colors"
            >
              −
            </button>
            <div className="flex-1 text-center">
              <span className="text-[17px] font-bold tabular-nums text-slate-800 dark:text-slate-100">
                {offsetMinutes}
              </span>
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
        <div className="rounded-xl bg-slate-50/60 dark:bg-slate-800/40 px-3.5 py-2 ring-1 ring-slate-200/40 dark:ring-slate-700/30 transition-all duration-200 focus-within:ring-2 focus-within:ring-emerald-400/40 dark:focus-within:ring-emerald-500/30">
          <div className="flex items-center gap-2">
            {/* 12h hour input (1-12) */}
            <input
              type="text"
              inputMode="numeric"
              value={(() => {
                const [h] = fixedTime.split(':').map(Number);
                const h12 = h % 12 || 12;
                return String(h12);
              })()}
              onChange={(event) => {
                const raw = event.target.value.replace(/\D/g, '');
                if (raw === '' || raw === '0') {
                  onFixedTimeChange('00:' + (fixedTime.split(':')[1] || '00'));
                  return;
                }
                const h = parseInt(raw, 10);
                if (h >= 1 && h <= 12) {
                  const [, m] = fixedTime.split(':');
                  const currentH24 = parseInt(fixedTime.split(':')[0], 10);
                  const isPM = currentH24 >= 12;
                  let h24: number;
                  if (isPM) {
                    h24 = h === 12 ? 12 : h + 12;
                  } else {
                    h24 = h === 12 ? 0 : h;
                  }
                  onFixedTimeChange(`${String(h24).padStart(2, '0')}:${m || '00'}`);
                }
              }}
              className="w-9 bg-transparent text-[17px] font-bold tabular-nums text-slate-800 dark:text-slate-100 outline-none text-center"
            />
            <span className="text-[17px] font-bold text-slate-400 dark:text-slate-500">:</span>
            {/* Minute input (00-59) */}
            <input
              type="text"
              inputMode="numeric"
              value={fixedTime.split(':')[1] || '00'}
              onChange={(event) => {
                const raw = event.target.value.replace(/\D/g, '');
                if (raw.length <= 2) {
                  const m = parseInt(raw, 10);
                  if (raw === '' || (m >= 0 && m <= 59)) {
                    const [h] = fixedTime.split(':');
                    onFixedTimeChange(`${h}:${raw.padStart(2, '0')}`);
                  }
                }
              }}
              className="w-9 bg-transparent text-[17px] font-bold tabular-nums text-slate-800 dark:text-slate-100 outline-none text-center"
            />
            {/* AM/PM Toggle */}
            <button
              type="button"
              onClick={() => {
                const [h24, m] = fixedTime.split(':').map(Number);
                const isPM = h24 >= 12;
                const newH24 = isPM ? h24 - 12 : h24 + 12;
                onFixedTimeChange(`${String(newH24).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
              }}
              className={`ml-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all duration-200 ${
                parseInt(fixedTime.split(':')[0]) >= 12
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                  : 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300'
              }`}
            >
              {parseInt(fixedTime.split(':')[0]) >= 12 ? 'PM' : 'AM'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Premium Preview Strip ───
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

      {/* Error display */}
      {errors.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-2 pt-2 border-t border-red-200/50 dark:border-red-800/30"
        >
          {errors.map((error) => (
            <p key={error} className="text-[10px] font-semibold text-red-500 dark:text-red-400 leading-relaxed">
              ⚠ {error}
            </p>
          ))}
        </motion.div>
      )}
    </div>
  );
}

// ─── Preference Card (Premium Redesign) ───
function PreferenceCard({
  prayer,
  startTime,
  preference,
  onPersist,
}: {
  prayer: ConfigurablePrayerName;
  startTime: string;
  preference: PrayerTimePreference;
  onPersist: (updates: Partial<PrayerTimePreference>) => void;
}) {
  const [draft, setDraft] = useState(preference);

  useEffect(() => {
    setDraft(preference);
  }, [preference]);

  const preview = useMemo(() => computePrayerTimeConfig(startTime, draft), [draft, startTime]);
  const isValid = preview.errors.length === 0;

  const updateDraft = (updates: Partial<PrayerTimePreference>) => {
    const next = { ...draft, ...updates };
    setDraft(next);
    // Always persist - validation is for display only, not data integrity
    onPersist(updates);
  };

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
            <h4 className="text-[15px] font-bold text-slate-800 dark:text-slate-100">
              {PRAYER_CONFIG_LABELS[prayer]}
            </h4>
            <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
              {preview.prayerStartDisplay}
            </p>
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
          mode={draft.azanMode}
          offsetMinutes={draft.azanOffsetMinutes}
          fixedTime={draft.azanFixedTime}
          onModeChange={(azanMode) => updateDraft({ azanMode })}
          onOffsetChange={(azanOffsetMinutes) => updateDraft({ azanOffsetMinutes })}
          onFixedTimeChange={(azanFixedTime) => updateDraft({ azanFixedTime })}
          accentColor="emerald"
        />
        <TimeRow
          label="Jamat"
          icon={<UsersRound size={13} className="text-amber-500 dark:text-amber-400" />}
          mode={draft.jamatMode}
          offsetMinutes={draft.jamatOffsetMinutes}
          fixedTime={draft.jamatFixedTime}
          onModeChange={(jamatMode) => updateDraft({ jamatMode })}
          onOffsetChange={(jamatOffsetMinutes) => updateDraft({ jamatOffsetMinutes })}
          onFixedTimeChange={(jamatFixedTime) => updateDraft({ jamatFixedTime })}
          accentColor="amber"
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
  const preferences = usePrefsStore((state) => state.prayerTimePreferences);
  const updatePreference = usePrefsStore((state) => state.updatePrayerTimePreference);

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
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-emerald-600 dark:text-emerald-400">
              Azan & Jamat
            </p>
            <h3 className="text-[17px] font-bold text-slate-800 dark:text-slate-100 -mt-0.5">
              Prayer time configuration
            </h3>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 ring-1 ring-slate-200/50 dark:ring-slate-700/30">
          <Clock3 size={10} />
          Live preview
        </span>
      </motion.div>

      {/* Cards Grid */}
      <div className="grid gap-3 lg:grid-cols-2">
        {CONFIGURABLE_PRAYERS.map((prayer, idx) => (
          <motion.div
            key={prayer}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05, type: 'spring', stiffness: 200, damping: 25 }}
          >
            <PreferenceCard
              prayer={prayer}
              startTime={prayerTimesResponse.timings[prayer].time}
              preference={preferences[prayer]}
              onPersist={(updates) => updatePreference(prayer, updates)}
            />
          </motion.div>
        ))}
      </div>
    </section>
  );
}