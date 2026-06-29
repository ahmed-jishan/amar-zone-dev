'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface UseDraggableOptions {
  /** Storage key for persisting position in localStorage */
  storageKey: string
  /** Initial position. Defaults to top-right when the viewport is available. */
  initialX?: number
  initialY?: number
  /** The element's width/height for bounds calculation */
  elementWidth?: number
  elementHeight?: number
  /** Minimum distance from the viewport edge */
  viewportPadding?: number
}

type DragPoint = { x: number; y: number }

const getViewportSize = () => {
  if (typeof window === 'undefined') return { width: 0, height: 0 }
  return {
    width: window.visualViewport?.width ?? window.innerWidth,
    height: window.visualViewport?.height ?? window.innerHeight,
  }
}

const isPosition = (value: unknown): value is DragPoint => {
  if (!value || typeof value !== 'object') return false
  const position = value as Record<string, unknown>
  return typeof position.x === 'number' && typeof position.y === 'number'
}

export function useDraggable({
  storageKey,
  initialX,
  initialY,
  elementWidth = 48,
  elementHeight = 48,
  viewportPadding = 8,
}: UseDraggableOptions) {
  const getInitialPosition = useCallback(() => {
    if (typeof window === 'undefined') return { x: initialX ?? 0, y: initialY ?? 0 }
    const viewport = getViewportSize()
    return {
      x: initialX ?? Math.max(viewportPadding, viewport.width - elementWidth - viewportPadding),
      y: initialY ?? Math.max(viewportPadding, viewportPadding + 72),
    }
  }, [elementHeight, elementWidth, initialX, initialY, viewportPadding])

  const constrainToBounds = useCallback(
    (x: number, y: number) => {
      const viewport = getViewportSize()
      const maxX = Math.max(viewportPadding, viewport.width - elementWidth - viewportPadding)
      const maxY = Math.max(viewportPadding, viewport.height - elementHeight - viewportPadding)
      return {
        x: Math.max(viewportPadding, Math.min(maxX, x)),
        y: Math.max(viewportPadding, Math.min(maxY, y)),
      }
    },
    [elementWidth, elementHeight, viewportPadding]
  )

  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    if (typeof window === 'undefined') return { x: initialX ?? 0, y: initialY ?? 0 }
    try {
      const saved = window.localStorage.getItem(storageKey)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (isPosition(parsed)) return constrainToBounds(parsed.x, parsed.y)
      }
    } catch {}
    const initial = getInitialPosition()
    return constrainToBounds(initial.x, initial.y)
  })

  const [isDragging, setIsDragging] = useState(false)
  const dragStart = useRef<{ x: number; y: number; posX: number; posY: number }>({ x: 0, y: 0, posX: 0, posY: 0 })
  const elementRef = useRef<HTMLDivElement>(null)
  const isDraggingRef = useRef(false)
  const activePointerId = useRef<number | null>(null)
  const clickPrevented = useRef(false)

  const savePosition = useCallback(
    (pos: { x: number; y: number }) => {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(pos))
      } catch {}
    },
    [storageKey]
  )

  const beginDrag = useCallback(
    (point: DragPoint) => {
      isDraggingRef.current = true
      clickPrevented.current = false
      dragStart.current = {
        x: point.x,
        y: point.y,
        posX: position.x,
        posY: position.y,
      }
      setIsDragging(true)
    },
    [position]
  )

  const moveDrag = useCallback(
    (point: DragPoint) => {
      if (!isDraggingRef.current) return
      const dx = point.x - dragStart.current.x
      const dy = point.y - dragStart.current.y
      const distance = Math.abs(dx) + Math.abs(dy)
      if (distance > 5) {
        clickPrevented.current = true
      }
      const newPos = constrainToBounds(dragStart.current.posX + dx, dragStart.current.posY + dy)
      setPosition(newPos)
    },
    [constrainToBounds]
  )

  const endDrag = useCallback(
    (point?: DragPoint) => {
      if (!isDraggingRef.current) return
      isDraggingRef.current = false
      setIsDragging(false)
      const currentPoint = point ?? { x: dragStart.current.x, y: dragStart.current.y }
      const dx = currentPoint.x - dragStart.current.x
      const dy = currentPoint.y - dragStart.current.y
      const finalPos = constrainToBounds(dragStart.current.posX + dx, dragStart.current.posY + dy)
      setPosition(finalPos)
      savePosition(finalPos)
    },
    [constrainToBounds, savePosition]
  )

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return
      e.preventDefault()
      activePointerId.current = e.pointerId
      beginDrag({ x: e.clientX, y: e.clientY })
      try {
        elementRef.current?.setPointerCapture(e.pointerId)
      } catch {}
    },
    [beginDrag]
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (activePointerId.current !== null && e.pointerId !== activePointerId.current) return
      if (!isDraggingRef.current) return
      e.preventDefault()
      moveDrag({ x: e.clientX, y: e.clientY })
    },
    [moveDrag]
  )

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (activePointerId.current !== null && e.pointerId !== activePointerId.current) return
      endDrag({ x: e.clientX, y: e.clientY })
      activePointerId.current = null
      try {
        elementRef.current?.releasePointerCapture(e.pointerId)
      } catch {}
    },
    [endDrag]
  )

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (typeof window !== 'undefined' && 'PointerEvent' in window) return
      if (e.button !== 0) return
      e.preventDefault()
      beginDrag({ x: e.clientX, y: e.clientY })
    },
    [beginDrag]
  )

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (typeof window !== 'undefined' && 'PointerEvent' in window) return
      const touch = e.touches[0]
      if (!touch) return
      beginDrag({ x: touch.clientX, y: touch.clientY })
    },
    [beginDrag]
  )

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handlePointerMove = (event: PointerEvent) => {
      if (activePointerId.current !== null && event.pointerId !== activePointerId.current) return
      if (!isDraggingRef.current) return
      event.preventDefault()
      moveDrag({ x: event.clientX, y: event.clientY })
    }
    const handlePointerUp = (event: PointerEvent) => {
      if (activePointerId.current !== null && event.pointerId !== activePointerId.current) return
      endDrag({ x: event.clientX, y: event.clientY })
      activePointerId.current = null
    }
    const handleMouseMove = (event: MouseEvent) => {
      if (!isDraggingRef.current) return
      event.preventDefault()
      moveDrag({ x: event.clientX, y: event.clientY })
    }
    const handleMouseUp = (event: MouseEvent) => {
      endDrag({ x: event.clientX, y: event.clientY })
    }
    const handleTouchMove = (event: TouchEvent) => {
      if (!isDraggingRef.current) return
      const touch = event.touches[0]
      if (!touch) return
      event.preventDefault()
      moveDrag({ x: touch.clientX, y: touch.clientY })
    }
    const handleTouchEnd = (event: TouchEvent) => {
      const touch = event.changedTouches[0]
      endDrag(touch ? { x: touch.clientX, y: touch.clientY } : undefined)
    }

    window.addEventListener('pointermove', handlePointerMove, { passive: false })
    window.addEventListener('pointerup', handlePointerUp)
    window.addEventListener('pointercancel', handlePointerUp)
    window.addEventListener('mousemove', handleMouseMove, { passive: false })
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    window.addEventListener('touchend', handleTouchEnd)
    window.addEventListener('touchcancel', handleTouchEnd)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerUp)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
      window.removeEventListener('touchcancel', handleTouchEnd)
    }
  }, [endDrag, moveDrag])

  useEffect(() => {
    const handleViewportChange = () => {
      setPosition((prev) => {
        const next = constrainToBounds(prev.x, prev.y)
        savePosition(next)
        return next
      })
    }
    window.addEventListener('resize', handleViewportChange)
    window.addEventListener('orientationchange', handleViewportChange)
    window.visualViewport?.addEventListener('resize', handleViewportChange)
    window.visualViewport?.addEventListener('scroll', handleViewportChange)
    return () => {
      window.removeEventListener('resize', handleViewportChange)
      window.removeEventListener('orientationchange', handleViewportChange)
      window.visualViewport?.removeEventListener('resize', handleViewportChange)
      window.visualViewport?.removeEventListener('scroll', handleViewportChange)
    }
  }, [constrainToBounds, savePosition])

  return {
    position,
    isDragging,
    wasDragged: () => clickPrevented.current,
    elementRef,
    handlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerUp,
      onMouseDown: handleMouseDown,
      onTouchStart: handleTouchStart,
    },
  }
}
