'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BellRing, CheckCircle, Circle, Clock, Moon, Sunrise, Sun, Sunset, Users, UsersRound, XCircle } from 'lucide-react';
import {
  buildPrayerWindows,
  formatPrayerTime12h,
  formatRemaining,
} from '../../utils/prayerSchedule';
import type { PrayerTimesResponse } from '../../types/prayer.types';
import { PRAYER_NAME_LABELS } from '../../constants/prayerNames';
import { triggerHaptic, vibrateBrowser } from '@/lib/native/haptics';

type PrayerStatus = 'pending' | 'onTime' | 'late' | 'missed' | 'jamaat';

interface PrayerEntry {
  prayerStart: string;
  adhan: string;
  jamaat: string;
  endTime: string;
  status: PrayerStatus;
}

interface PrayerData {
  Fajr: PrayerEntry;
  Dhuhr: PrayerEntry;
  Asr: PrayerEntry;
  Maghrib: PrayerEntry;
  Isha: PrayerEntry;
}

interface Props {
  prayerTimes: PrayerData;
  prayerTimesResponse?: PrayerTimesResponse | null;
  onMarkPrayer: (prayer: string, status: PrayerStatus) => void;
  language: 'bn' | 'en';
}

const PRAYER_ORDER = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const;
const LEGACY_TO_CANONICAL = {
  Fajr: 'fajr', Dhuhr: 'dhuhr', Asr: 'asr', Maghrib: 'maghrib', Isha: 'isha',
} as const;
const PRAYER_META = {
  Fajr: { period: { bn: 'ভোর', en: 'Dawn' } },
  Dhuhr: { period: { bn: 'দুপুর', en: 'Noon' } },
  Asr: { period: { bn: 'বিকাল', en: 'Afternoon' } },
  Maghrib: { period: { bn: 'সন্ধ্যা', en: 'Sunset' } },
  Isha: { period: { bn: 'রাত', en: 'Night' } },
} as const;
const PRAYER_ICONS = {
  Fajr: <Sunrise size={14} className="text-emerald-500" />,
  Dhuhr: <Sun size={14} className="text-amber-500" />,
  Asr: <Sun size={14} className="text-amber-600" />,
  Maghrib: <Sunset size={14} className="text-rose-500" />,
  Isha: <Moon size={14} className="text-sky-500" />,
} as const;
const STATUS_LABELS: Record<'bn' | 'en', Record<PrayerStatus, string>> = {
  bn: { pending: 'বাকি', onTime: 'সময়মত', jamaat: 'জামাতে', late: 'দেরিতে', missed: 'কাজা' },
  en: { pending: 'Pending', onTime: 'On time', jamaat: 'Jamaat', late: 'Late', missed: 'Missed' },
};
const STATUS_META: Record<PrayerStatus, { className: string; icon: React.ReactNode; description: string }> = {
  pending: { className: 'bg-white/50 text-slate-500 border-slate-200/50 dark:bg-white/5 dark:text-slate-400', icon: <Circle size={16} />, description: 'Not yet marked' },
  onTime: { className: 'bg-emerald-50/80 text-emerald-700 border-emerald-200/60 dark:bg-emerald-900/20 dark:text-emerald-300', icon: <CheckCircle size={16} />, description: 'Prayed within the time' },
  jamaat: { className: 'bg-emerald-50/80 text-emerald-700 border-emerald-200/60 dark:bg-emerald-900/20 dark:text-emerald-300', icon: <Users size={16} />, description: 'Prayed in congregation' },
  late: { className: 'bg-amber-50/80 text-amber-700 border-amber-200/60 dark:bg-amber-900/20 dark:text-amber-300', icon: <Clock size={16} />, description: 'Prayed but late' },
  missed: { className: 'bg-red-50/80 text-red-700 border-red-200/60 dark:bg-red-900/20 dark:text-red-300', icon: <XCircle size={16} />, description: 'Missed, need qada' },
};
const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
const toBN = (value: string) => value.replace(/\d/g, (digit) => BN_DIGITS[Number(digit)] ?? digit);

function displayTime(time: string, language: 'bn' | 'en') {
  return formatPrayerTime12h(time, { banglaDigits: language === 'bn', padHour: true });
}

// ─── Premium Compact Bottom Sheet ────────────────────────────────
function PrayerStatusSheet({
  open,
  prayerName,
  prayerLabel,
  current,
  language,
  onSelect,
  onClose,
}: {
  open: boolean;
  prayerName: string;
  prayerLabel: string;
  current: PrayerStatus;
  language: 'bn' | 'en';
  onSelect: (status: PrayerStatus) => void;
  onClose: () => void;
}) {
  const STATUS_OPTIONS: PrayerStatus[] = ['onTime', 'jamaat', 'late', 'missed'];

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay — light frosted glass */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-[2px]"
          />

          {/* Sheet — Premium compact design */}
          <motion.div
            initial={{ y: '100%', opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0.5 }}
            transition={{ type: 'spring', damping: 30, stiffness: 320, mass: 0.9 }}
            className="fixed bottom-0 left-0 right-0 z-[70] rounded-t-2xl border-t border-white/20 bg-white/90 backdrop-blur-2xl pb-6 shadow-[0_-4px_30px_rgba(0,0,0,0.08)] dark:border-white/10 dark:bg-slate-900/95"
          >
            {/* Handle */}
            <div className="mx-auto mt-2.5 h-1 w-8 rounded-full bg-slate-300/60 dark:bg-slate-600/60" />

            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-3 pt-4">
              <div>
                <h2 className="text-[17px] font-bold text-slate-900 dark:text-white">{prayerLabel}</h2>
                <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
                  {language === 'bn' ? 'নামাজের অবস্থা নির্বাচন করুন' : 'Mark your prayer status'}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-400 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-500 dark:hover:bg-slate-700"
              >
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4l8 8M12 4l-8 8" />
                </svg>
              </button>
            </div>

            {/* Current status indicator — compact */}
            <div className="mx-5 mb-3 flex items-center gap-2.5 rounded-xl border border-emerald-100/60 bg-emerald-50/60 px-3.5 py-2.5 dark:border-emerald-900/20 dark:bg-emerald-900/10">
              <div className="flex-shrink-0">{STATUS_META[current].icon}</div>
              <div className="min-w-0">
                <p className="text-[12px] font-semibold text-slate-700 dark:text-slate-300">
                  {language === 'bn' ? 'বর্তমান:' : 'Current:'} {STATUS_LABELS[language][current]}
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{STATUS_META[current].description}</p>
              </div>
            </div>

            {/* Status options — 2×2 Grid (compact) */}
            <div className="grid grid-cols-2 gap-2 px-5">
              {STATUS_OPTIONS.map((status) => {
                const meta = STATUS_META[status];
                const isSelected = current === status;
                return (
                  <motion.button
                    key={status}
                    type="button"
                    whileTap={{ scale: 0.96 }}
                    onClick={() => {
                      triggerHaptic('medium');
                      vibrateBrowser(10);
                      onSelect(status);
                      onClose();
                    }}
                    className={`flex items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-all duration-200 ${
                      isSelected
                        ? 'border-emerald-400/70 bg-emerald-50 shadow-sm dark:border-emerald-500/50 dark:bg-emerald-900/20'
                        : 'border-slate-200/60 bg-white/60 hover:bg-slate-50/80 dark:border-slate-700/40 dark:bg-slate-800/40 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div
                      className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${
                        isSelected ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {meta.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-[12px] font-bold ${isSelected ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-800 dark:text-slate-200'}`}>
                        {STATUS_LABELS[language][status]}
                      </p>
                      <p className="mt-px text-[9px] text-slate-400 dark:text-slate-500 truncate">
                        {language === 'bn' ? STATUS_DESC_BN[status] : meta.description}
                      </p>
                    </div>
                    {isSelected && (
                      <CheckCircle size={14} className="flex-shrink-0 text-emerald-500" />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

const STATUS_DESC_BN: Record<PrayerStatus, string> = {
  pending: 'এখনো চিহ্নিত করা হয়নি',
  onTime: 'সময়মতো পড়েছেন',
  jamaat: 'জামাতের সাথে পড়েছেন',
  late: 'দেরিতে পড়েছেন',
  missed: 'কাজা করতে হবে',
};

function RemainingText({
  isActive,
  label,
  language,
  target,
  now,
}: {
  isActive: boolean;
  label: string;
  language: 'bn' | 'en';
  target?: Date;
  now: Date;
}) {
  if (!target) return null;

  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50/70 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200">
      <Clock size={10} />
      {isActive
        ? (language === 'bn' ? `${label} শেষ:` : `${label} ends:`)
        : (language === 'bn' ? `${label} শুরু:` : `${label} starts:`)
      }
      <span className="font-mono tabular-nums">
        {language === 'bn' ? toBN(formatRemaining(target, now)) : formatRemaining(target, now)}
      </span>
    </span>
  );
}

// ─── Main Component ───
export default function PrayerTimeCard({ prayerTimes, prayerTimesResponse, onMarkPrayer, language }: Props) {
  const [now, setNow] = useState(new Date());
  const [activeSheet, setActiveSheet] = useState<{ prayerKey: string; prayerLabel: string; currentStatus: PrayerStatus } | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const windows = useMemo(
    () => buildPrayerWindows(prayerTimesResponse, now),
    [now, prayerTimesResponse]
  );
  const completedCount = PRAYER_ORDER.filter((key) => ['onTime', 'late', 'jamaat'].includes(prayerTimes[key].status)).length;
  const totalCount = PRAYER_ORDER.length;

  const handleStatusSelect = (status: PrayerStatus) => {
    if (!activeSheet) return;
    onMarkPrayer(activeSheet.prayerKey, status);
    setActiveSheet(null);
  };

  // Progress ring segments
  const progressPct = (completedCount / totalCount) * 100;

  return (
    <div className="overflow-hidden rounded-2xl bg-white/70 backdrop-blur-xl border border-white/20 shadow-[0_2px_12px_rgba(0,0,0,0.03),0_8px_28px_rgba(0,0,0,0.05)] dark:bg-slate-900/70 dark:border-white/5">
      {/* ── Header ── */}
      <div className="flex flex-col gap-1.5 border-b border-slate-200/30 px-4 py-3.5 dark:border-slate-700/20">
        <div className="flex items-center justify-between">
          <h3 className="text-[15px] font-bold text-slate-800 dark:text-slate-100">
            {language === 'bn' ? "আজকের নামাজের সময়" : "Today's prayer times"}
          </h3>
          <div className="flex items-center gap-2">
            {/* Compact progress indicator */}
            <div className="flex items-center gap-1.5">
              <div className="relative h-1.5 w-12 overflow-hidden rounded-full bg-slate-200/60 dark:bg-slate-700/40">
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-full bg-emerald-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
                />
              </div>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tabular-nums">
                {completedCount}/{totalCount}
              </span>
            </div>
          </div>
        </div>
        <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 leading-relaxed">
          {language === 'bn'
            ? 'শুরুর সময় আজান, শেষ সময় পরবর্তী ওয়াক্তের সীমা।'
            : 'Prayer start stays calculated. Azan and Jamat follow your saved settings.'}
        </p>
      </div>

      {/* ── Prayer rows ── */}
      <div className="divide-y divide-slate-100/60 dark:divide-slate-800/30">
        {PRAYER_ORDER.map((key, idx) => {
          const entry = prayerTimes[key];
          const meta = PRAYER_META[key];
          const window = windows.find((item) => item.prayer === LEGACY_TO_CANONICAL[key]);
          const isActive = window?.status === 'active';
          const isUpcoming = window?.status === 'before';
          const target = isActive ? window?.end : window?.start;
          const label = PRAYER_NAME_LABELS[key]?.[language] ?? key;
          const periodLabel = meta.period[language];

          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04, type: 'spring', stiffness: 200, damping: 25 }}
              whileTap={{ scale: 0.997 }}
              onClick={() => {
                triggerHaptic('light');
                setActiveSheet({
                  prayerKey: key,
                  prayerLabel: label,
                  currentStatus: entry.status,
                });
              }}
              className={`grid grid-cols-[1fr_auto] gap-2 px-4 py-3 transition cursor-pointer ${
                isActive
                  ? 'bg-emerald-50/40 dark:bg-emerald-900/10'
                  : 'bg-transparent hover:bg-slate-50/40 dark:hover:bg-slate-800/20'
              }`}
            >
              <div className="min-w-0">
                {/* Prayer name row */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/80 dark:bg-slate-800/60 px-2 py-1 text-[12px] font-bold text-slate-800 dark:text-slate-100 shadow-sm border border-slate-200/40 dark:border-slate-700/30">
                    {PRAYER_ICONS[key]}
                    {label}
                  </span>
                  <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{periodLabel}</span>
                  {isActive && (
                    <span className="rounded-full bg-emerald-500/90 px-1.5 py-0.5 text-[8px] font-bold text-white tracking-wide">
                      {language === 'bn' ? 'চলছে' : 'LIVE'}
                    </span>
                  )}
                  {!isActive && isUpcoming && (
                    <span className="rounded-full bg-slate-200/60 px-1.5 py-0.5 text-[8px] font-bold text-slate-500 dark:bg-slate-700/40 dark:text-slate-400">
                      {language === 'bn' ? 'পরবর্তী' : 'NEXT'}
                    </span>
                  )}
                  {/* Compact remaining timer */}
                  {(isActive || isUpcoming) && target && (
                    <RemainingText
                      isActive={Boolean(isActive)}
                      label={label}
                      language={language}
                      target={target}
                      now={now}
                    />
                  )}
                </div>

                {/* Time badges row — compact inline */}
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-md bg-white/60 dark:bg-slate-800/40 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-300 border border-slate-200/40 dark:border-slate-700/30">
                    <BellRing size={9} className="text-slate-400" />
                    {displayTime(entry.adhan, language)}
                    <span className="text-[8px] font-medium text-slate-400 dark:text-slate-500 ml-px">{language === 'bn' ? 'আ.' : 'Az'}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-50/70 dark:bg-amber-900/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300 border border-amber-200/40 dark:border-amber-800/30">
                    <UsersRound size={9} className="text-amber-500" />
                    {displayTime(entry.jamaat, language)}
                    <span className="text-[8px] font-medium text-amber-500 dark:text-amber-400 ml-px">{language === 'bn' ? 'জা.' : 'Jm'}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-white/40 dark:bg-slate-800/30 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400 border border-slate-200/30 dark:border-slate-700/20">
                    <Clock size={9} className="text-slate-400" />
                    {displayTime(entry.endTime, language)}
                    <span className="text-[8px] font-medium text-slate-400 ml-px">
                      {language === 'bn' ? 'শে.' : 'End'}{key === 'Isha' ? (language === 'bn' ? '*' : '*') : ''}
                    </span>
                  </span>
                </div>
              </div>

              {/* Status badge — compact pill */}
              <div className="flex items-center">
                <motion.div
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.94 }}
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-bold shadow-sm transition-all ${STATUS_META[entry.status].className}`}
                >
                  {STATUS_META[entry.status].icon}
                  <span className="hidden sm:inline">{STATUS_LABELS[language][entry.status]}</span>
                  <span className="sm:hidden">
                    {entry.status === 'onTime' ? '✓' : entry.status === 'jamaat' ? 'J' : entry.status === 'late' ? 'L' : entry.status === 'missed' ? '✗' : '—'}
                  </span>
                </motion.div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Bottom Sheet (dropdown) */}
      <PrayerStatusSheet
        open={activeSheet !== null}
        prayerName={activeSheet?.prayerKey ?? ''}
        prayerLabel={activeSheet?.prayerLabel ?? ''}
        current={activeSheet?.currentStatus ?? 'pending'}
        language={language}
        onSelect={handleStatusSelect}
        onClose={() => setActiveSheet(null)}
      />
    </div>
  );
}
