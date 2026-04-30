// TODO: Full analytics UI
// Connects to: useMoneyStore, useTaskStore, useNamazStore, recharts, exportMonthlyReport
export default function AnalyticsPage() {
  return (
    <div className="p-4 pt-6">
      <h1 className="text-2xl font-semibold mb-1">Analytics</h1>
      <p className="text-sm" style={{ color: 'rgb(var(--muted))' }}>Weekly · Monthly · Yearly</p>
      {/* Build: ExpenseBarChart, TaskCompletionLine, NamazConsistency, PDFExportButton */}
    </div>
  )
}
