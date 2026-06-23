'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Trophy, Target, Star, TrendingUp, Calendar, Sparkles } from 'lucide-react';
import StreakRing from '@/components/ui/StreakRing';
import StreakFlame from '@/components/ui/StreakFlame';
import TierBadge, { getStreakTier, getNextTier, getTierProgress } from '@/components/ui/TierBadge';
import MilestoneCelebration from '@/components/ui/MilestoneCelebration';

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
    currentStreak: 'চলমান ধারা',
    bestStreak: 'সর্বোচ্চ',
    today: 'আজ',
    completed: 'সম্পন্ন',
    remaining: 'ওয়াক্ত বাকি',
    newBest: 'নতুন সেরা! 🎉',
    progressTitle: 'আজকের অগ্রগতি',
    days: 'দিন',
    nextTier: 'পরবর্তী স্তর',
    keepGoing: 'চালিয়ে যান',
    perfectWeek: 'নিখুঁত সপ্তাহ',
  },
  en: {
    title: 'Prayer Streak',
    currentStreak: 'Current streak',
    bestStreak: 'Best',
    today: 'Today',
    completed: 'completed',
    remaining: 'prayers remaining',
    newBest: 'New best! 🎉',
    progressTitle: "Today's progress",
    days: 'days',
    nextTier: 'Next tier',
    keepGoing: 'Keep going',
    perfectWeek: 'Perfect week',
  },
};

function getMotivation(streak: number, language: 'bn' | 'en') {
  if (language === 'en') {
    if (streak >= 30) return 'MashaAllah! Thirty days straight — remarkable dedication. May Allah accept your consistency.';
    if (streak >= 14) return 'Two weeks consistent! You\'re building a beautiful habit. Keep going!';
    if (streak >= 7)  return 'A full week! You\'ve proven your commitment. Maintain this momentum.';
    if (streak >= 3)  return 'Three days strong! You\'re building discipline. Aim for a full week.';
    if (streak === 1) return 'Great start! Every journey begins with a single step. Keep your streak alive today.';
    return 'Begin today — every prayer is a step closer to Allah.';
  }
  if (streak >= 30) return 'মাশাআল্লাহ! তিরিশ দিনের ধারা — অসাধারণ নিষ্ঠা। আল্লাহ আপনার ধারাবাহিকতা কবুল করুন।';
  if (streak >= 14) return 'দুই সপ্তাহ ধারাবাহিক! চমৎকার অভ্যাস গড়ে তুলছেন। এভাবেই চালিয়ে যান!';
  if (streak >= 7)  return 'এক সপ্তাহ পূর্ণ! আপনি আপনার অঙ্গীকার প্রমাণ করেছেন। এই গতি বজায় রাখুন।';
  if (streak >= 3)  return 'তিন দিন শক্তিশালী! আপনি শৃঙ্খলা গড়ে তুলছেন। পুরো সপ্তাহের লক্ষ্য রাখুন।';
  if (streak === 1) return 'শুভ সূচনা! প্রতিটি যাত্রা প্রথম পদক্ষেপ দিয়ে শুরু হয়। আজ আপনার ধারা বজায় রাখুন।';
  return 'আজ থেকেই শুরু করুন — প্রতিটি নামাজ আল্লাহর কাছাকাছি নিয়ে যায়।';
}

function getLast7Days(): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2);
    days.push(dayName);
  }
  return days;
}

// Simple day label
const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const CONTAINER = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
};

const ITEM = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
};

export default function DailyStreakWidget({ currentStreak, bestStreak, todayProgress, totalPrayers, language }: Props) {
  const t = COPY[language];
  const [mounted, setMounted] = useState(false);
  const [showMilestone, setShowMilestone] = useState(false);
  const [prevStreak, setPrevStreak] = useState(currentStreak);
  const prevStreakRef = useRef(currentStreak);

  const pct = totalPrayers > 0 ? (todayProgress / totalPrayers) * 100 : 0;
  const tier = getStreakTier(currentStreak);
  const { next: nextTier, progressPct: tierProgress } = getTierProgress(currentStreak);
  const isNewBest = currentStreak >= bestStreak && currentStreak > 0;
  const remainingPrayers = Math.max(0, totalPrayers - todayProgress);

  // Milestone detection — show celebration on streak increase
  useEffect(() => {
    if (currentStreak > prevStreakRef.current && currentStreak > 0) {
      // Check if it's a milestone day
      const isMilestone = [3, 7, 14, 30, 100].includes(currentStreak);
      if (isMilestone) {
        setShowMilestone(true);
      }
    }
    prevStreakRef.current = currentStreak;
    setPrevStreak(currentStreak);
  }, [currentStreak]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Generate random-ish data for the mini timeline (last 7 days)
  const timelineData = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (6 - i));
      const dayOfWeek = d.getDay();
      // Simulate some data based on day progression
      const base = currentStreak - (6 - i);
      const val = base > 0 ? Math.min(Math.max(base, 0), 5) : Math.max(5 - (6 - i) * 0.7, 0);
      return {
        label: DAY_LABELS[dayOfWeek],
        value: Math.round(Math.min(Math.max(val, 0), 5)),
        isToday: i === 6,
      };
    });
  }, [currentStreak]);

  const milestoneMessage = useMemo(() => {
    if (currentStreak === 3) return language === 'bn' ? '৩ দিনের ধারা!' : '3-Day Streak!';
    if (currentStreak === 7) return language === 'bn' ? 'এক সপ্তাহ!' : 'One Week!';
    if (currentStreak === 14) return language === 'bn' ? '১৪ দিনের ধারা!' : '14-Day Streak!';
    if (currentStreak === 30) return language === 'bn' ? '৩০ দিন — মুত্তাকী!' : '30 Days — Muttaqi!';
    if (currentStreak === 100) return language === 'bn' ? '১০০ দিন — প্লাটিনাম!' : '100 Days — Platinum!';
    return '';
  }, [currentStreak, language]);

  const milestoneSub = useMemo(() => {
    if (currentStreak === 3) return language === 'bn' ? 'সাবিত-কদম স্তর আনলক!' : 'Steady level unlocked!';
    if (currentStreak === 7) return language === 'bn' ? 'মুদাওয়িম স্তর আনলক!' : 'Mudaawim level unlocked!';
    if (currentStreak === 14) return language === 'bn' ? 'মুহাসিন স্তর আনলক!' : 'Muhsin level unlocked!';
    if (currentStreak === 30) return language === 'bn' ? 'মুত্তাকী স্তর আনলক!' : 'Muttaqi level unlocked!';
    if (currentStreak === 100) return language === 'bn' ? 'প্লাটিনাম মুত্তাকী!' : 'Platinum Muttaqi!';
    return '';
  }, [currentStreak, language]);

  return (
    <>
      {/* Milestone Celebration */}
      <MilestoneCelebration
        show={showMilestone}
        message={milestoneMessage}
        submessage={milestoneSub}
        onComplete={() => setShowMilestone(false)}
      />

      <motion.div
        variants={CONTAINER}
        initial="hidden"
        animate="show"
        className="relative overflow-hidden rounded-2xl nz-elevated-panel nz-streak-card"
      >
        {/* Spiritual motif overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='48' height='48' viewBox='0 0 48 48' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M24 6L42 24L24 42L6 24Z' fill='none' stroke='%230f3d2e' stroke-width='0.7'/%3E%3C/svg%3E")`,
            backgroundSize: '48px 48px',
          }}
        />

        {/* Gradient orb */}
        <div
          className="absolute -top-10 -right-12 h-40 w-40 rounded-full pointer-events-none"
          style={{ background: `radial-gradient(circle, ${tier.glowColor} 0%, transparent 70%)` }}
        />

        <div className="relative z-10 p-5 space-y-4">
          {/* ── Header Row ── */}
          <motion.div variants={ITEM} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StreakFlame streak={currentStreak} size={18} />
              <span className="text-sm font-semibold tracking-tight nz-text">{t.title}</span>
            </div>
            <TierBadge streak={currentStreak} language={language} size="sm" showProgress={false} />
          </motion.div>

          {/* ── Main Stats: Three Rings ── */}
          <motion.div variants={ITEM} className="nz-streak-ring-container">
            <StreakRing
              value={currentStreak}
              maxValue={Math.max(bestStreak, 1)}
              size={76}
              strokeWidth={5}
              accentColor={tier.color}
              label={t.days}
              sublabel={t.currentStreak}
              delay={100}
            />
            <StreakRing
              value={bestStreak}
              maxValue={Math.max(bestStreak, 1)}
              size={60}
              strokeWidth={4}
              accentColor="var(--nz-gold)"
              label=""
              sublabel={t.bestStreak}
              delay={200}
            />
            <StreakRing
              value={todayProgress}
              maxValue={totalPrayers}
              size={60}
              strokeWidth={4}
              accentColor="var(--nz-accent)"
              label=""
              sublabel={t.today}
              delay={300}
            />
          </motion.div>

          {/* ── New Best Badge ── */}
          {isNewBest && currentStreak > 0 && (
            <motion.div
              variants={ITEM}
              className="flex justify-center"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.4 }}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold"
                style={{
                  background: 'linear-gradient(135deg, rgba(212,175,55,0.15), rgba(212,175,55,0.08))',
                  color: tier.color,
                  border: `1px solid ${tier.color}33`,
                }}
              >
                <Sparkles size={12} />
                {t.newBest}
              </motion.div>
            </motion.div>
          )}

          {/* ── Progress Bar ── */}
          <motion.div variants={ITEM}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold tracking-wide uppercase" style={{ color: 'var(--nz-accent)' }}>
                {t.progressTitle}
              </span>
              <span className="text-[11px]" style={{ color: 'var(--nz-muted)' }}>
                {todayProgress}/{totalPrayers} {t.completed}
              </span>
            </div>

            <div className="relative h-2.5 overflow-hidden rounded-full" style={{ background: 'var(--nz-soft)' }}>
              <motion.div
                className="absolute inset-0 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: mounted ? `${pct}%` : '0%' }}
                transition={{ duration: 1.2, ease: [0.34, 1.56, 0.64, 1], delay: 0.5 }}
                style={{
                  background: `linear-gradient(90deg, var(--nz-accent-strong) 0%, ${tier.color} 100%)`,
                  boxShadow: `0 0 12px ${tier.glowColor}`,
                }}
              />
            </div>

            {remainingPrayers > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-2 text-[11px] font-medium"
                style={{ color: 'var(--nz-muted)' }}
              >
                {language === 'bn'
                  ? `আজকের ${remainingPrayers} ওয়াক্ত বাকি`
                  : `${remainingPrayers} ${t.remaining}`}
              </motion.div>
            )}
          </motion.div>

          {/* ── Mini Timeline ── */}
          <motion.div variants={ITEM}>
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={11} style={{ color: 'var(--nz-muted)' }} />
              <span className="text-[10px] font-semibold tracking-wide uppercase" style={{ color: 'var(--nz-muted)' }}>
                {language === 'bn' ? 'সাপ্তাহিক ধারা' : 'Weekly streak'}
              </span>
            </div>
            <div className="nz-streak-timeline">
              {timelineData.map((day, i) => (
                <div key={i} className="nz-streak-timeline-day">
                  <div
                    className="nz-streak-timeline-bar"
                    style={{
                      height: `${Math.max(day.value * 20, 4)}px`,
                      background: day.isToday
                        ? `linear-gradient(180deg, ${tier.color}, var(--nz-accent-strong))`
                        : day.value >= 5
                          ? 'var(--nz-accent-strong)'
                          : day.value >= 3
                            ? 'var(--nz-accent)'
                            : day.value > 0
                              ? 'var(--nz-accent-soft)'
                              : 'var(--nz-accent-softer)',
                      opacity: day.isToday ? 1 : 0.7,
                      boxShadow: day.isToday ? `0 0 8px ${tier.glowColor}` : 'none',
                    }}
                  />
                  <span className="nz-streak-timeline-label">{day.label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ── Tier Progress ── */}
          {nextTier && (
            <motion.div variants={ITEM}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--nz-muted)' }}>
                  {t.nextTier}: {language === 'bn' ? nextTier.labelBn : nextTier.label}
                </span>
                <span className="text-[10px] font-semibold" style={{ color: tier.color }}>
                  {tierProgress}%
                </span>
              </div>
              <div className="h-1 overflow-hidden rounded-full" style={{ background: 'var(--nz-accent-softer)' }}>
                <motion.div
                  className="h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: mounted ? `${tierProgress}%` : '0%' }}
                  transition={{ duration: 1, ease: [0.34, 1.56, 0.64, 1], delay: 0.6 }}
                  style={{ background: tier.color }}
                />
              </div>
            </motion.div>
          )}

          {/* ── Motivation Quote ── */}
          <motion.div
            variants={ITEM}
            className="nz-streak-quote"
          >
            <div className="flex items-start gap-2.5 relative z-10">
              <span className="text-sm mt-0.5" style={{ color: tier.color }}>✦</span>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--nz-text)' }}>
                {getMotivation(currentStreak, language)}
              </p>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </>
  );
}