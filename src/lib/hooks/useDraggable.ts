'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface UseDraggableOptions {
  /** Storage key for persisting position in localStorage */
  storageKey: string
  /** Initial position (defaults to right-4 top-4) */
  initialX?: number
  initialY?: number
  /** The element's width/height for bounds calculation */
  elementWidth?: number
  elementHeight?: number
}

export function useDraggable({
  storageKey,
  initialX = 0,
  initialY = 0,
  elementWidth = 48,
  elementHeight = 48,
}: UseDraggableOptions) {
  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    if (typeof window === 'undefined') return { x: initialX, y: initialY }
    try {
      const saved = window.localStorage.getItem(storageKey)
      if (saved) return JSON.parse(saved)
    } catch {}
    return { x: initialX, y: initialY }
  })

  const [isDragging, setIsDragging] = useState(false)
  const dragStart = useRef<{ x: number; y: number; posX: number; posY: number }>({ x: 0, y: 0, posX: 0, posY: 0 })
  const elementRef = useRef<HTMLDivElement>(null)
  const clickPrevented = useRef(false)

  const constrainToBounds = useCallback(
    (x: number, y: number) => {
      const w = typeof window !== 'undefined' ? window.innerWidth : 0
      const h = typeof window !== 'undefined' ? window.innerHeight : 0
      return {
        x: Math.max(0, Math.min(w - elementWidth, x)),
        y: Math.max(0, Math.min(h - elementHeight, y)),
      }
    },
    [elementWidth, elementHeight]
  )

  const savePosition = useCallback(
    (pos: { x: number; y: number }) => {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(pos))
      } catch {}
    },
    [storageKey]
  )

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      // Only start drag if not clicking on the button content (e.g. the badge)
      // We want the whole element to be draggable
      setIsDragging(true)
      clickPrevented.current = false
      dragStart.current = {
        x: e.clientX,
        y: e.clientY,
        posX: position.x,
        posY: position.y,
      }
      // Capture pointer to get events even outside element
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    },
    [position]
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return
      const dx = e.clientX - dragStart.current.x
      const dy = e.clientY - dragStart.current.y
      const distance = Math.abs(dx) + Math.abs(dy)
      if (distance > 5) {
        clickPrevented.current = true
      }
      const newPos = constrainToBounds(dragStart.current.posX + dx, dragStart.current.posY + dy)
      setPosition(newPos)
    },
    [isDragging, constrainToBounds]
  )

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (isDragging) {
        setIsDragging(false)
        const dx = e.clientX - dragStart.current.x
        const dy = e.clientY - dragStart.current.y
        const finalPos = constrainToBounds(dragStart.current.posX + dx, dragStart.current.posY + dy)
        setPosition(finalPos)
        savePosition(finalPos)
      }
    },
    [isDragging, constrainToBounds, savePosition]
  )

  // Re-apply constraints on window resize
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => constrainToBounds(prev.x, prev.y))
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [constrainToBounds])

  return {
    position,
    isDragging,
    clickPrevented: clickPrevented.current,
    elementRef,
    handlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
    },
  }
}
