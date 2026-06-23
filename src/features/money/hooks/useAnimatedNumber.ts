'use client'

import { useState, useEffect, useRef } from 'react'

/**
 * Animated counter hook — Apple-style number animation.
 * Animates from previous value to current value with spring easing.
 */
export function useAnimatedNumber(target: number, duration = 500) {
  const [display, setDisplay] = useState(target)
  const prevRef = useRef(target)
  const frameRef = useRef<number>()

  useEffect(() => {
    const start = prevRef.current
    const diff = target - start
    if (Math.abs(diff) < 0.01) {
      setDisplay(target)
      prevRef.current = target
      return
    }

    const startTime = performance.now()

    function animate(time: number) {
      const elapsed = time - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Spring-like easing
      const eased = 1 - Math.pow(1 - progress, 3) + (progress < 0.6 ? Math.sin(progress * Math.PI * 2) * 0.04 : 0)
      setDisplay(start + diff * eased)

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate)
      } else {
        setDisplay(target)
        prevRef.current = target
      }
    }

    frameRef.current = requestAnimationFrame(animate)
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [target, duration])

  return Math.round(display * 100) / 100
}
