'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { Loan } from '@/lib/types'

export default function EditLoanModal({ loan, onClose, onSave, translations: t }: { loan: Loan; onClose: () => void; onSave: (id: string, updates: Partial<Loan>) => void; translations: any }) {
  const [personName, setPersonName] = useState(loan.personName)
  const [note, setNote] = useState(loan.note || '')
  const [dueDate, setDueDate] = useState(loan.dueDate || '')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(loan.id, { personName: personName.trim(), note: note || undefined, dueDate: dueDate || undefined })
    onClose()
  }

  if (!mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-[mon-fade-in_150ms_ease-out]" onClick={onClose}>
      {/* Backdrop with enhanced blur */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />

      {/* Premium Modal Card */}
      <div
        className="relative w-full max-w-[400px] max-h-[90vh] overflow-y-auto rounded-[var(--mon-radius-2xl)] animate-[mon-scale-in_250ms_ease-out] mon-glass shadow-[0_32px_64px_rgba(0,0,0,0.5)]"
        style={{ border: '1px solid var(--mon-glass-border-2)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gold accent line at top */}
        <div className="absolute top-0 left-8 right-8 h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, var(--mon-gold), transparent)' }} />

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
              style={{
                background: 'var(--mon-surface-2)',
                border: '1px solid var(--mon-border)'
              }}
            >
              ✏️
            </div>
            <div>
              <h3 className="text-[17px] font-bold tracking-[-0.3px]" style={{ color: 'var(--mon-text-1)' }}>
                {t.edit || 'Edit'} — {loan.personName}
              </h3>
              <p className="text-[12px] mt-0.5" style={{ color: 'var(--mon-text-3)' }}>
                {loan.direction === 'taken' ? 'Loan Taken' : 'Loan Given'} · {loan.amount.toLocaleString()}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90 hover:bg-[var(--mon-surface-2)]"
            style={{ border: '1px solid var(--mon-border)', color: 'var(--mon-text-3)' }}
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-5">
          {/* Person Name */}
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wide block mb-1.5" style={{ color: 'var(--mon-text-3)' }}>{t.personName}</label>
            <input
              type="text"
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              autoFocus
              className="w-full px-3 py-2.5 rounded-[var(--mon-radius-lg)] text-[15px] font-semibold outline-none transition-all"
              style={{ background: 'var(--mon-surface-2)', border: '1px solid var(--mon-border)', color: 'var(--mon-text-1)' }}
            />
          </div>

          {/* Due Date */}
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wide block mb-1.5" style={{ color: 'var(--mon-text-3)' }}>{t.dueDate}</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-[var(--mon-radius-lg)] text-[14px] outline-none transition-all"
              style={{ background: 'var(--mon-surface-2)', border: '1px solid var(--mon-border)', color: 'var(--mon-text-1)' }}
            />
          </div>

          {/* Note */}
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wide block mb-1.5" style={{ color: 'var(--mon-text-3)' }}>{t.note}</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional"
              className="w-full px-3 py-2.5 rounded-[var(--mon-radius-lg)] text-[14px] outline-none transition-all"
              style={{ background: 'var(--mon-surface-2)', border: '1px solid var(--mon-border)', color: 'var(--mon-text-1)' }}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!personName.trim()}
            className="w-full py-3.5 rounded-[var(--mon-radius-xl)] text-[15px] font-bold text-white transition-all active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(135deg, var(--mon-gold), #b8860b)',
              boxShadow: '0 8px 24px var(--mon-gold-glow)',
            }}
          >
            <span className="flex items-center justify-center gap-2">
              💾 {t.save}
            </span>
          </button>
        </form>
      </div>
    </div>,
    document.body
  )
}