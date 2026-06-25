'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CheckSquare, Moon, Home, Wallet, Settings } from 'lucide-react'
import { useTheme } from '@/lib/hooks/useTheme'
import { useEffect, useState } from 'react'
import CalculatorModal from '@/components/ui/CalculatorModal'
import NotificationCenter from '@/components/ui/NotificationCenter'
import AppLockGate from '@/components/security/AppLockGate'
import VoiceFloatingButton from '@/components/ui/VoiceFloatingButton'
import { useSettingsStore } from '@/features/settings/store/settingsStore'
import SafeRender from '@/components/shared/SafeRender'
import PermissionOnboarding from '@/components/shared/PermissionOnboarding'

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
        <main style={{ flex: 1, overflowY: 'auto', paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}>
          {children}
        </main>
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
      <SafeRender name="VoiceFloatingButton">
        <VoiceFloatingButton />
      </SafeRender>
      <SafeRender name="PermissionOnboarding">
        <PermissionOnboarding />
      </SafeRender>

      <style>{`
        .bottom-nav {
          position: fixed;
          bottom: 14px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 50;
          width: auto;
          min-width: 0;
          max-width: calc(100vw - 32px);
          background: rgba(var(--bg), 0.78);
          backdrop-filter: blur(32px) saturate(180%);
          -webkit-backdrop-filter: blur(32px) saturate(180%);
          border: 1px solid rgba(var(--border), 0.25);
          border-radius: 28px;
          padding: 6px 10px;
          padding-bottom: 8px;
          box-shadow:
            0 4px 6px rgba(0, 0, 0, 0.02),
            0 8px 24px rgba(0, 0, 0, 0.06),
            0 16px 48px rgba(0, 0, 0, 0.04),
            inset 0 1px 0 rgba(255, 255, 255, 0.4);
          transition:
            box-shadow 0.3s ease,
            background 0.3s ease;
          animation: navbarFloatIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes navbarFloatIn {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(20px) scale(0.95);
            filter: blur(4px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0) scale(1);
            filter: blur(0);
          }
        }
        .bottom-nav-container {
          display: flex;
          justify-content: center;
          align-items: flex-end;
          gap: 2px;
        }
        .bottom-nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          padding: 4px 14px 6px;
          border-radius: 18px;
          text-decoration: none;
          cursor: pointer;
          position: relative;
          border: none;
          background: transparent;
          transition: all 0.35s cubic-bezier(0.2, 0.9, 0.4, 1.1);
          min-width: 48px;
        }
        @media (hover: hover) {
          .bottom-nav-item:not(.active):hover {
            transform: translateY(-2px);
          }
          .bottom-nav-item:not(.active):hover .bottom-nav-icon {
            color: rgba(99, 102, 241, 0.7);
          }
        }
        .bottom-nav-item:active {
          transform: scale(0.94);
          transition: transform 0.08s;
        }
        .bottom-nav-item.active {
          background: rgba(99, 102, 241, 0.10);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.15);
        }
        .bottom-nav-icon-wrapper {
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .bottom-nav-icon-bg {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 32px;
          height: 28px;
          border-radius: 10px;
          transition: all 0.3s cubic-bezier(0.34, 1.2, 0.64, 1);
        }
        .bottom-nav-item.active .bottom-nav-icon-bg {
          transform: scale(1.05);
        }
        .bottom-nav-icon {
          color: rgb(var(--muted));
          transition:
            color 0.25s ease,
            transform 0.35s cubic-bezier(0.34, 1.2, 0.64, 1),
            filter 0.25s ease;
          transform: scale(1);
        }
        .bottom-nav-item.active .bottom-nav-icon {
          color: #6366f1;
          transform: scale(1.06);
          filter: drop-shadow(0 0 6px rgba(99, 102, 241, 0.25));
          animation: iconRelax 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes iconRelax {
          0%   { transform: scale(1); filter: drop-shadow(0 0 0 rgba(99, 102, 241, 0)); }
          50%  { transform: scale(1.1); filter: drop-shadow(0 0 8px rgba(99, 102, 241, 0.3)); }
          100% { transform: scale(1.06); filter: drop-shadow(0 0 6px rgba(99, 102, 241, 0.25)); }
        }
        .bottom-nav-label {
          font-size: 9px;
          font-weight: 500;
          color: rgb(var(--muted));
          letter-spacing: 0.02em;
          transition: all 0.25s cubic-bezier(0.2, 0.9, 0.4, 1.1);
          display: inline-block;
        }
        .bottom-nav-item.active .bottom-nav-label {
          font-weight: 600;
          color: #6366f1;
          opacity: 1;
        }
        .bottom-nav-item::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          border-radius: 50%;
          background: rgba(99, 102, 241, 0.3);
          transform: translate(-50%, -50%);
          transition: width 0.5s ease-out, height 0.5s ease-out, opacity 0.3s ease;
          pointer-events: none;
          opacity: 0;
        }
        .bottom-nav-item:active::after {
          width: 180px;
          height: 180px;
          opacity: 1;
          background: rgba(99, 102, 241, 0.12);
        }
        @media (max-width: 380px) {
          .bottom-nav {
            padding: 5px 6px;
            padding-bottom: 6px;
            border-radius: 24px;
            max-width: calc(100vw - 20px);
          }
          .bottom-nav-item {
            padding: 3px 8px 5px;
            min-width: 40px;
          }
          .bottom-nav-icon-bg {
            width: 28px;
            height: 24px;
          }
          .bottom-nav-container {
            gap: 0;
          }
        }
        @media (min-width: 500px) {
          .bottom-nav {
            padding: 8px 16px;
            padding-bottom: 10px;
            border-radius: 32px;
            max-width: 460px;
          }
          .bottom-nav-item {
            padding: 6px 20px 8px;
            gap: 3px;
          }
          .bottom-nav-container {
            gap: 4px;
          }
        }
        main {
          padding-bottom: calc(80px + env(safe-area-inset-bottom)) !important;
          background: transparent !important;
        }
        main:has(.namaz-root) { background: #fbf6e8 !important; }
        .dark main:has(.namaz-root) { background: #151614 !important; }
        main:has(.home-root) { background: #f5f3ff !important; }
        .dark main:has(.home-root) { background: #14141f !important; }
        main:has(.st-root) { background: #f6f8fc !important; }
        .dark main:has(.st-root) { background: #0b0d10 !important; }
        main:has(.mon-root) { background: #f8f9fb !important; }
        .dark main:has(.mon-root) { background: #0b0c0e !important; }
        main:has(.az-root) { background: #f8f9fb !important; }
        .dark main:has(.az-root) { background: #0b0c0e !important; }
      `}</style>
    </>
  )
}
