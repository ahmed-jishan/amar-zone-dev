'use client';

import { useTaskStore } from '@/lib/store/taskStore';
import { useCallback, useState } from 'react';

export default function BulkActions() {
  const selectedIds = useTaskStore((s) => s.selectedIds);
  const isSelectionMode = useTaskStore((s) => s.isSelectionMode);
  const clearSelection = useTaskStore((s) => s.clearSelection);
  const bulkDelete = useTaskStore((s) => s.bulkDelete);
  const bulkComplete = useTaskStore((s) => s.bulkComplete);
  const bulkArchive = useTaskStore((s) => s.bulkArchive);
  const bulkSetPriority = useTaskStore((s) => s.bulkSetPriority);
  const canUndo = useTaskStore((s) => s.canUndo);
  const undo = useTaskStore((s) => s.undo);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const count = selectedIds.length;
  if (!isSelectionMode || count === 0) return null;

  const btnClass = `
    px-3 py-1.5 rounded-[var(--az-radius-md)] text-[13px] font-medium
    transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]
    border flex items-center gap-1.5
  `;

  return (
    <div className="sticky top-0 z-30 mb-3 animate-[az-slide-down_250ms_ease-out]">
      <div className="az-glass rounded-[var(--az-radius-xl)] p-2 shadow-[var(--az-shadow-lg)] border border-[var(--az-glass-border)]">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2 py-1 text-[13px] font-semibold text-[var(--az-accent)]">
            {count} selected
          </span>

          <div className="w-px h-5 bg-[var(--az-border)]" />

          <button
            onClick={() => bulkComplete(true)}
            className={`${btnClass} text-[var(--az-success)] border-[var(--az-success-border)] bg-[var(--az-success-bg)] hover:bg-[var(--az-success)]/20`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path d="M5 13l4 4L19 7" />
            </svg>
            Complete
          </button>

          <button
            onClick={() => bulkArchive()}
            className={`${btnClass} text-[var(--az-text-2)] border-[var(--az-border)] bg-[var(--az-surface-2)] hover:bg-[var(--az-surface-3)]`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8" />
            </svg>
            Archive
          </button>

          <div className="relative group">
            <button
              className={`${btnClass} text-[var(--az-warn)] border-[var(--az-warn-border)] bg-[var(--az-warn-bg)] hover:bg-[var(--az-warn)]/20`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Priority
            </button>
            <div className="absolute top-full left-0 mt-1 hidden group-hover:flex flex-col gap-1 p-1.5 rounded-[var(--az-radius-lg)] bg-[var(--az-surface-2)] border border-[var(--az-border)] shadow-[var(--az-shadow-lg)] z-40 min-w-[120px]">
              {(['critical', 'high', 'medium', 'low'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => bulkSetPriority(p)}
                  className="px-3 py-1.5 rounded-md text-[12px] font-medium text-left capitalize hover:bg-[var(--az-surface-3)] transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setConfirmDelete(true)}
            className={`${btnClass} text-[var(--az-danger)] border-[var(--az-danger-border)] bg-[var(--az-danger-bg)] hover:bg-[var(--az-danger)]/20`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </button>

          <div className="flex-1" />

          {canUndo && (
            <button
              onClick={undo}
              className={`${btnClass} text-[var(--az-accent)] border-[var(--az-accent-border)] bg-[var(--az-accent-bg)] hover:bg-[var(--az-accent)]/20`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              Undo
            </button>
          )}

          <button
            onClick={clearSelection}
            className={`${btnClass} text-[var(--az-text-3)] border-transparent hover:bg-[var(--az-surface-hover)]`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
            Cancel
          </button>
        </div>
      </div>

      {confirmDelete && (
        <div className="az-confirm-backdrop" onClick={() => setConfirmDelete(false)}>
          <div className="az-confirm-card" onClick={(e) => e.stopPropagation()}>
            <div className="az-confirm-title">Delete forever? This cannot be undone.</div>
            <div className="az-confirm-actions">
              <button className="az-ghost-btn" onClick={() => setConfirmDelete(false)}>Cancel</button>
              <button className="az-ghost-btn" onClick={() => { bulkArchive(); setConfirmDelete(false); }}>Archive instead</button>
              <button className="az-delete-btn" onClick={() => { bulkDelete(); setConfirmDelete(false); }}>Delete Forever</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
