// app/(tabs)/namaz/components/CalendarView/DayDetailModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { X, Clock, Users, CheckCircle, Circle, AlertCircle } from 'lucide-react';

type PrayerStatus = 'pending' | 'onTime' | 'late' | 'missed' | 'jamaat';

const prayerOrder = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const;
type PrayerName = (typeof prayerOrder)[number];

interface DailyLog {
  Fajr?: { status: PrayerStatus; markedAt?: number };
  Dhuhr?: { status: PrayerStatus; markedAt?: number };
  Asr?: { status: PrayerStatus; markedAt?: number };
  Maghrib?: { status: PrayerStatus; markedAt?: number };
  Isha?: { status: PrayerStatus; markedAt?: number };
}

interface DayDetailModalProps {
  date: Date;
  logs: Record<string, DailyLog>;
  onClose: () => void;
  onUpdate: (date: Date, updatedLog: DailyLog) => void;
}

const prayerNames: Record<string, string> = {
  Fajr: 'ফজর', Dhuhr: 'যোহর', Asr: 'আসর', Maghrib: 'মাগরিব', Isha: 'এশা'
};

const statusIcons: Record<PrayerStatus, React.ReactNode> = {
  pending: <Circle size={18} className="text-gray-400" />,
  onTime: <CheckCircle size={18} className="text-emerald-600" />,
  late: <Clock size={18} className="text-amber-600" />,
  missed: <AlertCircle size={18} className="text-red-500" />,
  jamaat: <Users size={18} className="text-blue-600" />
};

const statusLabels: Record<PrayerStatus, string> = {
  pending: 'পেন্ডিং', onTime: 'সময়মত', late: 'দেরি', missed: 'মিস/কাজা', jamaat: 'জামাত'
};

export default function DayDetailModal({ date, logs, onClose, onUpdate }: DayDetailModalProps) {
  const dateKey = date.toISOString().split('T')[0];
  const initialLog = logs[dateKey] || {};
  const [localLog, setLocalLog] = useState<DailyLog>(initialLog);
  const [isEditing, setIsEditing] = useState(false);
  const [tempStatus, setTempStatus] = useState<Record<PrayerName, PrayerStatus>>({} as Record<PrayerName, PrayerStatus>);

  // Initialize temp status for editing
  useEffect(() => {
    const init = {} as Record<PrayerName, PrayerStatus>;
    for (const prayer of prayerOrder) {
      init[prayer] = localLog[prayer]?.status || 'pending';
    }
    setTempStatus(init);
  }, [localLog]);

  const handleStatusChange = (prayer: PrayerName, newStatus: PrayerStatus) => {
    setTempStatus(prev => ({ ...prev, [prayer]: newStatus }));
  };

  const handleSave = () => {
    const updatedLog: DailyLog = {};
    for (const prayer of prayerOrder) {
      const status = tempStatus[prayer];
      if (status !== 'pending') {
        updatedLog[prayer] = { status, markedAt: Date.now() };
      } else {
        updatedLog[prayer] = { status: 'pending' };
      }
    }
    onUpdate(date, updatedLog);
    setLocalLog(updatedLog);
    setIsEditing(false);
  };

  const completedCount = prayerOrder.filter(p => {
    const status = localLog[p]?.status;
    return status && status !== 'pending';
  }).length;

  const statusCounts = {
    onTime: prayerOrder.filter(p => localLog[p]?.status === 'onTime').length,
    late: prayerOrder.filter(p => localLog[p]?.status === 'late').length,
    missed: prayerOrder.filter(p => localLog[p]?.status === 'missed').length,
    jamaat: prayerOrder.filter(p => localLog[p]?.status === 'jamaat').length,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-all" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
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

        {/* Summary stats */}
        <div className="grid grid-cols-4 gap-2 p-4 bg-emerald-50/40">
          <div className="text-center"><p className="text-xs text-emerald-500">সম্পন্ন</p><p className="font-bold text-emerald-800">{completedCount}/৫</p></div>
          <div className="text-center"><p className="text-xs text-emerald-500">সময়মত</p><p className="font-bold text-emerald-600">{statusCounts.onTime}</p></div>
          <div className="text-center"><p className="text-xs text-emerald-500">দেরি</p><p className="font-bold text-amber-600">{statusCounts.late}</p></div>
          <div className="text-center"><p className="text-xs text-emerald-500">জামাত</p><p className="font-bold text-blue-600">{statusCounts.jamaat}</p></div>
        </div>

        {/* Prayer list */}
        <div className="p-4 max-h-96 overflow-y-auto">
          <div className="space-y-3">
            {prayerOrder.map(prayer => {
              const currentStatus = isEditing ? tempStatus[prayer] : (localLog[prayer]?.status || 'pending');
              return (
                <div key={prayer} className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <span className="font-medium text-gray-800">{prayerNames[prayer]}</span>
                  {isEditing ? (
                    <select
                      value={currentStatus}
                      onChange={(e) => handleStatusChange(prayer, e.target.value as PrayerStatus)}
                      className="px-2 py-1 rounded-lg border border-emerald-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300"
                    >
                      {Object.entries(statusLabels).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex items-center gap-2">
                      {statusIcons[currentStatus as PrayerStatus]}
                      <span className="text-sm text-gray-600">{statusLabels[currentStatus as PrayerStatus]}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-emerald-100 flex gap-3">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                className="flex-1 py-2 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition"
              >
                সংরক্ষণ করুন
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition"
              >
                বাতিল করুন
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="w-full py-2 bg-emerald-100 text-emerald-700 rounded-xl font-medium hover:bg-emerald-200 transition"
            >
              সম্পাদনা করুন
            </button>
          )}
        </div>
      </div>
    </div>
  );
}