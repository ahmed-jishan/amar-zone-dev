'use client';
import { memo, useState } from 'react';
import { Task } from '../../types';
import { PRIORITIES } from '../../constants/priorities';
import { CATEGORIES } from '../../constants/categories';
import { formatTaskDate, isDateOverdue } from '../../utils/taskDates';
import { getTaskProgress } from '../../utils/taskProgress';
import TaskDetailsModal from '../TaskDetailsModal/TaskDetailsModal';
import { useTaskStore } from '@/lib/store/taskStore';

interface Props { task: Task; onToggle?: (id: string) => void; onFocus?: (task: Task) => void; }

function TaskCard({ task, onToggle, onFocus }: Props) {
  const [open, setOpen] = useState(false);
  const deleteTask = useTaskStore(s => s.deleteTask);
  const isOverdue = task.status === 'overdue' && !task.completed;
  const dueDateOverdue = task.dueDate ? isDateOverdue(task.dueDate) : false;
  const progress = getTaskProgress(task);
  const pri = PRIORITIES[task.priority];
  const cat = CATEGORIES[task.category];

  return (
    <>
      <article
        className={`az-card${isOverdue?' az-card--overdue':''}${task.completed?' az-card--done':''}`}
        style={{ borderLeftColor: pri.accentColor }}
      >
        <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
          {/* Checkbox */}
          <button
            className={`az-chk${task.completed?' az-chk--done':''}`}
            onClick={() => onToggle?.(task.id)}
            role="checkbox" aria-checked={task.completed}
            aria-label={`Mark "${task.title}" as ${task.completed?'incomplete':'complete'}`}
            style={{ '--ck': pri.accentColor } as any}
          >
            {task.completed && (
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>

          {/* Body */}
          <div style={{ flex:1, minWidth:0, cursor:'pointer' }} onClick={() => setOpen(true)}
            role="button" tabIndex={0} onKeyDown={e => e.key==='Enter' && setOpen(true)}>
            <h3 className={`az-card-title${task.completed?' az-card-title--done':''}`}>{task.title}</h3>
            {task.description && (
              <p style={{ fontSize:12, color:'var(--az-text-3)', margin:'0 0 8px', overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>{task.description}</p>
            )}
            <div style={{ display:'flex', flexWrap:'wrap', gap:5, alignItems:'center' }}>
              <span className="az-badge" style={{ color:pri.textColor, background:pri.bgColor, borderColor:pri.borderColor }}>{pri.label}</span>
              <span className="az-badge" style={{ color:'var(--az-text-2)' }}>{cat?.emoji} {cat?.label ?? task.category}</span>
              {task.dueDate && (
                <span className="az-badge" style={{ color:dueDateOverdue?'var(--az-danger)':'var(--az-text-3)', borderColor:dueDateOverdue?'var(--az-danger-border)':'var(--az-border)' }}>
                  {dueDateOverdue?'!':'◷'} {formatTaskDate(task.dueDate)}
                </span>
              )}
              {task.energyLevel && <span className="az-badge">⚡ {task.energyLevel}</span>}
            </div>
          </div>

          {/* Actions */}
          <div className="az-card-acts">
            {!task.completed && onFocus && (
              <button className="az-act az-act--focus" onClick={e=>{e.stopPropagation();onFocus(task);}} aria-label="Focus">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="8"/></svg>
              </button>
            )}
            <button className="az-act az-act--del" onClick={e=>{e.stopPropagation();deleteTask(task.id);}} aria-label="Delete">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/></svg>
            </button>
          </div>
        </div>

        {/* Subtask progress */}
        {task.subtasks && task.subtasks.length > 0 && (
          <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:10, paddingTop:8, borderTop:'1px solid var(--az-border)' }}>
            <div style={{ flex:1, height:3, background:'var(--az-surface-2)', borderRadius:99, overflow:'hidden' }}>
              <div style={{ width:`${progress}%`, height:'100%', background:pri.accentColor, borderRadius:99, transition:'width .5s' }}/>
            </div>
            <span style={{ fontSize:10, color:'var(--az-text-3)', fontVariantNumeric:'tabular-nums', flexShrink:0 }}>
              {task.subtasks.filter(s=>s.completed).length}/{task.subtasks.length}
            </span>
          </div>
        )}
      </article>

      <TaskDetailsModal task={task} open={open} setOpen={setOpen}/>

      <style>{`
        .az-card { background:var(--az-surface-1); border:1px solid var(--az-border); border-left:3px solid var(--az-surface-2); border-radius:14px; padding:12px 12px 12px 14px; transition:all .15s; }
        .az-card:hover { border-color:var(--az-border-hover); background:var(--az-surface-hover); }
        .az-card--overdue { border-left-color:var(--az-danger)!important; background:var(--az-danger-bg-subtle); }
        .az-card--done { opacity:.6; }
        .az-chk { width:20px; height:20px; border-radius:50%; border:2px solid var(--az-border-hover); background:transparent; display:flex; align-items:center; justify-content:center; cursor:pointer; flex-shrink:0; margin-top:1px; color:#fff; transition:all .15s; }
        .az-chk:hover { border-color:var(--ck,var(--az-accent)); }
        .az-chk--done { background:var(--ck,var(--az-accent)); border-color:var(--ck,var(--az-accent)); }
        .az-card-title { font-size:14px; font-weight:600; color:var(--az-text-1); margin:0 0 3px; line-height:1.4; }
        .az-card-title--done { text-decoration:line-through; color:var(--az-text-3); }
        .az-badge { font-size:10px; font-weight:600; padding:2px 7px; border-radius:6px; border:1px solid var(--az-border); color:var(--az-text-3); background:var(--az-surface-2); white-space:nowrap; }
        .az-card-acts { display:flex; flex-direction:column; gap:4px; flex-shrink:0; opacity:0; transition:opacity .15s; }
        .az-card:hover .az-card-acts { opacity:1; }
        @media(hover:none) { .az-card-acts { opacity:1; } }
        .az-act { width:26px; height:26px; border-radius:7px; border:1px solid var(--az-border); background:var(--az-surface-2); color:var(--az-text-3); display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all .15s; }
        .az-act:active { transform:scale(.92); }
        .az-act--focus:hover { background:var(--az-success-bg); color:var(--az-success); border-color:var(--az-success-border); }
        .az-act--del:hover { background:var(--az-danger-bg); color:var(--az-danger); border-color:var(--az-danger-border); }
      `}</style>
    </>
  );
}

export default memo(TaskCard);
