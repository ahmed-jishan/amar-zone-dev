// app/(tabs)/namaz/components/DashboardView/index.tsx
'use client';

import { useMemo } from 'react';
import { BellRing, BookOpen, Clock3 } from 'lucide-react';
import CurrentPrayerCard from './CurrentPrayerCard';
import PrayerTimeCard from './PrayerTimeCardList';
import DailyStreakWidget from './StreakWidget';
import QuickActions from './QuickActions';
import { useLogsStore, TRACKED_PRAYERS } from '../../store/logsStore';
import { calculateStreak } from '../../utils/streakCalculator';
import { formatLocalDateKey } from '../../utils/dateHelpers';
import type { useAzanScheduler } from '../../hooks/useAzanScheduler';
import type { PrayerTimesResponse } from '../../types/prayer.types';

// Prayer status type
export type PrayerStatus = 'pending' | 'onTime' | 'late' | 'missed' | 'jamaat';

interface DashboardViewProps {
  azan?: ReturnType<typeof useAzanScheduler>;
  prayerTimesResponse?: PrayerTimesResponse | null;
  locationLabel?: string;
  locationStatus?: string;
  onOpenQuran?: () => void;
}

export default function DashboardView({ azan, prayerTimesResponse, locationLabel, locationStatus, onOpenQuran }: DashboardViewProps) {
  const logs = useLogsStore((state) => state.logs);
  const updatePrayer = useLogsStore((state) => state.updatePrayer);
  const today = formatLocalDateKey(new Date());

  const prayerData = useMemo(() => prayerTimesResponse ? ({
    Fajr: {
      adhan: prayerTimesResponse.rawTimings.Fajr,
      jamaat: prayerTimesResponse.rawTimings.Fajr,
      endTime: prayerTimesResponse.rawTimings.Sunrise ?? prayerTimesResponse.rawTimings.Dhuhr,
      status: logs[today]?.Fajr?.status || 'pending' as PrayerStatus,
    },
    Dhuhr: {
      adhan: prayerTimesResponse.rawTimings.Dhuhr,
      jamaat: prayerTimesResponse.rawTimings.Dhuhr,
      endTime: prayerTimesResponse.rawTimings.Asr,
      status: logs[today]?.Dhuhr?.status || 'pending' as PrayerStatus,
    },
    Asr: {
      adhan: prayerTimesResponse.rawTimings.Asr,
      jamaat: prayerTimesResponse.rawTimings.Asr,
      endTime: prayerTimesResponse.rawTimings.Maghrib,
      status: logs[today]?.Asr?.status || 'pending' as PrayerStatus,
    },
    Maghrib: {
      adhan: prayerTimesResponse.rawTimings.Maghrib,
      jamaat: prayerTimesResponse.rawTimings.Maghrib,
      endTime: prayerTimesResponse.rawTimings.Isha,
      status: logs[today]?.Maghrib?.status || 'pending' as PrayerStatus,
    },
    Isha: {
      adhan: prayerTimesResponse.rawTimings.Isha,
      jamaat: prayerTimesResponse.rawTimings.Isha,
      endTime: prayerTimesResponse.rawTimings.Fajr,
      status: logs[today]?.Isha?.status || 'pending' as PrayerStatus,
    },
  }) : null, [logs, prayerTimesResponse, today]);

  const streak = useMemo(() => calculateStreak(logs), [logs]);
  const totalPrayedToday = TRACKED_PRAYERS.filter((prayer) => {
    const status = logs[today]?.[prayer]?.status;
    return status === 'onTime' || status === 'late' || status === 'jamaat';
  }).length;

  const handleMarkPrayer = (prayerName: string, status: PrayerStatus) => {
    updatePrayer(today, prayerName as 'Fajr' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha', status);
  };

  return (
    <div className="space-y-6">
      {/* Current/Next Prayer Card */}
      {prayerData && prayerTimesResponse ? (
        <CurrentPrayerCard
          prayerTimes={prayerData}
          prayerTimesResponse={prayerTimesResponse}
          locationLabel={locationLabel}
        />
      ) : (
        <div className="rounded-2xl border border-emerald-100 bg-white/75 p-5 text-sm font-semibold text-emerald-800 shadow-sm">
          Prayer times are syncing with your current location...
        </div>
      )}

      <section className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-emerald-100 bg-white/75 p-4 shadow-sm shadow-emerald-900/5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700">
                <BellRing size={16} /> Azan
              </p>
              <h3 className="mt-2 text-lg font-bold text-emerald-950">
                {azan?.enabled ? 'Azan is ON' : 'Silent prayer mode'}
              </h3>
              <p className="mt-1 text-sm text-emerald-700">
                {azan?.nextAzan ? `${azan.nextAzan.label} at ${azan.nextAzan.displayTime}` : 'Prayer schedule is loading'}
              </p>
              <p className="mt-1 text-xs text-emerald-600">
                {locationStatus === 'denied' ? 'Location permission denied. Using saved location.' : locationLabel}
              </p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${azan?.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
              {azan?.enabled ? 'ON' : 'OFF'}
            </span>
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-emerald-900">
            <Clock3 size={16} />
            <span className="text-sm font-semibold">Next Azan in</span>
            <span className="ml-auto font-mono text-lg font-bold">{azan?.remaining ?? '--:--:--'}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenQuran}
          className="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 to-emerald-50 p-4 text-left shadow-sm shadow-emerald-900/5 transition hover:border-emerald-200 hover:shadow-md"
        >
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-amber-800">
            <BookOpen size={16} /> Quran Companion
          </p>
          <h3 className="mt-2 text-lg font-bold text-emerald-950">Resume reading and listening</h3>
          <p className="mt-1 text-sm leading-6 text-emerald-700">
            Open the Quran tab for Surah list, Bangla translation, ayah audio, bookmarks, and calm mode.
          </p>
        </button>
      </section>

      {/* 5 Prayer Time Cards */}
      {prayerData && (
        <PrayerTimeCard
          prayerTimes={prayerData}
          prayerTimesResponse={prayerTimesResponse}
          onMarkPrayer={handleMarkPrayer}
        />
      )}

      {/* Streak Widget */}
      <DailyStreakWidget 
        currentStreak={streak.current}
        bestStreak={streak.best}
        todayProgress={totalPrayedToday}
        totalPrayers={5}
      />

      {/* Quick Actions */}
      <QuickActions />
    </div>
  );
}
