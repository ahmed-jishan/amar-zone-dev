// app/(tabs)/namaz/components/LogsView/PrayerStatusBadge.tsx
'use client';

import { useState } from 'react';
import { CheckCircle, Circle, AlertCircle, Users, Clock } from 'lucide-react';

type PrayerStatus = 'pending' | 'onTime' | 'late' | 'missed' | 'jamaat';

interface Props {
  status: PrayerStatus;
  onStatusChange: (newStatus: PrayerStatus) => void;
}

const statusConfig = {
  pending: { label: 'পেন্ডিং', icon: <Circle size={18} />, color: 'text-gray-400', bg: 'hover:bg-gray-50' },
  onTime: { label: 'সময়মত', icon: <CheckCircle size={18} />, color: 'text-emerald-600', bg: 'hover:bg-emerald-50' },
  late: { label: 'দেরি', icon: <Clock size={18} />, color: 'text-amber-600', bg: 'hover:bg-amber-50' },
  missed: { label: 'কাজা', icon: <AlertCircle size={18} />, color: 'text-red-500', bg: 'hover:bg-red-50' },
  jamaat: { label: 'জামাত', icon: <Users size={18} />, color: 'text-blue-600', bg: 'hover:bg-blue-50' }
};

export default function PrayerStatusBadge({ status, onStatusChange }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const current = statusConfig[status];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium transition-all ${current.bg} ${current.color} border-current/20`}
      >
        {current.icon}
        <span>{current.label}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-xl border border-gray-100 z-40 overflow-hidden">
          {Object.entries(statusConfig).map(([key, config]) => (
            <button
              key={key}
              onClick={() => {
                onStatusChange(key as PrayerStatus);
                setIsOpen(false);
              }}
              className={`flex items-center gap-3 w-full px-4 py-2 text-left text-sm hover:bg-gray-50 ${config.color}`}
            >
              {config.icon}
              <span>{config.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}