// app/(tabs)/namaz/components/NamazTabWrapper.tsx
'use client';

import { useState } from 'react';
import TopbarNav from './TopbarNav';
import DashboardView from './DashboardView';
// Import other views (make them first, then uncomment)
import LogsView from './LogsView';
import CalendarView from './CalendarView';
import QiblaView from './QiblaView';
import TasbihView from './TasbihView';
import DuaView from './DuaView';
import InsightsView from '../InsightsView';
import PreferencesView from '../PreferencesView';

type ActiveTab = 
  | 'dashboard' 
  | 'logs' 
  | 'calendar' 
  | 'qibla' 
  | 'tasbih' 
  | 'dua' 
  | 'insights' 
  | 'preferences';

export function NamazTabWrapper() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-amber-50">
      {/* Subtle geometric pattern overlay */}
      <div 
        className="fixed inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5L55 30L30 55L5 30L30 5z' fill='none' stroke='%23065742' stroke-width='0.8'/%3E%3C/svg%3E")`,
          backgroundSize: '40px 40px',
        }}
      />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <TopbarNav activeTab={activeTab} onTabChange={setActiveTab} />
        
        <div className="mt-8 transition-all duration-300">
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'logs' && <LogsView />}
          {activeTab === 'calendar' && <CalendarView />}
          {activeTab === 'qibla' && <QiblaView />}
          {activeTab === 'tasbih' && <TasbihView />}
          {activeTab === 'dua' && <DuaView />}
          {activeTab === 'insights' && <InsightsView />}
          {activeTab === 'preferences' && <PreferencesView />}
        </div>
      </div>
    </div>
  );
}
