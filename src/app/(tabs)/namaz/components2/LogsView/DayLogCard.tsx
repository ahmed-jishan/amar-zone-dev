// DayLogCard.tsx
'use client';


import { useState } from 'react';
import PrayerStatusBadge from './PrayerStatusBadge';
import { formatLocalDateKey } from '../../lib2/dateHelpers';
import type { PrayerName, PrayerStatus } from '@/app/(tabs)/namaz/types2/prayer.types';

interface Props {
  date: Date;
  getPrayerStatus: (date: string, prayer: PrayerName) => PrayerStatus;
  onPrayerUpdate: (prayer: PrayerName, status: PrayerStatus) => void;
}

const prayerOrder: PrayerName[] = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
const prayerNamesBn: Record<string, string> = {
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

export default function DayLogCard({ date, getPrayerStatus, onPrayerUpdate }: Props) {
  const dateKey = formatLocalDateKey(date);
  const [openDropdown, setOpenDropdown] = useState<PrayerName | null>(null);

  const handleStatusChange = (prayer: PrayerName, newStatus: PrayerStatus) => {
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
                {getPrayerStatus(dateKey, prayer) !== 'pending' ? 'মার্ক করা হয়েছে' : 'মার্ক করা হয়নি'}
              </p>
            </div>
            <PrayerStatusBadge
              status={getPrayerStatus(dateKey, prayer)}
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
