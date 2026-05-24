// DayLogCard.tsx
'use client';


import { useState } from 'react';
import PrayerStatusBadge from './PrayerStatusBadge';
import { formatLocalDateKey } from '../../utils/dateHelpers';
import type { PrayerName, PrayerStatus } from '@/features/namaz/types/prayer.types';

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
    <div className="rounded-2xl nz-card">
      <div className="px-5 py-3 border-b nz-divider nz-soft">
        <h3 className="font-semibold nz-text flex items-center gap-2">
          <span>{isToday ? '🌟 আজকের' : ''} দিনের নামাজের বিস্তারিত</span>
        </h3>
      </div>
      <div className="divide-y nz-divider">
        {prayerOrder.map((prayer) => (
          <div key={prayer} className="flex justify-between items-center p-4 hover:bg-emerald-100/10 transition">
            <div>
              <p className="font-medium nz-text">{prayerNamesBn[prayer]}</p>
              <p className="text-xs nz-muted">
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
