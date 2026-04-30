'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CheckSquare, Moon, Wallet, BarChart2, Settings } from 'lucide-react'
import { useTheme } from '@/lib/hooks/useTheme'

const TABS = [
  { href: '/tasks',     icon: CheckSquare, label: 'Tasks'     },
  { href: '/namaz',     icon: Moon,        label: 'Namaz'     },
  { href: '/money',     icon: Wallet,      label: 'Money'     },
  { href: '/analytics', icon: BarChart2,   label: 'Analytics' },
  { href: '/settings',  icon: Settings,    label: 'Settings'  },
]

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  useTheme()
  const pathname = usePathname()

  return (
    <div className="flex flex-col h-full">
      <main className="flex-1 overflow-y-auto bottom-safe">
        {children}
      </main>

      <nav
        className="fixed bottom-0 left-0 right-0 z-50
                   flex items-center justify-around h-16 px-2
                   border-t"
        style={{
          backgroundColor: 'rgb(var(--bg) / 0.85)',
          backdropFilter: 'blur(20px)',
          borderColor: 'rgb(var(--border))',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {TABS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all"
              style={{ color: active ? 'rgb(var(--brand))' : 'rgb(var(--muted))' }}
            >
              <Icon size={22} strokeWidth={active ? 2.2 : 1.8} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
