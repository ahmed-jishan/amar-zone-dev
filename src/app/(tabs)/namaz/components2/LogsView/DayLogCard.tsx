// app/(tabs)/namaz/components/LogsView/DayLogCard.tsx
'use client';

import { useState, useEffect } from 'react';
import PrayerStatusBadge from './PrayerStatusBadge';

type PrayerStatus = 'pending' | 'onTime' | 'late' | 'missed' | 'jamaat';

interface PrayerEntry {
  status: PrayerStatus;
  markedAt?: number;
}

interface PrayerLog {
  Fajr: PrayerEntry;
  Dhuhr: PrayerEntry;
  Asr: PrayerEntry;
  Maghrib: PrayerEntry;
  Isha: PrayerEntry;
}

interface Props {
  date: Date;
  initialLog?: PrayerLog;
  onUpdate: (log: PrayerLog) => void;
}

type PrayerName = keyof PrayerLog;

const prayerOrder: PrayerName[] = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
const prayerNamesBn: Record<string, string> = {
  Fajr: 'ফজর', Dhuhr: 'যোহর', Asr: 'আসর', Maghrib: 'মাগরিব', Isha: 'এশা'
};

export default function DayLogCard({ date, initialLog, onUpdate }: Props) {
  const [log, setLog] = useState<PrayerLog>(() => {
    if (initialLog) return initialLog;
    // Default empty log
    return {
      Fajr: { status: 'pending' },
      Dhuhr: { status: 'pending' },
      Asr: { status: 'pending' },
      Maghrib: { status: 'pending' },
      Isha: { status: 'pending' }
    };
  });

  useEffect(() => {
    if (initialLog) setLog(initialLog);
    else setLog({
      Fajr: { status: 'pending' },
      Dhuhr: { status: 'pending' },
      Asr: { status: 'pending' },
      Maghrib: { status: 'pending' },
      Isha: { status: 'pending' }
    });
  }, [initialLog, date]);

  const handleStatusChange = (prayer: PrayerName, newStatus: PrayerStatus) => {
    const updated = {
      ...log,
      [prayer]: { status: newStatus, markedAt: Date.now() }
    };
    setLog(updated);
    onUpdate(updated);
  };

  const isToday = date.toDateString() === new Date().toDateString();

  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-emerald-100 overflow-hidden">
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-5 py-3 border-b border-emerald-100">
        <h3 className="font-semibold text-emerald-900 flex items-center gap-2">
          <span>{isToday ? '🌟 আজকের' : ''} দিনের নামাজের বিস্তারিত</span>
        </h3>
      </div>
      <div className="divide-y divide-emerald-50">
        {prayerOrder.map((prayer) => (
          <div key={prayer} className="flex justify-between items-center p-4 hover:bg-emerald-50/30 transition">
            <div>
              <p className="font-medium text-emerald-900">{prayerNamesBn[prayer]}</p>
              <p className="text-xs text-emerald-500">
                {log[prayer].markedAt ? new Date(log[prayer].markedAt).toLocaleTimeString() : 'মার্ক করা হয়নি'}
              </p>
            </div>
            <PrayerStatusBadge
              status={log[prayer].status}
              onStatusChange={(newStatus) => handleStatusChange(prayer, newStatus)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}