'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
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
  Fajr: <Sunrise size={16} className="text-emerald-600" />,
  Dhuhr: <Sun size={16} className="text-amber-500" />,
  Asr: <Sun size={16} className="text-amber-600" />,
  Maghrib: <Sunset size={16} className="text-rose-500" />,
  Isha: <Moon size={16} className="text-emerald-700 dark:text-emerald-400" />,
} as const;
const STATUS_LABELS: Record<'bn' | 'en', Record<PrayerStatus, string>> = {
  bn: { pending: 'বাকি', onTime: 'সময়মত', jamaat: 'জামাতে', late: 'দেরিতে', missed: 'কাজা' },
  en: { pending: 'Pending', onTime: 'On time', jamaat: 'Jamaat', late: 'Late', missed: 'Missed' },
};
const STATUS_META: Record<PrayerStatus, { className: string; icon: React.ReactNode; description: string }> = {
  pending: { className: 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400', icon: <Circle size={20} />, description: 'Not yet marked' },
  onTime: { className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300', icon: <CheckCircle size={20} />, description: 'Prayed within the time' },
  jamaat: { className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300', icon: <Users size={20} />, description: 'Prayed in congregation' },
  late: { className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300', icon: <Clock size={20} />, description: 'Prayed but late' },
  missed: { className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300', icon: <XCircle size={20} />, description: 'Missed, need qada' },
};
const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
const toBN = (value: string) => value.replace(/\d/g, (digit) => BN_DIGITS[Number(digit)] ?? digit);

function displayTime(time: string, language: 'bn' | 'en') {
  return formatPrayerTime12h(time, { banglaDigits: language === 'bn', padHour: true });
}

// ─── Prayer Status Bottom Sheet ──────────────────────────────────────
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
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300, mass: 1 }}
            className="fixed bottom-0 left-0 right-0 z-[70] rounded-t-3xl border-t border-emerald-100/30 bg-white pb-8 shadow-2xl dark:border-emerald-900/30 dark:bg-slate-900"
          >
            {/* Handle */}
            <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-slate-300 dark:bg-slate-600" />

            {/* Header */}
            <div className="flex items-center justify-between px-6 pb-4 pt-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">{prayerLabel}</h2>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {language === 'bn' ? 'নামাজের অবস্থা নির্বাচন করুন' : 'Mark your prayer status'}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4l8 8M12 4l-8 8" />
                </svg>
              </button>
            </div>

            {/* Current status indicator */}
            <div className="mx-6 mb-4 flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/50 px-4 py-3 dark:border-emerald-900/30 dark:bg-emerald-900/10">
              {STATUS_META[current].icon}
              <div>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  {language === 'bn' ? 'বর্তমান:' : 'Current:'} {STATUS_LABELS[language][current]}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{STATUS_META[current].description}</p>
              </div>
            </div>

            {/* Status options */}
            <div className="space-y-2 px-6">
              {STATUS_OPTIONS.map((status) => {
                const meta = STATUS_META[status];
                const isSelected = current === status;
                return (
                  <motion.button
                    key={status}
                    type="button"
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      triggerHaptic('medium');
                      vibrateBrowser(10);
                      onSelect(status);
                      onClose();
                    }}
                    className={`flex w-full items-center gap-4 rounded-2xl border-2 px-5 py-4 text-left transition-all duration-200 ${
                      isSelected
                        ? 'border-emerald-400 bg-emerald-50 shadow-sm dark:border-emerald-500 dark:bg-emerald-900/20'
                        : 'border-transparent bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                        isSelected ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {meta.icon}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-bold ${isSelected ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-800 dark:text-slate-200'}`}>
                        {STATUS_LABELS[language][status]}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                        {language === 'bn' ? STATUS_DESC_BN[status] : meta.description}
                      </p>
                    </div>
                    {isSelected && (
                      <CheckCircle size={20} className="text-emerald-500" />
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
}: {
  isActive: boolean;
  label: string;
  language: 'bn' | 'en';
  target?: Date;
}) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  if (!target) return null;

  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-100">
      <Clock size={12} />
      {isActive
        ? (language === 'bn' ? `${label} শেষ হতে বাকি: ` : `${label} ends in: `)
        : (language === 'bn' ? `${label} শুরু হতে বাকি: ` : `${label} starts in: `)
      }
      <span className="font-mono tabular-nums">
        {language === 'bn' ? toBN(formatRemaining(target, now)) : formatRemaining(target, now)}
      </span>
    </span>
  );
}

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

  const handleStatusSelect = (status: PrayerStatus) => {
    if (!activeSheet) return;
    onMarkPrayer(activeSheet.prayerKey, status);
    setActiveSheet(null);
  };

  return (
    <div className="overflow-hidden rounded-2xl nz-card">
      <div className="flex flex-col gap-2 border-b px-4 py-4 sm:flex-row sm:items-center sm:justify-between nz-divider">
        <div>
          <h3 className="text-base font-bold nz-text">
            {language === 'bn' ? 'আজকের নামাজের সময়' : "Today's prayer times"}
          </h3>
          <p className="mt-1 text-xs font-medium nz-muted">
            {language === 'bn'
              ? 'শুরুর সময় আজান, শেষ সময় পরবর্তী ওয়াক্তের সীমা।'
              : 'Prayer start stays calculated. Azan and Jamat follow your saved settings.'}
          </p>
        </div>
        <span className="rounded-full px-3 py-1 text-xs font-bold nz-chip">
          {language === 'bn' ? `${completedCount}/5 সম্পন্ন` : `${completedCount}/5 completed`}
        </span>
      </div>

      <div className="divide-y divide-emerald-900/10">
        {PRAYER_ORDER.map((key) => {
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
              whileTap={{ scale: 0.995 }}
              onClick={() => {
                triggerHaptic('light');
                setActiveSheet({
                  prayerKey: key,
                  prayerLabel: label,
                  currentStatus: entry.status,
                });
              }}
              className={`grid grid-cols-[1fr_auto] gap-3 px-4 py-3.5 transition cursor-pointer ${
                isActive ? 'nz-accent-bg' : 'bg-transparent hover:bg-slate-50/50 dark:hover:bg-slate-800/30'
              }`}
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-bold nz-soft nz-text shadow-sm">
                    {PRAYER_ICONS[key]}
                    {label}
                  </span>
                  <span className="text-[11px] font-semibold nz-muted">{periodLabel}</span>
                  {isActive && (
                    <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
                      {language === 'bn' ? 'চলছে' : 'Active'}
                    </span>
                  )}
                  {!isActive && isUpcoming && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                      {language === 'bn' ? 'পরবর্তী' : 'Upcoming'}
                    </span>
                  )}
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold nz-text">
                  <span className="inline-flex items-center gap-1 rounded-md px-2 py-1 nz-soft">
                    <BellRing size={12} />
                    {displayTime(entry.adhan, language)}
                    <span className="nz-muted">{language === 'bn' ? 'আজান' : 'Azan'}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-amber-800 dark:border-amber-800/30 dark:bg-amber-900/20 dark:text-amber-200">
                    <UsersRound size={12} />
                    {displayTime(entry.jamaat, language)}
                    <span className="text-amber-600 dark:text-amber-400">{language === 'bn' ? 'জামাত' : 'Jamat'}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md px-2 py-1 nz-soft">
                    <Clock size={12} />
                    {displayTime(entry.endTime, language)}
                    <span className="text-amber-600">
                      {language === 'bn' ? 'শেষ' : 'Ends'}{key === 'Isha' ? (language === 'bn' ? ' (কাল)' : ' (tomorrow)') : ''}
                    </span>
                  </span>
                  {isActive && (
                    <RemainingText
                      isActive={Boolean(isActive)}
                      label={label}
                      language={language}
                      target={target}
                    />
                  )}
                </div>
              </div>

              {/* Status badge (click target) */}
              <div className="flex items-center">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold shadow-sm transition-all ${STATUS_META[entry.status].className}`}
                >
                  {STATUS_META[entry.status].icon}
                  <span>{STATUS_LABELS[language][entry.status]}</span>
                </motion.div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Bottom Sheet */}
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