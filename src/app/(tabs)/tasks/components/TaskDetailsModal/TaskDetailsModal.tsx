'use client';
import { useEffect, useState } from 'react';
import { Task } from '../../types';
import { PRIORITIES } from '../../constants/priorities';
import { CATEGORIES } from '../../constants/categories';
import { formatTaskDate, isDateOverdue } from '../../utils/taskDates';
import { getTaskProgress } from '../../utils/taskProgress';
import { useTaskStore } from '@/lib/store/taskStore';

interface Props { task: Task | null; open: boolean; setOpen: (v: boolean) => void; }

export default function TaskDetailsModal({ task, open, setOpen }: Props) {
  const [notes, setNotes] = useState('');
  const updateTask = useTaskStore(s => s.updateTask);
  const toggleTask = useTaskStore(s => s.toggleTask);

  useEffect(() => { if (task) setNotes(task.notes || ''); }, [task]);
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, setOpen]);

  if (!open || !task) return null;

  const pri = PRIORITIES[task.priority];
  const cat = CATEGORIES[task.category];
  const dueDateOverdue = task.dueDate ? isDateOverdue(task.dueDate) : false;
  const progress = getTaskProgress(task);

  return (
    <>
      <div className="azd-backdrop" onClick={e => { if (e.target === e.currentTarget) setOpen(false); }}>
        <div className="azd-sheet">
          <div className="azd-handle"/>

          {/* Header */}
          <div style={{ display:'flex', alignItems:'flex-start', gap:10, marginBottom:10 }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:pri.accentColor, flexShrink:0, marginTop:6 }}/>
            <h2 style={{ flex:1, fontSize:18, fontWeight:700, color:'var(--az-text-1)', margin:0, lineHeight:1.4, letterSpacing:'-0.01em' }}>{task.title}</h2>
            <button className="azd-close" onClick={() => setOpen(false)} aria-label="Close">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/></svg>
            </button>
          </div>

          {task.description && (
            <p style={{ fontSize:14, color:'var(--az-text-2)', lineHeight:1.6, margin:'0 0 14px', paddingLeft:18 }}>{task.description}</p>
          )}

          {/* Badges */}
          <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:20, paddingLeft:18 }}>
            <span className="azd-badge" style={{ color:pri.textColor, background:pri.bgColor, borderColor:pri.borderColor }}>{pri.label}</span>
            <span className="azd-badge" style={{ color:'var(--az-text-1)' }}>{cat?.emoji} {cat?.label ?? task.category}</span>
            {task.dueDate && (
              <span className="azd-badge" style={{ color:dueDateOverdue?'var(--az-danger)':'var(--az-text-2)', borderColor:dueDateOverdue?'var(--az-danger-border)':'var(--az-border)' }}>
                ◷ {formatTaskDate(task.dueDate)}
              </span>
            )}
            {task.energyLevel && <span className="azd-badge">⚡ {task.energyLevel} energy</span>}
            {task.recurring !== 'none' && <span className="azd-badge">↻ {task.recurring}</span>}
            <span className="azd-badge" style={{ color:'var(--az-text-3)', textTransform:'capitalize' }}>📂 {task.status}</span>
          </div>

          {/* Subtasks */}
          {task.subtasks && task.subtasks.length > 0 && (
            <div className="azd-section">
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                <span className="azd-section-title">Subtasks</span>
                <span style={{ fontSize:12, fontWeight:700, color:'var(--az-text-2)' }}>{progress}%</span>
              </div>
              <div style={{ height:3, background:'var(--az-surface-2)', borderRadius:99, overflow:'hidden', marginBottom:12 }}>
                <div style={{ width:`${progress}%`, height:'100%', background:pri.accentColor, borderRadius:99, transition:'width .5s' }}/>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {task.subtasks.map(sub => (
                  <div key={sub.id} style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:18, height:18, borderRadius:5, border:`2px solid ${sub.completed ? pri.accentColor : 'var(--az-border-hover)'}`, background:sub.completed?pri.accentColor:'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      {sub.completed && <svg width="8" height="8" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </div>
                    <span style={{ fontSize:13, color:sub.completed?'var(--az-text-3)':'var(--az-text-1)', textDecoration:sub.completed?'line-through':'none' }}>{sub.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div className="azd-section">
              <span className="azd-section-title" style={{ display:'block', marginBottom:8 }}>Tags</span>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {task.tags.map(tag => (
                  <span key={tag} style={{ fontSize:11, fontWeight:500, padding:'3px 8px', borderRadius:6, background:'var(--az-accent-bg)', color:'var(--az-accent)', border:'1px solid var(--az-accent-border)' }}>#{tag}</span>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="azd-section">
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
              <span className="azd-section-title">Notes</span>
              <span style={{ fontSize:10, color:'var(--az-text-3)' }}>auto-saved</span>
            </div>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              onBlur={() => { if (notes !== task.notes) updateTask(task.id, { notes }); }}
              placeholder="Add notes…"
              rows={4}
              className="azd-notes"
            />
          </div>

          {/* Meta info row */}
          <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
            <div style={{ flex:1, background:'var(--az-surface-2)', borderRadius:10, padding:'8px 12px', minWidth:120 }}>
              <p style={{ fontSize:10, color:'var(--az-text-3)', margin:'0 0 2px', textTransform:'uppercase', letterSpacing:'0.06em' }}>Created</p>
              <p style={{ fontSize:12, color:'var(--az-text-2)', margin:0, fontWeight:500 }}>
                {new Date(task.createdAt).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })}
              </p>
            </div>
            {task.completedDates.length > 0 && (
              <div style={{ flex:1, background:'var(--az-surface-2)', borderRadius:10, padding:'8px 12px', minWidth:120 }}>
                <p style={{ fontSize:10, color:'var(--az-text-3)', margin:'0 0 2px', textTransform:'uppercase', letterSpacing:'0.06em' }}>Completions</p>
                <p style={{ fontSize:12, color:'var(--az-success)', margin:0, fontWeight:600 }}>{task.completedDates.length}×</p>
              </div>
            )}
          </div>

          {/* Complete / Undo button */}
          <button
            className={`azd-complete-btn${task.completed?' azd-complete-btn--undo':''}`}
            onClick={() => { toggleTask(task.id); setOpen(false); }}
          >
            {task.completed ? '↩  Mark as incomplete' : '✓  Mark as complete'}
          </button>
        </div>
      </div>

      <style>{`
        .azd-backdrop { position:fixed; inset:0; z-index:50; background:rgba(0,0,0,.65); backdrop-filter:blur(6px); display:flex; align-items:flex-end; justify-content:center; }
        @media(min-width:640px) { .azd-backdrop { align-items:center; padding:16px; } .azd-sheet { border-radius:20px!important; border-bottom:1px solid var(--az-border)!important; max-height:90vh; } }
        .azd-sheet { background:var(--az-bg); border-radius:24px 24px 0 0; border:1px solid var(--az-border); border-bottom:none; width:100%; max-width:480px; max-height:88vh; overflow-y:auto; padding:8px 20px 32px; animation:azd-up .28s cubic-bezier(.34,1.2,.64,1); }
        @keyframes azd-up { from{transform:translateY(60px);opacity:0} to{transform:none;opacity:1} }
        .azd-handle { width:36px; height:4px; border-radius:99px; background:var(--az-surface-2); margin:10px auto 18px; }
        .azd-close { width:32px; height:32px; border-radius:10px; background:var(--az-surface-2); border:1px solid var(--az-border); color:var(--az-text-2); display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all .15s; flex-shrink:0; }
        .azd-close:hover { color:var(--az-text-1); }
        .azd-badge { font-size:11px; font-weight:600; padding:3px 9px; border-radius:8px; border:1px solid var(--az-border); color:var(--az-text-2); background:var(--az-surface-2); }
        .azd-section { margin-bottom:20px; }
        .azd-section-title { font-size:11px; font-weight:700; letter-spacing:.07em; text-transform:uppercase; color:var(--az-text-3); }
        .azd-notes { width:100%; background:var(--az-surface-1); border:1px solid var(--az-border); border-radius:12px; padding:12px; font-size:13px; color:var(--az-text-1); resize:none; outline:none; box-sizing:border-box; line-height:1.6; transition:border-color .15s; font-family:inherit; }
        .azd-notes:focus { border-color:var(--az-accent); }
        .azd-notes::placeholder { color:var(--az-text-3); }
        .azd-complete-btn { width:100%; padding:13px; border-radius:14px; background:var(--az-success-bg); color:var(--az-success); border:1px solid var(--az-success-border); font-size:14px; font-weight:700; cursor:pointer; transition:all .15s; font-family:inherit; }
        .azd-complete-btn:hover { filter:brightness(1.05); }
        .azd-complete-btn:active { transform:scale(.98); }
        .azd-complete-btn--undo { background:var(--az-surface-2); color:var(--az-text-2); border-color:var(--az-border); }
      `}</style>
    </>
  );
}
