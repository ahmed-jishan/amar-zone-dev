'use client'

import { useState } from 'react'
import type { Loan } from '@/lib/types'

export default function EditLoanModal({ loan, onClose, onSave, translations: t }: { loan: Loan; onClose: () => void; onSave: (id: string, updates: Partial<Loan>) => void; translations: any }) {
  const [personName, setPersonName] = useState(loan.personName)
  const [note, setNote] = useState(loan.note || '')
  const [dueDate, setDueDate] = useState(loan.dueDate || '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(loan.id, { personName: personName.trim(), note: note || undefined, dueDate: dueDate || undefined })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-[mon-fade-in_150ms_ease-out]" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative w-full max-w-[380px] mx-4 rounded-[var(--mon-radius-2xl)] overflow-hidden animate-[mon-scale-in_200ms_ease-out] mon-glass shadow-[var(--mon-shadow-lg)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--mon-border)' }}>
          <h3 className="text-[16px] font-bold" style={{ color: 'var(--mon-text-1)' }}>{t.edit}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[var(--mon-text-3)] hover:text-[var(--mon-text-1)] hover:bg-[var(--mon-surface-hover)] transition-all">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wide block mb-1.5" style={{ color: 'var(--mon-text-3)' }}>{t.personName}</label>
            <input type="text" value={personName} onChange={(e) => setPersonName(e.target.value)} autoFocus
              className="w-full px-3 py-2.5 rounded-[var(--mon-radius-lg)] text-[15px] font-semibold outline-none"
              style={{ background: 'var(--mon-surface-2)', border: '1px solid var(--mon-border)', color: 'var(--mon-text-1)' }}
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wide block mb-1.5" style={{ color: 'var(--mon-text-3)' }}>{t.dueDate}</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 rounded-[var(--mon-radius-lg)] text-[14px] outline-none"
              style={{ background: 'var(--mon-surface-2)', border: '1px solid var(--mon-border)', color: 'var(--mon-text-1)' }}
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wide block mb-1.5" style={{ color: 'var(--mon-text-3)' }}>{t.note}</label>
            <input type="text" value={note} onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 rounded-[var(--mon-radius-lg)] text-[14px] outline-none"
              style={{ background: 'var(--mon-surface-2)', border: '1px solid var(--mon-border)', color: 'var(--mon-text-1)' }}
            />
          </div>
          <button type="submit"
            className="w-full py-3 rounded-[var(--mon-radius-xl)] text-[15px] font-bold text-white transition-all active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, var(--mon-gold), var(--mon-gold-2))', boxShadow: '0 4px 20px var(--mon-gold-glow)' }}
          >
            {t.save}
          </button>
        </form>
      </div>
    </div>
  )
}
