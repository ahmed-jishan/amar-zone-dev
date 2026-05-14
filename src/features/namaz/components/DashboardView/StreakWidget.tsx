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
}

// Prayer names in Bengali
const PRAYER_NAMES = ['ফজর', 'যোহর', 'আসর', 'মাগরিব', 'ইশা'];

// Streak tier config
function getStreakTier(streak: number) {
  if (streak >= 30) return { label: 'মুত্তাকী',    color: '#d4af37', glow: 'rgba(212,175,55,0.25)',  icon: '✦' };
  if (streak >= 14) return { label: 'মুহাসিন',     color: '#059669', glow: 'rgba(5,150,105,0.20)',   icon: '◆' };
  if (streak >= 7)  return { label: 'মুদাওয়িম',   color: '#0d9488', glow: 'rgba(13,148,136,0.20)',  icon: '●' };
  if (streak >= 3)  return { label: 'সাবিত-কদম',  color: '#6d8c53', glow: 'rgba(109,140,83,0.20)',   icon: '○' };
  return              { label: 'মুবতাদী',           color: '#92670a', glow: 'rgba(146,103,10,0.15)',  icon: '◌' };
}

function getMotivation(streak: number) {
  if (streak >= 30) return 'মাশাআল্লাহ! তিরিশ দিনের ধারা — অসাধারণ নিষ্ঠা।';
  if (streak >= 14) return 'দুই সপ্তাহ ধারাবাহিক! আল্লাহ কবুল করুন।';
  if (streak >= 7)  return 'এক সপ্তাহ পূর্ণ! ধারা বজায় রাখুন।';
  if (streak >= 3)  return 'ভালো শুরু। প্রতিদিন পাঁচ ওয়াক্ত নামাজ পড়ুন।';
  if (streak === 1) return 'শুভ সূচনা! আজকের ধারা বজায় রাখুন।';
  return 'আজ থেকেই শুরু করুন — প্রতিটি নামাজ গুরুত্বপূর্ণ।';
}

export default function DailyStreakWidget({ currentStreak, bestStreak, todayProgress, totalPrayers }: Props) {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [animatedStreak, setAnimatedStreak] = useState(0);
  const [mounted, setMounted] = useState(false);

  const pct     = totalPrayers > 0 ? (todayProgress / totalPrayers) * 100 : 0;
  const tier    = getStreakTier(currentStreak);
  const isNewBest = currentStreak >= bestStreak && currentStreak > 0;

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
    <div
      className="relative overflow-hidden rounded-2xl border border-emerald-100 shadow-sm"
      style={{
        background: 'linear-gradient(145deg, rgba(255,255,255,0.82) 0%, rgba(240,253,244,0.70) 50%, rgba(254,252,232,0.60) 100%)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* ── Geometric pattern overlay (matches root bg motif) ─────────── */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.035]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 3L37 20L20 37L3 20Z' fill='none' stroke='%23065742' stroke-width='0.7'/%3E%3C/svg%3E")`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* ── Subtle tier glow in top-right corner ──────────────────────── */}
      <div
        className="absolute -top-10 -right-10 w-40 h-40 rounded-full pointer-events-none transition-all duration-700"
        style={{ background: `radial-gradient(circle, ${tier.glow} 0%, transparent 70%)` }}
      />

      <div className="relative z-10 p-5 space-y-5">

        {/* ── Top row: title + tier badge ───────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Flame size={16} className="text-orange-500" fill="currentColor" />
              <span className="text-sm font-bold text-emerald-900 tracking-tight">নামাজের ধারা</span>
            </div>
          </div>

          {/* Tier badge */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border"
            style={{
              color: tier.color,
              borderColor: `${tier.color}40`,
              background: `${tier.color}10`,
            }}
          >
            <span style={{ fontSize: '9px' }}>{tier.icon}</span>
            {tier.label}
          </div>
        </div>

        {/* ── Main stats row ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">

          {/* Current streak — circular ring */}
          <div
            className="relative flex flex-col items-center justify-center rounded-2xl py-4 border gap-1"
            style={{
              background: 'rgba(255,255,255,0.75)',
              borderColor: `${tier.color}30`,
              boxShadow: `0 2px 12px ${tier.glow}`,
            }}
          >
            {/* SVG ring */}
            <div className="relative">
              <svg width="72" height="72" className="-rotate-90">
                {/* Track */}
                <circle cx="36" cy="36" r={RING_R} fill="none" stroke="rgba(6,95,70,0.08)" strokeWidth="4" />
                {/* Progress */}
                <circle
                  cx="36" cy="36" r={RING_R}
                  fill="none"
                  stroke={tier.color}
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={RING_C}
                  strokeDashoffset={mounted ? RING_C * (1 - streakPct) : RING_C}
                  style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.34,1.56,0.64,1)' }}
                />
              </svg>
              {/* Center number */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span
                  className="text-2xl font-bold leading-none"
                  style={{ color: tier.color, fontFamily: 'Georgia, serif',
                    transition: 'all 0.6s ease',
                    textShadow: `0 0 12px ${tier.glow}` }}
                >
                  {mounted ? animatedStreak : 0}
                </span>
                <span className="text-[9px] text-emerald-500 mt-0.5">দিন</span>
              </div>
            </div>
            <p className="text-[11px] font-medium text-emerald-700">বর্তমান ধারা</p>
            {isNewBest && currentStreak > 0 && (
              <div className="absolute -top-1.5 -right-1.5 flex items-center gap-0.5 bg-amber-400 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow">
                <Star size={7} fill="white" /> সেরা
              </div>
            )}
          </div>

          {/* Best streak + today's count */}
          <div className="flex flex-col gap-3">
            {/* Best streak */}
            <div
              className="flex items-center justify-between rounded-xl px-3 py-2.5 border"
              style={{
                background: 'rgba(255,255,255,0.75)',
                borderColor: 'rgba(180,145,20,0.2)',
              }}
            >
              <div>
                <p className="text-[10px] text-amber-600 font-medium">সর্বোচ্চ ধারা</p>
                <p className="text-xl font-bold text-amber-700" style={{ fontFamily: 'Georgia, serif' }}>
                  {bestStreak}
                  <span className="text-xs font-normal ml-1 text-amber-500">দিন</span>
                </p>
              </div>
              <Trophy size={20} className="text-amber-400" />
            </div>

            {/* Today count */}
            <div
              className="flex items-center justify-between rounded-xl px-3 py-2.5 border"
              style={{
                background: 'rgba(255,255,255,0.75)',
                borderColor: 'rgba(5,150,105,0.15)',
              }}
            >
              <div>
                <p className="text-[10px] text-emerald-600 font-medium">আজকের নামাজ</p>
                <p className="text-xl font-bold text-emerald-800" style={{ fontFamily: 'Georgia, serif' }}>
                  {todayProgress}
                  <span className="text-xs font-normal ml-0.5 text-emerald-400">/ {totalPrayers}</span>
                </p>
              </div>
              <Target size={20} className="text-emerald-400" />
            </div>
          </div>
        </div>

        {/* ── Today's 5 prayer dots ────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-emerald-700 tracking-wide uppercase">
              আজকের অগ্রগতি
            </span>
            <span className="text-[11px] text-emerald-500">{todayProgress}/{totalPrayers} পড়া হয়েছে</span>
          </div>

          {/* Prayer name dots */}
          <div className="flex gap-2">
            {PRAYER_NAMES.map((name, i) => {
              const done = i < todayProgress;
              return (
                <div key={name} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full h-1.5 rounded-full transition-all duration-500"
                    style={{
                      transitionDelay: `${i * 80}ms`,
                      background: done
                        ? `linear-gradient(90deg, #059669, #0d9488)`
                        : 'rgba(6,95,70,0.10)',
                      boxShadow: done ? '0 0 6px rgba(5,150,105,0.3)' : 'none',
                    }}
                  />
                  <span className="text-[9px] text-emerald-500">{name}</span>
                </div>
              );
            })}
          </div>

          {/* Animated fill bar */}
          <div className="mt-2 h-1 bg-emerald-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: mounted ? `${animatedProgress}%` : '0%',
                transition: 'width 1s cubic-bezier(0.34,1.56,0.64,1)',
                background: 'linear-gradient(90deg, #059669 0%, #0d9488 60%, #d4af37 100%)',
                boxShadow: '0 0 8px rgba(5,150,105,0.3)',
              }}
            />
          </div>
        </div>

        {/* ── Motivation quote ──────────────────────────────────────────── */}
        <div
          className="flex items-start gap-2.5 rounded-xl px-3.5 py-3 border"
          style={{
            background: 'rgba(254,252,232,0.6)',
            borderColor: 'rgba(180,145,20,0.15)',
          }}
        >
          <span className="text-amber-500 text-sm mt-0.5" style={{ fontFamily: 'Georgia, serif' }}>✦</span>
          <p className="text-xs text-amber-800 leading-relaxed italic">{getMotivation(currentStreak)}</p>
        </div>

      </div>
    </div>
  );
}