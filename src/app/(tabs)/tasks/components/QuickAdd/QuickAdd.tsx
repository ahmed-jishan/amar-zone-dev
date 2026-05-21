'use client';
import { useRef, useState } from 'react';
import QuickAddModal from './QuickAddModal';
import { useTaskStore } from '@/lib/store/taskStore';

export default function QuickAdd() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const addTask = useTaskStore(s => s.addTask);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleCreate = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    addTask({ title: trimmed, status: 'today', priority: 'medium', category: 'personal', completed: false, completedDates: [], recurring: 'none' });
    setTitle('');
    inputRef.current?.focus();
  };

  return (
    <>
      <div className="azqa-wrap">
        <div className="azqa-icon" aria-hidden>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
        </div>
        <input
          ref={inputRef}
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => { if (e.key==='Enter') handleCreate(); if (e.key==='Escape') setTitle(''); }}
          placeholder="Quick add a task… (Enter to save)"
          maxLength={200}
          className="azqa-input"
          aria-label="New task title"
        />
        <button onClick={() => setOpen(true)} className="azqa-more" aria-label="More options" title="More options">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="5"  cy="12" r="1.5" fill="currentColor"/>
            <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
            <circle cx="19" cy="12" r="1.5" fill="currentColor"/>
          </svg>
        </button>
        <button onClick={handleCreate} disabled={!title.trim()} className="azqa-add">Add</button>
      </div>

      <QuickAddModal open={open} setOpen={setOpen} initialTitle={title} onTitleChange={setTitle}/>

      <style>{`
        .azqa-wrap { display:flex; align-items:center; gap:8px; background:var(--az-surface-1); border:1px solid var(--az-border); border-radius:14px; padding:10px 12px; margin-bottom:14px; transition:border-color .15s; }
        .azqa-wrap:focus-within { border-color:var(--az-accent); }
        .azqa-icon { color:var(--az-text-3); flex-shrink:0; display:flex; }
        .azqa-input { flex:1; background:transparent; border:none; outline:none; font-size:14px; color:var(--az-text-1); min-width:0; font-family:inherit; }
        .azqa-input::placeholder { color:var(--az-text-3); }
        .azqa-more { background:transparent; border:none; cursor:pointer; color:var(--az-text-3); display:flex; align-items:center; padding:4px; border-radius:6px; transition:all .15s; flex-shrink:0; }
        .azqa-more:hover { background:var(--az-surface-2); color:var(--az-text-2); }
        .azqa-add { background:var(--az-accent); color:#fff; border:none; border-radius:9px; padding:6px 14px; font-size:13px; font-weight:600; cursor:pointer; flex-shrink:0; transition:all .15s; font-family:inherit; }
        .azqa-add:hover:not(:disabled) { filter:brightness(1.1); }
        .azqa-add:active:not(:disabled) { transform:scale(.96); }
        .azqa-add:disabled { opacity:.35; cursor:not-allowed; }
      `}</style>
    </>
  );
}
