'use client'

import { getDaysLeft, formatCurrency } from '../utils'
import type { SavingsGoal } from '@/lib/types'

export default function GoalsTab({ goals, currency_symbol, language, t, onAdd, onContribute, onDelete }: any) {
  return (
    <div className="space-y-4 animate-[mon-slide-up_400ms_ease-out]">
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] font-semibold uppercase tracking-[1.2px]" style={{ color: 'var(--mon-text-3)' }}>{t.goals}</h3>
        <button onClick={onAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all hover:scale-105"
          style={{ color: 'var(--mon-gold)', background: 'var(--mon-gold-bg)', border: '1px solid var(--mon-gold-glow)' }}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M12 4v16m8-8H4" /></svg>
          {t.addGoal}
        </button>
      </div>

      {goals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 text-center">
          <div className="w-16 h-16 rounded-[var(--mon-radius-xl)] flex items-center justify-center text-2xl mb-4 animate-[mon-float_4s_ease-in-out_infinite]"
            style={{ background: 'var(--mon-surface-2)', border: '1px solid var(--mon-border)' }}>🎯</div>
          <p className="text-[15px] font-semibold" style={{ color: 'var(--mon-text-2)' }}>No savings goals yet</p>
          <p className="text-[13px] mt-1" style={{ color: 'var(--mon-text-3)' }}>Set a goal to start tracking your savings</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {goals.map((goal: SavingsGoal, i: number) => {
            const pct = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0
            const days = goal.deadline ? getDaysLeft(goal.deadline) : null
            return (
              <div key={goal.id} className="p-4 rounded-[var(--mon-radius-xl)] transition-all duration-200 hover:border-[var(--mon-border-hover)] group"
                style={{ background: 'var(--mon-surface-1)', border: '1px solid var(--mon-border)', animation: `mon-slide-up 350ms ease-out ${i * 40}ms both` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-[15px] font-bold" style={{ color: 'var(--mon-text-1)' }}>{goal.title}</p>
                    <p className="text-[11px] mt-0.5" style={{ color: 'var(--mon-text-3)' }}>
                      {formatCurrency(goal.currentAmount, currency_symbol)} / {formatCurrency(goal.targetAmount, currency_symbol)}
                      {days !== null && (
                        <span className={`ml-2 px-1.5 py-0.5 rounded-md text-[10px] font-bold ${days < 0 ? 'text-[var(--mon-expense)] bg-[var(--mon-expense-bg)]' : days < 7 ? 'text-[var(--mon-gold)] bg-[var(--mon-gold-bg)]' : 'text-[var(--mon-text-3)] bg-[var(--mon-surface-2)]'}`}>
                          {days < 0 ? t.overdue : `${days} ${t.daysLeft}`}
                        </span>
                      )}
                    </p>
                  </div>
                  <button onClick={() => onDelete(goal.id)} className="p-1.5 rounded-lg text-[var(--mon-text-3)] hover:text-[var(--mon-expense)] hover:bg-[var(--mon-expense-bg)] transition-all opacity-0 group-hover:opacity-100">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>

                <div className="h-[4px] rounded-full overflow-hidden mb-3" style={{ background: 'var(--mon-surface-3)' }}>
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(pct, 100)}%`, background: goal.color || 'var(--mon-gold)' }} />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold" style={{ color: 'var(--mon-text-2)' }}>{Math.round(pct)}% {t.goalProgress}</span>
                  <button onClick={() => {
                    const amount = parseFloat(prompt('Amount to contribute:') || '0')
                    if (amount > 0) onContribute(goal.id, amount)
                  }}
                    className="px-3 py-1.5 rounded-[var(--mon-radius-md)] text-[12px] font-semibold transition-all active:scale-[0.97]"
                    style={{ background: 'var(--mon-gold-bg)', color: 'var(--mon-gold)', border: '1px solid var(--mon-gold-glow)' }}
                  >
                    + Add
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
