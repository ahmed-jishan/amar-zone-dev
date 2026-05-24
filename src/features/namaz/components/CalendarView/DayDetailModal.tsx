// app/(tabs)/namaz/components/CalendarView/DayDetailModal.tsx
'use client';

import { useState } from 'react';
import { X, Clock, Users, CheckCircle, Circle, AlertCircle } from 'lucide-react';
import { useLogsStore, TRACKED_PRAYERS } from '../../store/logsStore';
import { formatLocalDateKey } from '../../utils/dateHelpers';
import type { PrayerName, PrayerStatus } from '../../types/prayer.types';

interface DayDetailModalProps {
  date: Date;
  onClose: () => void;
}

const prayerNames: Record<PrayerName, string> = {
  Fajr: 'ফজর',
  Dhuhr: 'যোহর',
  Asr: 'আসর',
  Maghrib: 'মাগরিব',
  Isha: 'এশা',
  fajr: 'ফজর',
  dhuhr: 'যোহর',
  asr: 'আসর',
  maghrib: 'মাগরিব',
  isha: 'এশা',
};

const statusIcons: Record<PrayerStatus, React.ReactNode> = {
  pending: <Circle size={18} className="text-gray-400" />,
  onTime: <CheckCircle size={18} className="text-emerald-600" />,
  late: <Clock size={18} className="text-amber-600" />,
  missed: <AlertCircle size={18} className="text-red-500" />,
  jamaat: <Users size={18} className="text-blue-600" />,
};

const statusLabels: Record<PrayerStatus, string> = {
  pending: 'পেন্ডিং',
  onTime: 'সময়মত',
  late: 'দেরি',
  missed: 'মিস/কাজা',
  jamaat: 'জামাত',
};

const statusOptions = Object.keys(statusLabels) as PrayerStatus[];

export default function DayDetailModal({ date, onClose }: DayDetailModalProps) {
  const dateKey = formatLocalDateKey(date);
  const dailyLog = useLogsStore((state) => state.logs[dateKey] || {});
  const updatePrayer = useLogsStore((state) => state.updatePrayer);
  const [isEditing, setIsEditing] = useState(false);

  const getStatus = (prayer: PrayerName): PrayerStatus => dailyLog[prayer]?.status || 'pending';

  const completedCount = TRACKED_PRAYERS.filter((prayer) => {
    const status = getStatus(prayer);
    return status === 'onTime' || status === 'late' || status === 'jamaat';
  }).length;

  const statusCounts = {
    onTime: TRACKED_PRAYERS.filter((p) => getStatus(p) === 'onTime').length,
    late: TRACKED_PRAYERS.filter((p) => getStatus(p) === 'late').length,
    missed: TRACKED_PRAYERS.filter((p) => getStatus(p) === 'missed').length,
    jamaat: TRACKED_PRAYERS.filter((p) => getStatus(p) === 'jamaat').length,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all" onClick={onClose}>
      <div
        className="rounded-2xl w-full max-w-md shadow-2xl transform transition-all nz-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b nz-divider rounded-t-2xl nz-soft">
          <div>
            <h3 className="text-xl font-bold nz-text">
              {date.toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' })}
            </h3>
            <p className="text-sm nz-muted">{date.toLocaleDateString('en-US', { weekday: 'long' })}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-emerald-100/10 transition">
            <X size={20} className="nz-text" />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-2 p-4 nz-soft">
          <div className="text-center"><p className="text-xs nz-muted">সম্পন্ন</p><p className="font-bold nz-text">{completedCount}/৫</p></div>
          <div className="text-center"><p className="text-xs nz-muted">সময়মত</p><p className="font-bold nz-accent">{statusCounts.onTime}</p></div>
          <div className="text-center"><p className="text-xs nz-muted">দেরি</p><p className="font-bold text-amber-500">{statusCounts.late}</p></div>
          <div className="text-center"><p className="text-xs nz-muted">জামাত</p><p className="font-bold text-blue-500">{statusCounts.jamaat}</p></div>
        </div>

        <div className="p-4 max-h-96 overflow-y-auto">
          <div className="space-y-3">
            {TRACKED_PRAYERS.map((prayer) => {
              const currentStatus = getStatus(prayer);
              return (
                <div key={prayer} className="flex justify-between items-center border-b nz-divider pb-2">
                  <span className="font-medium nz-text">{prayerNames[prayer]}</span>
                  {isEditing ? (
                    <select
                      value={currentStatus}
                      onChange={(e) => updatePrayer(dateKey, prayer, e.target.value as PrayerStatus)}
                      className="px-2 py-1 rounded-lg border text-sm nz-soft nz-text focus:outline-none focus:ring-2 focus:ring-emerald-300"
                    >
                      {statusOptions.map((value) => (
                        <option key={value} value={value}>{statusLabels[value]}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex items-center gap-2">
                      {statusIcons[currentStatus]}
                      <span className="text-sm nz-muted">{statusLabels[currentStatus]}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-4 border-t nz-divider flex gap-3">
          <button
            onClick={() => setIsEditing((value) => !value)}
            className="w-full py-2 rounded-xl font-medium transition nz-chip"
          >
            {isEditing ? 'দেখুন' : 'সম্পাদনা করুন'}
          </button>
        </div>
      </div>
    </div>
  );
}
