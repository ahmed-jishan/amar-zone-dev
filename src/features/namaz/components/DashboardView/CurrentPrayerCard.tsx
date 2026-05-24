'use client';

import { useEffect, useMemo, useState } from 'react';
import { Clock, MapPin } from 'lucide-react';
import {
  buildPrayerWindows,
  formatPrayerTime12h,
  getCurrentOrNextPrayer,
} from '../../utils/prayerSchedule';
import type { PrayerTimesResponse } from '../../types/prayer.types';
import { PRAYER_NAME_LABELS } from '../../constants/prayerNames';

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
  language: 'bn' | 'en';
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
const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
const toBN = (value: number | string) =>
  String(value).replace(/\d/g, (digit) => BN_DIGITS[Number(digit)] ?? digit);
const pad2 = (value: number, language: 'bn' | 'en') => {
  const raw = String(value).padStart(2, '0');
  return language === 'bn' ? toBN(raw) : raw;
};

export default function CurrentPrayerCard({ prayerTimes, prayerTimesResponse, locationLabel, language }: Props) {
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

  const dateLabel = useMemo(() => {
    return new Intl.DateTimeFormat(language === 'bn' ? 'bn-BD' : 'en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      timeZone: prayerTimesResponse.timezone,
    }).format(now);
  }, [now, prayerTimesResponse.timezone, language]);

  const endSuffix = activeWindow?.endsTomorrow ? ' (কাল)' : '';
  const prayerLabel = PRAYER_NAME_LABELS[activeName]?.[language] ?? activeName;
  const caption = activeWindow?.status === 'active'
    ? (language === 'bn' ? `${prayerLabel} ওয়াক্ত শেষ হতে বাকি` : `${prayerLabel} ends in`)
    : (language === 'bn' ? `${prayerLabel} শুরু হতে বাকি` : `${prayerLabel} starts in`);
  const helperText = useMemo(() => {
    if (!activeWindow) return language === 'bn' ? 'শান্তভাবে প্রস্তুতি নিন' : 'Prepare calmly';
    if (activeWindow.status === 'active') {
      if (countdownSec <= 10 * 60) return language === 'bn' ? 'সময় কম — শান্তভাবে শেষ করুন' : 'Time is short — finish calmly';
      if (countdownSec <= 30 * 60) return language === 'bn' ? 'মনোযোগ ধরে রাখুন' : 'Stay focused';
      return language === 'bn' ? 'নিয়মিত জামাতে চেষ্টা করুন' : 'Try to pray in congregation';
    }
    if (countdownSec <= 10 * 60) return language === 'bn' ? 'সময় কম — প্রস্তুতি নিন' : 'Time is short — get ready';
    return language === 'bn' ? 'ওযু ও প্রস্তুতি নিন' : 'Make wudu and prepare';
  }, [activeWindow, countdownSec, language]);

  return (
    <div className="relative overflow-hidden rounded-2xl nz-card">
      <div
        className="relative overflow-hidden px-5 py-5 text-white sm:px-6"
        style={{
          background: 'linear-gradient(135deg, #0f3d2e 0%, #0f4a3a 55%, #0f5a51 100%)',
        }}
      >
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
          {activeWindow?.status === 'active'
            ? (language === 'bn' ? 'বর্তমান ওয়াক্ত' : 'Current prayer')
            : isTomorrow
              ? (language === 'bn' ? 'কাল ফজর' : 'Tomorrow Fajr')
              : (language === 'bn' ? 'পরবর্তী নামাজ' : 'Next prayer')}
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-4xl font-bold leading-none text-white">{prayerLabel}</h2>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm font-medium text-white/75">
              <Clock size={14} />
              <span>{language === 'bn' ? 'আজান' : 'Azan'}</span>
              <span className="text-lg font-bold text-white">
                {formatPrayerTime12h(activeEntry.adhan, { banglaDigits: language === 'bn', padHour: true })}
              </span>
              <span className="text-white/35">•</span>
              <span>{language === 'bn' ? 'শেষ' : 'Ends'}</span>
              <span className="text-lg font-bold text-white">
                {formatPrayerTime12h(activeEntry.endTime, { banglaDigits: language === 'bn', padHour: true })}{endSuffix}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 rounded-xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur sm:min-w-[240px]">
            <div>
              <p className="text-[11px] font-semibold text-white/70">{caption}</p>
              <div className="mt-1 flex items-end gap-1.5 font-bold tabular-nums">
                <span className="text-2xl sm:text-3xl">{pad2(cdH, language)}</span>
                <span className="pb-0.5 text-white/45">:</span>
                <span className="text-2xl sm:text-3xl">{pad2(cdM, language)}</span>
                <span className="pb-0.5 text-white/45">:</span>
                <span className="text-2xl sm:text-3xl">{pad2(cdS, language)}</span>
              </div>
              <p className="mt-1 text-[11px] font-medium text-white/60">{helperText}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto px-4 py-4">
        {PRAYER_ORDER.map((name, index) => {
          const window = windows.find((item) => item.prayer === LEGACY_TO_CANONICAL[name]);
          const isActive = window?.status === 'active';
          const isTarget = index === activeIdx;
          const isEnded = window?.status === 'ended';
          const label = PRAYER_NAME_LABELS[name]?.[language] ?? name;

          return (
            <div
              key={name}
              className="flex min-w-[72px] flex-shrink-0 flex-col items-center gap-1 rounded-xl border px-3 py-2"
              style={{
                borderColor: isTarget ? 'var(--nz-accent)' : 'var(--nz-border)',
                background: isActive ? 'var(--nz-accent-soft)' : 'var(--nz-soft)',
                opacity: isEnded && !isTarget ? 0.55 : 1,
              }}
            >
              <span className="text-[10px] font-bold uppercase tracking-wide nz-muted">{label}</span>
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{
                  background: isTarget ? 'var(--nz-accent)' : isEnded ? '#94a3b8' : 'rgba(59,183,161,0.25)',
                  boxShadow: isTarget ? '0 0 0 4px rgba(59,183,161,0.18)' : 'none',
                }}
              />
              <span className="text-xs font-bold tabular-nums nz-text">
                {formatPrayerTime12h(prayerTimes[name].adhan, { banglaDigits: language === 'bn', padHour: true })}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-2 border-t px-5 py-3 text-sm font-medium sm:flex-row sm:items-center sm:justify-between nz-divider nz-text">
        <div className="flex items-center gap-1.5">
          <MapPin size={14} />
          <span>{locationLabel || (language === 'bn' ? 'লোকেশন সিঙ্ক হচ্ছে' : 'Location syncing')}</span>
        </div>
        <span className="text-xs nz-muted">{dateLabel}</span>
      </div>
    </div>
  );
}
