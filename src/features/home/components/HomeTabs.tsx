'use client'

import { motion } from 'framer-motion'
import { LayoutDashboard, StickyNote, Heart } from 'lucide-react'

export type HomeSubTab = 'dashboard' | 'notes' | 'health'

interface HomeTabsProps {
  activeTab: HomeSubTab
  onTabChange: (tab: HomeSubTab) => void
}

const TABS: { value: HomeSubTab; label: string; icon: typeof LayoutDashboard }[] = [
  { value: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { value: 'notes', label: 'Notes', icon: StickyNote },
  { value: 'health', label: 'Health', icon: Heart },
]

export default function HomeTabs({ activeTab, onTabChange }: HomeTabsProps) {
  return (
    <div className="hm-segmented-control">
      {TABS.map(({ value, label, icon: Icon }) => {
        const isActive = activeTab === value
        return (
          <button
            key={value}
            onClick={() => onTabChange(value)}
            className={`hm-segment ${isActive ? 'active' : ''}`}
          >
            <Icon size={15} strokeWidth={isActive ? 2.5 : 1.8} />
            <span>{label}</span>
            {isActive && (
              <motion.div
                layoutId="hm-active-tab"
                className="absolute inset-0 rounded-[10px] bg-[var(--hm-surface)]"
                style={{ zIndex: -1 }}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
          </button>
        )
      })}
    </div>
  )
}