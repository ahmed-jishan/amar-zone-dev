'use client'

import { useState } from 'react'
import { todayISO } from '../utils'

export default function AddGoalModal({ onClose, onAdd, translations: t, currencySymbol }: any) {
  const [title, setTitle] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [currentAmount, setCurrentAmount] = useState('')
  const [deadline, setDeadline] = useState('')
  const [color, setColor] = useState('#c9a84c')

  const colors = ['#c9a84c', '#22c55e', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316']

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !targetAmount || parseFloat(targetAmount) <= 0) return
    onAdd({
      title: title.trim(),
      targetAmount: parseFloat(targetAmount),
      currentAmount: parseFloat(currentAmount) || 0,
      deadline: deadline || undefined,
      color,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-[mon-fade-in_150ms_ease-out]" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative w-full max-w-[420px] mx-4 rounded-[var(--mon-radius-2xl)] overflow-hidden animate-[mon-scale-in_200ms_ease-out] mon-glass shadow-[var(--mon-shadow-lg)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--mon-border)' }}>
          <h3 className="text-[16px] font-bold" style={{ color: 'var(--mon-text-1)' }}>{t.addGoal}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[var(--mon-text-3)] hover:text-[var(--mon-text-1)] hover:bg-[var(--mon-surface-hover)] transition-all">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wide block mb-1.5" style={{ color: 'var(--mon-text-3)' }}>{t.title}</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. New Laptop" autoFocus
              className="w-full px-3 py-2.5 rounded-[var(--mon-radius-lg)] text-[15px] font-semibold outline-none"
              style={{ background: 'var(--mon-surface-2)', border: '1px solid var(--mon-border)', color: 'var(--mon-text-1)' }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wide block mb-1.5" style={{ color: 'var(--mon-text-3)' }}>{t.targetAmount}</label>
              <div className="flex items-center gap-2 px-3 py-2 rounded-[var(--mon-radius-lg)]" style={{ background: 'var(--mon-surface-2)', border: '1px solid var(--mon-border)' }}>
                <span className="text-[14px]" style={{ color: 'var(--mon-text-3)' }}>{currencySymbol}</span>
                <input type="number" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} placeholder="0"
                  className="flex-1 bg-transparent text-[16px] font-bold outline-none" style={{ color: 'var(--mon-text-1)' }}
                />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wide block mb-1.5" style={{ color: 'var(--mon-text-3)' }}>{t.currentAmount}</label>
              <div className="flex items-center gap-2 px-3 py-2 rounded-[var(--mon-radius-lg)]" style={{ background: 'var(--mon-surface-2)', border: '1px solid var(--mon-border)' }}>
                <span className="text-[14px]" style={{ color: 'var(--mon-text-3)' }}>{currencySymbol}</span>
                <input type="number" value={currentAmount} onChange={(e) => setCurrentAmount(e.target.value)} placeholder="0"
                  className="flex-1 bg-transparent text-[16px] font-bold outline-none" style={{ color: 'var(--mon-text-1)' }}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wide block mb-1.5" style={{ color: 'var(--mon-text-3)' }}>{t.deadline}</label>
            <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-3 py-2 rounded-[var(--mon-radius-lg)] text-[14px] outline-none"
              style={{ background: 'var(--mon-surface-2)', border: '1px solid var(--mon-border)', color: 'var(--mon-text-1)' }}
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wide block mb-1.5" style={{ color: 'var(--mon-text-3)' }}>Color</label>
            <div className="flex gap-2">
              {colors.map((c) => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition-all ${color === c ? 'ring-2 ring-offset-2 ring-offset-[var(--mon-bg)]' : 'hover:scale-110'}`}
                  style={{ background: c, '--tw-ring-color': c } as React.CSSProperties}
                />
              ))}
            </div>
          </div>

          <button type="submit" disabled={!title || !targetAmount}
            className="w-full py-3 rounded-[var(--mon-radius-xl)] text-[15px] font-bold text-white transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg, var(--mon-gold), var(--mon-gold-2))', boxShadow: '0 4px 20px var(--mon-gold-glow)' }}
          >
            {t.save}
          </button>
        </form>
      </div>
    </div>
  )
}
