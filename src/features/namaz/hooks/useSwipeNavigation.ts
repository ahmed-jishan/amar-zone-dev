'use client';

import { useRef, useCallback } from 'react';

interface SwipeOptions {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  threshold?: number;
}

/**
 * Custom hook for swipe gesture navigation.
 * Returns refs to attach to your container element.
 */
export function useSwipeNavigation({ onSwipeLeft, onSwipeRight, threshold = 60 }: SwipeOptions) {
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchStartTime = useRef(0);
  const isSwiping = useRef(false);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchStartTime.current = Date.now();
    isSwiping.current = false;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartX.current) return;
    const deltaX = e.touches[0].clientX - touchStartX.current;
    const deltaY = e.touches[0].clientY - touchStartY.current;

    // Only consider horizontal swipes (prevent vertical scroll conflicts)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 20) {
      isSwiping.current = true;
    }
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStartX.current) return;
      const deltaX = e.changedTouches[0].clientX - touchStartX.current;
      const deltaY = e.changedTouches[0].clientY - touchStartY.current;
      const elapsed = Date.now() - touchStartTime.current;

      // Must be horizontal, fast enough (< 300ms), and beyond threshold
      if (Math.abs(deltaX) > Math.abs(deltaY) && elapsed < 300 && Math.abs(deltaX) > threshold) {
        if (deltaX > 0) {
          onSwipeRight();
        } else {
          onSwipeLeft();
        }
      }

      touchStartX.current = 0;
      touchStartY.current = 0;
      touchStartTime.current = 0;
      isSwiping.current = false;
    },
    [onSwipeLeft, onSwipeRight, threshold]
  );

  return {
    swipeHandlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    },
  };
}