'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface StreakRingProps {
  /** Current streak value (0–best) */
  value: number;
  /** Best streak for scaling the ring */
  maxValue: number;
  /** Size in px */
  size?: number;
  /** Stroke width */
  strokeWidth?: number;
  /** Color when at max */
  accentColor?: string;
  /** Label below the ring */
  label?: string;
  /** Sub-label */
  sublabel?: string;
  /** Delay before animation starts (ms) */
  delay?: number;
}

export default function StreakRing({
  value,
  maxValue,
  size = 72,
  strokeWidth = 5,
  accentColor,
  label,
  sublabel,
  delay = 200,
}: StreakRingProps) {
  const [animatedValue, setAnimatedValue] = useState(0);
  const [mounted, setMounted] = useState(false);

  const pct = maxValue > 0 ? Math.min(value / maxValue, 1) : 0;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct);

  const color = accentColor || 'var(--nz-accent-strong)';

  useEffect(() => {
    setMounted(true);
    const t = setTimeout(() => setAnimatedValue(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 120, damping: 18, delay: delay / 1000 }}
      className="relative inline-flex flex-col items-center"
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--nz-accent-softer)"
          strokeWidth={strokeWidth}
        />
        {/* Progress ring with animated stroke-dashoffset */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: mounted ? offset : circumference }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: delay / 1000 + 0.2 }}
        />
      </svg>

      {/* Center text */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center"
        style={{ width: size, height: size }}
      >
        <motion.span
          key={value}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-lg font-bold tabular-nums leading-none"
          style={{ color: 'var(--nz-text)' }}
        >
          {mounted ? animatedValue : 0}
        </motion.span>
        {sublabel && (
          <span className="text-[7px] font-semibold uppercase tracking-wider mt-0.5" style={{ color: 'var(--nz-muted)' }}>
            {sublabel}
          </span>
        )}
      </div>

      {label && (
        <span className="mt-2 text-[10px] font-semibold tracking-wide" style={{ color: 'var(--nz-muted)' }}>
          {label}
        </span>
      )}
    </motion.div>
  );
}