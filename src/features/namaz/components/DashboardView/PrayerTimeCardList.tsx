'use client';

import { createPortal } from 'react-dom';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle, ChevronDown, Circle, Clock, Users, XCircle } from 'lucide-react';
import {
  buildPrayerWindows,
  formatPrayerTime12h,
  formatRemaining,
} from '../../utils/prayerSchedule';
import type { PrayerTimesResponse } from '../../types/prayer.types';

type PrayerStatus = 'pending' | 'onTime' | 'late' | 'missed' | 'jamaat';

interface PrayerEntry {
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
  Fajr: { bn: 'ফজর', period: 'ভোর' },
  Dhuhr: { bn: 'যোহর', period: 'দুপুর' },
  Asr: { bn: 'আসর', period: 'বিকাল' },
  Maghrib: { bn: 'মাগরিব', period: 'সন্ধ্যা' },
  Isha: { bn: 'এশা', period: 'রাত' },
} as const;
const STATUS_META: Record<PrayerStatus, { label: string; className: string; icon: React.ReactNode }> = {
  pending: { label: 'বাকি', className: 'bg-slate-100 text-slate-600 border-slate-200', icon: <Circle size={15} /> },
  onTime: { label: 'সময়মত', className: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: <CheckCircle size={15} /> },
  jamaat: { label: 'জামাতে', className: 'bg-blue-100 text-blue-700 border-blue-200', icon: <Users size={15} /> },
  late: { label: 'দেরিতে', className: 'bg-amber-100 text-amber-700 border-amber-200', icon: <Clock size={15} /> },
  missed: { label: 'কাজা', className: 'bg-red-100 text-red-700 border-red-200', icon: <XCircle size={15} /> },
};
const STATUS_OPTIONS: PrayerStatus[] = ['pending', 'onTime', 'jamaat', 'late', 'missed'];

function displayTime(time: string) {
  return formatPrayerTime12h(time, { banglaDigits: true, padHour: true });
}

function StatusMenu({
  triggerRef,
  current,
  onSelect,
  onClose,
}: {
  triggerRef: React.RefObject<HTMLButtonElement>;
  current: PrayerStatus;
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
      className="fixed z-[1000] w-[184px] overflow-hidden rounded-xl border border-emerald-100 bg-white py-1 shadow-xl shadow-emerald-950/15 animate-[az-scale-in_150ms_ease-out]"
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
            <span>{meta.label}</span>
          </button>
        );
      })}
    </div>,
    document.body
  );
}

function StatusButton({
  status,
  onSelect,
}: {
  status: PrayerStatus;
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
        <span className="hidden xs:inline">{meta.label}</span>
        <ChevronDown size={13} />
      </button>
      {open && (
        <StatusMenu
          triggerRef={triggerRef}
          current={status}
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
  target,
}: {
  isActive: boolean;
  label: string;
  target?: Date;
}) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  if (!target) return null;

  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-800">
      <Clock size={12} />
      {isActive ? `${label} শেষ হতে বাকি: ` : `${label} শুরু হতে বাকি: `}
      <span className="font-mono tabular-nums">{formatRemaining(target, now)}</span>
    </span>
  );
}

export default function PrayerTimeCard({ prayerTimes, prayerTimesResponse, onMarkPrayer }: Props) {
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
    <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-white/80 shadow-sm shadow-emerald-900/5">
      <div className="flex flex-col gap-2 border-b border-emerald-900/10 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-bold text-emerald-950">আজকের নামাজের সময়</h3>
          <p className="mt-1 text-xs font-medium text-emerald-700">
            Start time is azan time. End time follows the next prayer boundary.
          </p>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
          {completedCount}/5 completed
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

          return (
            <div
              key={key}
              className={`grid grid-cols-[1fr_auto] gap-3 px-4 py-3 transition ${
                isActive ? 'bg-emerald-50/80' : 'bg-white/40'
              }`}
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-emerald-950">{meta.bn}</span>
                  <span className="text-[11px] font-semibold text-emerald-500">{meta.period}</span>
                  {isActive && (
                    <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
                      চলছে
                    </span>
                  )}
                  {!isActive && isUpcoming && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                      upcoming
                    </span>
                  )}
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-emerald-800">
                  <span className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 ring-1 ring-emerald-100">
                    <Clock size={12} />
                    {displayTime(entry.adhan)}
                    <span className="text-emerald-500">আজান</span>
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 ring-1 ring-emerald-100">
                    {displayTime(entry.endTime)}
                    <span className="text-amber-600">শেষ{key === 'Isha' ? ' (কাল)' : ''}</span>
                  </span>
                  <RemainingText isActive={Boolean(isActive)} label={meta.bn} target={target} />
                </div>
              </div>

              <div className="flex items-center">
                <StatusButton
                  status={entry.status}
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
