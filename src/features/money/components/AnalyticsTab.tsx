'use client'

import { useMemo, useState } from 'react'
import { Download, TrendingDown, TrendingUp } from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { CATEGORY_META } from '../constants'
import { formatCurrency, getCurrentMonth } from '../utils'
import type { Transaction } from '@/lib/types'

type Props = {
  transactions: Transaction[]
  currency_symbol: string
  language: 'bn' | 'en'
  t: Record<string, string>
}

type Range = 'week' | 'month'

const COLORS = ['#c9a84c', '#22c55e', '#6366f1', '#ef4444', '#0ea5e9', '#f59e0b', '#8b5cf6', '#14b8a6']

export default function AnalyticsTab({ transactions, currency_symbol, language, t }: Props) {
  const [range, setRange] = useState<Range>('month')
  const month = getCurrentMonth()

  const analytics = useMemo(() => {
    const now = new Date()
    const start = range === 'week'
      ? new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6)
      : new Date(now.getFullYear(), now.getMonth(), 1)

    const current = transactions.filter((txn) => {
      const date = new Date(`${txn.date}T00:00:00`)
      return txn.status === 'completed' && date >= start && date <= now
    })

    const monthly = transactions.filter((txn) => txn.status === 'completed' && txn.date.startsWith(month))
    const income = current.filter((txn) => txn.type === 'income').reduce((sum, txn) => sum + txn.amount, 0)
    const expense = current.filter((txn) => txn.type === 'expense').reduce((sum, txn) => sum + txn.amount, 0)
    const net = income - expense

    const categoryMap = new Map<string, number>()
    current.filter((txn) => txn.type === 'expense').forEach((txn) => {
      categoryMap.set(txn.category, (categoryMap.get(txn.category) ?? 0) + txn.amount)
    })
    const categoryData = Array.from(categoryMap.entries())
      .map(([category, value], index) => ({
        category,
        name: labelForCategory(category, language),
        value,
        percentage: expense > 0 ? Math.round((value / expense) * 100) : 0,
        fill: COLORS[index % COLORS.length],
      }))
      .sort((a, b) => b.value - a.value)

    const days = range === 'week' ? 7 : new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    const dailyData = Array.from({ length: days }, (_, index) => {
      const date = range === 'week'
        ? new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days - index - 1))
        : new Date(now.getFullYear(), now.getMonth(), index + 1)
      const iso = date.toISOString().slice(0, 10)
      const dayTxns = transactions.filter((txn) => txn.status === 'completed' && txn.date === iso)
      return {
        day: range === 'week' ? date.toLocaleDateString('en-US', { weekday: 'short' }) : String(date.getDate()),
        income: dayTxns.filter((txn) => txn.type === 'income').reduce((sum, txn) => sum + txn.amount, 0),
        expense: dayTxns.filter((txn) => txn.type === 'expense').reduce((sum, txn) => sum + txn.amount, 0),
      }
    })

    const previousStart = new Date(start)
    previousStart.setDate(previousStart.getDate() - days)
    const previous = transactions.filter((txn) => {
      const date = new Date(`${txn.date}T00:00:00`)
      return txn.status === 'completed' && date >= previousStart && date < start
    })
    const previousExpense = previous.filter((txn) => txn.type === 'expense').reduce((sum, txn) => sum + txn.amount, 0)
    const growth = previousExpense > 0 ? ((expense - previousExpense) / previousExpense) * 100 : expense > 0 ? 100 : 0

    return {
      income,
      expense,
      net,
      monthly,
      avgDaily: expense / Math.max(days, 1),
      savingsRate: income > 0 ? ((income - expense) / income) * 100 : 0,
      growth,
      categoryData,
      dailyData,
      topCategory: categoryData[0],
    }
  }, [transactions, month, range, language])

  const exportPdf = () => {
    const doc = new jsPDF()
    doc.setFillColor(11, 12, 14)
    doc.rect(0, 0, 210, 34, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.text('Amar Zone Money Report', 14, 16)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(`${range === 'week' ? 'Weekly' : 'Monthly'} analytics • ${new Date().toLocaleDateString()}`, 14, 25)

    doc.setTextColor(20, 20, 24)
    doc.setFontSize(11)
    doc.text(`Income: ${formatCurrency(analytics.income, currency_symbol)}`, 14, 46)
    doc.text(`Expense: ${formatCurrency(analytics.expense, currency_symbol)}`, 14, 54)
    doc.text(`Net balance: ${formatCurrency(analytics.net, currency_symbol)}`, 14, 62)
    doc.text(`Top category: ${analytics.topCategory?.name ?? 'No expenses'}`, 14, 70)

    autoTable(doc, {
      startY: 82,
      head: [['Category', 'Amount', 'Share']],
      body: analytics.categoryData.map((item) => [item.name, formatCurrency(item.value, currency_symbol), `${item.percentage}%`]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [201, 168, 76], textColor: [8, 12, 20] },
    })

    const finalY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 110
    autoTable(doc, {
      startY: finalY + 10,
      head: [['Day', 'Income', 'Expense']],
      body: analytics.dailyData.map((item) => [item.day, formatCurrency(item.income, currency_symbol), formatCurrency(item.expense, currency_symbol)]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [99, 102, 241] },
    })

    doc.save(`amar-zone-money-${range}-${new Date().toISOString().slice(0, 10)}.pdf`)
  }

  return (
    <div className="space-y-5 animate-[mon-slide-up_400ms_ease-out]">
      <div className="flex items-center justify-between gap-3">
        <div className="rounded-[var(--mon-radius-lg)] bg-[var(--mon-surface-1)] p-1 border border-[var(--mon-border)]">
          {(['week', 'month'] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setRange(item)}
              className={`rounded-[10px] px-3 py-2 text-[12px] font-bold capitalize transition-all ${range === item ? 'bg-[var(--mon-gold)] text-[#080c14]' : 'text-[var(--mon-text-3)]'}`}
            >
              {item}
            </button>
          ))}
        </div>
        <button type="button" onClick={exportPdf} className="inline-flex items-center gap-2 rounded-[var(--mon-radius-lg)] bg-[var(--mon-gold-bg)] px-3 py-2 text-[12px] font-bold text-[var(--mon-gold)] border border-[var(--mon-gold-glow)]">
          <Download size={15} /> PDF
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label={t.income || 'Income'} value={formatCurrency(analytics.income, currency_symbol)} color="var(--mon-income)" />
        <StatCard label={t.expense || 'Expense'} value={formatCurrency(analytics.expense, currency_symbol)} color="var(--mon-expense)" />
        <StatCard label="Net balance" value={formatCurrency(analytics.net, currency_symbol)} color={analytics.net >= 0 ? 'var(--mon-income)' : 'var(--mon-expense)'} />
        <StatCard label="Savings rate" value={`${Math.round(analytics.savingsRate)}%`} color={analytics.savingsRate >= 20 ? 'var(--mon-income)' : 'var(--mon-gold)'} />
      </div>

      <div className="rounded-[var(--mon-radius-xl)] bg-[var(--mon-surface-1)] p-4 border border-[var(--mon-border)]">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[11px] font-semibold uppercase tracking-[1.2px] text-[var(--mon-text-3)]">Income vs Expense</h3>
          <TrendBadge growth={analytics.growth} />
        </div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics.dailyData}>
              <CartesianGrid stroke="var(--mon-border)" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: 'var(--mon-text-3)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip contentStyle={{ background: 'var(--mon-surface-2)', border: '1px solid var(--mon-border)', borderRadius: 12 }} />
              <Bar dataKey="income" fill="var(--mon-income)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="expense" fill="var(--mon-expense)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-[var(--mon-radius-xl)] bg-[var(--mon-surface-1)] p-4 border border-[var(--mon-border)]">
          <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-[1.2px] text-[var(--mon-text-3)]">Category Breakdown</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={analytics.categoryData} dataKey="value" nameKey="name" innerRadius={48} outerRadius={82} paddingAngle={3}>
                  {analytics.categoryData.map((entry) => <Cell key={entry.category} fill={entry.fill} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--mon-surface-2)', border: '1px solid var(--mon-border)', borderRadius: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-[var(--mon-radius-xl)] bg-[var(--mon-surface-1)] p-4 border border-[var(--mon-border)]">
          <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-[1.2px] text-[var(--mon-text-3)]">Daily Spending Trend</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.dailyData}>
                <defs>
                  <linearGradient id="expenseTrend" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fill: 'var(--mon-text-3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip contentStyle={{ background: 'var(--mon-surface-2)', border: '1px solid var(--mon-border)', borderRadius: 12 }} />
                <Area type="monotone" dataKey="expense" stroke="var(--mon-expense)" fill="url(#expenseTrend)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-[var(--mon-radius-xl)] bg-[var(--mon-surface-1)] p-4 border border-[var(--mon-border)]">
        <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-[1.2px] text-[var(--mon-text-3)]">Breakdowns</h3>
        <div className="space-y-3">
          {analytics.categoryData.map((item) => (
            <div key={item.category}>
              <div className="mb-1 flex items-center justify-between gap-3 text-[12px]">
                <span className="font-semibold text-[var(--mon-text-2)]">{item.name}</span>
                <span className="font-bold text-[var(--mon-text-1)]">{formatCurrency(item.value, currency_symbol)} • {item.percentage}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[var(--mon-surface-3)]">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${item.percentage}%`, background: item.fill }} />
              </div>
            </div>
          ))}
          {analytics.categoryData.length === 0 && <p className="text-sm text-[var(--mon-text-3)]">No expenses in this period.</p>}
        </div>
      </div>

      <div className="rounded-[var(--mon-radius-xl)] bg-[var(--mon-surface-1)] p-4 border border-[var(--mon-border)]">
        <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-[1.2px] text-[var(--mon-text-3)]">Monthly Line</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={analytics.dailyData}>
              <XAxis dataKey="day" hide />
              <YAxis hide />
              <Tooltip contentStyle={{ background: 'var(--mon-surface-2)', border: '1px solid var(--mon-border)', borderRadius: 12 }} />
              <Line type="monotone" dataKey="income" stroke="var(--mon-income)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="expense" stroke="var(--mon-expense)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

function labelForCategory(category: string, language: 'bn' | 'en'): string {
  const meta = CATEGORY_META[category as keyof typeof CATEGORY_META] || CATEGORY_META.other
  return language === 'bn' ? meta.labelBn : meta.labelEn
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-[var(--mon-radius-xl)] bg-[var(--mon-surface-1)] p-4 border border-[var(--mon-border)]">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--mon-text-3)]">{label}</p>
      <p className="text-[20px] font-black leading-tight" style={{ color }}>{value}</p>
    </div>
  )
}

function TrendBadge({ growth }: { growth: number }) {
  const positive = growth <= 0
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold ${positive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
      {positive ? <TrendingDown size={13} /> : <TrendingUp size={13} />}
      {Math.abs(Math.round(growth))}% {positive ? 'lower' : 'higher'}
    </span>
  )
}
