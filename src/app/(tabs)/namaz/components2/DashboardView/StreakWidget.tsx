// app/(tabs)/namaz/components/DashboardView/DailyStreakWidget.tsx
'use client';

import { Flame, Trophy, TrendingUp, Calendar } from 'lucide-react';

interface Props {
  currentStreak: number;
  bestStreak: number;
  todayProgress: number;
  totalPrayers: number;
}

export default function DailyStreakWidget({ currentStreak, bestStreak, todayProgress, totalPrayers }: Props) {
  const progressPercentage = (todayProgress / totalPrayers) * 100;
  
  // Get motivational message based on streak
  const getMotivationMessage = () => {
    if (currentStreak >= 30) return 'আল্লাহু আকবার! অসাধারণ ধারাবাহিকতা!';
    if (currentStreak >= 7) return 'চমৎকার! এই ধারা বজায় রাখুন';
    if (currentStreak >= 3) return 'ভালো কাজ করছেন, সামনে এগিয়ে যান';
    if (currentStreak === 1) return 'শুভ সূচনা! আল্লাহ আপনার সহায় হোন';
    return 'আজ থেকে শুরু করুন, প্রতিদিন ৫ ওয়াক্ত';
  };

  return (
    <div className="bg-gradient-to-br from-white/80 to-emerald-50/50 backdrop-blur-sm rounded-2xl p-5 border border-emerald-100 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-emerald-900 flex items-center gap-2">
          <Flame size={18} className="text-orange-500" />
          আপনার অগ্রগতি
        </h3>
        <div className="text-xs text-emerald-500 bg-emerald-100 px-2 py-1 rounded-full">
          <TrendingUp size={12} className="inline mr-1" />
          ধারা বজায় রাখুন
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center p-3 bg-white rounded-xl shadow-sm">
          <div className="flex justify-center items-center gap-1 text-orange-500">
            <Flame size={20} fill="currentColor" />
            <span className="text-2xl font-bold text-emerald-800">{currentStreak}</span>
          </div>
          <p className="text-xs text-emerald-600 mt-1">বর্তমান ধারা (দিন)</p>
        </div>
        <div className="text-center p-3 bg-white rounded-xl shadow-sm">
          <div className="flex justify-center items-center gap-1 text-amber-500">
            <Trophy size={20} />
            <span className="text-2xl font-bold text-emerald-800">{bestStreak}</span>
          </div>
          <p className="text-xs text-emerald-600 mt-1">সর্বোচ্চ ধারা</p>
        </div>
      </div>
      
      {/* Today's progress bar */}
      <div className="mb-3">
        <div className="flex justify-between text-sm text-emerald-700 mb-1">
          <span>আজকের অগ্রগতি</span>
          <span>{todayProgress}/{totalPrayers}</span>
        </div>
        <div className="h-3 bg-emerald-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-700"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>
      
      {/* Motivation message */}
      <div className="mt-3 pt-3 border-t border-emerald-100 flex items-start gap-2">
        <Calendar size={16} className="text-emerald-500 mt-0.5" />
        <p className="text-xs text-emerald-700 italic">{getMotivationMessage()}</p>
      </div>
    </div>
  );
}