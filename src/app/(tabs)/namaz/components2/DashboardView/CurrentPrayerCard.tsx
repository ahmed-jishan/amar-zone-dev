// app/(tabs)/namaz/components/DashboardView/CurrentPrayerCard.tsx
'use client';

import { useState, useEffect } from 'react';
import { Clock, MapPin, ChevronRight, Moon, Sun, Cloud } from 'lucide-react';

interface PrayerTimes {
  Fajr: { adhan: string; jamaat: string; status: string };
  Dhuhr: { adhan: string; jamaat: string; status: string };
  Asr: { adhan: string; jamaat: string; status: string };
  Maghrib: { adhan: string; jamaat: string; status: string };
  Isha: { adhan: string; jamaat: string; status: string };
}

interface Props {
  prayerTimes: PrayerTimes;
  prayerStatuses: Record<string, string>;
}

const prayerOrder = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

// Helper: Convert time string to minutes since midnight
const timeToMinutes = (timeStr: string): number => {
  const [hour, minute] = timeStr.split(':').map(Number);
  return hour * 60 + minute;
};

// Get dynamic greeting and icon based on current time
const getTimeBasedTheme = () => {
  const hour = new Date().getHours();
  if (hour >= 4 && hour < 11) return { greeting: 'সুবহে সাদিক', icon: <Sun size={24} />, gradient: 'from-amber-600 to-orange-700' };
  if (hour >= 11 && hour < 16) return { greeting: 'যোহরের সময়', icon: <Sun size={24} />, gradient: 'from-yellow-500 to-orange-600' };
  if (hour >= 16 && hour < 19) return { greeting: 'অপরাহ্ন', icon: <Cloud size={24} />, gradient: 'from-orange-400 to-red-500' };
  if (hour >= 19 && hour < 20) return { greeting: 'সন্ধ্যা', icon: <Cloud size={24} />, gradient: 'from-purple-600 to-pink-600' };
  return { greeting: 'রাতের ইবাদত', icon: <Moon size={24} />, gradient: 'from-indigo-800 to-purple-900' };
};

export default function CurrentPrayerCard({ prayerTimes, prayerStatuses }: Props) {
  const [nextPrayer, setNextPrayer] = useState<{ name: string; time: string; remaining: string } | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const theme = getTimeBasedTheme();

  // Update countdown every second
  useEffect(() => {
    const updateNextPrayer = () => {
      const now = new Date();
      setCurrentTime(now);
      const nowMinutes = now.getHours() * 60 + now.getMinutes();

      let found = null;
      for (const prayer of prayerOrder) {
        const prayerTime = prayerTimes[prayer as keyof PrayerTimes].adhan;
        const prayerMinutes = timeToMinutes(prayerTime);
        const isCompleted = prayerStatuses[prayer] === 'onTime' || prayerStatuses[prayer] === 'late' || prayerStatuses[prayer] === 'jamaat';
        
        if (prayerMinutes > nowMinutes && !isCompleted) {
          const diffMinutes = prayerMinutes - nowMinutes;
          const hours = Math.floor(diffMinutes / 60);
          const minutes = diffMinutes % 60;
          const remaining = hours > 0 ? `${hours} ঘ ${minutes} মি` : `${minutes} মিনিট`;
          found = { name: prayer, time: prayerTime, remaining };
          break;
        }
      }

      if (!found) {
        // Next is tomorrow's Fajr
        const fajrTime = prayerTimes.Fajr.adhan;
        const fajrMinutes = timeToMinutes(fajrTime);
        const tomorrowFajr = fajrMinutes + 24 * 60;
        const diffMinutes = tomorrowFajr - nowMinutes;
        const hours = Math.floor(diffMinutes / 60);
        const minutes = diffMinutes % 60;
        const remaining = hours > 0 ? `${hours} ঘ ${minutes} মি` : `${minutes} মিনিট`;
        found = { name: 'ফজর (কাল)', time: fajrTime, remaining };
      }

      setNextPrayer(found);
    };

    updateNextPrayer();
    const interval = setInterval(updateNextPrayer, 1000);
    return () => clearInterval(interval);
  }, [prayerTimes, prayerStatuses]);

  if (!nextPrayer) return null;

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${theme.gradient} text-white shadow-xl transition-all duration-500`}>
      {/* Islamic geometric pattern */}
      <div className="absolute top-0 right-0 w-40 h-40 opacity-10">
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M50 5L95 50L50 95L5 50L50 5z" stroke="currentColor" strokeWidth="1" />
          <circle cx="50" cy="50" r="20" stroke="currentColor" strokeWidth="1" />
          <path d="M50 15 L85 50 L50 85 L15 50 L50 15z" stroke="currentColor" strokeWidth="0.5" />
        </svg>
      </div>
      
      <div className="relative p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-white/80 text-sm font-medium tracking-wide flex items-center gap-1">
              {theme.icon}
              <span className="ml-1">{theme.greeting}</span>
            </p>
            <h2 className="text-3xl font-bold mt-2 font-amiri">{nextPrayer.name}</h2>
            <div className="flex items-center gap-2 mt-1 text-white/90">
              <Clock size={16} />
              <span className="text-xl font-mono">{nextPrayer.time}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-white/70 text-xs">বাকি সময়</p>
            <p className="text-2xl font-bold tracking-tighter">{nextPrayer.remaining}</p>
          </div>
        </div>
        
        <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between text-white/80 text-sm">
          <div className="flex items-center gap-1">
            <MapPin size={14} />
            <span>ঢাকা, বাংলাদেশ</span>
          </div>
          <div className="flex items-center gap-1">
            <span>{new Date().toLocaleDateString('bn-BD', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
            <ChevronRight size={14} />
          </div>
        </div>
      </div>
    </div>
  );
}