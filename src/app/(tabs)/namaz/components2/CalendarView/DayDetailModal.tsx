// app/(tabs)/namaz/components/CalendarView/DayDetailModal.tsx
'use client';

import { useState } from 'react';
import { X, Clock, Users, CheckCircle, Circle, AlertCircle } from 'lucide-react';
import { useLogsStore, TRACKED_PRAYERS } from '../../store2/logsStore';
import { formatLocalDateKey } from '../../lib2/dateHelpers';
import type { PrayerName, PrayerStatus } from '../../types2/prayer.types';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-all" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-t-2xl">
          <div>
            <h3 className="text-xl font-bold text-emerald-900">
              {date.toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' })}
            </h3>
            <p className="text-sm text-emerald-600">{date.toLocaleDateString('en-US', { weekday: 'long' })}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-emerald-100 transition">
            <X size={20} className="text-emerald-700" />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-2 p-4 bg-emerald-50/40">
          <div className="text-center"><p className="text-xs text-emerald-500">সম্পন্ন</p><p className="font-bold text-emerald-800">{completedCount}/৫</p></div>
          <div className="text-center"><p className="text-xs text-emerald-500">সময়মত</p><p className="font-bold text-emerald-600">{statusCounts.onTime}</p></div>
          <div className="text-center"><p className="text-xs text-emerald-500">দেরি</p><p className="font-bold text-amber-600">{statusCounts.late}</p></div>
          <div className="text-center"><p className="text-xs text-emerald-500">জামাত</p><p className="font-bold text-blue-600">{statusCounts.jamaat}</p></div>
        </div>

        <div className="p-4 max-h-96 overflow-y-auto">
          <div className="space-y-3">
            {TRACKED_PRAYERS.map((prayer) => {
              const currentStatus = getStatus(prayer);
              return (
                <div key={prayer} className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <span className="font-medium text-gray-800">{prayerNames[prayer]}</span>
                  {isEditing ? (
                    <select
                      value={currentStatus}
                      onChange={(e) => updatePrayer(dateKey, prayer, e.target.value as PrayerStatus)}
                      className="px-2 py-1 rounded-lg border border-emerald-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300"
                    >
                      {statusOptions.map((value) => (
                        <option key={value} value={value}>{statusLabels[value]}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex items-center gap-2">
                      {statusIcons[currentStatus]}
                      <span className="text-sm text-gray-600">{statusLabels[currentStatus]}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-4 border-t border-emerald-100 flex gap-3">
          <button
            onClick={() => setIsEditing((value) => !value)}
            className="w-full py-2 bg-emerald-100 text-emerald-700 rounded-xl font-medium hover:bg-emerald-200 transition"
          >
            {isEditing ? 'দেখুন' : 'সম্পাদনা করুন'}
          </button>
        </div>
      </div>
    </div>
  );
}
