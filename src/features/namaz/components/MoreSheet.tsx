'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef } from 'react';
import {
  ListChecks,
  CalendarDays,
  BookOpen,
  TrendingUp,
  Settings2,
  Library,
} from 'lucide-react';
import type { ActiveTab } from './TopbarNav';

interface MoreSheetProps {
  open: boolean;
  onClose: () => void;
  onTabChange: (tab: ActiveTab) => void;
  language: 'bn' | 'en';
  currentTab: ActiveTab;
}

const MORE_TABS: { id: ActiveTab; labelEn: string; labelBn: string; icon: React.ReactNode }[] = [
  { id: 'logs', labelEn: 'Prayer Logs', labelBn: 'নামাজের লগ', icon: <ListChecks size={20} /> },
  { id: 'calendar', labelEn: 'Calendar', labelBn: 'ক্যালেন্ডার', icon: <CalendarDays size={20} /> },
  { id: 'quran', labelEn: 'Quran', labelBn: 'কুরআন', icon: <Library size={20} /> },
  { id: 'dua', labelEn: 'Duas & Zikr', labelBn: 'দোয়া ও যিকির', icon: <BookOpen size={20} /> },
  { id: 'insights', labelEn: 'Insights', labelBn: 'ইনসাইটস', icon: <TrendingUp size={20} /> },
  { id: 'preferences', labelEn: 'Settings', labelBn: 'সেটিংস', icon: <Settings2 size={20} /> },
];

const COPY = {
  bn: { title: 'সকল ফিচার', subtitle: 'দ্রুত যেকোনো ফিচারে যান' },
  en: { title: 'More Features', subtitle: 'Quick access to all tools' },
};

export default function MoreSheet({ open, onClose, onTabChange, language, currentTab }: MoreSheetProps) {
  const t = COPY[language];
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            ref={overlayRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300, mass: 1 }}
            className="fixed bottom-0 left-0 right-0 z-[70] rounded-t-3xl border-t border-emerald-100/30 bg-white shadow-2xl dark:border-emerald-900/30 dark:bg-slate-900"
            style={{ maxHeight: '70vh', overflow: 'hidden' }}
          >
            {/* Handle */}
            <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-slate-300 dark:bg-slate-600" />

            {/* Header */}
            <div className="flex items-center justify-between px-6 pb-2 pt-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t.title}</h2>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{t.subtitle}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4l8 8M12 4l-8 8" />
                </svg>
              </button>
            </div>

            {/* List */}
            <div className="overflow-y-auto px-4 pb-8 pt-2" style={{ maxHeight: 'calc(70vh - 100px)' }}>
              {MORE_TABS.map((tab, index) => (
                <motion.button
                  key={tab.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.04, type: 'spring', stiffness: 300, damping: 25 }}
                  type="button"
                  onClick={() => {
                    onTabChange(tab.id);
                    onClose();
                  }}
                  className={`mb-2 flex w-full items-center gap-4 rounded-2xl p-4 text-left transition-all duration-200 ${
                    currentTab === tab.id
                      ? 'bg-emerald-50 shadow-sm dark:bg-emerald-900/30'
                      : 'bg-slate-50/50 hover:bg-slate-100 dark:bg-slate-800/30 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                      currentTab === tab.id
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30'
                        : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {tab.icon}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-bold ${currentTab === tab.id ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-800 dark:text-slate-200'}`}>
                      {language === 'bn' ? tab.labelBn : tab.labelEn}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                      {getTabDescription(tab.id, language)}
                    </p>
                  </div>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-slate-300 dark:text-slate-600"
                  >
                    <path d="M6 4l4 4-4 4" />
                  </svg>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function getTabDescription(id: ActiveTab, language: 'bn' | 'en'): string {
  if (language === 'bn') {
    switch (id) {
      case 'logs': return 'আপনার নামাজের ইতিহাস ও ট্র্যাকিং';
      case 'calendar': return 'মাসিক ও বার্ষিক নামাজের সময়সূচী';
      case 'quran': return 'পবিত্র কুরআন পাঠ ও তিলাওয়াত';
      case 'dua': return 'দৈনন্দিন দোয়া ও যিকিরের সংকলন';
      case 'insights': return 'নামাজের ধারা ও পরিসংখ্যান বিশ্লেষণ';
      case 'preferences': return 'আযান, স্মারক ও থিম কাস্টমাইজ';
      default: return '';
    }
  }
  switch (id) {
    case 'logs': return 'Your prayer history & tracking';
    case 'calendar': return 'Monthly & yearly prayer schedules';
    case 'quran': return 'Read and listen to the Holy Quran';
    case 'dua': return 'Daily duas and zikr collection';
    case 'insights': return 'Streaks, trends & prayer analytics';
    case 'preferences': return 'Azan, reminders & theme settings';
    default: return '';
  }
}