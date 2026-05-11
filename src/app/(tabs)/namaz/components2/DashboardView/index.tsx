// app/(tabs)/namaz/components/DashboardView/index.tsx
'use client';

import { useState, useEffect } from 'react';
import CurrentPrayerCard from './CurrentPrayerCard';
import PrayerTimeCard from './PrayerTimeCardList';
import DailyStreakWidget from './StreakWidget';
import QuickActions from './QuickActions';

// Prayer status type
export type PrayerStatus = 'pending' | 'onTime' | 'late' | 'missed' | 'jamaat';

// Mock data - later replace with real API + store
const mockPrayerTimes = {
  Fajr: { adhan: "05:12", jamaat: "05:45", status: 'pending' as PrayerStatus },
  Dhuhr: { adhan: "12:38", jamaat: "13:00", status: 'pending' as PrayerStatus },
  Asr: { adhan: "16:15", jamaat: "16:45", status: 'pending' as PrayerStatus },
  Maghrib: { adhan: "18:52", jamaat: "18:52", status: 'pending' as PrayerStatus },
  Isha: { adhan: "20:15", jamaat: "20:30", status: 'pending' as PrayerStatus }
};

export default function DashboardView() {
  const [prayerData, setPrayerData] = useState(mockPrayerTimes);
  const [streak, setStreak] = useState({ current: 7, best: 24 });
  const [totalPrayedToday, setTotalPrayedToday] = useState(0);

  // Update total prayed count whenever status changes
  useEffect(() => {
    const prayedCount = Object.values(prayerData).filter(p => 
      p.status === 'onTime' || p.status === 'late' || p.status === 'jamaat'
    ).length;
    setTotalPrayedToday(prayedCount);
  }, [prayerData]);

  // Handle marking a prayer
  const handleMarkPrayer = (prayerName: string, status: PrayerStatus) => {
    setPrayerData(prev => ({
      ...prev,
      [prayerName]: { ...prev[prayerName as keyof typeof prev], status }
    }));
    // Here you would also save to localStorage/your store
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