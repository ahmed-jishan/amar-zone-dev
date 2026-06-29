// app/(tabs)/namaz/components/DashboardView/index.tsx
'use client';

import { useMemo } from 'react';
import { BellRing, BookOpen, Clock3 } from 'lucide-react';
import CurrentPrayerCard from './CurrentPrayerCard';
import PrayerTimeCard from './PrayerTimeCardList';
import AzanJamatConfigPanel from './AzanJamatConfigPanel';
import DailyStreakWidget from './StreakWidget';
import QuickActions from './QuickActions';
import ModeBanner from '../../modes/components/ModeBanner';
import IftarCountdown from '../../modes/components/IftarCountdown';
import FastingTracker from '../../modes/components/FastingTracker';
import TaraweehTracker from '../../modes/components/TaraweehTracker';
import RamadanCountdown from '../../modes/components/RamadanCountdown';
import { motion } from 'framer-motion';
import { useLogsStore, TRACKED_PRAYERS } from '../../store/logsStore';
import { usePrefsStore } from '../../store/prefsStore';
import { calculateStreak } from '../../utils/streakCalculator';
import { formatLocalDateKey } from '../../utils/dateHelpers';
import { computePrayerTimeConfig } from '../../utils/azanJamatConfig';
import type { useAzanScheduler } from '../../hooks/useAzanScheduler';
import type { PrayerTimesResponse } from '../../types/prayer.types';
import '@/features/namaz/modes/modes-premium.css';

// Prayer status type
export type PrayerStatus = 'pending' | 'onTime' | 'late' | 'missed' | 'jamaat';

interface DashboardViewProps {
  azan?: ReturnType<typeof useAzanScheduler>;
  prayerTimesResponse?: PrayerTimesResponse | null;
  locationLabel?: string;
  locationStatus?: string;
  onOpenQuran?: () => void;
  language: 'bn' | 'en';
}

const COPY = {
  bn: {
    syncing: 'আপনার লোকেশন অনুযায়ী নামাজের সময় সিঙ্ক হচ্ছে...',
    azan: 'আজান',
    azanOn: 'আজান চালু আছে',
    azanOff: 'নীরব মোড',
    scheduleLoading: 'সময়সূচি লোড হচ্ছে',
    nextAt: 'পরের আজান',
    locationDenied: 'লোকেশন অনুমতি নেই। সংরক্ষিত লোকেশন ব্যবহার করা হচ্ছে।',
    nextIn: 'পরের আজান শুরু হতে',
    quranTitle: 'কুরআন সহচর',
    quranHeadline: 'পড়া ও শোনা চালিয়ে যান',
    quranBody: 'কুরআন ট্যাবে সূরা তালিকা, অনুবাদ, তিলাওয়াত ও বুকমার্ক পাবেন।',
  },
  en: {
    syncing: 'Prayer times are syncing with your current location...',
    azan: 'Azan',
    azanOn: 'Azan is ON',
    azanOff: 'Silent prayer mode',
    scheduleLoading: 'Prayer schedule is loading',
    nextAt: 'Next azan',
    locationDenied: 'Location permission denied. Using saved location.',
    nextIn: 'Next azan in',
    quranTitle: 'Quran Companion',
    quranHeadline: 'Resume reading and listening',
    quranBody: 'Open the Quran tab for Surah list, translation, ayah audio, bookmarks, and calm mode.',
  },
};

export default function DashboardView({ azan, prayerTimesResponse, locationLabel, locationStatus, onOpenQuran, language }: DashboardViewProps) {
  const t = COPY[language];
  const logs = useLogsStore((state) => state.logs);
  const updatePrayer = useLogsStore((state) => state.updatePrayer);
  const prayerTimePreferences = usePrefsStore((state) => state.prayerTimePreferences);
  const ramadanMode = usePrefsStore((state) => state.ramadanMode);
  const today = formatLocalDateKey(new Date());

  const prayerData = useMemo(() => prayerTimesResponse ? ({
    Fajr: {
      prayerStart: prayerTimesResponse.rawTimings.Fajr,
      adhan: computePrayerTimeConfig(prayerTimesResponse.rawTimings.Fajr, prayerTimePreferences.fajr).azanTime,
      jamaat: computePrayerTimeConfig(prayerTimesResponse.rawTimings.Fajr, prayerTimePreferences.fajr).jamatTime,
      endTime: prayerTimesResponse.rawTimings.Sunrise ?? prayerTimesResponse.rawTimings.Dhuhr,
      status: logs[today]?.Fajr?.status || 'pending' as PrayerStatus,
    },
    Dhuhr: {
      prayerStart: prayerTimesResponse.rawTimings.Dhuhr,
      adhan: computePrayerTimeConfig(prayerTimesResponse.rawTimings.Dhuhr, prayerTimePreferences.dhuhr).azanTime,
      jamaat: computePrayerTimeConfig(prayerTimesResponse.rawTimings.Dhuhr, prayerTimePreferences.dhuhr).jamatTime,
      endTime: prayerTimesResponse.rawTimings.Asr,
      status: logs[today]?.Dhuhr?.status || 'pending' as PrayerStatus,
    },
    Asr: {
      prayerStart: prayerTimesResponse.rawTimings.Asr,
      adhan: computePrayerTimeConfig(prayerTimesResponse.rawTimings.Asr, prayerTimePreferences.asr).azanTime,
      jamaat: computePrayerTimeConfig(prayerTimesResponse.rawTimings.Asr, prayerTimePreferences.asr).jamatTime,
      endTime: prayerTimesResponse.rawTimings.Maghrib,
      status: logs[today]?.Asr?.status || 'pending' as PrayerStatus,
    },
    Maghrib: {
      prayerStart: prayerTimesResponse.rawTimings.Maghrib,
      adhan: computePrayerTimeConfig(prayerTimesResponse.rawTimings.Maghrib, prayerTimePreferences.maghrib).azanTime,
      jamaat: computePrayerTimeConfig(prayerTimesResponse.rawTimings.Maghrib, prayerTimePreferences.maghrib).jamatTime,
      endTime: prayerTimesResponse.rawTimings.Isha,
      status: logs[today]?.Maghrib?.status || 'pending' as PrayerStatus,
    },
    Isha: {
      prayerStart: prayerTimesResponse.rawTimings.Isha,
      adhan: computePrayerTimeConfig(prayerTimesResponse.rawTimings.Isha, prayerTimePreferences.isha).azanTime,
      jamaat: computePrayerTimeConfig(prayerTimesResponse.rawTimings.Isha, prayerTimePreferences.isha).jamatTime,
      endTime: prayerTimesResponse.rawTimings.Fajr,
      status: logs[today]?.Isha?.status || 'pending' as PrayerStatus,
    },
  }) : null, [logs, prayerTimesResponse, prayerTimePreferences, today]);

  const streak = useMemo(() => calculateStreak(logs), [logs]);
  const totalPrayedToday = TRACKED_PRAYERS.filter((prayer) => {
    const status = logs[today]?.[prayer]?.status;
    return status === 'onTime' || status === 'late' || status === 'jamaat';
  }).length;

  const handleMarkPrayer = (prayerName: string, status: PrayerStatus) => {
    updatePrayer(today, prayerName as 'Fajr' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha', status);
  };

  // Check if we're actually in Ramadan month (from API Hijri date)
  const isActualRamadanMonth = prayerTimesResponse?.hijriDate?.toLowerCase().includes('ramadan') ?? false;
  // Full Ramadan features only available during actual Ramadan
  const showFullRamadanFeatures = ramadanMode && isActualRamadanMonth;

  return (
    <div className="space-y-6">
      {/* Mode Intelligence Banner (Ramadan / Travel) */}
      <ModeBanner onOpenSettings={() => {}} prayerTimes={prayerTimesResponse ?? null} />

      {/* Ramadan Announcement Card (shown only when toggle ON but NOT actual Ramadan month) */}
      {/* When OFF → normal dashboard (no countdown card, no announcement) */}
      {/* When ON + not Ramadan → amber announcement card with next Ramadan date */}
      {/* When ON + actual Ramadan → hidden (full Iftar/Fasting/Taraweeh shows instead) */}
      {ramadanMode && !isActualRamadanMonth && (
        <RamadanCountdown 
          isRamadanActive={false}
          ramadanDay={null}
          onOpenSettings={() => {}}
        />
      )}

      {/* Full Ramadan Mode: Iftar Countdown + Fasting + Taraweeh */}
      {/* Only shows during ACTUAL Ramadan month, not when toggled on outside season */}
      {showFullRamadanFeatures && (
        <div className="space-y-4">
          <IftarCountdown variant="full" />
          <div className="grid gap-4 sm:grid-cols-2">
            <FastingTracker />
            <TaraweehTracker />
          </div>
        </div>
      )}

      {/* Current/Next Prayer Card */}
      {prayerData && prayerTimesResponse ? (
        <CurrentPrayerCard
          prayerTimes={prayerData}
          prayerTimesResponse={prayerTimesResponse}
          locationLabel={locationLabel}
          language={language}
          prayerTimePreferences={prayerTimePreferences}
        />
      ) : (
        <div className="rounded-2xl p-5 text-sm font-semibold nz-card nz-text">
          {t.syncing}
        </div>
      )}

      <section className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl p-4 nz-card">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="inline-flex items-center gap-2 text-sm font-semibold nz-accent">
                <BellRing size={16} /> {t.azan}
              </p>
              <h3 className="mt-2 text-lg font-bold nz-text">
                {azan?.enabled ? t.azanOn : t.azanOff}
              </h3>
              <p className="mt-1 text-sm nz-muted">
                {azan?.nextAzan ? `${t.nextAt} ${azan.nextAzan.label} • ${azan.nextAzan.displayTime}` : t.scheduleLoading}
              </p>
              <p className="mt-1 text-xs nz-muted">
                {locationStatus === 'denied' ? t.locationDenied : locationLabel}
              </p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${azan?.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
              {azan?.enabled ? 'ON' : 'OFF'}
            </span>
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-xl px-3 py-2 nz-soft nz-text">
            <Clock3 size={16} />
            <span className="text-sm font-semibold">{t.nextIn}</span>
            <span className="ml-auto font-mono text-lg font-bold">{azan?.remaining ?? '--:--:--'}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenQuran}
          className="rounded-2xl p-4 text-left shadow-sm transition hover:shadow-md nz-card"
        >
          <p className="inline-flex items-center gap-2 text-sm font-semibold nz-gold">
            <BookOpen size={16} /> {t.quranTitle}
          </p>
          <h3 className="mt-2 text-lg font-bold nz-text">{t.quranHeadline}</h3>
          <p className="mt-1 text-sm leading-6 nz-muted">
            {t.quranBody}
          </p>
        </button>
      </section>

      {prayerTimesResponse && <AzanJamatConfigPanel prayerTimesResponse={prayerTimesResponse} />}

      {/* 5 Prayer Time Cards */}
      {prayerData && (
        <PrayerTimeCard
          prayerTimes={prayerData}
          prayerTimesResponse={prayerTimesResponse}
          onMarkPrayer={handleMarkPrayer}
          language={language}
        />
      )}

      {/* Streak Widget */}
      <DailyStreakWidget 
        currentStreak={streak.current}
        bestStreak={streak.best}
        todayProgress={totalPrayedToday}
        totalPrayers={5}
        language={language}
      />

      {/* Swipe hint (only on primary tab dashboard) */}
      <div className="flex justify-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2, duration: 0.8 }}
          className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-[10px] font-semibold text-slate-400 dark:bg-slate-800 dark:text-slate-500"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M7 2L4 6l3 4" />
          </svg>
          {language === 'bn' ? 'সোয়াইপ করে কিবলা ও তাসবিহ দেখুন' : 'Swipe for Qibla & Tasbih'}
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M5 10l3-4-3-4" />
          </svg>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <QuickActions language={language} />
    </div>
  );
}
