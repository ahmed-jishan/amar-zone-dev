// app/(tabs)/namaz/components/CalendarView/index.tsx
'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import MonthCalendar from './MonthCalendar';
import DayDetailModal from './DayDetailModal';

interface PrayerLogEntry {
  status: 'pending' | 'onTime' | 'late' | 'missed' | 'jamaat';
  markedAt?: number;
}

interface DailyLog {
  Fajr?: PrayerLogEntry;
  Dhuhr?: PrayerLogEntry;
  Asr?: PrayerLogEntry;
  Maghrib?: PrayerLogEntry;
  Isha?: PrayerLogEntry;
}

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [logs, setLogs] = useState<Record<string, DailyLog>>({});
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Load logs from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('namazLogs');
    if (stored) {
      setLogs(JSON.parse(stored));
    }
  }, []);

  // Function to update logs (passed to modal for editing)
  const updateLogForDate = (date: Date, updatedPrayers: DailyLog) => {
    const dateKey = date.toISOString().split('T')[0];
    const newLogs = { ...logs, [dateKey]: updatedPrayers };
    setLogs(newLogs);
    localStorage.setItem('namazLogs', JSON.stringify(newLogs));
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedDate(null);
  };

  const monthYear = currentDate.toLocaleString('bn-BD', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 rounded-xl">
            <Calendar className="text-emerald-700" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-emerald-900">নামাজ ক্যালেন্ডার</h2>
            <p className="text-emerald-600 text-sm">মাসিক অগ্রগতি দেখুন ও দিন নির্বাচন করুন</p>
          </div>
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className="flex items-center justify-between bg-white/50 backdrop-blur-sm rounded-xl p-3 border border-emerald-100">
        <button
          onClick={handlePrevMonth}
          className="flex items-center gap-1 px-3 py-2 rounded-lg text-emerald-700 hover:bg-emerald-100 transition"
        >
          <ChevronLeft size={18} />
          <span className="hidden sm:inline">পূর্ববর্তী</span>
        </button>
        <div className="text-center">
          <p className="text-sm text-emerald-500">{currentDate.toLocaleString('default', { year: 'numeric' })}</p>
          <p className="font-semibold text-emerald-900 text-lg">{currentDate.toLocaleString('bn-BD', { month: 'long' })}</p>
        </div>
        <button
          onClick={handleNextMonth}
          className="flex items-center gap-1 px-3 py-2 rounded-lg text-emerald-700 hover:bg-emerald-100 transition"
        >
          <span className="hidden sm:inline">পরবর্তী</span>
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Month Calendar */}
      <MonthCalendar
        currentDate={currentDate}
        logs={logs}
        onDayClick={handleDayClick}
      />

      {/* Day Detail Modal */}
      {isModalOpen && selectedDate && (
        <DayDetailModal
          date={selectedDate}
          logs={logs}
          onClose={closeModal}
          onUpdate={updateLogForDate}
        />
      )}
    </div>
  );
}