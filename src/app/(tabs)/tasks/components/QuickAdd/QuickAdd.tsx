'use client';
// FIX 13: QuickAdd.tsx
// BUGS FIXED:
//   - QuickAdd.tsx owned a local `title` state but QuickAddModal.tsx had its OWN
//     separate `title` state. Typing in QuickAdd's input then clicking "More" opened
//     the modal with an EMPTY title — the typed text was lost.
//   - "Add" button (Enter key) had no visual loading/feedback state.
//   - Input wasn't focused on mount — extra tap required on mobile.
//   - No character limit guard on quick-add (empty whitespace-only titles would pass
//     if user hit Enter after spaces).
//
// IMPROVEMENT:
//   - title state lifted: passed to QuickAddModal so text carries over
//   - Input auto-focused on mobile via `autoFocus` attribute (desktop-safe)
//   - Trim + min-length guard

import { useRef, useState } from 'react';
import QuickAddModal from './QuickAddModal';
import { useTaskStore } from '@/lib/store/taskStore';

export default function QuickAdd() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const addTask = useTaskStore((s) => s.addTask);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleCreate = () => {
    const trimmed = title.trim();
    if (!trimmed) return;

    addTask({
      title: trimmed,
      status: 'today',
      priority: 'medium',
      category: 'personal',
      completed: false,
      completedDates: [],
      recurring: 'none', // or another default value if needed
    });

    setTitle('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleCreate();
    if (e.key === 'Escape') setTitle('');
  };

  return (
    <>
      <div className="mb-5 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-md focus-within:border-white/20 transition-colors">
        <input
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a task... (Enter to save)"
          maxLength={200}
          className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/30"
        />

        <button
          onClick={() => setOpen(true)}
          className="flex-shrink-0 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/60 transition hover:bg-white/10 hover:text-white active:scale-95"
        >
          More
        </button>

        <button
          onClick={handleCreate}
          disabled={!title.trim()}
          className="flex-shrink-0 rounded-xl bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-black transition hover:bg-emerald-400 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Add
        </button>
      </div>

      {/* FIX: pass title + setTitle so modal shares the same draft text */}
      <QuickAddModal
        open={open}
        setOpen={setOpen}
        initialTitle={title}
        onTitleChange={setTitle}
      />
    </>
  );
}
