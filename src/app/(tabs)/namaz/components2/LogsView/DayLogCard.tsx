// DayLogCard.tsx
'use client';


import { useState, useEffect } from 'react';
import PrayerStatusBadge from './PrayerStatusBadge';
import type { PrayerName, PrayerStatus } from '@/app/(tabs)/namaz/types2/prayer.types';

interface Props {
  date: Date;
  getPrayerStatus: (date: string, prayer: PrayerName) => PrayerStatus;
  onPrayerUpdate: (prayer: PrayerName, status: PrayerStatus) => void;
}

const prayerOrder: PrayerName[] = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
const prayerNamesBn: Record<PrayerName, string> = {
  Fajr: 'ফজর', Dhuhr: 'যোহর', Asr: 'আসর', Maghrib: 'মাগরিব', Isha: 'এশা'
};

export default function DayLogCard({ date, getPrayerStatus, onPrayerUpdate }: Props) {
  const dateKey = date.toISOString().split('T')[0];
  const [localStatuses, setLocalStatuses] = useState<Record<PrayerName, PrayerStatus>>({} as any);
  // State to track which dropdown is open
  const [openDropdown, setOpenDropdown] = useState<PrayerName | null>(null);

  useEffect(() => {
    const initial: any = {};
    prayerOrder.forEach(p => {
      initial[p] = getPrayerStatus(dateKey, p);
    });
    setLocalStatuses(initial);
  }, [dateKey, getPrayerStatus]);

  const handleStatusChange = (prayer: PrayerName, newStatus: PrayerStatus) => {
    setLocalStatuses(prev => ({ ...prev, [prayer]: newStatus }));
    onPrayerUpdate(prayer, newStatus);
  };

  const isToday = date.toDateString() === new Date().toDateString();

  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-emerald-100">
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
                {localStatuses[prayer] !== 'pending' ? 'মার্ক করা হয়েছে' : 'মার্ক করা হয়নি'}
              </p>
            </div>
            <PrayerStatusBadge
              status={localStatuses[prayer]}
              onStatusChange={(newStatus) => handleStatusChange(prayer, newStatus)}
              isOpen={openDropdown === prayer}
              onOpenChange={(open) => setOpenDropdown(open ? prayer : null)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}