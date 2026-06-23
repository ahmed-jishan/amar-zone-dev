'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  rotation: number;
  shape: 'circle' | 'star' | 'diamond';
}

const COLORS = ['#d4af37', '#059669', '#0d9488', '#818cf8', '#f59e0b', '#10b981', '#34d399'];

interface MilestoneCelebrationProps {
  show: boolean;
  /** Message to display (e.g., "7-Day Streak!") */
  message: string;
  /** Sub-message (e.g., "Mudaawim level unlocked") */
  submessage?: string;
  onComplete?: () => void;
}

export default function MilestoneCelebration({ show, message, submessage, onComplete }: MilestoneCelebrationProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [visible, setVisible] = useState(false);

  const generateParticles = useCallback(() => {
    const items: Particle[] = [];
    for (let i = 0; i < 24; i++) {
      items.push({
        id: i,
        x: Math.random() * 100,
        y: -10 - Math.random() * 20,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: 4 + Math.random() * 8,
        rotation: Math.random() * 360,
        shape: (['circle', 'star', 'diamond'] as const)[Math.floor(Math.random() * 3)],
      });
    }
    return items;
  }, []);

  useEffect(() => {
    if (show) {
      setParticles(generateParticles());
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        onComplete?.();
      }, 2400);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [show, generateParticles, onComplete]);

  const getShapeStyle = (p: Particle) => {
    const base = {
      width: p.size,
      height: p.size,
      backgroundColor: p.color,
    };
    if (p.shape === 'circle') return { ...base, borderRadius: '50%' };
    if (p.shape === 'diamond') return { ...base, transform: `rotate(${p.rotation}deg)`, borderRadius: '2px' };
    // star shape via clip-path
    return {
      ...base,
      clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
    };
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="pointer-events-none fixed inset-0 z-[9999] flex items-center justify-center"
          style={{ isolation: 'isolate' }}
        >
          {/* Particles */}
          {particles.map((p) => (
            <motion.div
              key={p.id}
              className="absolute"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                ...getShapeStyle(p),
              }}
              initial={{ opacity: 1, y: 0, x: 0, scale: 0 }}
              animate={{
                opacity: [1, 0.8, 0],
                y: [0, 120 + Math.random() * 180],
                x: [0, (Math.random() - 0.5) * 120],
                scale: [0, 1.2, 0.6],
                rotate: p.rotation + 360,
              }}
              transition={{
                duration: 1.8 + Math.random() * 0.6,
                ease: [0.16, 1, 0.3, 1],
                delay: Math.random() * 0.3,
              }}
            />
          ))}

          {/* Message */}
          <motion.div
            initial={{ opacity: 0, scale: 0.6, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            transition={{ type: 'spring', stiffness: 200, damping: 18, delay: 0.1 }}
            className="flex flex-col items-center gap-2 rounded-3xl px-8 py-6 text-center"
            style={{
              background: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,0.12)',
              maxWidth: '280px',
            }}
          >
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 12, delay: 0.3 }}
              className="text-3xl"
            >
              🎉
            </motion.span>
            <span className="text-base font-bold text-white tracking-tight">{message}</span>
            {submessage && (
              <span className="text-xs font-medium text-white/60">{submessage}</span>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}