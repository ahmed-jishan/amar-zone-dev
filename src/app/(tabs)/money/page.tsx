'use client'

import TabErrorBoundary from '@/components/shared/TabErrorBoundary'
import { MoneyPage } from '@/features/money'

export default function Page() {
  return (
    <TabErrorBoundary fallbackTitle="Money tab crashed" fallbackMessage="Your financial data is safe. Please try again.">
      <MoneyPage />
    </TabErrorBoundary>
  )
}
