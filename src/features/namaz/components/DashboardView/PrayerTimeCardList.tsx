'use client';

import { createPortal } from 'react-dom';
import { useEffect, useMemo, useRef, useState } from 'react';
import { BellRing, CheckCircle, ChevronDown, Circle, Clock, Moon, Sunrise, Sun, Sunset, Users, UsersRound, XCircle } from 'lucide-react';
import {
  buildPrayerWindows,
  formatPrayerTime12h,
  formatRemaining,
} from '../../utils/prayerSchedule';
import type { PrayerTimesResponse } from '../../types/prayer.types';
import { PRAYER_NAME_LABELS } from '../../constants/prayerNames';

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
  Fajr: 'fajr',
  Dhuhr: 'dhuhr',
  Asr: 'asr',
  Maghrib: 'maghrib',
  Isha: 'isha',
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
  Isha: <Moon size={16} className="text-indigo-500" />,
} as const;
const STATUS_LABELS: Record<'bn' | 'en', Record<PrayerStatus, string>> = {
  bn: {
    pending: 'বাকি',
    onTime: 'সময়মত',
    jamaat: 'জামাতে',
    late: 'দেরিতে',
    missed: 'কাজা',
  },
  en: {
    pending: 'Pending',
    onTime: 'On time',
    jamaat: 'Jamaat',
    late: 'Late',
    missed: 'Missed',
  },
};
const STATUS_META: Record<PrayerStatus, { className: string; icon: React.ReactNode }> = {
  pending: { className: 'bg-slate-100 text-slate-600 border-slate-200', icon: <Circle size={15} /> },
  onTime: { className: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: <CheckCircle size={15} /> },
  jamaat: { className: 'bg-blue-100 text-blue-700 border-blue-200', icon: <Users size={15} /> },
  late: { className: 'bg-amber-100 text-amber-700 border-amber-200', icon: <Clock size={15} /> },
  missed: { className: 'bg-red-100 text-red-700 border-red-200', icon: <XCircle size={15} /> },
};
const STATUS_OPTIONS: PrayerStatus[] = ['pending', 'onTime', 'jamaat', 'late', 'missed'];
const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
const toBN = (value: string) => value.replace(/\d/g, (digit) => BN_DIGITS[Number(digit)] ?? digit);

function displayTime(time: string, language: 'bn' | 'en') {
  return formatPrayerTime12h(time, { banglaDigits: language === 'bn', padHour: true });
}

function StatusMenu({
  triggerRef,
  current,
  language,
  onSelect,
  onClose,
}: {
  triggerRef: React.RefObject<HTMLButtonElement>;
  current: PrayerStatus;
  language: 'bn' | 'en';
  onSelect: (status: PrayerStatus) => void;
  onClose: () => void;
}) {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const width = 184;
      const openUp = window.innerHeight - rect.bottom < 240 && rect.top > 240;
      setPosition({
        top: openUp ? rect.top - 222 : rect.bottom + 8,
        left: Math.max(8, Math.min(rect.right - width, window.innerWidth - width - 8)),
      });
    };

    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [triggerRef]);

  useEffect(() => {
    const handlePointer = (event: MouseEvent) => {
      const target = event.target as Node;
      if (menuRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      onClose();
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose, triggerRef]);

  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      className="fixed z-[1000] w-[184px] overflow-hidden rounded-xl border border-emerald-100 bg-white py-1 shadow-xl shadow-emerald-950/15 animate-[az-scale-in_150ms_ease-out] dark:border-emerald-900/40 dark:bg-slate-900"
      style={{ top: position.top, left: position.left }}
    >
      {STATUS_OPTIONS.map((status) => {
        const meta = STATUS_META[status];
        return (
          <button
            key={status}
            type="button"
            role="menuitemradio"
            aria-checked={current === status}
            onClick={() => onSelect(status)}
            className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold transition hover:bg-emerald-50 ${
              current === status ? 'text-emerald-700' : 'text-slate-700'
            }`}
          >
            {meta.icon}
            <span>{STATUS_LABELS[language][status]}</span>
          </button>
        );
      })}
    </div>,
    document.body
  );
}

function StatusButton({
  status,
  language,
  onSelect,
}: {
  status: PrayerStatus;
  language: 'bn' | 'en';
  onSelect: (status: PrayerStatus) => void;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const meta = STATUS_META[status];

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-bold transition hover:shadow-sm ${meta.className}`}
      >
        {meta.icon}
        <span className="hidden xs:inline">{STATUS_LABELS[language][status]}</span>
        <ChevronDown size={13} />
      </button>
      {open && (
        <StatusMenu
          triggerRef={triggerRef}
          current={status}
          language={language}
          onClose={() => setOpen(false)}
          onSelect={(next) => {
            onSelect(next);
            setOpen(false);
          }}
        />
      )}
    </>
  );
}

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

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const windows = useMemo(
    () => buildPrayerWindows(prayerTimesResponse, now),
    [now, prayerTimesResponse]
  );
  const completedCount = PRAYER_ORDER.filter((key) => ['onTime', 'late', 'jamaat'].includes(prayerTimes[key].status)).length;

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
            <div
              key={key}
              className={`grid grid-cols-[1fr_auto] gap-3 px-4 py-3 transition ${
                isActive ? 'nz-accent-bg' : 'bg-transparent'
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
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
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

              <div className="flex items-center">
                <StatusButton
                  status={entry.status}
                  language={language}
                  onSelect={(status) => onMarkPrayer(key, status)}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
