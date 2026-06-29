'use client'

import Link from 'next/link'
import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'
import { CheckSquare, Moon, Home, Wallet, Settings } from 'lucide-react'
import { useTheme } from '@/lib/hooks/useTheme'
import { useEffect, useState, memo } from 'react'
import AppLockGate from '@/components/security/AppLockGate'
import { useSettingsStore } from '@/features/settings/store/settingsStore'
import SafeRender from '@/components/shared/SafeRender'
import './TabsShell.css'

const CalculatorModal = dynamic(() => import('@/components/ui/CalculatorModal'), {
  ssr: false,
  loading: () => null,
})
const NotificationCenter = dynamic(() => import('@/components/ui/NotificationCenter'), {
  ssr: false,
  loading: () => null,
})
const PermissionOnboarding = dynamic(() => import('@/components/shared/PermissionOnboarding'), {
  ssr: false,
  loading: () => null,
})

const TABS = [
  { href: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { href: '/namaz', icon: Moon, label: 'Namaz' },
  { href: '/home', icon: Home, label: 'Home' },
  { href: '/money', icon: Wallet, label: 'Money' },
  { href: '/settings', icon: Settings, label: 'Settings' },
]

export default function TabsShell({
  children,
  activePathname,
}: {
  children: React.ReactNode
  activePathname?: string
}) {
  useTheme()
  const { calculatorEnabled } = useSettingsStore()
  const pathname = activePathname ?? usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <main
          aria-hidden="true"
          suppressHydrationWarning
          style={{
            flex: 1,
            overflowY: 'auto',
            paddingBottom: 'calc(80px + env(safe-area-inset-bottom))',
            background: 'transparent',
          }}
        />
      </div>
    )
  }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <main style={{ flex: 1, overflowY: 'auto', paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}>
          {children}
        </main>

        <nav className="bottom-nav">
          <div className="bottom-nav-container">
            {TABS.map(({ href, icon: Icon, label }) => {
              const active = pathname === href || pathname === `${href}/`
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={`bottom-nav-item ${active ? 'active' : ''}`}
                  data-active={active}
                >
                  <div className="bottom-nav-icon-wrapper">
                    <div className="bottom-nav-icon-bg">
                      <Icon
                        size={18}
                        strokeWidth={active ? 2.4 : 1.8}
                        className="bottom-nav-icon"
                      />
                    </div>
                  </div>
                  <span className="bottom-nav-label">
                    {label}
                  </span>
                </Link>
              )
            })}
          </div>
        </nav>
      </div>

      {calculatorEnabled && (
        <SafeRender name="CalculatorModal">
          <CalculatorModal />
        </SafeRender>
      )}
      <SafeRender name="NotificationCenter">
        <NotificationCenter />
      </SafeRender>
      <SafeRender name="AppLockGate">
        <AppLockGate />
      </SafeRender>
      <SafeRender name="PermissionOnboarding">
        <PermissionOnboarding />
      </SafeRender>
    </>
  )
}
