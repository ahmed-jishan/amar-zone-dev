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
  ListChecks 
} from 'lucide-react';

type ActiveTab = 
  | 'dashboard' 
  | 'logs' 
  | 'calendar' 
  | 'qibla' 
  | 'tasbih' 
  | 'dua' 
  | 'insights' 
  | 'preferences';

interface TopbarNavProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

const tabs: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { id: 'logs', label: 'Logs', icon: <ListChecks size={18} /> },
  { id: 'calendar', label: 'Calendar', icon: <CalendarDays size={18} /> },
  { id: 'qibla', label: 'Qibla', icon: <Compass size={18} /> },
  { id: 'tasbih', label: 'Tasbih', icon: <Sparkles size={18} /> },
  { id: 'dua', label: 'Duas', icon: <BookOpen size={18} /> },
  { id: 'insights', label: 'Insights', icon: <TrendingUp size={18} /> },
  { id: 'preferences', label: 'Prefs', icon: <Settings2 size={18} /> },
];

export default function TopbarNav({ activeTab, onTabChange }: TopbarNavProps) {
  return (
    <div className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-sm border border-emerald-100/50 p-1">
      <div className="flex flex-wrap justify-center gap-1 sm:gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
              ${activeTab === tab.id 
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200' 
                : 'text-emerald-800 hover:bg-emerald-100/60 hover:text-emerald-900'
              }
            `}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}