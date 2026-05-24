'use client';

import { useMemo } from 'react';
import type { Loan, MonthlyBudget, SavingsGoal, Subscription, Transaction, Wallet } from '@/lib/types';
import { formatCurrency } from '../utils';

interface Props {
  transactions: Transaction[];
  loans: Loan[];
  budgets: MonthlyBudget[];
  savingsGoals: SavingsGoal[];
  subscriptions: Subscription[];
  wallets: Wallet[];
  month: string;
  currencySymbol: string;
}

const dayMs = 24 * 60 * 60 * 1000;

function parseLocalDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function isInMonth(date: string | undefined, month: string) {
  return !!date && date.startsWith(month);
}

function getMonthBounds(month: string) {
  const [year, monthNumber] = month.split('-').map(Number);
  const start = new Date(year, monthNumber - 1, 1);
  const end = new Date(year, monthNumber, 0);
  return { start, end };
}

export default function CashflowForecast({
  transactions,
  loans,
  budgets,
  savingsGoals,
  subscriptions,
  wallets,
  month,
  currencySymbol,
}: Props) {
  const forecast = useMemo(() => {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const { end } = getMonthBounds(month);
    const dayOfMonth = todayStart.getMonth() === end.getMonth() && todayStart.getFullYear() === end.getFullYear()
      ? todayStart.getDate()
      : end.getDate();
    const daysInMonth = end.getDate();
    const daysLeft = Math.max(0, Math.ceil((end.getTime() - todayStart.getTime()) / dayMs));

    const monthTxns = transactions.filter((txn) => txn.date.startsWith(month) && txn.status === 'completed');
    const income = monthTxns.filter((txn) => txn.type === 'income').reduce((sum, txn) => sum + txn.amount, 0);
    const expense = monthTxns.filter((txn) => txn.type === 'expense').reduce((sum, txn) => sum + txn.amount, 0);
    const dailyExpense = expense / Math.max(1, Math.min(dayOfMonth, daysInMonth));
    const projectedDailySpend = dailyExpense * daysLeft;
    const currentBalance = wallets.reduce((sum, wallet) => sum + wallet.balance, 0);

    const currentBudget = budgets.find((budget) => budget.month === month);
    const expectedRemainingIncome = currentBudget ? Math.max(0, currentBudget.salary - income) : 0;

    const upcomingSubscriptions = subscriptions
      .filter((subscription) => subscription.status === 'active' && isInMonth(subscription.nextBillingDate, month))
      .filter((subscription) => parseLocalDate(subscription.nextBillingDate) >= todayStart);
    const upcomingSubscriptionTotal = upcomingSubscriptions.reduce((sum, subscription) => sum + subscription.amount, 0);

    const activeLoans = loans.filter((loan) => !loan.settled && loan.currentBalance > 0);
    const dueLoans = activeLoans.filter((loan) => isInMonth(loan.dueDate, month) && loan.dueDate && parseLocalDate(loan.dueDate) >= todayStart);
    const loanIn = dueLoans.filter((loan) => loan.direction === 'given').reduce((sum, loan) => sum + loan.currentBalance, 0);
    const loanOut = dueLoans.filter((loan) => loan.direction === 'taken').reduce((sum, loan) => sum + loan.currentBalance, 0);

    const goalPressure = savingsGoals
      .filter((goal) => goal.deadline && isInMonth(goal.deadline, month) && parseLocalDate(goal.deadline) >= todayStart)
      .reduce((sum, goal) => sum + Math.max(0, goal.targetAmount - goal.currentAmount), 0);

    const projectedEndBalance =
      currentBalance +
      expectedRemainingIncome +
      loanIn -
      projectedDailySpend -
      upcomingSubscriptionTotal -
      loanOut -
      goalPressure;

    const safeToSpend = Math.max(0, projectedEndBalance / Math.max(1, daysLeft || 1));
    const budgetBurn = currentBudget?.salary ? Math.min(999, (expense / currentBudget.salary) * 100) : 0;

    return {
      daysLeft,
      currentBalance,
      expectedRemainingIncome,
      projectedDailySpend,
      upcomingSubscriptionTotal,
      upcomingSubscriptionCount: upcomingSubscriptions.length,
      loanIn,
      loanOut,
      goalPressure,
      projectedEndBalance,
      safeToSpend,
      budgetBurn,
      hasBudget: !!currentBudget,
    };
  }, [transactions, loans, budgets, savingsGoals, subscriptions, wallets, month]);

  const status =
    forecast.projectedEndBalance >= 0
      ? { label: 'On track', color: 'var(--mon-income)', bg: 'var(--mon-income-bg)' }
      : { label: 'Needs attention', color: 'var(--mon-expense)', bg: 'var(--mon-expense-bg)' };

  return (
    <section
      className="rounded-[var(--mon-radius-xl)] p-4 animate-[mon-slide-up_400ms_ease-out]"
      style={{ background: 'var(--mon-surface-1)', border: '1px solid var(--mon-border)' }}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[1.2px]" style={{ color: 'var(--mon-text-3)' }}>
            Cashflow Forecast
          </p>
          <h3 className="mt-1 text-[20px] font-black tracking-[-0.5px]" style={{ color: 'var(--mon-text-1)' }}>
            {formatCurrency(forecast.projectedEndBalance, currencySymbol)}
          </h3>
          <p className="mt-1 text-[12px]" style={{ color: 'var(--mon-text-3)' }}>
            projected end-of-month balance
          </p>
        </div>
        <span
          className="rounded-full px-2.5 py-1 text-[11px] font-bold"
          style={{ color: status.color, background: status.bg, border: `1px solid ${status.color}33` }}
        >
          {status.label}
        </span>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2">
        <ForecastMetric label="Safe/day" value={formatCurrency(forecast.safeToSpend, currencySymbol)} color="var(--mon-gold)" />
        <ForecastMetric label="Days left" value={forecast.daysLeft} color="var(--mon-text-1)" />
      </div>

      <div className="space-y-2">
        <ForecastRow label="Current wallet balance" value={forecast.currentBalance} currencySymbol={currencySymbol} positive />
        <ForecastRow label="Expected income left" value={forecast.expectedRemainingIncome} currencySymbol={currencySymbol} positive />
        <ForecastRow label="Projected daily spend" value={forecast.projectedDailySpend} currencySymbol={currencySymbol} />
        <ForecastRow
          label={`Subscriptions (${forecast.upcomingSubscriptionCount})`}
          value={forecast.upcomingSubscriptionTotal}
          currencySymbol={currencySymbol}
        />
        <ForecastRow label="Loan money expected" value={forecast.loanIn} currencySymbol={currencySymbol} positive />
        <ForecastRow label="Loan payments due" value={forecast.loanOut} currencySymbol={currencySymbol} />
        <ForecastRow label="Goal pressure" value={forecast.goalPressure} currencySymbol={currencySymbol} />
      </div>

      {forecast.hasBudget && (
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold" style={{ color: 'var(--mon-text-3)' }}>
            <span>Budget burn</span>
            <span>{Math.round(forecast.budgetBurn)}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full" style={{ background: 'var(--mon-surface-3)' }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.min(forecast.budgetBurn, 100)}%`,
                background: forecast.budgetBurn > 90 ? 'var(--mon-expense)' : forecast.budgetBurn > 70 ? 'var(--mon-gold)' : 'var(--mon-income)',
              }}
            />
          </div>
        </div>
      )}
    </section>
  );
}

function ForecastMetric({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="rounded-[var(--mon-radius-lg)] px-3 py-2" style={{ background: 'var(--mon-surface-2)', border: '1px solid var(--mon-border)' }}>
      <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--mon-text-3)' }}>{label}</p>
      <p className="mt-0.5 text-[16px] font-black" style={{ color }}>{value}</p>
    </div>
  );
}

function ForecastRow({
  label,
  value,
  currencySymbol,
  positive = false,
}: {
  label: string;
  value: number;
  currencySymbol: string;
  positive?: boolean;
}) {
  if (value <= 0) return null;
  return (
    <div className="flex items-center justify-between gap-3 text-[13px]">
      <span style={{ color: 'var(--mon-text-3)' }}>{label}</span>
      <span className="font-bold" style={{ color: positive ? 'var(--mon-income)' : 'var(--mon-expense)' }}>
        {positive ? '+' : '-'}{formatCurrency(value, currencySymbol)}
      </span>
    </div>
  );
}
