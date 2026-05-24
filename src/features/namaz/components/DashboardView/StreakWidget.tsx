// // app/(tabs)/namaz/components/DashboardView/DailyStreakWidget.tsx
// 'use client';

// import { Flame, Trophy, TrendingUp, Calendar } from 'lucide-react';

// interface Props {
//   currentStreak: number;
//   bestStreak: number;
//   todayProgress: number;
//   totalPrayers: number;
// }

// export default function DailyStreakWidget({ currentStreak, bestStreak, todayProgress, totalPrayers }: Props) {
//   const progressPercentage = (todayProgress / totalPrayers) * 100;
  
//   // Get motivational message based on streak
//   const getMotivationMessage = () => {
//     if (currentStreak >= 30) return 'আল্লাহু আকবার! অসাধারণ ধারাবাহিকতা!';
//     if (currentStreak >= 7) return 'চমৎকার! এই ধারা বজায় রাখুন';
//     if (currentStreak >= 3) return 'ভালো কাজ করছেন, সামনে এগিয়ে যান';
//     if (currentStreak === 1) return 'শুভ সূচনা! আল্লাহ আপনার সহায় হোন';
//     return 'আজ থেকে শুরু করুন, প্রতিদিন ৫ ওয়াক্ত';
//   };

//   return (
//     <div className="bg-gradient-to-br from-white/80 to-emerald-50/50 backdrop-blur-sm rounded-2xl p-5 border border-emerald-100 shadow-sm">
//       <div className="flex items-center justify-between mb-4">
//         <h3 className="font-semibold text-emerald-900 flex items-center gap-2">
//           <Flame size={18} className="text-orange-500" />
//           আপনার অগ্রগতি
//         </h3>
//         <div className="text-xs text-emerald-500 bg-emerald-100 px-2 py-1 rounded-full">
//           <TrendingUp size={12} className="inline mr-1" />
//           ধারা বজায় রাখুন
//         </div>
//       </div>
      
//       <div className="grid grid-cols-2 gap-4 mb-4">
//         <div className="text-center p-3 bg-white rounded-xl shadow-sm">
//           <div className="flex justify-center items-center gap-1 text-orange-500">
//             <Flame size={20} fill="currentColor" />
//             <span className="text-2xl font-bold text-emerald-800">{currentStreak}</span>
//           </div>
//           <p className="text-xs text-emerald-600 mt-1">বর্তমান ধারা (দিন)</p>
//         </div>
//         <div className="text-center p-3 bg-white rounded-xl shadow-sm">
//           <div className="flex justify-center items-center gap-1 text-amber-500">
//             <Trophy size={20} />
//             <span className="text-2xl font-bold text-emerald-800">{bestStreak}</span>
//           </div>
//           <p className="text-xs text-emerald-600 mt-1">সর্বোচ্চ ধারা</p>
//         </div>
//       </div>
      
//       {/* Today's progress bar */}
//       <div className="mb-3">
//         <div className="flex justify-between text-sm text-emerald-700 mb-1">
//           <span>আজকের অগ্রগতি</span>
//           <span>{todayProgress}/{totalPrayers}</span>
//         </div>
//         <div className="h-3 bg-emerald-100 rounded-full overflow-hidden">
//           <div 
//             className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-700"
//             style={{ width: `${progressPercentage}%` }}
//           />
//         </div>
//       </div>
      
//       {/* Motivation message */}
//       <div className="mt-3 pt-3 border-t border-emerald-100 flex items-start gap-2">
//         <Calendar size={16} className="text-emerald-500 mt-0.5" />
//         <p className="text-xs text-emerald-700 italic">{getMotivationMessage()}</p>
//       </div>
//     </div>
//   );
// }

'use client';

import { Flame, Trophy, Star, Target } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Props {
  currentStreak: number;
  bestStreak: number;
  todayProgress: number;
  totalPrayers: number;
  language: 'bn' | 'en';
}

const COPY = {
  bn: {
    title: 'নামাজের ধারা',
    currentStreak: 'বর্তমান ধারা',
    bestStreak: 'সর্বোচ্চ',
    todayProgress: 'আজ',
    completed: 'সম্পন্ন',
    remaining: 'ওয়াক্ত বাকি',
    newBest: 'নতুন সেরা ধারা',
    progressTitle: 'আজকের অগ্রগতি',
  },
  en: {
    title: 'Prayer Streak',
    currentStreak: 'Current streak',
    bestStreak: 'Best',
    todayProgress: 'Today',
    completed: 'completed',
    remaining: 'prayers remaining',
    newBest: 'New best streak',
    progressTitle: "Today's progress",
  },
};

// Streak tier config
function getStreakTier(streak: number, language: 'bn' | 'en') {
  if (streak >= 30) return { label: language === 'bn' ? 'মুত্তাকী' : 'Muttaqi', color: '#d4af37', glow: 'rgba(212,175,55,0.25)', icon: '✦' };
  if (streak >= 14) return { label: language === 'bn' ? 'মুহাসিন' : 'Muhsin', color: '#059669', glow: 'rgba(5,150,105,0.20)', icon: '◆' };
  if (streak >= 7)  return { label: language === 'bn' ? 'মুদাওয়িম' : 'Mudaawim', color: '#0d9488', glow: 'rgba(13,148,136,0.20)', icon: '●' };
  if (streak >= 3)  return { label: language === 'bn' ? 'সাবিত-কদম' : 'Steady', color: '#6d8c53', glow: 'rgba(109,140,83,0.20)', icon: '○' };
  return              { label: language === 'bn' ? 'মুবতাদী' : 'Beginner', color: '#92670a', glow: 'rgba(146,103,10,0.15)', icon: '◌' };
}

function getMotivation(streak: number, language: 'bn' | 'en') {
  if (language === 'en') {
    if (streak >= 30) return 'MashaAllah! Thirty days straight — remarkable dedication.';
    if (streak >= 14) return 'Two weeks consistent. May Allah accept.';
    if (streak >= 7)  return 'A full week. Keep the streak alive.';
    if (streak >= 3)  return 'Good start. Aim for all five daily prayers.';
    if (streak === 1) return 'Great start. Keep today’s streak going.';
    return 'Begin today — every prayer matters.';
  }
  if (streak >= 30) return 'মাশাআল্লাহ! তিরিশ দিনের ধারা — অসাধারণ নিষ্ঠা।';
  if (streak >= 14) return 'দুই সপ্তাহ ধারাবাহিক! আল্লাহ কবুল করুন।';
  if (streak >= 7)  return 'এক সপ্তাহ পূর্ণ! ধারা বজায় রাখুন।';
  if (streak >= 3)  return 'ভালো শুরু। প্রতিদিন পাঁচ ওয়াক্ত নামাজ পড়ুন।';
  if (streak === 1) return 'শুভ সূচনা! আজকের ধারা বজায় রাখুন।';
  return 'আজ থেকেই শুরু করুন — প্রতিটি নামাজ গুরুত্বপূর্ণ।';
}

export default function DailyStreakWidget({ currentStreak, bestStreak, todayProgress, totalPrayers, language }: Props) {
  const t = COPY[language];
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [animatedStreak, setAnimatedStreak] = useState(0);
  const [mounted, setMounted] = useState(false);

  const pct     = totalPrayers > 0 ? (todayProgress / totalPrayers) * 100 : 0;
  const tier    = getStreakTier(currentStreak, language);
  const isNewBest = currentStreak >= bestStreak && currentStreak > 0;
  const remainingPrayers = Math.max(0, totalPrayers - todayProgress);

  useEffect(() => {
    setMounted(true);
    // Staggered number animations
    const tStreak  = setTimeout(() => setAnimatedStreak(currentStreak), 120);
    const tProg    = setTimeout(() => setAnimatedProgress(pct), 240);
    return () => { clearTimeout(tStreak); clearTimeout(tProg); };
  }, [currentStreak, pct]);

  // Circular progress for streak ring
  const RING_R  = 30;
  const RING_C  = 2 * Math.PI * RING_R;
  const streakPct = Math.min(currentStreak / Math.max(bestStreak, 1), 1);

  return (
    <div className="relative overflow-hidden rounded-2xl nz-elevated-panel nz-streak-card">
      {/* Subtle spiritual motif */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='48' height='48' viewBox='0 0 48 48' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M24 6L42 24L24 42L6 24Z' fill='none' stroke='%230f3d2e' stroke-width='0.7'/%3E%3C/svg%3E")`,
          backgroundSize: '48px 48px',
        }}
      />

      <div
        className="absolute -top-10 -right-12 h-40 w-40 rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle, ${tier.glow} 0%, transparent 70%)` }}
      />

      <div className="relative z-10 p-5 space-y-4">

        {/* ── Top row: title + tier badge ───────────────────────────────── */}
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame size={16} className="text-amber-500" fill="currentColor" />
            <span className="text-sm font-semibold nz-text tracking-tight">{t.title}</span>
          </div>

          <div
            className="absolute right-0 top-0 flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold"
            style={{
              color: tier.color,
              borderColor: `${tier.color}33`,
              background: `${tier.color}0f`,
            }}
            title={`ধারা স্তর: ${tier.label}`}
          >
            <span style={{ fontSize: '9px' }}>{tier.icon}</span>
            {tier.label}
          </div>
        </div>

        {/* ── Main stats row ─────────────────────────────────────────────── */}
        <div className="rounded-2xl px-4 py-4 text-center nz-soft">
          <div className="text-xs font-semibold nz-accent">{t.currentStreak}</div>
          <div
            className={`mt-1 text-4xl font-bold tabular-nums nz-text ${!mounted ? 'animate-pulse' : ''}`}
          >
            {mounted ? animatedStreak : 0}
          </div>
          <div className="mt-1 text-[11px] font-medium nz-muted">{language === 'bn' ? 'দিন' : 'days'}</div>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            <div className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold nz-soft nz-gold">
              <Trophy size={12} /> {t.bestStreak} {bestStreak} {language === 'bn' ? 'দিন' : 'days'}
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold nz-chip">
              <Target size={12} /> {t.todayProgress} {todayProgress}/{totalPrayers} {t.completed}
            </div>
          </div>

          {isNewBest && currentStreak > 0 && (
            <div className="mx-auto mt-2 w-fit rounded-full px-2 py-0.5 text-[10px] font-semibold nz-soft nz-gold">
              <Star size={10} className="mr-1 inline" /> {t.newBest}
            </div>
          )}
        </div>

        {/* ── Today's 5 prayer dots ────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold nz-accent tracking-wide uppercase">
              {t.progressTitle}
            </span>
            <span className="text-[11px] nz-muted">{t.todayProgress} {todayProgress}/{totalPrayers} {t.completed}</span>
          </div>

          <div className="h-2 overflow-hidden rounded-full nz-soft">
            <div
              className="h-full rounded-full"
              style={{
                width: mounted ? `${animatedProgress}%` : '0%',
                transition: 'width 1s cubic-bezier(0.34,1.56,0.64,1)',
                background: 'linear-gradient(90deg, #059669 0%, #0f766e 70%, #d4af37 100%)',
              }}
            />
          </div>

          <div className="mt-2 text-[11px] font-medium nz-muted">
            {language === 'bn'
              ? `আজকের ${remainingPrayers} ওয়াক্ত বাকি`
              : `${remainingPrayers} ${t.remaining}`}
          </div>
        </div>

        {/* ── Motivation quote ──────────────────────────────────────────── */}
        <div className="flex items-start gap-2.5 rounded-xl px-3.5 py-3 nz-soft">
          <span className="text-sm mt-0.5 nz-gold">✦</span>
          <p className="text-xs leading-relaxed nz-text">{getMotivation(currentStreak, language)}</p>
        </div>

      </div>
    </div>
  );
}
