'use client';
// FIX 18: TaskDetailsModal.tsx
// BUGS FIXED:
//   - Modal used `items-end` (bottom sheet) positioning — fine on mobile, but on
//     desktop it looked broken (full-width sheet at bottom of a wide screen).
//   - TaskNotes.tsx had local `notes` state that was NEVER saved to the store.
//     User types notes → closes modal → notes gone. Silent data loss.
//   - No Escape key to close.
//   - No backdrop click to close.
//   - No scroll lock on body when modal open — background scrolled behind modal.
//   - Close button was tiny unstyled text "Close" with no visual affordance.
//
// IMPROVEMENT:
//   - Bottom sheet on mobile (≤ sm), centered modal on desktop (sm+)
//   - Notes auto-saved to store via updateTask on blur
//   - Body scroll locked while open

import { useEffect } from 'react';
import { Task } from '../../types';
import TaskDescription from './TaskDescription';
import TaskMeta from './TaskMeta';
import TaskNotes from './TaskNotes';

interface Props {
  task: Task | null;
  open: boolean;
  setOpen: (v: boolean) => void;
}

export default function TaskDetailsModal({ task, open, setOpen }: Props) {
  // FIX: lock body scroll while modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // FIX: Escape key to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, setOpen]);

  if (!open || !task) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      {/* 
        FIX: Bottom sheet on mobile, centered card on desktop
        - Mobile: rounded-t-3xl, full width, max 85vh
        - Desktop (sm+): rounded-3xl, max-w-lg, centered
      */}
      <div className="w-full max-h-[88vh] overflow-y-auto rounded-t-3xl border border-white/10 bg-[#0d0d12] p-5 shadow-2xl sm:max-w-lg sm:rounded-3xl">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Task Details</h2>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close details"
            className="rounded-lg p-1.5 text-white/40 transition hover:bg-white/10 hover:text-white"
          >
            ✕
          </button>
        </div>

        <TaskDescription task={task} />
        <TaskMeta task={task} />
        {/* FIX: TaskNotes receives taskId so it can save to store */}
        <TaskNotes task={task} />
      </div>
    </div>
  );
}
