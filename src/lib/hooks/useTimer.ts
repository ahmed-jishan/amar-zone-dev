import { useState, useEffect, useRef, useCallback } from 'react'

interface UseTimerOptions {
  initialMinutes?: number
  onComplete?: () => void
}

export function useTimer({ initialMinutes = 25, onComplete }: UseTimerOptions = {}) {
  const [totalSeconds, setTotalSeconds] = useState(initialMinutes * 60)
  const [isRunning, setIsRunning]       = useState(false)
  const [phase, setPhase]               = useState<'work' | 'break'>('work')
  const intervalRef                     = useRef<ReturnType<typeof setInterval>>()

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTotalSeconds((s) => {
          if (s <= 1) {
            clearInterval(intervalRef.current)
            setIsRunning(false)
            onComplete?.()
            return 0
          }
          return s - 1
        })
      }, 1000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [isRunning, onComplete])

  const start = useCallback(() => setIsRunning(true), [])
  const pause = useCallback(() => setIsRunning(false), [])
  const reset = useCallback(
    (minutes = initialMinutes) => {
      setIsRunning(false)
      setTotalSeconds(minutes * 60)
    },
    [initialMinutes]
  )

  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return { minutes, seconds, totalSeconds, isRunning, phase, start, pause, reset, setPhase }
}
