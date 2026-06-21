// app/(tabs)/namaz/components/TopbarNav.tsx
'use client';

import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Compass, 
  Sparkles, 
  Grid3x3,
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
  onOpenMore: () => void;
}

const PRIMARY_TABS: { id: ActiveTab; labelEn: string; labelBn: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', labelEn: 'Dashboard', labelBn: 'ড্যাশবোর্ড', icon: <LayoutDashboard size={16} /> },
  { id: 'qibla', labelEn: 'Qibla', labelBn: 'কিবলা', icon: <Compass size={16} /> },
  { id: 'tasbih', labelEn: 'Tasbih', labelBn: 'তাসবিহ', icon: <Sparkles size={16} /> },
];

export default function TopbarNav({ activeTab, onTabChange, language, onOpenMore }: TopbarNavProps) {
  return (
    <div className="flex items-center gap-1.5 rounded-2xl p-1.5 nz-surface shadow-sm">
      {/* Primary tabs */}
      <div className="flex flex-1 gap-1">
        {PRIMARY_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <motion.button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              whileTap={{ scale: 0.95 }}
              className={`
                relative flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold
                transition-all duration-200
                ${isActive 
                  ? 'text-white' 
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }
              `}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabBg"
                  className="absolute inset-0 rounded-xl bg-emerald-600 shadow-sm shadow-emerald-200 dark:shadow-emerald-900/30"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">{tab.icon}</span>
              <span className="relative z-10 hidden sm:inline">{language === 'bn' ? tab.labelBn : tab.labelEn}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Divider */}
      <div className="mx-1 h-6 w-px bg-slate-200 dark:bg-slate-700" />

      {/* More button */}
      <motion.button
        type="button"
        onClick={onOpenMore}
        whileTap={{ scale: 0.95 }}
        className={`
          flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold
          transition-all duration-200
          ${!['dashboard', 'qibla', 'tasbih'].includes(activeTab)
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800'
          }
        `}
      >
        <Grid3x3 size={16} />
        <span className="hidden sm:inline">{language === 'bn' ? 'আরো' : 'More'}</span>
      </motion.button>
    </div>
  );
}
