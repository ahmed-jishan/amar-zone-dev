// app/(tabs)/namaz/components/LogsView/index.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import DayLogCard from './DayLogCard';
import DatePicker from './DatePicker';
import { useLogs } from '@/features/namaz/hooks/useLogs';
import { formatLocalDateKey } from '@/features/namaz/utils/dateHelpers';
import type { PrayerName, PrayerStatus } from '@/features/namaz/types/prayer.types';

export default function LogsView() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { logs, updatePrayer, getPrayerStatus } = useLogs();
  
  const dateKey = formatLocalDateKey(selectedDate);
  const todayLog = logs[dateKey];

  // Summary calculation
  const summary = {
    total: 5,
    completed: 0,
    onTime: 0,
    late: 0,
    missed: 0,
  };

  if (todayLog) {
    const prayers = Object.values(todayLog);
    summary.completed = prayers.filter(p => p && p.status !== 'pending').length;
    summary.onTime = prayers.filter(p => p?.status === 'onTime').length;
    summary.late = prayers.filter(p => p?.status === 'late').length;
    summary.missed = prayers.filter(p => p?.status === 'missed').length;
  }

  // Handle prayer status change from DayLogCard
  const handlePrayerUpdate = useCallback((prayer: PrayerName, status: PrayerStatus) => {
    updatePrayer(dateKey, prayer, status);
  }, [dateKey, updatePrayer]);

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + days);
    setSelectedDate(newDate);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 rounded-xl">
            <Calendar className="text-emerald-700" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-emerald-900">নামাজের লগ</h2>
            <p className="text-emerald-600 text-sm">প্রতিদিনের নামাজের অবস্থা দেখুন ও এডিট করুন</p>
          </div>
        </div>
        <DatePicker selectedDate={selectedDate} onDateChange={setSelectedDate} />
      </div>

      {/* Date Navigation Buttons */}
      <div className="flex items-center justify-between bg-white/50 backdrop-blur-sm rounded-xl p-3 border border-emerald-100">
        <button
          onClick={() => changeDate(-1)}
          className="flex items-center gap-1 px-3 py-2 rounded-lg text-emerald-700 hover:bg-emerald-100 transition"
        >
          <ChevronLeft size={18} />
          <span>গতকাল</span>
        </button>
        <div className="text-center">
          <p className="text-sm text-emerald-500">পঞ্জিকা তারিখ</p>
          <p className="font-semibold text-emerald-900">
            {selectedDate.toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button
          onClick={() => changeDate(1)}
          className="flex items-center gap-1 px-3 py-2 rounded-lg text-emerald-700 hover:bg-emerald-100 transition"
        >
          <span>আগামীকাল</span>
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white/60 rounded-xl p-3 text-center border border-emerald-100">
          <p className="text-xs text-emerald-500">সম্পন্ন</p>
          <p className="text-2xl font-bold text-emerald-800">{summary.completed}/{summary.total}</p>
        </div>
        <div className="bg-white/60 rounded-xl p-3 text-center border border-emerald-100">
          <p className="text-xs text-emerald-500">সময়মত</p>
          <p className="text-2xl font-bold text-green-600">{summary.onTime}</p>
        </div>
        <div className="bg-white/60 rounded-xl p-3 text-center border border-emerald-100">
          <p className="text-xs text-emerald-500">দেরি</p>
          <p className="text-2xl font-bold text-amber-600">{summary.late}</p>
        </div>
        <div className="bg-white/60 rounded-xl p-3 text-center border border-emerald-100">
          <p className="text-xs text-emerald-500">মিস/কাজা</p>
          <p className="text-2xl font-bold text-red-500">{summary.missed}</p>
        </div>
      </div>

      {/* Day Log Card - passes getPrayerStatus and update handler */}
      <DayLogCard
        date={selectedDate}
        getPrayerStatus={getPrayerStatus}
        onPrayerUpdate={handlePrayerUpdate}
      />
    </div>
  );
}
