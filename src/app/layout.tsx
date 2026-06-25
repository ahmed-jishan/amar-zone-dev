import type { Metadata, Viewport } from 'next'
import './globals.css'
import { storageRepairScript } from '@/lib/startup/storageRepairScript'

const extensionErrorGuardScript = `
(function () {
  var isMetaMaskExtensionError = function (event) {
    var message = String((event && (event.message || event.reason && event.reason.message)) || '');
    var filename = String((event && event.filename) || '');
    var stack = String((event && event.error && event.error.stack) || (event && event.reason && event.reason.stack) || '');
    return (filename.indexOf('chrome-extension://') === 0 || stack.indexOf('chrome-extension://') !== -1) &&
      /metamask|failed to connect/i.test(message + ' ' + stack);
  };

  window.addEventListener('error', function (event) {
    if (isMetaMaskExtensionError(event)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);

  window.addEventListener('unhandledrejection', function (event) {
    if (isMetaMaskExtensionError(event)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);
})();
`


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
    <html lang="bn" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: storageRepairScript }} />
        <script dangerouslySetInnerHTML={{ __html: extensionErrorGuardScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        {children}
      </body>
    </html>
  )
}
