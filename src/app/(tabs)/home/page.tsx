'use client'

import { useEffect, useState, useTransition } from 'react'
import { motion } from 'framer-motion'
import HomeTabs, { HomeSubTab } from '@/features/home/components/HomeTabs'
import DashboardView from '@/features/home/components/DashboardView'
import NotesList from '@/features/notes/components/NotesList'
import BMICalculator from '@/features/health/components/BMICalculator'
import { ZakatWizard } from '@/features/zakat'
import SafeRender from '@/components/shared/SafeRender'
import '@/features/home/home.css'

const HOME_TABS: HomeSubTab[] = ['dashboard', 'notes', 'health', 'zakat']

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<HomeSubTab>('dashboard')
  const [mountedTabs, setMountedTabs] = useState<Set<HomeSubTab>>(() => new Set<HomeSubTab>(['dashboard']))
  const [, startTransition] = useTransition()

  const handleNavigate = (tab: HomeSubTab) => {
    setMountedTabs((prev) => new Set(prev).add(tab))
    startTransition(() => setActiveTab(tab))
  }

  useEffect(() => {
    const preload = () => {
      setMountedTabs(new Set(HOME_TABS))
    }
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      const idleId = window.requestIdleCallback(preload, { timeout: 1600 })
      return () => window.cancelIdleCallback(idleId)
    }

    const timeoutId = globalThis.setTimeout(preload, 900)
    return () => globalThis.clearTimeout(timeoutId)
  }, [])

  const renderContent = (tab: HomeSubTab) => {
    switch (tab) {
      case 'dashboard':
        return (
          <SafeRender name="DashboardView">
            <DashboardView onNavigate={handleNavigate} />
          </SafeRender>
        )
      case 'notes':
        return (
          <SafeRender name="NotesList">
            <NotesList />
          </SafeRender>
        )
      case 'health':
        return (
          <SafeRender name="BMICalculator">
            <BMICalculator />
          </SafeRender>
        )
      case 'zakat':
        return (
          <SafeRender name="ZakatWizard">
            <ZakatWizard />
          </SafeRender>
        )
      default:
        return null
    }
  }

  return (
    <div className="home-root min-h-[100dvh]">
      <div className="max-w-[680px] mx-auto px-4 sm:px-6 pb-32 pt-4 sm:pt-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-lg font-bold text-[var(--hm-text)]">Home</h1>
            <p className="text-xs text-[var(--hm-muted)]">Your personal hub</p>
          </div>
        </div>

        {/* Segmented Tabs */}
        <div className="mb-5">
          <HomeTabs activeTab={activeTab} onTabChange={handleNavigate} />
        </div>

        {/* Tab Content */}
        <div className="hm-tab-panels">
          {HOME_TABS.map((tab) => {
            const isActive = activeTab === tab
            if (!mountedTabs.has(tab) && !isActive) return null
            return (
              <motion.div
                key={tab}
                className={`hm-tab-panel ${isActive ? 'hm-tab-panel--active' : 'hm-tab-panel--hidden'}`}
                initial={false}
                animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              >
                {renderContent(tab)}
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
