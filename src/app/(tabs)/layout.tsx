'use client'

import TabsShell from '@/components/shared/TabsShell'

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  return <TabsShell>{children}</TabsShell>
}
