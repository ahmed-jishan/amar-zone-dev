'use client'

import { useState, useCallback, useRef } from 'react'
import { Eye, EyeOff, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownLeft, Wallet as WalletIcon, ChevronDown, Check, Plus, Building2, Landmark } from 'lucide-react'
import { formatCurrency } from '../../utils'
import type { Wallet, SavingsGoal, Loan } from '@/lib/types'

interface WealthHubProps {
  totalBalance: number
  animatedBalance: number
  currencySymbol: string
  balanceVisible: boolean
  onToggleBalance: () => void
  summary: { income: number; expense: number; balance: number }
  monthName: string
  healthScore: number
  wallets: Wallet[]
  selectedWalletId: string | null
  savingsGoals: SavingsGoal[]
  loans: Loan[]
  assets: { id: string; label: string; value: number }[]
  onSelectWallet: (id: string) => void
  onOpenWalletTools: () => void
  onAddTransaction: (type: 'income' | 'expense') => void
  netWorth: number
}

type HubView = 'balance' | 'net-worth' | 'wallets'

export default function WealthHub({
  totalBalance, animatedBalance, currencySymbol, balanceVisible, onToggleBalance,
  summary, monthName, healthScore, wallets, selectedWalletId, savingsGoals, loans, assets,
  onSelectWallet, onOpenWalletTools, onAddTransaction, netWorth
}: WealthHubProps) {
  const [expanded, setExpanded] = useState(false)
  const [hubView, setHubView] = useState<HubView>('balance')
  const contentRef = useRef<HTMLDivElement>(null)

  const selectedWallet = wallets.find(w => w.id === selectedWalletId)
  const totalSavings = savingsGoals.reduce((a, g) => a + g.currentAmount, 0)
  const totalLoansNet = loans.filter(l => !l.settled).reduce((a, l) => a + (l.direction === 'given' ? l.currentBalance : -l.currentBalance), 0)

  const toggleExpand = useCallback(() => {
    setExpanded(prev => !prev)
  }, [])

  const views: { key: HubView; label: string; icon: typeof Building2 }[] = [
    { key: 'balance', label: 'Balance', icon: WalletIcon },
    { key: 'net-worth', label: 'Net Worth', icon: Building2 },
    { key: 'wallets', label: 'Wallets', icon: Landmark },
  ]

  return (
    <div className={`mon-wealth-hub ${expanded ? 'expanded' : ''}`}>
      {/* Ambient glow */}
      <div className="hub-ambient-glow" />

      {/* Main balance area — always visible */}
      <div className="hub-primary" onClick={!expanded ? toggleExpand : undefined}>
        <div className="hub-top-row">
          <div className="hub-view-pills">
            {views.map(v => (
              <button
                key={v.key}
                type="button"
                onClick={(e) => { e.stopPropagation(); setHubView(v.key); if (!expanded) setExpanded(true) }}
                className={`hub-view-pill ${hubView === v.key ? 'active' : ''}`}
              >
                <v.icon size={12} strokeWidth={2.5} />
                {v.label}
              </button>
            ))}
          </div>
          <div className="hub-actions">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onToggleBalance() }}
              className="hub-icon-btn"
              aria-label={balanceVisible ? 'Hide balance' : 'Show balance'}
            >
              {balanceVisible ? <Eye size={14} /> : <EyeOff size={14} />}
            </button>
          </div>
        </div>

        <div className="hub-amount-row">
          <span className="hub-currency-sign">{currencySymbol}</span>
          <span className="hub-amount">
            {balanceVisible
              ? animatedBalance.toLocaleString('en-BD')
              : '••••••'}
          </span>
        </div>

        <div className="hub-meta-row">
          <span className="hub-month">{monthName}</span>
          <span className="hub-income-badge">
            <TrendingUp size={12} /> {formatCurrency(summary.income, currencySymbol)}
          </span>
          <span className="hub-expense-badge">
            <TrendingDown size={12} /> {formatCurrency(summary.expense, currencySymbol)}
          </span>
        </div>

        {/* Expand indicator */}
        <div className="hub-expand-indicator">
          <ChevronDown size={16} className={`hub-chevron ${expanded ? 'rotated' : ''}`} />
        </div>
      </div>

      {/* Expanded detail area */}
      <div
        ref={contentRef}
        className="hub-expanded-content"
        style={{
          maxHeight: expanded ? '600px' : '0px',
          opacity: expanded ? 1 : 0,
        }}
      >
        <div className="hub-expanded-inner">
          {/* Hub View Content */}
          {hubView === 'balance' && (
            <div className="hub-section">
              <div className="hub-stat-grid">
                <div className="hub-stat-card income">
                  <div className="hub-stat-icon"><ArrowUpRight size={16} /></div>
                  <div>
                    <p className="hub-stat-label">Income</p>
                    <p className="hub-stat-value">{formatCurrency(summary.income, currencySymbol)}</p>
                  </div>
                </div>
                <div className="hub-stat-card expense">
                  <div className="hub-stat-icon"><ArrowDownLeft size={16} /></div>
                  <div>
                    <p className="hub-stat-label">Expense</p>
                    <p className="hub-stat-value">{formatCurrency(summary.expense, currencySymbol)}</p>
                  </div>
                </div>
                <div className="hub-stat-card balance">
                  <div className="hub-stat-icon"><WalletIcon size={16} /></div>
                  <div>
                    <p className="hub-stat-label">Net Flow</p>
                    <p className="hub-stat-value" style={{ color: summary.balance >= 0 ? 'var(--mon-income)' : 'var(--mon-expense)' }}>
                      {formatCurrency(summary.balance, currencySymbol)}
                    </p>
                  </div>
                </div>
                <div className="hub-stat-card health">
                  <div className="hub-stat-icon">
                    <div className="hub-health-ring">
                      <svg width="18" height="18" viewBox="0 0 18 18">
                        <circle cx="9" cy="9" r="7" fill="none" stroke="var(--mon-surface-3)" strokeWidth="2" />
                        <circle cx="9" cy="9" r="7" fill="none"
                          stroke={healthScore >= 70 ? 'var(--mon-income)' : healthScore >= 40 ? 'var(--mon-gold)' : 'var(--mon-expense)'}
                          strokeWidth="2" strokeLinecap="round"
                          strokeDasharray={`${(healthScore / 100) * 44} 44`}
                          transform="rotate(-90 9 9)"
                        />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <p className="hub-stat-label">Health</p>
                    <p className="hub-stat-value">{healthScore}/100</p>
                  </div>
                </div>
              </div>

              {/* Quick action buttons */}
              <div className="hub-quick-actions">
                <button
                  type="button"
                  onClick={() => onAddTransaction('expense')}
                  className="hub-quick-btn expense"
                >
                  <ArrowDownLeft size={14} /> Add Expense
                </button>
                <button
                  type="button"
                  onClick={() => onAddTransaction('income')}
                  className="hub-quick-btn income"
                >
                  <ArrowUpRight size={14} /> Add Income
                </button>
                <button
                  type="button"
                  onClick={onOpenWalletTools}
                  className="hub-quick-btn wallet"
                >
                  <WalletIcon size={14} /> Wallets
                </button>
              </div>
            </div>
          )}

          {hubView === 'net-worth' && (
            <div className="hub-section">
              <div className="hub-nw-card">
                <p className="hub-nw-label">Total Net Worth</p>
                <p className="hub-nw-value">{formatCurrency(netWorth, currencySymbol)}</p>
                <div className="hub-nw-breakdown">
                  <div className="hub-nw-item">
                    <span className="hub-nw-dot savings" />
                    <span>Savings</span>
                    <span className="hub-nw-amount">{formatCurrency(totalSavings, currencySymbol)}</span>
                  </div>
                  <div className="hub-nw-item">
                    <span className="hub-nw-dot loans" />
                    <span>Loans (Net)</span>
                    <span className="hub-nw-amount">{formatCurrency(totalLoansNet, currencySymbol)}</span>
                  </div>
                  <div className="hub-nw-item">
                    <span className="hub-nw-dot assets" />
                    <span>Assets</span>
                    <span className="hub-nw-amount">{formatCurrency(assets.reduce((a, as) => a + as.value, 0), currencySymbol)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {hubView === 'wallets' && (
            <div className="hub-section">
              <div className="hub-wallet-list">
                {wallets.map(w => (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => onSelectWallet(w.id)}
                    className={`hub-wallet-item ${w.id === selectedWalletId ? 'active' : ''}`}
                  >
                    <div className="hub-wallet-left">
                      <div className="hub-wallet-icon" style={{ background: `var(--mon-${w.type === 'cash' ? 'gold' : w.type === 'bank' ? 'accent' : w.type === 'mobile' ? 'teal' : 'amber'}-bg)`, color: `var(--mon-${w.type === 'cash' ? 'gold' : w.type === 'bank' ? 'accent' : w.type === 'mobile' ? 'teal' : 'amber'})` }}>
                        {w.type === 'cash' ? '💵' : w.type === 'bank' ? '🏦' : w.type === 'mobile' ? '📱' : '🏺'}
                      </div>
                      <div className="hub-wallet-info">
                        <p className="hub-wallet-name">{w.name}</p>
                        <p className="hub-wallet-type">{w.type}</p>
                      </div>
                    </div>
                    <div className="hub-wallet-right">
                      <p className="hub-wallet-balance">{formatCurrency(w.balance, currencySymbol)}</p>
                      {w.id === selectedWalletId && <Check size={12} className="hub-wallet-check" />}
                    </div>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={onOpenWalletTools}
                className="hub-manage-wallets"
              >
                <Plus size={14} /> Manage Wallets
              </button>
            </div>
          )}
        </div>

        {/* Collapse handle */}
        <button
          type="button"
          onClick={toggleExpand}
          className="hub-collapse-btn"
        >
          <ChevronDown size={18} className="hub-chevron rotated" />
        </button>
      </div>
    </div>
  )
}
