'use client';
import { useEffect, useRef, useState } from 'react';
import { useTaskStore } from '@/lib/store/taskStore';
import { CATEGORIES } from '../../constants/categories';

interface Props {
  open: boolean;
  setOpen: (v: boolean) => void;
  initialTitle?: string;
  onTitleChange?: (v: string) => void;
}

const PRIORITIES = [
  { value: 'low',      label: 'Low',      emoji: '🟢' },
  { value: 'medium',   label: 'Medium',   emoji: '🟡' },
  { value: 'high',     label: 'High',     emoji: '🟠' },
  { value: 'critical', label: 'Critical', emoji: '🔴' },
];

const STATUSES = [
  { value: 'today',       label: 'Today' },
  { value: 'inbox',       label: 'Inbox' },
  { value: 'upcoming',    label: 'Upcoming' },
  { value: 'in-progress', label: 'In Progress' },
];

export default function QuickAddModal({ open, setOpen, initialTitle = '', onTitleChange }: Props) {
  const [title,       setTitle]       = useState(initialTitle);
  const [description, setDescription] = useState('');
  const [priority,    setPriority]    = useState('medium');
  const [category,    setCategory]    = useState('personal');
  const [status,      setStatus]      = useState('today');
  const [dueDate,     setDueDate]     = useState('');
  const [energyLevel, setEnergyLevel] = useState('');
  const addTask = useTaskStore(s => s.addTask);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTitle(initialTitle);
      setTimeout(() => titleRef.current?.focus(), 60);
    }
  }, [open, initialTitle]);

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, setOpen]);

  if (!open) return null;

  const handleCreate = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    addTask({
      title: trimmed,
      description: description.trim() || undefined,
      status: status as any,
      priority: priority as any,
      category: category as any,
      completed: false,
      completedDates: [],
      recurring: 'none',
      ...(dueDate ? { dueDate } : {}),
      ...(energyLevel ? { energyLevel: energyLevel as any } : {}),
    });
    onTitleChange?.('');
    setTitle(''); setDescription(''); setDueDate('');
    setPriority('medium'); setCategory('personal'); setStatus('today'); setEnergyLevel('');
    setOpen(false);
  };

  return (
    <>
      <div className="azm-backdrop" onClick={e => { if (e.target === e.currentTarget) setOpen(false); }}>
        <div className="azm-sheet">
          <div className="azm-handle"/>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
            <h2 style={{ fontSize:18, fontWeight:700, color:'var(--az-text-1)', margin:0 }}>New Task</h2>
            <button className="azm-close" onClick={() => setOpen(false)} aria-label="Close">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/></svg>
            </button>
          </div>

          {/* Title */}
          <input
            ref={titleRef}
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) handleCreate(); }}
            placeholder="Task title…"
            maxLength={200}
            className="azm-input azm-input--lg"
          />

          {/* Description */}
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={2}
            className="azm-input azm-textarea"
          />

          {/* Priority */}
          <p className="azm-label">Priority</p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6, marginBottom:16 }}>
            {PRIORITIES.map(p => (
              <button key={p.value} onClick={() => setPriority(p.value)}
                className={`azm-chip${priority===p.value?' azm-chip--on':''}`}>
                <span>{p.emoji}</span><span>{p.label}</span>
              </button>
            ))}
          </div>

          {/* Status */}
          <p className="azm-label">Status</p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:6, marginBottom:16 }}>
            {STATUSES.map(s => (
              <button key={s.value} onClick={() => setStatus(s.value)}
                className={`azm-chip${status===s.value?' azm-chip--on':''}`}>
                {s.label}
              </button>
            ))}
          </div>

          {/* Category */}
          <p className="azm-label">Category</p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6, marginBottom:16 }}>
            {Object.entries(CATEGORIES).map(([key, cat]) => (
              <button key={key} onClick={() => setCategory(key)}
                className={`azm-chip${category===key?' azm-chip--on':''}`}>
                <span>{cat.emoji}</span><span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Energy Level */}
          <p className="azm-label">Energy Level <span style={{ fontWeight:400, textTransform:'none', letterSpacing:0, opacity:.6 }}>(optional)</span></p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6, marginBottom:16 }}>
            {['low','medium','high'].map(e => (
              <button key={e} onClick={() => setEnergyLevel(energyLevel===e?'':e)}
                className={`azm-chip${energyLevel===e?' azm-chip--on':''}`} style={{ textTransform:'capitalize' }}>
                {e==='low'?'🔋':e==='medium'?'⚡':'🔥'} {e}
              </button>
            ))}
          </div>

          {/* Due date */}
          <p className="azm-label">Due date <span style={{ fontWeight:400, textTransform:'none', letterSpacing:0, opacity:.6 }}>(optional)</span></p>
          <input
            type="date"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
            className="azm-input"
            style={{ colorScheme:'dark', marginBottom:20 }}
          />

          <button onClick={handleCreate} disabled={!title.trim()} className="azm-submit">
            Create Task
          </button>
        </div>
      </div>

      <style>{`
        .azm-backdrop { position:fixed; inset:0; z-index:50; background:rgba(0,0,0,.65); backdrop-filter:blur(6px); display:flex; align-items:flex-end; justify-content:center; }
        @media(min-width:640px){ .azm-backdrop{align-items:center;padding:16px;} .azm-sheet{border-radius:20px!important;border-bottom:1px solid var(--az-border)!important;} }
        .azm-sheet { background:var(--az-bg); border-radius:24px 24px 0 0; border:1px solid var(--az-border); border-bottom:none; width:100%; max-width:480px; max-height:92vh; overflow-y:auto; padding:8px 20px 40px; animation:azm-up .28s cubic-bezier(.34,1.2,.64,1); }
        @keyframes azm-up { from{transform:translateY(60px);opacity:0} to{transform:none;opacity:1} }
        .azm-handle { width:36px; height:4px; border-radius:99px; background:var(--az-surface-2); margin:10px auto 18px; }
        .azm-close { width:32px; height:32px; border-radius:10px; background:var(--az-surface-2); border:1px solid var(--az-border); color:var(--az-text-2); display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all .15s; }
        .azm-close:hover { color:var(--az-text-1); }
        .azm-input { display:block; width:100%; background:var(--az-surface-1); border:1px solid var(--az-border); border-radius:12px; padding:11px 14px; font-size:14px; color:var(--az-text-1); outline:none; margin-bottom:12px; box-sizing:border-box; transition:border-color .15s; font-family:inherit; }
        .azm-input:focus { border-color:var(--az-accent); }
        .azm-input::placeholder { color:var(--az-text-3); }
        .azm-input--lg { font-size:15px; padding:13px 14px; }
        .azm-textarea { resize:none; }
        .azm-label { font-size:11px; font-weight:700; letter-spacing:.06em; text-transform:uppercase; color:var(--az-text-3); margin:0 0 8px; }
        .azm-chip { display:flex; flex-direction:column; align-items:center; gap:3px; padding:8px 4px; border-radius:10px; border:1px solid var(--az-border); background:var(--az-surface-1); font-size:11px; color:var(--az-text-2); cursor:pointer; transition:all .15s; font-family:inherit; }
        .azm-chip:hover { background:var(--az-surface-2); color:var(--az-text-1); }
        .azm-chip--on { border-color:var(--az-accent); background:var(--az-accent-bg); color:var(--az-accent); font-weight:600; }
        .azm-submit { width:100%; padding:14px; border-radius:14px; background:var(--az-accent); color:#fff; font-size:15px; font-weight:700; border:none; cursor:pointer; transition:all .15s; font-family:inherit; }
        .azm-submit:hover:not(:disabled) { filter:brightness(1.1); }
        .azm-submit:active:not(:disabled) { transform:scale(.98); }
        .azm-submit:disabled { opacity:.4; cursor:not-allowed; }
      `}</style>
    </>
  );
}
