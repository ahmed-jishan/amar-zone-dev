// app/(tabs)/namaz/components/NamazTabWrapper.tsx
'use client';

import { useEffect, useState } from 'react';
import TopbarNav, { type ActiveTab } from './TopbarNav';
import DashboardView from './DashboardView';
// Import other views (make them first, then uncomment)
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

export function NamazTabWrapper() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const { language } = useSettingsStore();
  const locationSync = useLocationSync(true);
  const { data: prayerTimes } = usePrayerTimes();
  const azan = useAzanScheduler(prayerTimes);

  useEffect(() => {
    const openQibla = () => setActiveTab('qibla');
    const openDua = () => setActiveTab('dua');
    window.addEventListener('namaz:open-qibla', openQibla);
    window.addEventListener('namaz:open-dua', openDua);
    return () => {
      window.removeEventListener('namaz:open-qibla', openQibla);
      window.removeEventListener('namaz:open-dua', openDua);
    };
  }, []);

  return (
    <div className="namaz-root">
      {/* Subtle geometric pattern overlay */}
      <div 
        className="fixed inset-0 opacity-5 pointer-events-none dark:opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5L55 30L30 55L5 30L30 5z' fill='none' stroke='%23065742' stroke-width='0.8'/%3E%3C/svg%3E")`,
          backgroundSize: '40px 40px',
        }}
      />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <TopbarNav activeTab={activeTab} onTabChange={setActiveTab} language={language} />
        
        <div className="mt-8 transition-all duration-300">
          {activeTab === 'dashboard' && (
            <DashboardView
              azan={azan}
              prayerTimesResponse={prayerTimes}
              locationLabel={locationSync.label}
              locationStatus={locationSync.status}
              onOpenQuran={() => setActiveTab('quran')}
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
        </div>
      </div>

    </div>
  );
}
