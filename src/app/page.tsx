'use client'

import TabsShell from '@/components/shared/TabsShell'
import SafeRender from '@/components/shared/SafeRender'
import HomePage from './(tabs)/home/page'

const HOME_PATH = '/home/'

export default function Home() {
  return (
    <TabsShell activePathname={HOME_PATH}>
      <SafeRender name="RootHome">
        <HomePage />
      </SafeRender>
    </TabsShell>
  )
}
