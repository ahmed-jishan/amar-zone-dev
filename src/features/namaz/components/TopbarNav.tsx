// app/(tabs)/namaz/components/TopbarNav.tsx
'use client';

import { 
  LayoutDashboard, 
  CalendarDays, 
  Compass, 
  Sparkles, 
  BookOpen, 
  TrendingUp, 
  Settings2,
  ListChecks,
  Library
} from 'lucide-react';

export type ActiveTab = 
  | 'dashboard' 
  | 'logs' 
  | 'calendar' 
  | 'qibla' 
  | 'tasbih' 
  | 'dua' 
  | 'quran'
  | 'insights' 
  | 'preferences';

interface TopbarNavProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  language: 'bn' | 'en';
}

const tabs: { id: ActiveTab; labelKey: ActiveTab; icon: React.ReactNode }[] = [
  { id: 'dashboard', labelKey: 'dashboard', icon: <LayoutDashboard size={18} /> },
  { id: 'logs', labelKey: 'logs', icon: <ListChecks size={18} /> },
  { id: 'calendar', labelKey: 'calendar', icon: <CalendarDays size={18} /> },
  { id: 'qibla', labelKey: 'qibla', icon: <Compass size={18} /> },
  { id: 'tasbih', labelKey: 'tasbih', icon: <Sparkles size={18} /> },
  { id: 'dua', labelKey: 'dua', icon: <BookOpen size={18} /> },
  { id: 'quran', labelKey: 'quran', icon: <Library size={18} /> },
  { id: 'insights', labelKey: 'insights', icon: <TrendingUp size={18} /> },
  { id: 'preferences', labelKey: 'preferences', icon: <Settings2 size={18} /> },
];

const TAB_LABELS: Record<'bn' | 'en', Record<ActiveTab, string>> = {
  bn: {
    dashboard: 'ড্যাশবোর্ড',
    logs: 'লগস',
    calendar: 'ক্যালেন্ডার',
    qibla: 'কিবলা',
    tasbih: 'তাসবিহ',
    dua: 'দোয়া',
    quran: 'কুরআন',
    insights: 'ইনসাইটস',
    preferences: 'পছন্দ',
  },
  en: {
    dashboard: 'Dashboard',
    logs: 'Logs',
    calendar: 'Calendar',
    qibla: 'Qibla',
    tasbih: 'Tasbih',
    dua: 'Duas',
    quran: 'Quran',
    insights: 'Insights',
    preferences: 'Prefs',
  },
};

export default function TopbarNav({ activeTab, onTabChange, language }: TopbarNavProps) {
  return (
    <div className="rounded-2xl p-1 nz-surface">
      <div className="flex flex-wrap justify-center gap-1 sm:gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
              ${activeTab === tab.id 
                ? 'nz-primary' 
                : 'nz-nav-idle nz-text'
              }
            `}
          >
            {tab.icon}
            <span className="hidden sm:inline">{TAB_LABELS[language][tab.labelKey]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
