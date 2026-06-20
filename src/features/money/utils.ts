export const formatCurrency = (amount: number, symbol = '৳') => {
  return `${symbol}${amount.toLocaleString('en-BD', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

export const toLocalDateISO = (date = new Date()) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const parseLocalDate = (dateStr: string) => {
  const [year, month, day] = normalizeMoneyDateKey(dateStr).split('-').map(Number)
  return new Date(year, (month || 1) - 1, day || 1)
}

export const todayISO = () => toLocalDateISO()

export const normalizeMoneyDateKey = (value: string) => {
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10)
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? todayISO() : toLocalDateISO(parsed)
}

export const getCurrentMonth = () => todayISO().slice(0, 7)

export const getMonthName = (monthStr: string) => {
  const [year, month] = monthStr.split('-')
  return new Date(Number(year), Number(month) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export const getRelativeDate = (dateStr: string) => {
  const date = parseLocalDate(dateStr)
  const today = parseLocalDate(todayISO())
  const diff = Math.floor((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (diff < 0) return { label: 'Overdue', isOverdue: true }
  if (diff === 0) return { label: 'Today', isOverdue: false }
  if (diff === 1) return { label: 'Tomorrow', isOverdue: false }
  if (diff < 7) return { label: date.toLocaleDateString('en-US', { weekday: 'long' }), isOverdue: false }
  return { label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), isOverdue: false }
}

export const getDaysLeft = (dateStr: string) => {
  const date = parseLocalDate(dateStr)
  const now = parseLocalDate(todayISO())
  return Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

export const getWeekData = (transactions: any[]) => {
  const data: { day: string; income: number; expense: number }[] = []
  const today = new Date()
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const iso = toLocalDateISO(d)
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
