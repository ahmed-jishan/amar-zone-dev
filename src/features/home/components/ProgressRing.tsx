'use client'

import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { useEffect } from 'react'

interface ProgressRingProps {
  progress: number // 0–100
  size?: number
  strokeWidth?: number
  color?: string
  trackColor?: string
  children?: React.ReactNode
  delay?: number
}

export default function ProgressRing({
  progress,
  size = 72,
  strokeWidth = 5,
  color = '#6366f1',
  trackColor = 'rgba(99,102,241,0.12)',
  children,
  delay = 0,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const count = useMotionValue(0)
  const dashOffset = useTransform(count, (v) => circumference * (1 - v / 100))

  useEffect(() => {
    const controls = animate(count, Math.min(progress, 100), {
      type: 'spring',
      stiffness: 60,
      damping: 20,
      delay,
      restDelta: 0.5,
    })
    return controls.stop
  }, [progress, delay, count])

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Progress */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          style={{
            strokeDashoffset: dashOffset,
            filter: 'drop-shadow(0 0 4px ' + color + '40)',
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  )
}