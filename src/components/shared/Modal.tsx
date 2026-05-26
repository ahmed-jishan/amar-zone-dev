'use client'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!open) return null

  if (!mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(0,0,0,0.58)', backdropFilter: 'blur(10px)' }}
        onClick={onClose}
      />
      <div
        className="relative z-10 w-full max-w-md rounded-3xl p-6
                   max-h-[min(90dvh,720px)] overflow-y-auto animate-dialog-in shadow-2xl"
        style={{ backgroundColor: 'rgb(var(--bg))', border: '1px solid rgb(var(--border))' }}
      >
        {title && (
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold" style={{ color: 'rgb(var(--fg))' }}>
              {title}
            </h2>
            <button
              onClick={onClose}
              className="btn-ghost p-2 -mr-2"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body
  )
}
