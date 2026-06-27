'use client'

import TabErrorBoundary from '@/components/shared/TabErrorBoundary'
import SettingsPage from '@/features/settings/components/SettingsPage'

export default function Page() {
  return (
    <TabErrorBoundary fallbackTitle="Settings tab crashed">
      <SettingsPage />
    </TabErrorBoundary>
  )
}
