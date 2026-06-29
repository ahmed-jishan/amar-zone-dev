import type { Metadata, Viewport } from 'next'
import { Ubuntu } from 'next/font/google'
import './globals.css'
import { storageRepairScript } from '@/lib/startup/storageRepairScript'

const ubuntu = Ubuntu({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  display: 'swap',
  preload: true,
  variable: '--font-ubuntu',
})

export const metadata: Metadata = {
  title: 'SelfSync',
  description: 'Your personal life management app',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SelfSync',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)',  color: '#0f0f13' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn" suppressHydrationWarning className={ubuntu.variable}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: storageRepairScript }} />
      </head>
      <body style={{ fontFamily: 'var(--font-ubuntu), system-ui, sans-serif' }}>
        {children}
      </body>
    </html>
  )
}