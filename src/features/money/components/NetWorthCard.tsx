'use client'

import { useMemo } from 'react'
import { formatCurrency } from '../utils'
import { selectNetWorth, selectAvailableBalance, selectSavingsTotal, selectOutstandingLoans } from '../selectors'
import type { Wallet, SavingsGoal, Loan, Asset } from '@/lib/types'

interface Props {
  wallets: Wallet[]
  savingsGoals: SavingsGoal[]
  loans: Loan[]
  assets: Asset[]
  currencySymbol: string
}

export default function NetWorthCard({ wallets, savingsGoals, loans, assets, currencySymbol }: Props) {
  const netWorth = useMemo(() => selectNetWorth(wallets, savingsGoals, loans, assets), [wallets, savingsGoals, loans, assets])
  const availableBalance = useMemo(() => selectAvailableBalance(wallets), [wallets])
  const totalSavings = useMemo(() => selectSavingsTotal(savingsGoals), [savingsGoals])
  const loanInfo = useMemo(() => selectOutstandingLoans(loans), [loans])

  const netWorthColor = netWorth.netWorth >= 0 ? 'var(--mon-income)' : 'var(--mon-expense)'

  return (
    <div className="mon-net-worth mb-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Available Balance */}
        <MetricCard
          label="Available Balance"
          value={formatCurrency(availableBalance, currencySymbol)}
          color="var(--mon-text-1)"
          icon="💵"
          sub="Total wallet cash"
        />

        {/* Savings */}
        <MetricCard
          label="Savings"
          value={formatCurrency(totalSavings, currencySymbol)}
          color="var(--mon-gold)"
          icon="🏦"
          sub={`${savingsGoals.length} goal${savingsGoals.length !== 1 ? 's' : ''}`}
        />

        {/* Outstanding Loans */}
        <MetricCard
          label="Outstanding Loans"
          value={formatCurrency(loanInfo.taken, currencySymbol)}
          color={loanInfo.taken > 0 ? 'var(--mon-expense)' : 'var(--mon-text-2)'}
          icon="📋"
          sub={`${loans.filter(l => !l.settled && l.direction === 'taken').length} active`}
        />

        {/* Net Worth */}
        <MetricCard
          label="Net Worth"
          value={formatCurrency(netWorth.netWorth, currencySymbol)}
          color={netWorthColor}
          icon="📊"
          sub={`Assets ${formatCurrency(netWorth.totalAssets, currencySymbol)} · Liabilities ${formatCurrency(netWorth.totalLiabilities, currencySymbol)}`}
        />
      </div>

      {/* Mini bar showing Assets vs Liabilities */}
      {netWorth.totalAssets > 0 && (
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--mon-text-3)' }}>Assets</span>
            <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--mon-surface-3)' }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min((netWorth.totalAssets / (netWorth.totalAssets + netWorth.totalLiabilities)) * 100, 100)}%`,
                  background: 'linear-gradient(90deg, var(--mon-income), var(--mon-teal))',
                }}
              />
            </div>
            <span className="text-[10px] font-semibold" style={{ color: 'var(--mon-text-3)' }}>{formatCurrency(netWorth.totalAssets, currencySymbol)}</span>
          </div>
          {netWorth.totalLiabilities > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--mon-text-3)' }}>Liabilities</span>
              <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--mon-surface-3)' }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min((netWorth.totalLiabilities / (netWorth.totalAssets + netWorth.totalLiabilities)) * 100, 100)}%`,
                    background: 'linear-gradient(90deg, var(--mon-expense), var(--mon-rose))',
                  }}
                />
              </div>
              <span className="text-[10px] font-semibold" style={{ color: 'var(--mon-text-3)' }}>{formatCurrency(netWorth.totalLiabilities, currencySymbol)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function MetricCard({ label, value, color, icon, sub }: { label: string; value: string; color: string; icon: string; sub: string }) {
  return (
    <div
      className="rounded-[var(--mon-radius-xl)] p-3.5 transition-all duration-200 hover:border-[var(--mon-border-hover)]"
      style={{ background: 'var(--mon-surface-1)', border: '1px solid var(--mon-border)' }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm">{icon}</span>
        <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--mon-text-3)' }}>{label}</p>
      </div>
      <p className="text-[17px] font-black tabular-nums truncate" style={{ color }}>{value}</p>
      <p className="text-[10px] mt-0.5 truncate" style={{ color: 'var(--mon-text-3)' }}>{sub}</p>
    </div>
  )
}