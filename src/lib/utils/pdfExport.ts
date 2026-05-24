import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Transaction, Loan } from '@/lib/types'
import { formatCurrency } from './helpers'

export function exportMonthlyReport(
  month: string,
  transactions: Transaction[],
  loans: Loan[],
  summary: { income: number; expense: number; balance: number }
) {
  const doc = new jsPDF()

  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('SelfSync — Monthly Report', 14, 20)

  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text(`Period: ${month}`, 14, 30)

  doc.setFontSize(11)
  doc.text(`Income:  ${formatCurrency(summary.income)}`, 14, 44)
  doc.text(`Expense: ${formatCurrency(summary.expense)}`, 14, 52)
  doc.text(`Balance: ${formatCurrency(summary.balance)}`, 14, 60)

  autoTable(doc, {
    startY: 70,
    head: [['Date', 'Type', 'Category', 'Note', 'Amount']],
    body: transactions.map((t) => [
      t.date, t.type, t.category, t.note ?? '—', formatCurrency(t.amount),
    ]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [99, 102, 241] },
  })

  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY ?? 100

  autoTable(doc, {
    startY: finalY + 10,
    head: [['Person', 'Direction', 'Amount', 'Due Date', 'Status']],
    body: loans.map((l) => [
      l.personName, l.direction, formatCurrency(l.amount),
      l.dueDate ?? '—', l.settled ? 'Settled' : 'Pending',
    ]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [245, 158, 11] },
  })

  doc.save(`selfsync-${month}.pdf`)
}
