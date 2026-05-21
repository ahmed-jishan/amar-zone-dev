'use client';

export default function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center animate-[az-scale-in_500ms_ease-out]">
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-[var(--az-radius-2xl)] bg-[var(--az-surface-2)] border border-[var(--az-border)] flex items-center justify-center animate-[az-float_4s_ease-in-out_infinite]">
          <svg className="w-9 h-9 text-[var(--az-text-3)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </div>
        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[var(--az-accent)]/20 border border-[var(--az-accent-border)] flex items-center justify-center">
          <svg className="w-3 h-3 text-[var(--az-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path d="M12 4v16m8-8H4" />
          </svg>
        </div>
      </div>
      <h3 className="text-[17px] font-semibold text-[var(--az-text-1)] mb-2">
        All caught up
      </h3>
      <p className="text-[14px] text-[var(--az-text-2)] max-w-[240px] leading-relaxed">
        You have no tasks in this view. Add a new task to get started or adjust your filters.
      </p>
    </div>
  );
}
