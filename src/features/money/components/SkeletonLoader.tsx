'use client'

export function SkeletonHero() {
  return (
    <div className="pt-5 pb-4">
      <div className="mon-hero p-5">
        <div className="mon-skeleton mon-skeleton-text w-24 mb-3" />
        <div className="mon-skeleton mon-skeleton-title w-48 mb-4" />
        <div className="flex gap-2">
          <div className="mon-skeleton mon-skeleton-text w-20" />
          <div className="mon-skeleton mon-skeleton-text w-20" />
        </div>
      </div>
    </div>
  )
}

export function SkeletonStats() {
  return (
    <div className="flex items-center gap-3 p-4 rounded-[var(--mon-radius-xl)] mb-5" style={{ background: 'var(--mon-surface-1)', border: '1px solid var(--mon-border)' }}>
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex-1">
          <div className="mon-skeleton mon-skeleton-text w-16 mb-2" />
          <div className="mon-skeleton mon-skeleton-title w-24" />
        </div>
      ))}
    </div>
  )
}

export function SkeletonCard() {
  return (
    <div className="mon-skeleton mon-skeleton-card" />
  )
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-[var(--mon-radius-lg)]" style={{ background: 'var(--mon-surface-1)', border: '1px solid var(--mon-border)' }}>
          <div className="mon-skeleton w-10 h-10 rounded-xl flex-shrink-0" />
          <div className="flex-1">
            <div className="mon-skeleton mon-skeleton-text w-32" />
            <div className="mon-skeleton mon-skeleton-text w-20 mt-1" />
          </div>
          <div className="mon-skeleton w-16 h-6 rounded" />
        </div>
      ))}
    </div>
  )
}

export default function MoneySkeleton() {
  return (
    <div className="mon-root min-h-[100dvh] bg-[var(--mon-bg)]">
      <div className="max-w-[680px] mx-auto px-4 sm:px-6 pb-32">
        <SkeletonHero />
        <SkeletonStats />
        <div className="flex gap-2.5 mb-5 overflow-x-auto">
          {[1, 2, 3].map((i) => (
            <div key={i} className="mon-skeleton min-w-[152px] h-[100px] rounded-[14px] flex-shrink-0" />
          ))}
        </div>
        <div className="mon-skeleton h-10 rounded-[var(--mon-radius-lg)] mb-5" />
        <SkeletonList count={4} />
      </div>
    </div>
  )
}