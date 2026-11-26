export const generateId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

export const formatCurrency = (amount: number, symbol = '৳') =>
  `${symbol}${amount.toLocaleString('en-BD')}`

export const toLocalDateISO = (date = new Date()) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const todayISO = () => toLocalDateISO()

export const monthISO = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

export function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(' ')
}
