'use client';

import { motion, AnimatePresence } from 'framer-motion';
import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard,
  Compass,
  Library,
  Grid3x3,
  Sparkles,
  ListChecks,
  CalendarDays,
  BookOpen,
  TrendingUp,
  Settings2,
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

const PRIMARY_TABS: { id: ActiveTab; labelEn: string; labelBn: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', labelEn: 'Dashboard', labelBn: 'ড্যাশবোর্ড', icon: <LayoutDashboard size={16} /> },
  { id: 'qibla', labelEn: 'Qibla', labelBn: 'কিবলা', icon: <Compass size={16} /> },
  { id: 'quran', labelEn: 'Quran', labelBn: 'কুরআন', icon: <Library size={16} /> },
];

const MORE_ITEMS: { id: ActiveTab; labelEn: string; labelBn: string; icon: React.ReactNode; descEn: string; descBn: string }[] = [
  { id: 'tasbih', labelEn: 'Tasbih', labelBn: 'তাসবিহ', icon: <Sparkles size={16} />, descEn: 'Digital tasbih counter', descBn: 'ডিজিটাল তাসবিহ' },
  { id: 'logs', labelEn: 'Prayer Logs', labelBn: 'নামাজের লগ', icon: <ListChecks size={16} />, descEn: 'History & tracking', descBn: 'ইতিহাস ও ট্র্যাকিং' },
  { id: 'dua', labelEn: 'Duas & Zikr', labelBn: 'দোয়া ও যিকির', icon: <BookOpen size={16} />, descEn: 'Daily duas collection', descBn: 'দৈনন্দিন দোয়া' },
  { id: 'calendar', labelEn: 'Calendar', labelBn: 'ক্যালেন্ডার', icon: <CalendarDays size={16} />, descEn: 'Monthly schedules', descBn: 'মাসিক সময়সূচী' },
  { id: 'insights', labelEn: 'Insights', labelBn: 'ইনসাইটস', icon: <TrendingUp size={16} />, descEn: 'Streaks & analytics', descBn: 'পরিসংখ্যান' },
  { id: 'preferences', labelEn: 'Settings', labelBn: 'সেটিংস', icon: <Settings2 size={16} />, descEn: 'Customize app', descBn: 'কাস্টমাইজ' },
];

export default function TopbarNav({ activeTab, onTabChange, language }: TopbarNavProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const moreBtnRef = useRef<HTMLButtonElement | null>(null);
  const topbarInnerRef = useRef<HTMLDivElement | null>(null);
  const [topbarHeight, setTopbarHeight] = useState<number>(64);

  useEffect(() => {
    const measure = () => {
      const el = topbarInnerRef.current;
      if (el) setTopbarHeight(el.offsetHeight);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  useEffect(() => {
    if (!moreOpen) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        moreBtnRef.current &&
        !moreBtnRef.current.contains(target)
      ) {
        setMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [moreOpen]);

  const isInMore = !PRIMARY_TABS.some((t) => t.id === activeTab);

  const handleMoreSelect = (tabId: ActiveTab) => {
    onTabChange(tabId);
    setMoreOpen(false);
  };

  return (
    <>
      <nav className="relative flex justify-center namaz-topbar" aria-label="Namaz topbar">
        <div
          ref={topbarInnerRef}
          className="inline-flex items-center gap-1 p-1 rounded-xl overflow-visible"
        >
          <div className="flex items-center gap-0.5">
            {PRIMARY_TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <motion.button
                  key={tab.id}
                  type="button"
                  onClick={() => onTabChange(tab.id)}
                  whileTap={{ scale: 0.95 }}
                  className={`relative flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-[11px] font-semibold transition-all duration-200 whitespace-nowrap ${
                    isActive
                      ? 'text-white'
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
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

          <div className="mx-0.5 h-5 w-px bg-slate-200 dark:bg-slate-700" />

          <div className="relative">
            <motion.button
              ref={moreBtnRef}
              type="button"
              onClick={() => setMoreOpen((v) => !v)}
              whileTap={{ scale: 0.95 }}
              className={`relative flex items-center justify-center gap-1 px-2.5 py-2 rounded-xl text-[11px] font-semibold transition-all duration-200 whitespace-nowrap ${
                isInMore || moreOpen
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <Grid3x3 size={15} />
              <span className="hidden sm:inline">{language === 'bn' ? 'আরো' : 'More'}</span>
              <motion.span animate={{ rotate: moreOpen ? 180 : 0 }} transition={{ duration: 0.2 }} className="hidden sm:inline-block">
                <svg width="7" height="7" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M2 3l2 2 2-2" />
                </svg>
              </motion.span>
            </motion.button>

            <AnimatePresence>
              {moreOpen && (
                <>
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} onClick={() => setMoreOpen(false)} className="fixed inset-0 z-40" />

                  <motion.div
                    ref={dropdownRef}
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ type: 'spring', stiffness: 350, damping: 25, mass: 0.8 }}
                    className="absolute right-0 top-full mt-2 z-50 w-72 origin-top-right overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-xl shadow-slate-900/10 dark:border-slate-700/60 dark:bg-slate-900 dark:shadow-black/30"
                  >
                    <div className="px-4 pt-3 pb-1.5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        {language === 'bn' ? 'সকল ফিচার' : 'All Features'}
                      </p>
                    </div>

                    <div className="px-2 pb-2">
                      {MORE_ITEMS.map((item, i) => {
                        const isActive = activeTab === item.id;
                        return (
                          <motion.button
                            key={item.id}
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.035, type: 'spring', stiffness: 300, damping: 25 }}
                            type="button"
                            onClick={() => handleMoreSelect(item.id)}
                            className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-150 ${
                              isActive ? 'bg-emerald-50 dark:bg-emerald-900/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                            }`}
                          >
                            <div
                              className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                                isActive ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                              }`}
                            >
                              {item.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-semibold ${isActive ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-800 dark:text-slate-200'}`}>
                                {language === 'bn' ? item.labelBn : item.labelEn}
                              </p>
                              <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{language === 'bn' ? item.descBn : item.descEn}</p>
                            </div>
                            {isActive && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="h-2 w-2 rounded-full bg-emerald-500" />}
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </nav>

      <div aria-hidden className="namaz-topbar-spacer" style={{ height: `${topbarHeight}px` }} />
    </>
  );
}
