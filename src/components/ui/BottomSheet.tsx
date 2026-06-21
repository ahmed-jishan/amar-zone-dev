'use client';

import { useEffect, useRef, useState, useCallback, type ReactNode } from 'react';
import { motion, AnimatePresence, type PanInfo } from 'framer-motion';
import { useHaptics } from '@/hooks/useHaptics';
import { springs } from '@/hooks/useSpringAnimation';

interface Props {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  snapPoints?: [number, number, number]; // e.g. [0.4, 0.7, 0.9] = 40%, 70%, 90%
  title?: string;
  showGrabHandle?: boolean;
  className?: string;
}

const DRAG_THRESHOLD = 80;
const VELOCITY_THRESHOLD = 500;

export default function BottomSheet({
  open,
  onClose,
  children,
  snapPoints = [0.5, 0.75, 0.92],
  title,
  showGrabHandle = true,
  className = '',
}: Props) {
  const [currentSnap, setCurrentSnap] = useState(1); // Start at middle snap
  const [sheetHeight, setSheetHeight] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const haptics = useHaptics();
  const draggedPastThreshold = useRef(false);

  // Calculate pixel values for snap points
  const getSnapPixels = useCallback(() => {
    const h = typeof window !== 'undefined' ? window.innerHeight : 800;
    return snapPoints.map((p) => h * (1 - p));
  }, [snapPoints]);

  const handleDragEnd = useCallback(
    (_: any, info: PanInfo) => {
      const { offset, velocity } = info;
      const snapPixels = getSnapPixels();

      // If dragged down fast or far enough, close
      if (offset.y > DRAG_THRESHOLD || velocity.y > VELOCITY_THRESHOLD) {
        if (currentSnap === 0 && offset.y > DRAG_THRESHOLD / 2) {
          haptics.heavy();
          onClose();
          return;
        }
        // Snap down
        const newSnap = Math.max(0, currentSnap - 1);
        setCurrentSnap(newSnap);
        if (newSnap === 0) haptics.tap();
        return;
      }

      // If dragged up fast or far enough, snap up
      if (offset.y < -DRAG_THRESHOLD || velocity.y < -VELOCITY_THRESHOLD) {
        const newSnap = Math.min(snapPoints.length - 1, currentSnap + 1);
        setCurrentSnap(newSnap);
        if (newSnap === snapPoints.length - 1) haptics.tap();
        return;
      }

      // Snap to nearest
      const currentTop = snapPixels[currentSnap] + offset.y;
      let nearest = 0;
      let minDist = Infinity;
      snapPixels.forEach((sp, i) => {
        const dist = Math.abs(currentTop - sp);
        if (dist < minDist) {
          minDist = dist;
          nearest = i;
        }
      });
      setCurrentSnap(nearest);
    },
    [currentSnap, getSnapPixels, onClose, haptics]
  );

  const handleDrag = useCallback(
    (_: any, info: PanInfo) => {
      const { offset } = info;
      if (offset.y > DRAG_THRESHOLD && !draggedPastThreshold.current) {
        draggedPastThreshold.current = true;
        haptics.swipeThreshold();
      } else if (offset.y < DRAG_THRESHOLD / 2) {
        draggedPastThreshold.current = false;
      }
    },
    [haptics]
  );

  // Close on backdrop tap
  const handleBackdropTap = useCallback(() => {
    haptics.tap();
    onClose();
  }, [onClose, haptics]);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Reset snap on open
  useEffect(() => {
    if (open) {
      setCurrentSnap(1);
      setSheetHeight(window.innerHeight);
    }
  }, [open]);

  const snapPixels = getSnapPixels();

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleBackdropTap}
          />

          {/* Sheet */}
          <motion.div
            ref={contentRef}
            drag="y"
            dragElastic={0.1}
            dragConstraints={{ top: snapPixels[0] - 20, bottom: 20 }}
            dragMomentum={false}
            onDragEnd={handleDragEnd}
            onDrag={handleDrag}
            initial={{ y: '100%' }}
            animate={{ y: snapPixels[currentSnap] }}
            exit={{ y: '100%' }}
            transition={springs.smooth}
            className={`
              relative w-full max-w-[520px] max-h-[100dvh]
              rounded-t-[var(--az-radius-2xl)]
              bg-[var(--az-surface-1)]
              border border-[var(--az-border)]
              shadow-[var(--az-shadow-lg)]
              overflow-hidden
              flex flex-col
              ${className}
            `}
            style={{ touchAction: 'none' }}
          >
            {/* Grab handle */}
            {showGrabHandle && (
              <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                <div className="w-10 h-1 rounded-full bg-[var(--az-text-4)] opacity-60" />
              </div>
            )}

            {/* Header */}
            {title && (
              <div className="flex items-center justify-between px-5 py-2 flex-shrink-0">
                <h2 className="text-[17px] font-bold text-[var(--az-text-1)] tracking-tight">
                  {title}
                </h2>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-[var(--az-text-3)] hover:text-[var(--az-text-1)] hover:bg-[var(--az-surface-hover)] transition-all"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {/* Content */}
            <div
              ref={contentRef}
              className="flex-1 overflow-y-auto az-scrollbar px-5 pb-6"
            >
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}