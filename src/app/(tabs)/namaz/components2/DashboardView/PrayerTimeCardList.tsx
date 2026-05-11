// app/(tabs)/namaz/components/DashboardView/PrayerTimeCard.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { Clock, Users, CheckCircle, Circle, AlertCircle, Star, Moon } from 'lucide-react';

type PrayerStatus = 'pending' | 'onTime' | 'late' | 'missed' | 'jamaat';

interface PrayerData {
  Fajr: { adhan: string; jamaat: string; status: PrayerStatus };
  Dhuhr: { adhan: string; jamaat: string; status: PrayerStatus };
  Asr: { adhan: string; jamaat: string; status: PrayerStatus };
  Maghrib: { adhan: string; jamaat: string; status: PrayerStatus };
  Isha: { adhan: string; jamaat: string; status: PrayerStatus };
}

interface Props {
  prayerTimes: PrayerData;
  onMarkPrayer: (prayerName: string, status: PrayerStatus) => void;
}

// Helper SunIcon
const SunIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
  </svg>
);

const prayerOrder = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
const prayerIcons: Record<string, React.ReactNode> = {
  Fajr: <Moon size={20} />,
  Dhuhr: <SunIcon size={20} />,
  Asr: <SunIcon size={20} />,
  Maghrib: <SunIcon size={20} />,
  Isha: <Moon size={20} />
};

const statusColors = {
  pending: { bg: 'bg-white/70', border: 'border-emerald-100', icon: <Circle size={22} className="text-emerald-300" />, label: '' },
  onTime: { bg: 'bg-emerald-50/80', border: 'border-emerald-200', icon: <CheckCircle size={22} className="text-emerald-600" />, label: 'সময়মত' },
  late: { bg: 'bg-amber-50/80', border: 'border-amber-200', icon: <AlertCircle size={22} className="text-amber-600" />, label: 'দেরি' },
  missed: { bg: 'bg-red-50/80', border: 'border-red-200', icon: <AlertCircle size={22} className="text-red-500" />, label: 'কাজা' },
  jamaat: { bg: 'bg-blue-50/80', border: 'border-blue-200', icon: <Users size={22} className="text-blue-600" />, label: 'জামাত' }
};

export default function PrayerTimeCard({ prayerTimes, onMarkPrayer }: Props) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStatusChange = (prayerName: string, status: PrayerStatus) => {
    onMarkPrayer(prayerName, status);
    setOpenDropdown(null);
  };

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-emerald-900 flex items-center gap-2">
        <span className="w-1 h-6 bg-emerald-500 rounded-full"></span>
        আজকের নামাজের সময়সূচি
      </h3>
      
      {prayerOrder.map((prayer) => {
        const data = prayerTimes[prayer as keyof PrayerData];
        const currentStatus = data.status;
        const statusStyle = statusColors[currentStatus];
        
        return (
          <div 
            key={prayer}
            className={`flex flex-wrap items-center justify-between p-4 rounded-xl transition-all duration-200 ${statusStyle.bg} border ${statusStyle.border} backdrop-blur-sm hover:shadow-md relative`}
          >
            <div className="flex items-center gap-4">
              <div className="text-emerald-700">
                {prayerIcons[prayer]}
              </div>
              <div>
                <h4 className="font-bold text-emerald-900 text-lg">{prayer}</h4>
                <div className="flex gap-3 text-sm text-emerald-600">
                  <span className="flex items-center gap-1"><Clock size={12} /> {data.adhan}</span>
                  <span className="flex items-center gap-1"><Users size={12} /> {data.jamaat}</span>
                </div>
              </div>
            </div>
            
            <div className="relative" ref={openDropdown === prayer ? dropdownRef : null}>
              {currentStatus !== 'pending' ? (
                <div className="flex items-center gap-2">
                  {statusStyle.icon}
                  <span className="text-sm font-medium text-emerald-700">{statusStyle.label}</span>
                  <button 
                    onClick={() => setOpenDropdown(openDropdown === prayer ? null : prayer)}
                    className="ml-2 text-emerald-500 hover:text-emerald-700"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setOpenDropdown(openDropdown === prayer ? null : prayer)}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition flex items-center gap-2"
                >
                  <CheckCircle size={16} />
                  মার্ক করুন
                </button>
              )}
              
              {/* Dropdown - positioned ABOVE the button to avoid clipping */}
              {openDropdown === prayer && (
                <div className="absolute bottom-full right-0 mb-2 w-48 bg-white rounded-lg shadow-xl border border-emerald-100 z-50 overflow-hidden">
                  {Object.entries(statusColors).map(([status, style]) => (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(prayer, status as PrayerStatus)}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-left text-sm hover:bg-emerald-50 transition-colors text-gray-800"
                    >
                      <span className="flex-shrink-0">{style.icon}</span>
                      <span className="font-medium">{style.label || 'পেন্ডিং'}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}