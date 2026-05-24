// app/(tabs)/namaz/components/CalendarView/index.tsx
'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import MonthCalendar from './MonthCalendar';
import DayDetailModal from './DayDetailModal';
import { useLogsStore } from '../../store/logsStore';

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const logs = useLogsStore((state) => state.logs);

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
          <div className="p-2 rounded-xl nz-accent-bg">
            <Calendar className="nz-accent" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold nz-text">নামাজ ক্যালেন্ডার</h2>
            <p className="nz-muted text-sm">মাসিক অগ্রগতি দেখুন ও দিন নির্বাচন করুন</p>
          </div>
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className="flex items-center justify-between rounded-xl p-3 nz-surface">
        <button
          onClick={handlePrevMonth}
          className="flex items-center gap-1 px-3 py-2 rounded-lg nz-text hover:bg-emerald-100/20 transition"
        >
          <ChevronLeft size={18} />
          <span className="hidden sm:inline">পূর্ববর্তী</span>
        </button>
        <div className="text-center">
          <p className="text-sm nz-muted">{currentDate.toLocaleString('default', { year: 'numeric' })}</p>
          <p className="font-semibold nz-text text-lg">{currentDate.toLocaleString('bn-BD', { month: 'long' })}</p>
        </div>
        <button
          onClick={handleNextMonth}
          className="flex items-center gap-1 px-3 py-2 rounded-lg nz-text hover:bg-emerald-100/20 transition"
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
          onClose={closeModal}
        />
      )}
    </div>
  );
}
