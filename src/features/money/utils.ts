export const formatCurrency = (amount: number, symbol = '৳') => {
  return `${symbol}${amount.toLocaleString('en-BD', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

export const todayISO = () => new Date().toISOString().split('T')[0]

export const getCurrentMonth = () => todayISO().slice(0, 7)

export const getMonthName = (monthStr: string) => {
  const [year, month] = monthStr.split('-')
  return new Date(Number(year), Number(month) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export const getRelativeDate = (dateStr: string) => {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (diff < 0) return { label: 'Overdue', isOverdue: true }
  if (diff === 0) return { label: 'Today', isOverdue: false }
  if (diff === 1) return { label: 'Tomorrow', isOverdue: false }
  if (diff < 7) return { label: date.toLocaleDateString('en-US', { weekday: 'long' }), isOverdue: false }
  return { label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), isOverdue: false }
}

export const getDaysLeft = (dateStr: string) => {
  const date = new Date(dateStr)
  const now = new Date()
  return Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

export const getWeekData = (transactions: any[]) => {
  const data: { day: string; income: number; expense: number }[] = []
  const today = new Date()
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const iso = d.toISOString().split('T')[0]
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' })
    const dayTxns = transactions.filter((t) => t.date === iso)
    data.push({
      day: dayName,
      income: dayTxns.filter((t) => t.type === 'income').reduce((a, t) => a + t.amount, 0),
      expense: dayTxns.filter((t) => t.type === 'expense').reduce((a, t) => a + t.amount, 0),
    })
  }
  return data
}

export const getHealthScore = (income: number, expense: number, savings: number) => {
  if (income === 0) return 0
  const savingsRate = (income - expense) / income
  const score = Math.min(100, Math.max(0, Math.round(savingsRate * 100) + 50))
  return score
}
