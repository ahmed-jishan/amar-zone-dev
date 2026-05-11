// app/(tabs)/namaz/components/LogsView/DatePicker.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';

interface Props {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export default function DatePicker({ selectedDate, onDateChange }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempDate, setTempDate] = useState(selectedDate);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDateSelect = (date: Date) => {
    onDateChange(date);
    setIsOpen(false);
  };

  const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const renderCalendar = () => {
    const year = tempDate.getFullYear();
    const month = tempDate.getMonth();
    const daysCount = daysInMonth(tempDate);
    const startDay = firstDayOfMonth(tempDate);
    const today = new Date();
    
    const days = [];
    for (let i = 0; i < startDay; i++) days.push(<div key={`empty-${i}`} className="h-8 w-8" />);
    
    for (let d = 1; d <= daysCount; d++) {
      const dateObj = new Date(year, month, d);
      const isSelected = dateObj.toDateString() === selectedDate.toDateString();
      const isToday = dateObj.toDateString() === today.toDateString();
      days.push(
        <button
          key={d}
          onClick={() => handleDateSelect(dateObj)}
          className={`h-8 w-8 rounded-full text-sm transition ${
            isSelected ? 'bg-emerald-600 text-white' : 
            isToday ? 'bg-emerald-100 text-emerald-800 font-semibold' : 
            'hover:bg-emerald-50 text-gray-700'
          }`}
        >
          {d}
        </button>
      );
    }
    return days;
  };

  const changeMonth = (delta: number) => {
    const newDate = new Date(tempDate);
    newDate.setMonth(tempDate.getMonth() + delta);
    setTempDate(newDate);
  };

  return (
    <div className="relative" ref={pickerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white/70 rounded-xl border border-emerald-200 text-emerald-700 hover:bg-white transition"
      >
        <CalendarIcon size={18} />
        <span>{selectedDate.toLocaleDateString('bn-BD')}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 z-50 p-4">
          <div className="flex justify-between items-center mb-4">
            <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-gray-100 rounded">‹</button>
            <span className="font-medium">
              {tempDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </span>
            <button onClick={() => changeMonth(1)} className="p-1 hover:bg-gray-100 rounded">›</button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 mb-2">
            {['স', 'ম', 'ঙ', 'ব', 'বৃ', 'শু', 'শ'].map(day => <div key={day}>{day}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {renderCalendar()}
          </div>
        </div>
      )}
    </div>
  );
}