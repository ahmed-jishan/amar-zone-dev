// app/(tabs)/namaz/components/CalendarView/MonthCalendar.tsx
'use client';

import { useMemo } from 'react';
import { formatLocalDateKey } from '../../utils/dateHelpers';
import type { DailyPrayerLog, PrayerName, PrayerStatus } from '../../types/prayer.types';

interface MonthCalendarProps {
  currentDate: Date;
  logs: Record<string, DailyPrayerLog>;
  onDayClick: (date: Date) => void;
}

type DayStatus = 'full' | 'partial' | 'mostlyMissed' | 'none';

const prayerOrder: PrayerName[] = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
const doneStatuses: PrayerStatus[] = ['onTime', 'late', 'jamaat'];

const getDayStatus = (date: Date, logs: Record<string, DailyPrayerLog>): DayStatus => {
  const dateKey = formatLocalDateKey(date);
  const dayLog = logs[dateKey];
  if (!dayLog) return 'none';

  const completedCount = prayerOrder.filter((prayer) => doneStatuses.includes(dayLog[prayer]?.status || 'pending')).length;
  const missedCount = prayerOrder.filter((prayer) => dayLog[prayer]?.status === 'missed').length;

  if (completedCount === prayerOrder.length) return 'full';
  if (missedCount >= 3) return 'mostlyMissed';
  if (completedCount > 0) return 'partial';
  return 'none';
};

const statusConfig = {
  full: { dot: 'bg-emerald-500', ring: 'ring-emerald-200', text: 'text-emerald-700' },
  partial: { dot: 'bg-amber-400', ring: 'ring-amber-200', text: 'text-amber-700' },
  mostlyMissed: { dot: 'bg-rose-500', ring: 'ring-rose-200', text: 'text-rose-700' },
  none: { dot: 'bg-slate-300', ring: 'ring-slate-200', text: 'text-slate-500' }
};

export default function MonthCalendar({ currentDate, logs, onDayClick }: MonthCalendarProps) {
  const calendarDays = useMemo<Array<{ date: Date | null; status: DayStatus }>>(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const startDayOfWeek = firstDayOfMonth.getDay();
    const daysArray: Array<{ date: Date | null; status: DayStatus }> = [];
    
    // Previous month padding (startDayOfWeek)
    for (let i = 0; i < startDayOfWeek; i++) {
      daysArray.push({ date: null, status: 'none' });
    }
    
    // Current month days
    for (let d = 1; d <= lastDayOfMonth.getDate(); d++) {
      const dateObj = new Date(year, month, d);
      const status = getDayStatus(dateObj, logs);
      daysArray.push({ date: dateObj, status });
    }
    
    // Next month padding to make 6 rows (42 cells)
    const totalCells = 42;
    const remaining = totalCells - daysArray.length;
    for (let i = 0; i < remaining; i++) {
      daysArray.push({ date: null, status: 'none' });
    }
    
    return daysArray;
  }, [currentDate, logs]);

  const weekdays = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহ', 'শুক্র', 'শনি'];

  return (
    <div className="rounded-2xl p-4 shadow-sm overflow-x-auto nz-card">
      <div className="min-w-[280px]">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 mb-2 text-center">
          {weekdays.map((day, idx) => (
            <div key={idx} className="text-xs font-medium nz-muted py-2">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, idx) => {
            if (!day.date) {
              return (
                <div key={idx} className="aspect-square p-1 opacity-0" />
              );
            }
            const isToday = day.date.toDateString() === new Date().toDateString();
            const config = statusConfig[day.status];
            return (
              <button
                key={idx}
                onClick={() => onDayClick(day.date!)}
                className={`
                  aspect-square p-1 rounded-xl transition-all duration-200
                  hover:bg-emerald-100/10 focus:outline-none focus:ring-2 focus:ring-emerald-300
                  flex flex-col items-center justify-center
                  ${isToday ? 'ring-2 ring-emerald-400 ring-offset-1' : ''}
                `}
              >
                <span className={`text-sm font-medium ${isToday ? 'nz-text font-bold' : 'nz-muted'}`}>
                  {day.date.getDate()}
                </span>
                <div className={`w-2 h-2 rounded-full mt-1 ${config.dot}`} />
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex justify-center gap-4 mt-4 pt-2 border-t nz-divider text-xs">
        <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div><span className="nz-muted">সম্পূর্ণ</span></div>
        <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div><span className="nz-muted">আংশিক</span></div>
        <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div><span className="nz-muted">বেশিরভাগ কাজা</span></div>
        <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div><span className="nz-muted">ডেটা নেই</span></div>
      </div>
    </div>
  );
}
