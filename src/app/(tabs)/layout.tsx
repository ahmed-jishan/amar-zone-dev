// src/app/(tabs)/layout.tsx
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CheckSquare, Moon, Wallet, Settings } from 'lucide-react'
import { useTheme } from '@/lib/hooks/useTheme'
import { useEffect, useState } from 'react'
import CalculatorModal from '@/components/ui/CalculatorModal'
import { useSettingsStore } from '@/features/settings/store/settingsStore'

const TABS = [
  { href: '/tasks',     icon: CheckSquare, label: 'Tasks'     },
  { href: '/namaz',     icon: Moon,        label: 'Namaz'     },
  { href: '/money',     icon: Wallet,      label: 'Money'     },
  { href: '/settings',  icon: Settings,    label: 'Settings'  },
]

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  useTheme()
  const { calculatorEnabled } = useSettingsStore()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <main style={{ flex: 1, overflowY: 'auto', paddingBottom: 'calc(68px + env(safe-area-inset-bottom))' }}>
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
                  style={{
                    backgroundColor: active ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                    border: active ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
                    boxShadow: active ? '0 2px 8px rgba(99, 102, 241, 0.2)' : 'none',
                    transition: 'all 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1)',
                    borderRadius: '12px',
                  }}
                >
                  <div className="bottom-nav-icon-wrapper">
                    <Icon
                      size={18}
                      strokeWidth={active ? 2.2 : 1.8}
                      className="bottom-nav-icon"
                      style={{
                        color: active ? '#6366f1' : 'rgb(var(--muted))',
                        transform: active ? 'scale(1.08)' : 'scale(1)',
                        filter: active ? 'drop-shadow(0 0 4px #6366f1)' : 'none',
                        transition: 'transform 0.3s cubic-bezier(0.34, 1.2, 0.64, 1), color 0.2s, filter 0.2s',
                      }}
                    />
                    {active && <div className="active-top-bar" />}
                  </div>
                  <span
                    className="bottom-nav-label"
                    style={{
                      fontWeight: active ? 700 : 500,
                      color: active ? '#6366f1' : 'rgb(var(--muted))',
                      transform: active ? 'scale(1.01)' : 'scale(1)',
                      transition: 'all 0.25s cubic-bezier(0.2, 0.9, 0.4, 1.1)',
                      display: 'inline-block',
                      fontSize: '9px',
                    }}
                  >
                    {label}
                  </span>
                </Link>
              )
            })}

          </div>
        </nav>
      </div>

      {calculatorEnabled && <CalculatorModal />}

      <style>{`
        .bottom-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 50;
          background: rgb(var(--bg));
          backdrop-filter: blur(20px);
          border-top: 1px solid rgba(var(--border), 0.6);
          padding: 6px 12px;
          padding-bottom: max(6px, env(safe-area-inset-bottom));
        }

        .bottom-nav-container {
          display: flex;
          justify-content: space-around;
          align-items: center;
          max-width: 500px;
          margin: 0 auto;
          gap: 6px;
        }

        .bottom-nav-item {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
          padding: 6px 6px 8px;
          border-radius: 12px;
          text-decoration: none;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1);
        }

        /* Ripple effect on click */
        .bottom-nav-item::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          border-radius: 50%;
          background: rgba(99, 102, 241, 0.4);
          transform: translate(-50%, -50%);
          transition: width 0.4s ease-out, height 0.4s ease-out;
          pointer-events: none;
        }
        .bottom-nav-item:active::after {
          width: 200px;
          height: 200px;
          background: rgba(99, 102, 241, 0.15);
        }

        .bottom-nav-icon-wrapper {
          position: relative;
          display: flex;
          justify-content: center;
        }

        /* Animated top bar with glow pulse */
        .active-top-bar {
          position: absolute;
          top: -10px;
          left: 50%;
          transform: translateX(-50%);
          width: 28px;
          height: 2px;
          background: #6366f1;
          border-radius: 2px;
          box-shadow: 0 0 6px #6366f1;
          animation: barSlide 0.4s cubic-bezier(0.2, 1.2, 0.4, 1), glowPulse 1.5s ease-in-out infinite;
        }

        @keyframes barSlide {
          0% { width: 0; opacity: 0; transform: translateX(-50%) scaleX(0); }
          60% { width: 34px; }
          100% { width: 28px; opacity: 1; transform: translateX(-50%) scaleX(1); }
        }

        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 3px #6366f1; opacity: 0.9; }
          50% { box-shadow: 0 0 10px #818cf8; opacity: 1; }
        }

        /* Icon bounce animation on mount (only for active) */
        .bottom-nav-item.active .bottom-nav-icon {
          animation: iconBounce 0.5s cubic-bezier(0.34, 1.2, 0.64, 1);
        }

        @keyframes iconBounce {
          0% { transform: scale(1); }
          50% { transform: scale(1.15); }
          100% { transform: scale(1.08); }
        }

        /* Label subtle bounce */
        .bottom-nav-item.active .bottom-nav-label {
          animation: labelPop 0.35s cubic-bezier(0.2, 1.2, 0.4, 1);
        }

        @keyframes labelPop {
          0% { transform: scale(1); }
          50% { transform: scale(1.04); }
          100% { transform: scale(1.01); }
        }

        /* Hover effect for non-active (desktop) */
        @media (hover: hover) {
          .bottom-nav-item:not(.active):hover {
            transform: translateY(-1px);
          }
          .bottom-nav-item:not(.active):hover .bottom-nav-icon {
            transform: scale(1.04);
            color: rgba(99, 102, 241, 0.8);
          }
          .bottom-nav-item:not(.active):hover .bottom-nav-label {
            color: rgba(99, 102, 241, 0.8);
          }
        }

        /* Tap feedback */
        .bottom-nav-item:active {
          transform: scale(0.98);
          transition: transform 0.05s;
        }
      `}</style>
    </>
  )
}
