'use client'

import React from 'react'

export default class SafeRender extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode; name?: string },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode; name?: string }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`[SelfSync] SafeRender recovered${this.props.name ? ` in ${this.props.name}` : ''}:`, error, errorInfo)
  }

  render() {
    if (this.state.hasError) return this.props.fallback ?? null
    return this.props.children
  }
}
