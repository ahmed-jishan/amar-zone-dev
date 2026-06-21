'use client'

import type { Wallet } from '@/lib/types'
import { formatCurrency } from '../utils'

interface Props {
  wallets: Wallet[]
  selectedWalletId: string | null
  currencySymbol: string
  onSelect: (id: string) => void
  onOpenTools: () => void
}

export default function WalletStrip({ wallets, selectedWalletId, currencySymbol, onSelect, onOpenTools }: Props) {
  if (!wallets.length) return null

  return (
    <section className="mb-5 animate-[mon-slide-up_400ms_ease-out]">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[1.2px]" style={{ color: 'var(--mon-text-3)' }}>
          Wallets
        </p>
        <button
          type="button"
          onClick={onOpenTools}
          className="mon-btn mon-btn-ghost text-[11px] !px-3 !py-1.5"
        >
          Tools
        </button>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1 mon-scrollbar">
        {wallets.map((wallet, index) => {
          const active = wallet.id === selectedWalletId || (!selectedWalletId && wallet.isDefault)
          return (
            <button
              key={wallet.id}
              type="button"
              onClick={() => onSelect(wallet.id)}
              className="min-w-[160px] shrink-0 rounded-[var(--mon-radius-xl)] p-4 text-left transition-all duration-200 active:scale-[0.98]"
              style={{
                background: active
                  ? 'linear-gradient(135deg, var(--mon-surface-hover), var(--mon-surface-2))'
                  : 'var(--mon-surface-1)',
                border: `1px solid ${active ? 'var(--mon-border-hover)' : 'var(--mon-border)'}`,
                boxShadow: active ? 'var(--mon-shadow-sm)' : 'none',
                animation: `mon-slide-up 400ms cubic-bezier(0.16, 1, 0.3, 1) ${index * 80}ms both`,
              }}
            >
              <div className="mb-2.5 flex items-center justify-between gap-2">
                <span className="text-[22px]" aria-hidden="true">{wallet.icon}</span>
                {wallet.isDefault && (
                  <span
                    className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide"
                    style={{ color: 'var(--mon-gold)', background: 'var(--mon-gold-bg)' }}
                  >
                    Default
                  </span>
                )}
              </div>
              <p className="truncate text-[13px] font-semibold" style={{ color: 'var(--mon-text-2)' }}>{wallet.name}</p>
              <p
                className="mt-1 text-[18px] font-black tabular-nums"
                style={{ color: wallet.balance >= 0 ? 'var(--mon-text-1)' : 'var(--mon-expense)' }}
              >
                {formatCurrency(wallet.balance, currencySymbol)}
              </p>
              {active && (
                <div
                  className="mt-2 h-[2px] rounded-full"
                  style={{
                    background: 'linear-gradient(90deg, var(--mon-gold), var(--mon-gold-2))',
                    animation: 'mon-scale-in 300ms ease-out',
                  }}
                />
              )}
            </button>
          )
        })}
      </div>
    </section>
  )
}