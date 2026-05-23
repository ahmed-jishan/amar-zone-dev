'use client';

import { useEffect, useMemo, useState } from 'react';
import { Clock, MapPin } from 'lucide-react';
import {
  buildPrayerWindows,
  formatPrayerTime12h,
  getCurrentOrNextPrayer,
} from '../../utils/prayerSchedule';
import type { PrayerTimesResponse } from '../../types/prayer.types';

interface PrayerEntry {
  adhan: string;
  jamaat: string;
  endTime: string;
  status: string;
}

interface PrayerTimes {
  Fajr: PrayerEntry;
  Dhuhr: PrayerEntry;
  Asr: PrayerEntry;
  Maghrib: PrayerEntry;
  Isha: PrayerEntry;
}

interface Props {
  prayerTimes: PrayerTimes;
  prayerTimesResponse: PrayerTimesResponse;
  locationLabel?: string;
}

const PRAYER_ORDER = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const;
const CANONICAL_TO_LEGACY = {
  fajr: 'Fajr',
  dhuhr: 'Dhuhr',
  asr: 'Asr',
  maghrib: 'Maghrib',
  isha: 'Isha',
} as const;
const LEGACY_TO_CANONICAL = {
  Fajr: 'fajr',
  Dhuhr: 'dhuhr',
  Asr: 'asr',
  Maghrib: 'maghrib',
  Isha: 'isha',
} as const;
const PRAYER_LABELS: Record<(typeof PRAYER_ORDER)[number], string> = {
  Fajr: 'ফজর',
  Dhuhr: 'যোহর',
  Asr: 'আসর',
  Maghrib: 'মাগরিব',
  Isha: 'এশা',
};

const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
const toBN = (value: number | string) =>
  String(value).replace(/\d/g, (digit) => BN_DIGITS[Number(digit)] ?? digit);
const pad2 = (value: number) => toBN(String(value).padStart(2, '0'));
const CIRC = 2 * Math.PI * 22;

export default function CurrentPrayerCard({ prayerTimes, prayerTimesResponse, locationLabel }: Props) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const activeWindow = useMemo(
    () => getCurrentOrNextPrayer(prayerTimesResponse, now),
    [now, prayerTimesResponse]
  );
  const windows = useMemo(
    () => buildPrayerWindows(prayerTimesResponse, now),
    [now, prayerTimesResponse]
  );

  const activeName = activeWindow ? CANONICAL_TO_LEGACY[activeWindow.prayer] : 'Fajr';
  const activeEntry = prayerTimes[activeName];
  const activeIdx = Math.max(0, PRAYER_ORDER.indexOf(activeName));
  const isTomorrow = Boolean(activeWindow?.prayer === 'fajr' && activeWindow.start.toDateString() !== now.toDateString());
  const countdownSec = activeWindow?.remainingSeconds ?? 0;
  const cdH = Math.floor(countdownSec / 3600);
  const cdM = Math.floor((countdownSec % 3600) / 60);
  const cdS = countdownSec % 60;

  const arcOffset = useMemo(() => {
    if (!activeWindow || activeWindow.status !== 'active') return CIRC;
    const span = activeWindow.end.getTime() - activeWindow.start.getTime();
    const elapsed = now.getTime() - activeWindow.start.getTime();
    return CIRC * (1 - Math.min(1, Math.max(0, elapsed / span)));
  }, [activeWindow, now]);
  const arcPct = Math.round((1 - arcOffset / CIRC) * 100);

  const dateBN = useMemo(() => {
    return new Intl.DateTimeFormat('bn-BD', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      timeZone: prayerTimesResponse.timezone,
    }).format(now);
  }, [now, prayerTimesResponse.timezone]);

  const endSuffix = activeWindow?.endsTomorrow ? ' (কাল)' : '';
  const caption = activeWindow?.status === 'active'
    ? `${PRAYER_LABELS[activeName]} ওয়াক্ত শেষ হতে বাকি`
    : `${PRAYER_LABELS[activeName]} শুরু হতে বাকি`;

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm shadow-emerald-900/10"
    >
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-700 px-5 py-5 text-white sm:px-6">
        <svg
          className="pointer-events-none absolute -right-5 -top-5 opacity-10"
          width="170"
          height="170"
          viewBox="0 0 160 160"
          fill="none"
          aria-hidden
        >
          <path d="M80 8L152 80L80 152L8 80L80 8z" stroke="white" strokeWidth="1.2" />
          <path d="M80 28L132 80L80 132L28 80L80 28z" stroke="white" strokeWidth="0.8" />
          <circle cx="80" cy="80" r="30" stroke="white" strokeWidth="0.8" />
        </svg>

        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white/85">
          <Clock size={12} />
          {activeWindow?.status === 'active' ? 'বর্তমান ওয়াক্ত' : isTomorrow ? 'কাল ফজর' : 'পরবর্তী নামাজ'}
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-4xl font-bold leading-none text-white">{PRAYER_LABELS[activeName]}</h2>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm font-medium text-white/75">
              <Clock size={14} />
              <span>আজান</span>
              <span className="text-lg font-bold text-white">
                {formatPrayerTime12h(activeEntry.adhan, { banglaDigits: true, padHour: true })}
              </span>
              <span className="text-white/35">•</span>
              <span>শেষ</span>
              <span className="text-lg font-bold text-white">
                {formatPrayerTime12h(activeEntry.endTime, { banglaDigits: true, padHour: true })}{endSuffix}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-5 rounded-xl border border-white/15 bg-white/10 px-4 py-3 sm:min-w-[280px]">
            <div>
              <p className="text-xs font-semibold text-white/65">{caption}</p>
              <div className="mt-1 flex items-end gap-2 font-bold tabular-nums">
                <span className="text-3xl">{pad2(cdH)}</span>
                <span className="pb-1 text-white/45">:</span>
                <span className="text-3xl">{pad2(cdM)}</span>
                <span className="pb-1 text-white/45">:</span>
                <span className="text-3xl">{pad2(cdS)}</span>
              </div>
            </div>

            <svg width="54" height="54" viewBox="0 0 54 54" fill="none" aria-label={`${toBN(arcPct)}% complete`}>
              <circle cx="27" cy="27" r="22" stroke="rgba(255,255,255,0.18)" strokeWidth="3" />
              <circle
                cx="27"
                cy="27"
                r="22"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={CIRC}
                strokeDashoffset={arcOffset}
                transform="rotate(-90 27 27)"
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
              <text x="27" y="31" textAnchor="middle" fontSize="11" fontWeight="700" fill="rgba(255,255,255,0.9)">
                {toBN(arcPct)}%
              </text>
            </svg>
          </div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto px-4 py-4">
        {PRAYER_ORDER.map((name, index) => {
          const window = windows.find((item) => item.prayer === LEGACY_TO_CANONICAL[name]);
          const isActive = window?.status === 'active';
          const isTarget = index === activeIdx;
          const isEnded = window?.status === 'ended';

          return (
            <div
              key={name}
              className="flex min-w-[72px] flex-shrink-0 flex-col items-center gap-1 rounded-xl border px-3 py-2"
              style={{
                borderColor: isTarget ? 'rgba(5,150,105,0.35)' : 'rgba(6,87,66,0.1)',
                background: isActive ? 'rgba(5,150,105,0.12)' : 'rgba(236,253,245,0.65)',
                opacity: isEnded && !isTarget ? 0.55 : 1,
              }}
            >
              <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-700">{PRAYER_LABELS[name]}</span>
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{
                  background: isTarget ? '#059669' : isEnded ? '#94a3b8' : '#d1fae5',
                  boxShadow: isTarget ? '0 0 0 4px rgba(5,150,105,0.16)' : 'none',
                }}
              />
              <span className="text-xs font-bold tabular-nums text-emerald-900">
                {formatPrayerTime12h(prayerTimes[name].adhan, { banglaDigits: true, padHour: true })}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-2 border-t border-emerald-900/10 px-5 py-3 text-sm font-medium text-emerald-800 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1.5">
          <MapPin size={14} />
          <span>{locationLabel || 'Location syncing'}</span>
        </div>
        <span className="text-xs text-emerald-600">{dateBN}</span>
      </div>
    </div>
  );
}
