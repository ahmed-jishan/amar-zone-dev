'use client';

import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';

interface StreakFlameProps {
  streak: number;
  size?: number;
  animated?: boolean;
}

function getFlameColor(streak: number): string {
  if (streak >= 100) return '#818cf8'; // Diamond
  if (streak >= 30) return '#d4af37';  // Gold
  if (streak >= 14) return '#059669';  // Emerald
  if (streak >= 7) return '#0d9488';   // Teal
  if (streak >= 3) return '#6d8c53';   // Green
  return '#f59e0b';                     // Amber
}

function getFlameGlow(streak: number): string {
  if (streak >= 100) return 'rgba(129,140,248,0.35)';
  if (streak >= 30) return 'rgba(212,175,55,0.35)';
  if (streak >= 14) return 'rgba(5,150,105,0.30)';
  if (streak >= 7) return 'rgba(13,148,136,0.25)';
  if (streak >= 3) return 'rgba(109,140,83,0.20)';
  return 'rgba(245,158,11,0.20)';
}

export default function StreakFlame({ streak, size = 20, animated = true }: StreakFlameProps) {
  const color = getFlameColor(streak);
  const glow = getFlameGlow(streak);

  if (!animated) {
    return (
      <Flame
        size={size}
        color={color}
        fill={color}
        strokeWidth={1.8}
      />
    );
  }

  return (
    <motion.div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {/* Glow effect */}
      <motion.div
        className="absolute inset-0 rounded-full"
        animate={{
          opacity: [0.3, 0.6, 0.3],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          background: `radial-gradient(circle, ${glow} 0%, transparent 70%)`,
        }}
      />

      {/* Flame icon */}
      <motion.div
        className="relative z-10"
        animate={{
          scale: [1, 1.06, 1, 0.96, 1],
          rotate: [0, -1.5, 1, -0.5, 0],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{ transformOrigin: 'center bottom' }}
      >
        <Flame
          size={size}
          color={color}
          fill={color}
          strokeWidth={1.8}
        />
      </motion.div>
    </motion.div>
  );
}