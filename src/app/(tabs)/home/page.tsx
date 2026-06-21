'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import HomeTabs, { HomeSubTab } from '@/features/home/components/HomeTabs'
import DashboardView from '@/features/home/components/DashboardView'
import NotesList from '@/features/notes/components/NotesList'
import BMICalculator from '@/features/health/components/BMICalculator'
import '@/features/home/home.css'

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<HomeSubTab>('dashboard')

  const handleNavigate = (tab: HomeSubTab) => {
    setActiveTab(tab)
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView onNavigate={handleNavigate} />
      case 'notes':
        return <NotesList />
      case 'health':
        return <BMICalculator />
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
          <HomeTabs activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}