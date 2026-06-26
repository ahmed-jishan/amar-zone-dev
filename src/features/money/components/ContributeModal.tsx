'use client'

import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { formatCurrency } from '../utils'

interface ContributeModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (amount: number) => void
  goalName?: string
}

export default function ContributeModal({ open, onClose, onSubmit, goalName }: ContributeModalProps) {
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setMounted(true)
    if (open) {
      document.body.style.overflow = 'hidden'
      setTimeout(() => inputRef.current?.focus(), 250)
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^\d.]/g, '')
    setAmount(val)
    setError('')
  }

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const num = parseFloat(amount)
    if (!amount || isNaN(num)) {
      setError('Please enter a valid amount')
      return
    }
    if (num <= 0) {
      setError('Amount must be positive')
      return
    }
    setError('')
    onSubmit(num)
    setAmount('')
    onClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
    if (e.key === 'Enter') handleSubmit()
  }

  // Quick amount suggestions
  const quickAmounts = [500, 1000, 2000, 5000, 10000]

  if (!mounted || !open) return null

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-[mon-fade-in_150ms_ease-out]" onClick={onClose}>
      {/* Enhanced backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />

      {/* Premium Modal Card */}
      <div
        className="relative w-full max-w-[380px] rounded-[var(--mon-radius-2xl)] animate-[mon-scale-in_250ms_ease-out] mon-glass shadow-[0_32px_64px_rgba(0,0,0,0.5)]"
        style={{ border: '1px solid var(--mon-glass-border-2)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gold accent line */}
        <div className="absolute top-0 left-8 right-8 h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, var(--mon-gold), transparent)' }} />

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
              style={{ background: 'var(--mon-gold-bg)', border: '1px solid var(--mon-gold-glow)' }}
            >
              🎯
            </div>
            <div>
              <h3 className="text-[17px] font-bold tracking-[-0.3px]" style={{ color: 'var(--mon-text-1)' }}>
                Contribute
              </h3>
              {goalName && (
                <p className="text-[12px] mt-0.5" style={{ color: 'var(--mon-gold)' }}>
                  {goalName}
                </p>
              )}
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
          {/* Amount Display */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5">
              <input
                ref={inputRef}
                type="number"
                value={amount}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                placeholder="0"
                step="any"
                className="w-36 bg-transparent text-[36px] font-black text-center outline-none tabular-nums"
                style={{ color: 'var(--mon-gold)', caretColor: 'var(--mon-gold)' }}
                aria-label="Contribution amount"
              />
            </div>
            {error && (
              <p className="text-[12px] mt-2 font-semibold animate-pulse" style={{ color: 'var(--mon-expense)' }}>
                {error}
              </p>
            )}
          </div>

          {/* Quick Amount Buttons */}
          <div className="flex gap-2 justify-center flex-wrap">
            {quickAmounts.map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => { setAmount(String(val)); setError('') }}
                className="px-3.5 py-1.5 rounded-lg text-[11px] font-bold transition-all active:scale-95"
                style={{
                  background: parseFloat(amount) === val ? 'var(--mon-gold-bg)' : 'var(--mon-surface-2)',
                  border: `1px solid ${parseFloat(amount) === val ? 'var(--mon-gold-glow)' : 'var(--mon-border)'}`,
                  color: parseFloat(amount) === val ? 'var(--mon-gold)' : 'var(--mon-text-3)',
                }}
              >
                {val.toLocaleString()}
              </button>
            ))}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!amount || parseFloat(amount) <= 0 || !!error}
            className="w-full py-3.5 rounded-[var(--mon-radius-xl)] text-[15px] font-bold text-white transition-all active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(135deg, var(--mon-gold), var(--mon-gold-2))',
              boxShadow: '0 8px 24px var(--mon-gold-glow)',
            }}
          >
            <span className="flex items-center justify-center gap-2">
              🎯 Contribute
              {amount && parseFloat(amount) > 0 ? ` ${formatCurrency(parseFloat(amount), '৳')}` : ''}
            </span>
          </button>
        </form>
      </div>
    </div>,
    document.body
  )
}