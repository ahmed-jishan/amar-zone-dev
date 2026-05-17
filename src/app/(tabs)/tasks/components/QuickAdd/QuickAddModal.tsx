'use client';
// FIX 14: QuickAddModal.tsx
// BUGS FIXED:
//   - Modal had NO backdrop click to close — UX dead-end on mobile.
//   - No Escape key listener to close.
//   - Title state was local and disconnected from QuickAdd's title input.
//   - <select> elements had no bg color defined — browser renders white bg on dark modal.
//   - No due date field — creating tasks from this modal always lacked a date.
//   - After creation, modal closed but parent QuickAdd title was NOT cleared.
//   - Missing `autoFocus` on title input when modal opens.
//   - Modal used `items-end` in TaskDetailsModal but `items-center` here — inconsistent
//     positioning strategy. Standardized to items-center for QuickAddModal (creation flow).

import { useEffect, useRef, useState } from 'react';
import { useTaskStore } from '@/lib/store/taskStore';
import { CATEGORIES } from '../../constants/categories';

interface Props {
  open: boolean;
  setOpen: (v: boolean) => void;
  initialTitle?: string;
  onTitleChange?: (v: string) => void;
}

export default function QuickAddModal({
  open,
  setOpen,
  initialTitle = '',
  onTitleChange,
}: Props) {
  const [title, setTitle] = useState(initialTitle);
  const [priority, setPriority] = useState('medium');
  const [category, setCategory] = useState('personal');
  const [dueDate, setDueDate] = useState('');
  const addTask = useTaskStore((s) => s.addTask);
  const titleRef = useRef<HTMLInputElement>(null);

  // Sync initialTitle when modal opens
  useEffect(() => {
    if (open) {
      setTitle(initialTitle);
      // Focus input after modal animates in
      setTimeout(() => titleRef.current?.focus(), 50);
    }
  }, [open, initialTitle]);

  // Escape key to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, setOpen]);

  if (!open) return null;

  const handleCreate = () => {
    const trimmed = title.trim();
    if (!trimmed) return;

    addTask({
      title: trimmed,
      status: 'today',
      priority: priority as any,
      category: category as any,
      completed: false,
      ...(dueDate ? { dueDate } : {}),
    });

    // FIX: clear parent QuickAdd input too
    onTitleChange?.('');
    setTitle('');
    setDueDate('');
    setPriority('medium');
    setCategory('personal');
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) handleCreate();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
      onClick={(e) => {
        // FIX: backdrop click to close
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0d0d12] p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">New Task</h2>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close modal"
            className="rounded-lg p-1 text-white/40 transition hover:bg-white/10 hover:text-white"
          >
            ✕
          </button>
        </div>

        <input
          ref={titleRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Task title"
          maxLength={200}
          className="mb-3 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/20 transition-colors"
        />

        <div className="mb-3 grid grid-cols-2 gap-2">
          {/* FIX: explicit bg color for selects on dark background */}
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="rounded-xl border border-white/10 bg-[#0d0d12] p-2.5 text-xs text-white/80 outline-none focus:border-white/20"
          >
            <option value="low">🟢 Low</option>
            <option value="medium">🟡 Medium</option>
            <option value="high">🟠 High</option>
            <option value="critical">🔴 Critical</option>
          </select>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-xl border border-white/10 bg-[#0d0d12] p-2.5 text-xs text-white/80 outline-none focus:border-white/20"
          >
            {Object.entries(CATEGORIES).map(([key, { label, emoji }]) => (
              <option key={key} value={key}>
                {emoji} {label}
              </option>
            ))}
          </select>
        </div>

        {/* FIX: due date field was missing */}
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="mb-4 w-full rounded-xl border border-white/10 bg-[#0d0d12] p-2.5 text-xs text-white/60 outline-none focus:border-white/20 transition-colors [color-scheme:dark]"
        />

        <button
          onClick={handleCreate}
          disabled={!title.trim()}
          className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Create Task
        </button>
      </div>
    </div>
  );
}
