// app/(tabs)/namaz/components/NamazTabWrapper.tsx
'use client';

import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import TopbarNav, { type ActiveTab } from './TopbarNav';
import DashboardView from './DashboardView';
import LogsView from './LogsView';
import CalendarView from './CalendarView';
import QiblaView from './QiblaView';
import TasbihView from './TasbihView';
import DuaView from './DuaView';
import QuranView from './QuranView';
import InsightsView from './InsightsView';
import PreferencesView from './PreferencesView';
import { usePrayerTimes } from '../hooks/usePrayerTimes';
import { useAzanScheduler } from '../hooks/useAzanScheduler';
import { useLocationSync } from '../hooks/useLocationSync';
import { useSettingsStore } from '@/features/settings/store/settingsStore';
import { useSwipeNavigation } from '../hooks/useSwipeNavigation';
import { triggerHaptic, vibrateBrowser } from '@/lib/native/haptics';
import '../namaz-globals.css';

// Tab navigation order for swipe gestures
const TAB_ORDER: ActiveTab[] = ['dashboard', 'qibla', 'tasbih'];

export function NamazTabWrapper() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [animateKey, setAnimateKey] = useState(0);
  const { language } = useSettingsStore();
  const locationSync = useLocationSync(true);
  const { data: prayerTimes } = usePrayerTimes();
  const azan = useAzanScheduler(prayerTimes);

  // Haptic + keyboard support for tab changes
  const handleTabChange = useCallback((tab: ActiveTab) => {
    if (tab === activeTab) return;
    triggerHaptic('light');
    vibrateBrowser(5);
    setAnimateKey((k) => k + 1);
    setActiveTab(tab);
  }, [activeTab]);

  // Swipe between dashboard/qibla/tasbih
  const handleSwipeLeft = useCallback(() => {
    const idx = TAB_ORDER.indexOf(activeTab);
    if (idx < TAB_ORDER.length - 1) {
      triggerHaptic('light');
      vibrateBrowser(5);
      setAnimateKey((k) => k + 1);
      setActiveTab(TAB_ORDER[idx + 1]);
    }
  }, [activeTab]);

  const handleSwipeRight = useCallback(() => {
    const idx = TAB_ORDER.indexOf(activeTab);
    if (idx > 0) {
      triggerHaptic('light');
      vibrateBrowser(5);
      setAnimateKey((k) => k + 1);
      setActiveTab(TAB_ORDER[idx - 1]);
    }
  }, [activeTab]);

  const { swipeHandlers } = useSwipeNavigation({
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight,
    threshold: 50,
  });

  useEffect(() => {
    const openQibla = () => handleTabChange('qibla');
    const openDua = () => handleTabChange('dua');
    window.addEventListener('namaz:open-qibla', openQibla);
    window.addEventListener('namaz:open-dua', openDua);
    return () => {
      window.removeEventListener('namaz:open-qibla', openQibla);
      window.removeEventListener('namaz:open-dua', openDua);
    };
  }, [handleTabChange]);

  // Determine if we should allow swipe (only primary tabs)
  const isPrimaryTab = TAB_ORDER.includes(activeTab);

  return (
    <div className="namaz-root">
      {/* Subtle geometric pattern overlay */}
      <div 
        className="fixed inset-0 opacity-[0.03] pointer-events-none dark:opacity-[0.06]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5L55 30L30 55L5 30L30 5z' fill='none' stroke='%23065742' stroke-width='0.8'/%3E%3C/svg%3E")`,
          backgroundSize: '40px 40px',
        }}
      />
      
      <div 
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6"
        {...(isPrimaryTab ? swipeHandlers : {})}
      >
        <div className="relative" style={{ zIndex: 50 }}>
          <TopbarNav 
            activeTab={activeTab} 
            onTabChange={handleTabChange} 
            language={language}
          />
        </div>
        
        <div className="mt-6 transition-all duration-300 relative" style={{ zIndex: 1 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={`${activeTab}-${animateKey}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            >
              {activeTab === 'dashboard' && (
                <DashboardView
                  azan={azan}
                  prayerTimesResponse={prayerTimes}
                  locationLabel={locationSync.label}
                  locationStatus={locationSync.status}
                  onOpenQuran={() => handleTabChange('quran')}
                  language={language}
                />
              )}
              {activeTab === 'logs' && <LogsView />}
              {activeTab === 'calendar' && <CalendarView />}
              {activeTab === 'qibla' && <QiblaView />}
              {activeTab === 'tasbih' && <TasbihView />}
              {activeTab === 'dua' && <DuaView />}
              {activeTab === 'quran' && <QuranView />}
              {activeTab === 'insights' && <InsightsView />}
              {activeTab === 'preferences' && <PreferencesView />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

    </div>
  );
}
