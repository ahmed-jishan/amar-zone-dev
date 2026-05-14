// app/(tabs)/namaz/components/DashboardView/index.tsx
'use client';

import { useMemo } from 'react';
import CurrentPrayerCard from './CurrentPrayerCard';
import PrayerTimeCard from './PrayerTimeCardList';
import DailyStreakWidget from './StreakWidget';
import QuickActions from './QuickActions';
import { useLogsStore, TRACKED_PRAYERS } from '../../store2/logsStore';
import { calculateStreak } from '../../lib2/streakCalculator';
import { formatLocalDateKey } from '../../lib2/dateHelpers';

// Prayer status type
export type PrayerStatus = 'pending' | 'onTime' | 'late' | 'missed' | 'jamaat';

const basePrayerTimes = {
  Fajr: { adhan: "05:12", jamaat: "05:45" },
  Dhuhr: { adhan: "12:38", jamaat: "13:00" },
  Asr: { adhan: "16:15", jamaat: "16:45" },
  Maghrib: { adhan: "18:52", jamaat: "18:52" },
  Isha: { adhan: "20:15", jamaat: "20:30" }
};

export default function DashboardView() {
  const logs = useLogsStore((state) => state.logs);
  const updatePrayer = useLogsStore((state) => state.updatePrayer);
  const today = formatLocalDateKey(new Date());

  const prayerData = useMemo(() => ({
    Fajr: { ...basePrayerTimes.Fajr, status: logs[today]?.Fajr?.status || 'pending' as PrayerStatus },
    Dhuhr: { ...basePrayerTimes.Dhuhr, status: logs[today]?.Dhuhr?.status || 'pending' as PrayerStatus },
    Asr: { ...basePrayerTimes.Asr, status: logs[today]?.Asr?.status || 'pending' as PrayerStatus },
    Maghrib: { ...basePrayerTimes.Maghrib, status: logs[today]?.Maghrib?.status || 'pending' as PrayerStatus },
    Isha: { ...basePrayerTimes.Isha, status: logs[today]?.Isha?.status || 'pending' as PrayerStatus },
  }), [logs, today]);

  const streak = useMemo(() => calculateStreak(logs), [logs]);
  const totalPrayedToday = TRACKED_PRAYERS.filter((prayer) => {
    const status = logs[today]?.[prayer]?.status;
    return status === 'onTime' || status === 'late' || status === 'jamaat';
  }).length;

  const handleMarkPrayer = (prayerName: string, status: PrayerStatus) => {
    updatePrayer(today, prayerName as keyof typeof basePrayerTimes, status);
  };

  return (
    <div className="space-y-6">
      {/* Current/Next Prayer Card */}
      <CurrentPrayerCard 
        prayerTimes={prayerData}
        prayerStatuses={Object.fromEntries(
          Object.entries(prayerData).map(([name, data]) => [name, data.status])
        )}
      />

      {/* 5 Prayer Time Cards */}
      <PrayerTimeCard 
        prayerTimes={prayerData}
        onMarkPrayer={handleMarkPrayer}
      />

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
