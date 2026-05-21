'use client';
import { useState } from 'react';
import { Task } from '../../types';
import TaskCard from '../TaskCard/TaskCard';

interface Props {
  title: string; tasks: Task[];
  onToggle?: (id: string) => void; onFocus?: (task: Task) => void;
  variant?: 'default'|'danger'|'muted'; defaultCollapsed?: boolean;
}
const TC = { default:'var(--az-text-2)', danger:'var(--az-danger)', muted:'var(--az-text-3)' };
const CC = { default:'var(--az-accent)', danger:'var(--az-danger)', muted:'var(--az-text-3)' };

export default function TaskSection({ title, tasks, onToggle, onFocus, variant='default', defaultCollapsed=false }: Props) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  if (!tasks.length) return null;
  const tc = TC[variant], cc = CC[variant];
  return (
    <>
      <section className="az-section">
        <button className="az-section-hd" onClick={() => setCollapsed(p => !p)} aria-expanded={!collapsed}>
          <div style={{ display:'flex', alignItems:'center', gap:7 }}>
            {variant==='danger' && <span style={{ width:6, height:6, borderRadius:'50%', background:'var(--az-danger)', display:'inline-block' }}/>}
            <h2 style={{ fontSize:11, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:tc, margin:0 }}>{title}</h2>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ fontSize:11, fontWeight:700, padding:'2px 7px', borderRadius:99, color:cc, background:`${cc}18`, fontVariantNumeric:'tabular-nums' }}>{tasks.length}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--az-text-3)" strokeWidth="2"
              style={{ transform:collapsed?'none':'rotate(180deg)', transition:'transform .2s' }}>
              <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </button>
        {!collapsed && (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {tasks.map(t => <TaskCard key={t.id} task={t} onToggle={onToggle} onFocus={onFocus}/>)}
          </div>
        )}
      </section>
      <style>{`
        .az-section { margin-bottom:24px; }
        .az-section-hd { display:flex; align-items:center; justify-content:space-between; width:100%; background:none; border:none; cursor:pointer; padding:0; margin-bottom:10px; }
      `}</style>
    </>
  );
}
