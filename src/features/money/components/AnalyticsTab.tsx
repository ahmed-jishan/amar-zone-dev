'use client'

import { useMemo } from 'react'
import { CATEGORY_META } from '../constants'
import { formatCurrency, getCurrentMonth } from '../utils'

export default function AnalyticsTab({ transactions, currency_symbol, language, t }: any) {
  const month = getCurrentMonth()

  const stats = useMemo(() => {
    const monthTxns = transactions.filter((t: any) => t.date.startsWith(month) && t.status === 'completed')
    const income = monthTxns.filter((t: any) => t.type === 'income').reduce((a: number, t: any) => a + t.amount, 0)
    const expense = monthTxns.filter((t: any) => t.type === 'expense').reduce((a: number, t: any) => a + t.amount, 0)
    const avgDaily = expense / 30
    const breakdown: Record<string, number> = {}
    monthTxns.filter((t: any) => t.type === 'expense').forEach((t: any) => {
      breakdown[t.category] = (breakdown[t.category] || 0) + t.amount
    })
    const topCat = Object.entries(breakdown).sort(([, a]: any, [, b]: any) => b - a)[0]
    return { income, expense, avgDaily, topCat, savingsRate: income > 0 ? ((income - expense) / income) * 100 : 0 }
  }, [transactions, month])

  // Last 6 months trend
  const trendData = useMemo(() => {
    const data: { month: string; income: number; expense: number }[] = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const m = d.toISOString().slice(0, 7)
      const txns = transactions.filter((t: any) => t.date.startsWith(m) && t.status === 'completed')
      data.push({
        month: d.toLocaleDateString('en-US', { month: 'short' }),
        income: txns.filter((t: any) => t.type === 'income').reduce((a: number, t: any) => a + t.amount, 0),
        expense: txns.filter((t: any) => t.type === 'expense').reduce((a: number, t: any) => a + t.amount, 0),
      })
    }
    return data
  }, [transactions])

  const maxTrend = Math.max(...trendData.map((d: any) => Math.max(d.income, d.expense)), 1)

  return (
    <div className="space-y-5 animate-[mon-slide-up_400ms_ease-out]">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label={t.income} value={formatCurrency(stats.income, currency_symbol)} color="var(--mon-income)" />
        <StatCard label={t.expense} value={formatCurrency(stats.expense, currency_symbol)} color="var(--mon-expense)" />
        <StatCard label={t.weeklyAvg} value={formatCurrency(stats.avgDaily * 7, currency_symbol)} color="var(--mon-gold)" />
        <StatCard label={t.savingsRate} value={`${Math.round(stats.savingsRate)}%`} color={stats.savingsRate >= 20 ? 'var(--mon-income)' : 'var(--mon-gold)'} />
      </div>

      {/* 6-Month Trend */}
      <div className="p-4 rounded-[var(--mon-radius-xl)]" style={{ background: 'var(--mon-surface-1)', border: '1px solid var(--mon-border)' }}>
        <h3 className="text-[11px] font-semibold uppercase tracking-[1.2px] mb-4" style={{ color: 'var(--mon-text-3)' }}>6-Month Trend</h3>
        <div className="flex items-end justify-between gap-3 h-36">
          {trendData.map((d: any, i: number) => (
            <div key={d.month} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full flex flex-col gap-1 relative" style={{ height: '100px' }}>
                <div className="w-full rounded-t-sm absolute bottom-0" style={{ height: `${Math.max((d.income / maxTrend) * 100, 4)}%`, background: 'var(--mon-income)', opacity: 0.7, minHeight: 4, animation: `mon-chart-grow 600ms ease-out ${i * 80}ms both`, transformOrigin: 'bottom' }} />
                <div className="w-full rounded-t-sm absolute bottom-0" style={{ height: `${Math.max((d.expense / maxTrend) * 100, 4)}%`, background: 'var(--mon-expense)', opacity: 0.5, minHeight: 4, animation: `mon-chart-grow 600ms ease-out ${i * 80 + 40}ms both`, transformOrigin: 'bottom' }} />
              </div>
              <span className="text-[10px] font-medium" style={{ color: 'var(--mon-text-3)' }}>{d.month}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top Category */}
      {stats.topCat && (
        <div className="p-4 rounded-[var(--mon-radius-xl)]" style={{ background: 'var(--mon-surface-1)', border: '1px solid var(--mon-border)' }}>
          <h3 className="text-[11px] font-semibold uppercase tracking-[1.2px] mb-3" style={{ color: 'var(--mon-text-3)' }}>{t.topCategory}</h3>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl" style={{ background: (CATEGORY_META[stats.topCat[0] as string] || CATEGORY_META.other).bg }}>
              {(CATEGORY_META[stats.topCat[0] as string] || CATEGORY_META.other).icon}
            </div>
            <div>
              <p className="text-[16px] font-bold" style={{ color: 'var(--mon-text-1)' }}>{language === 'bn' ? (CATEGORY_META[stats.topCat[0] as string] || CATEGORY_META.other).labelBn : (CATEGORY_META[stats.topCat[0] as string] || CATEGORY_META.other).labelEn}</p>
              <p className="text-[14px] font-semibold" style={{ color: 'var(--mon-expense)' }}>{formatCurrency(stats.topCat[1] as number, currency_symbol)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="p-4 rounded-[var(--mon-radius-xl)]" style={{ background: 'var(--mon-surface-1)', border: '1px solid var(--mon-border)' }}>
      <p className="text-[10px] font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--mon-text-3)' }}>{label}</p>
      <p className="text-[20px] font-black" style={{ color }}>{value}</p>
    </div>
  )
}
