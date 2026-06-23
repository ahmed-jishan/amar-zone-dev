'use client';

import { motion } from 'framer-motion';

export interface StreakTier {
  level: number;
  label: string;
  labelBn: string;
  color: string;
  glowColor: string;
  icon: string;
  minStreak: number;
}

export const STREAK_TIERS: StreakTier[] = [
  { level: 0, label: 'Beginner', labelBn: 'মুবতাদী', color: '#92670a', glowColor: 'rgba(146,103,10,0.15)', icon: '◌', minStreak: 0 },
  { level: 1, label: 'Steady', labelBn: 'সাবিত-কদম', color: '#6d8c53', glowColor: 'rgba(109,140,83,0.20)', icon: '○', minStreak: 3 },
  { level: 2, label: 'Mudaawim', labelBn: 'মুদাওয়িম', color: '#0d9488', glowColor: 'rgba(13,148,136,0.20)', icon: '●', minStreak: 7 },
  { level: 3, label: 'Muhsin', labelBn: 'মুহাসিন', color: '#059669', glowColor: 'rgba(5,150,105,0.25)', icon: '◆', minStreak: 14 },
  { level: 4, label: 'Muttaqi', labelBn: 'মুত্তাকী', color: '#d4af37', glowColor: 'rgba(212,175,55,0.30)', icon: '✦', minStreak: 30 },
  { level: 5, label: 'Muttaqi Platinum', labelBn: 'মুত্তাকী প্লাটিনাম', color: '#818cf8', glowColor: 'rgba(129,140,248,0.30)', icon: '👑', minStreak: 100 },
];

export function getStreakTier(streak: number): StreakTier {
  return [...STREAK_TIERS].reverse().find((t) => streak >= t.minStreak) || STREAK_TIERS[0];
}

export function getNextTier(streak: number): StreakTier | null {
  return STREAK_TIERS.find((t) => t.minStreak > streak) || null;
}

export function getTierProgress(streak: number): { current: StreakTier; next: StreakTier | null; progressPct: number } {
  const current = getStreakTier(streak);
  const next = getNextTier(streak);
  if (!next) return { current, next: null, progressPct: 100 };
  const range = next.minStreak - current.minStreak;
  const done = streak - current.minStreak;
  return { current, next, progressPct: Math.min(Math.round((done / range) * 100), 100) };
}

interface TierBadgeProps {
  streak: number;
  size?: 'sm' | 'md' | 'lg';
  language?: 'en' | 'bn';
  showProgress?: boolean;
}

export default function TierBadge({ streak, size = 'md', language = 'en', showProgress = true }: TierBadgeProps) {
  const { current, next, progressPct } = getTierProgress(streak);
  const label = language === 'bn' ? current.labelBn : current.label;

  const sizeMap = { sm: 20, md: 28, lg: 36 };
  const fontSizeMap = { sm: 7, md: 9, lg: 11 };
  const iconSizeMap = { sm: 10, md: 13, lg: 16 };
  const px = sizeMap[size];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 150, damping: 20 }}
      className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5"
      style={{
        borderColor: `${current.color}33`,
        background: `${current.color}0f`,
      }}
      title={`${language === 'bn' ? 'স্তর' : 'Tier'}: ${label}`}
    >
      <span style={{ fontSize: iconSizeMap[size], lineHeight: 1, color: current.color }}>{current.icon}</span>
      <span className="font-semibold" style={{ fontSize: fontSizeMap[size], color: current.color, letterSpacing: '0.02em' }}>
        {label}
      </span>
      {showProgress && next && (
        <span className="font-medium ml-0.5" style={{ fontSize: fontSizeMap[size] - 1, color: `${current.color}88` }}>
          · {progressPct}%
        </span>
      )}
    </motion.div>
  );
}