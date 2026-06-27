'use client'

import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface TabErrorBoundaryProps {
  children: React.ReactNode
  fallbackTitle?: string
  fallbackMessage?: string
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class TabErrorBoundary extends React.Component<TabErrorBoundaryProps, State> {
  constructor(props: TabErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`[TabErrorBoundary] ${this.props.fallbackTitle || 'Tab'} crashed:`, error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 24px',
            minHeight: 300,
            textAlign: 'center',
            color: 'rgb(var(--fg))',
            fontFamily: "'Inter', system-ui, sans-serif",
          }}
        >
          <AlertTriangle size={40} style={{ opacity: 0.5, marginBottom: 16 }} />
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
            {this.props.fallbackTitle || 'Something went wrong'}
          </h2>
          <p style={{ fontSize: 14, opacity: 0.6, maxWidth: 320, marginBottom: 20, lineHeight: 1.5 }}>
            {this.props.fallbackMessage || 'This section encountered an unexpected error. The rest of the app is still working.'}
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 24px',
              borderRadius: 12,
              border: 'none',
              background: 'rgb(var(--brand))',
              color: '#fff',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
