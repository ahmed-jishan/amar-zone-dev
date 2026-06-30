// app/(tabs)/namaz/components/NamazTabWrapper.tsx
'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import TopbarNav, { type ActiveTab } from './TopbarNav';
import DashboardView from './DashboardView';
import { usePrayerTimes } from '../hooks/usePrayerTimes';
import { useAzanScheduler } from '../hooks/useAzanScheduler';
import { useLocationSync } from '../hooks/useLocationSync';
import { useSettingsStore } from '@/features/settings/store/settingsStore';
import { useSwipeNavigation } from '../hooks/useSwipeNavigation';
import { triggerHaptic, vibrateBrowser } from '@/lib/native/haptics';
import SafeRender from '@/components/shared/SafeRender';
import '../namaz-globals.css';

// Tab navigation order for swipe gestures
const TAB_ORDER: ActiveTab[] = ['dashboard', 'qibla', 'tasbih'];
const tabLoading = () => <div className="rounded-2xl p-5 text-sm font-semibold nz-card nz-text">Loading...</div>;

const LogsView = dynamic(() => import('./LogsView'), { loading: tabLoading });
const CalendarView = dynamic(() => import('./CalendarView'), { loading: tabLoading });
const QiblaView = dynamic(() => import('./QiblaView'), { loading: tabLoading });
const TasbihView = dynamic(() => import('./TasbihView'), { loading: tabLoading });
const DuaView = dynamic(() => import('./DuaView'), { loading: tabLoading });
const QuranView = dynamic(() => import('./QuranView'), { loading: tabLoading });
const InsightsView = dynamic(() => import('./InsightsView'), { loading: tabLoading });
const PreferencesView = dynamic(() => import('./PreferencesView'), { loading: tabLoading });

export function NamazTabWrapper() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [animateKey, setAnimateKey] = useState(0);
  const { language } = useSettingsStore();
  const locationSync = useLocationSync({ force: true, watch: false, deferMs: 1200 });
  const { data: prayerTimes } = usePrayerTimes();
  const azan = useAzanScheduler(prayerTimes);

  // Haptic + keyboard support for tab changes
  const handleTabChange = useCallback((tab: ActiveTab) => {
    setActiveTab((current) => {
      if (tab === current) return current;
      void triggerHaptic('light');
      vibrateBrowser(5);
      setAnimateKey((k) => k + 1);
      return tab;
    });
  }, []);

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
      
      <TopbarNav 
        activeTab={activeTab} 
        onTabChange={handleTabChange} 
        language={language}
      />
      
      <div 
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6"
        {...(isPrimaryTab ? swipeHandlers : {})}
      >
        <div className="mt-6 transition-all duration-300 relative" style={{ zIndex: 1 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={`${activeTab}-${animateKey}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            >
              <SafeRender
                name={`Namaz ${activeTab}`}
                fallback={<div className="rounded-2xl p-5 text-sm font-semibold nz-card nz-text">This Namaz section recovered from an error. Please switch tabs and try again.</div>}
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
              </SafeRender>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

    </div>
  );
}
