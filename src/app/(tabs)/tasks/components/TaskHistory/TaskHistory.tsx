'use client';
import { useMemo, useState } from 'react';
import { Task } from '../../types';
import { PRIORITIES } from '../../constants/priorities';
import { CATEGORIES } from '../../constants/categories';
import { useTaskStore } from '@/lib/store/taskStore';

type SortKey = 'newest' | 'oldest' | 'priority' | 'title';
type FilterStatus = 'all' | 'completed' | 'overdue' | 'active';

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

const PRIORITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

export default function TaskHistory() {
  const tasks = useTaskStore(s => s.tasks);
  const deleteTask = useTaskStore(s => s.deleteTask);
  const toggleTask = useTaskStore(s => s.toggleTask);

  const [search,     setSearch]     = useState('');
  const [sort,       setSort]       = useState<SortKey>('newest');
  const [statusFilt, setStatusFilt] = useState<FilterStatus>('all');
  const [catFilt,    setCatFilt]    = useState('all');
  const [priFilter,  setPriFilter]  = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = [...tasks];

    // search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.notes?.toLowerCase().includes(q) ||
        t.tags?.some(tag => tag.toLowerCase().includes(q))
      );
    }

    // status
    if (statusFilt === 'completed') list = list.filter(t => t.completed);
    else if (statusFilt === 'overdue')   list = list.filter(t => t.status === 'overdue' && !t.completed);
    else if (statusFilt === 'active')    list = list.filter(t => !t.completed && t.status !== 'archived');

    // category
    if (catFilt !== 'all') list = list.filter(t => t.category === catFilt);

    // priority
    if (priFilter !== 'all') list = list.filter(t => t.priority === priFilter);

    // sort
    if (sort === 'newest')   list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (sort === 'oldest')   list.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    if (sort === 'priority') list.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
    if (sort === 'title')    list.sort((a, b) => a.title.localeCompare(b.title));

    return list;
  }, [tasks, search, sort, statusFilt, catFilt, priFilter]);

  // Stats
  const stats = useMemo(() => ({
    total:     tasks.length,
    completed: tasks.filter(t => t.completed).length,
    overdue:   tasks.filter(t => t.status === 'overdue' && !t.completed).length,
    streak:    (() => {
      const today = new Date().toISOString().split('T')[0];
      let streak = 0, d = new Date();
      while (true) {
        const key = d.toISOString().split('T')[0];
        const done = tasks.some(t => t.completedDates?.includes(key));
        if (!done) break;
        streak++;
        d.setDate(d.getDate() - 1);
      }
      return streak;
    })(),
  }), [tasks]);

  // Group by date (newest first)
  const groups = useMemo(() => {
    const map: Record<string, Task[]> = {};
    filtered.forEach(t => {
      const day = t.createdAt.split('T')[0];
      if (!map[day]) map[day] = [];
      map[day].push(t);
    });
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  const today    = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const dayLabel = (key: string) => {
    if (key === today)     return 'Today';
    if (key === yesterday) return 'Yesterday';
    return new Date(key).toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' });
  };

  return (
    <>
      <div className="azh-root">
        {/* ── Top stats ── */}
        <div className="azh-stats">
          {[
            { label:'Total',     value: stats.total,     color:'var(--az-text-1)' },
            { label:'Done',      value: stats.completed, color:'var(--az-success)' },
            { label:'Overdue',   value: stats.overdue,   color:'var(--az-danger)' },
            { label:'🔥 Streak', value: `${stats.streak}d`, color:'var(--az-warn)' },
          ].map(s => (
            <div key={s.label} className="azh-stat">
              <span className="azh-stat-val" style={{ color: s.color }}>{s.value}</span>
              <span className="azh-stat-label">{s.label}</span>
            </div>
          ))}
        </div>

        {/* ── Search ── */}
        <div className="azh-search-wrap">
          <svg className="azh-search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35" strokeLinecap="round"/>
          </svg>
          <input
            className="azh-search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search tasks, notes, tags…"
          />
          {search && (
            <button className="azh-search-clear" onClick={() => setSearch('')} aria-label="Clear">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/></svg>
            </button>
          )}
        </div>

        {/* ── Filters row ── */}
        <div className="azh-filters">
          {/* Status */}
          <select className="azh-select" value={statusFilt} onChange={e => setStatusFilt(e.target.value as any)}>
            <option value="all">All status</option>
            <option value="completed">Completed</option>
            <option value="active">Active</option>
            <option value="overdue">Overdue</option>
          </select>

          {/* Category */}
          <select className="azh-select" value={catFilt} onChange={e => setCatFilt(e.target.value)}>
            <option value="all">All categories</option>
            {Object.entries(CATEGORIES).map(([k, v]) => (
              <option key={k} value={k}>{v.emoji} {v.label}</option>
            ))}
          </select>

          {/* Priority */}
          <select className="azh-select" value={priFilter} onChange={e => setPriFilter(e.target.value)}>
            <option value="all">All priorities</option>
            <option value="critical">🔴 Critical</option>
            <option value="high">🟠 High</option>
            <option value="medium">🟡 Medium</option>
            <option value="low">🟢 Low</option>
          </select>

          {/* Sort */}
          <select className="azh-select" value={sort} onChange={e => setSort(e.target.value as SortKey)}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="priority">By priority</option>
            <option value="title">A → Z</option>
          </select>
        </div>

        {/* ── Results count ── */}
        <p className="azh-count">
          {filtered.length === 0
            ? 'No tasks found'
            : `${filtered.length} task${filtered.length !== 1 ? 's' : ''}${search ? ` for "${search}"` : ''}`}
        </p>

        {/* ── Timeline groups ── */}
        {groups.length === 0 ? (
          <div className="azh-empty">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <rect x="8" y="12" width="32" height="28" rx="4" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M16 12V10a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M17 22h14M17 28h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <p>No tasks match your filters</p>
          </div>
        ) : (
          <div className="azh-timeline">
            {groups.map(([day, dayTasks]) => (
              <div key={day} className="azh-group">
                <div className="azh-day-label">
                  <span className="azh-day-text">{dayLabel(day)}</span>
                  <span className="azh-day-count">{dayTasks.length}</span>
                </div>

                <div className="azh-group-cards">
                  {dayTasks.map(task => {
                    const pri  = PRIORITIES[task.priority];
                    const cat  = CATEGORIES[task.category];
                    const isEx = expandedId === task.id;

                    return (
                      <div
                        key={task.id}
                        className={`azh-card${task.completed ? ' azh-card--done' : ''}${task.status === 'overdue' && !task.completed ? ' azh-card--overdue' : ''}`}
                        style={{ borderLeftColor: pri.accentColor }}
                      >
                        {/* Main row */}
                        <div className="azh-card-row" onClick={() => setExpandedId(isEx ? null : task.id)}>
                          {/* Status dot */}
                          <div className="azh-status-dot"
                            style={{ background: task.completed ? 'var(--az-success)' : task.status === 'overdue' ? 'var(--az-danger)' : 'var(--az-surface-2)', border: `2px solid ${task.completed ? 'var(--az-success)' : task.status === 'overdue' ? 'var(--az-danger)' : 'var(--az-border-hover)'}` }}>
                            {task.completed && (
                              <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
                                <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                          </div>

                          {/* Content */}
                          <div className="azh-card-body">
                            <div className="azh-card-titlerow">
                              <h3 className={`azh-card-title${task.completed ? ' azh-card-title--done' : ''}`}>
                                {task.title}
                              </h3>
                              <span className="azh-card-time">{fmtTime(task.createdAt)}</span>
                            </div>

                            <div className="azh-card-badges">
                              <span className="azh-badge" style={{ color: pri.textColor, background: pri.bgColor, borderColor: pri.borderColor }}>
                                {pri.label}
                              </span>
                              <span className="azh-badge" style={{ color: 'var(--az-text-2)' }}>
                                {cat?.emoji} {cat?.label}
                              </span>
                              <span className="azh-badge" style={{ color: 'var(--az-text-3)', textTransform: 'capitalize' }}>
                                {task.status.replace('-', ' ')}
                              </span>
                              {task.completedDates?.length > 0 && (
                                <span className="azh-badge" style={{ color: 'var(--az-success)', borderColor: 'var(--az-success-border)' }}>
                                  ✓ {task.completedDates.length}×
                                </span>
                              )}
                              {task.recurring !== 'none' && (
                                <span className="azh-badge" style={{ color: 'var(--az-accent)' }}>↻ {task.recurring}</span>
                              )}
                            </div>
                          </div>

                          {/* Chevron */}
                          <svg className={`azh-chevron${isEx ? ' azh-chevron--open' : ''}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>

                        {/* Expanded detail */}
                        {isEx && (
                          <div className="azh-expand">
                            {task.description && (
                              <p className="azh-expand-desc">{task.description}</p>
                            )}

                            {/* Subtasks */}
                            {task.subtasks && task.subtasks.length > 0 && (
                              <div className="azh-expand-section">
                                <p className="azh-expand-label">Subtasks ({task.subtasks.filter(s => s.completed).length}/{task.subtasks.length})</p>
                                <div className="azh-subtask-bar">
                                  <div className="azh-subtask-fill" style={{ width: `${Math.round((task.subtasks.filter(s=>s.completed).length/task.subtasks.length)*100)}%`, background: pri.accentColor }}/>
                                </div>
                                {task.subtasks.map(sub => (
                                  <div key={sub.id} className="azh-subtask-row">
                                    <span style={{ color: sub.completed ? 'var(--az-success)' : 'var(--az-text-3)' }}>{sub.completed ? '✓' : '○'}</span>
                                    <span style={{ color: sub.completed ? 'var(--az-text-3)' : 'var(--az-text-2)', textDecoration: sub.completed ? 'line-through' : 'none', fontSize: 13 }}>{sub.title}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Notes */}
                            {task.notes && (
                              <div className="azh-expand-section">
                                <p className="azh-expand-label">Notes</p>
                                <p className="azh-expand-notes">{task.notes}</p>
                              </div>
                            )}

                            {/* Tags */}
                            {task.tags && task.tags.length > 0 && (
                              <div className="azh-expand-section">
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                                  {task.tags.map(tag => (
                                    <span key={tag} className="azh-tag">#{tag}</span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Completion history */}
                            {task.completedDates && task.completedDates.length > 0 && (
                              <div className="azh-expand-section">
                                <p className="azh-expand-label">Completion history</p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                                  {[...task.completedDates].sort((a,b) => b.localeCompare(a)).slice(0,10).map(d => (
                                    <span key={d} className="azh-date-chip">{fmt(d)}</span>
                                  ))}
                                  {task.completedDates.length > 10 && (
                                    <span className="azh-date-chip">+{task.completedDates.length - 10} more</span>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Meta */}
                            <div className="azh-expand-meta">
                              <span>Created {fmt(task.createdAt)}</span>
                              {task.dueDate && <span>Due {fmt(task.dueDate)}</span>}
                              {task.energyLevel && <span>⚡ {task.energyLevel} energy</span>}
                            </div>

                            {/* Actions */}
                            <div className="azh-expand-actions">
                              <button
                                className={`azh-action-btn${task.completed ? ' azh-action-btn--undo' : ' azh-action-btn--complete'}`}
                                onClick={() => toggleTask(task.id)}
                              >
                                {task.completed ? '↩ Mark incomplete' : '✓ Mark complete'}
                              </button>
                              <button
                                className="azh-action-btn azh-action-btn--delete"
                                onClick={() => { deleteTask(task.id); setExpandedId(null); }}
                              >
                                🗑 Delete
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .azh-root { padding: 4px 0 40px; }

        /* Stats */
        .azh-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; margin-bottom:16px; }
        .azh-stat  { background:var(--az-surface-1); border:1px solid var(--az-border); border-radius:12px; padding:10px 8px; display:flex; flex-direction:column; align-items:center; gap:3px; }
        .azh-stat-val   { font-size:18px; font-weight:700; line-height:1; font-variant-numeric:tabular-nums; }
        .azh-stat-label { font-size:10px; color:var(--az-text-3); font-weight:500; text-transform:uppercase; letter-spacing:.04em; text-align:center; }

        /* Search */
        .azh-search-wrap { position:relative; display:flex; align-items:center; background:var(--az-surface-1); border:1px solid var(--az-border); border-radius:12px; padding:10px 12px; margin-bottom:10px; transition:border-color .15s; }
        .azh-search-wrap:focus-within { border-color:var(--az-accent); }
        .azh-search-icon { color:var(--az-text-3); flex-shrink:0; }
        .azh-search { flex:1; background:transparent; border:none; outline:none; font-size:14px; color:var(--az-text-1); padding:0 8px; font-family:inherit; }
        .azh-search::placeholder { color:var(--az-text-3); }
        .azh-search-clear { background:transparent; border:none; cursor:pointer; color:var(--az-text-3); display:flex; padding:2px; border-radius:4px; transition:color .15s; }
        .azh-search-clear:hover { color:var(--az-text-1); }

        /* Filters */
        .azh-filters { display:flex; gap:6px; margin-bottom:10px; overflow-x:auto; scrollbar-width:none; padding-bottom:2px; }
        .azh-filters::-webkit-scrollbar { display:none; }
        .azh-select { flex-shrink:0; background:var(--az-surface-1); border:1px solid var(--az-border); border-radius:10px; padding:6px 10px; font-size:12px; color:var(--az-text-2); outline:none; cursor:pointer; font-family:inherit; transition:border-color .15s; }
        .azh-select:focus { border-color:var(--az-accent); color:var(--az-text-1); }

        /* Count */
        .azh-count { font-size:12px; color:var(--az-text-3); margin:0 0 16px; }

        /* Timeline */
        .azh-timeline { display:flex; flex-direction:column; gap:24px; }
        .azh-group {}
        .azh-day-label { display:flex; align-items:center; gap:8px; margin-bottom:10px; }
        .azh-day-text  { font-size:11px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--az-text-3); }
        .azh-day-count { font-size:11px; font-weight:700; padding:1px 7px; border-radius:99px; color:var(--az-accent); background:var(--az-accent-bg); font-variant-numeric:tabular-nums; }
        .azh-group-cards { display:flex; flex-direction:column; gap:8px; }

        /* Card */
        .azh-card { background:var(--az-surface-1); border:1px solid var(--az-border); border-left:3px solid var(--az-surface-2); border-radius:14px; padding:12px 12px 12px 14px; transition:border-color .15s; cursor:pointer; }
        .azh-card:hover { border-color:var(--az-border-hover); }
        .azh-card--done    { opacity:.65; }
        .azh-card--overdue { border-left-color:var(--az-danger)!important; background:var(--az-danger-bg-subtle); }
        .azh-card-row { display:flex; align-items:flex-start; gap:10px; }
        .azh-status-dot { width:20px; height:20px; border-radius:50%; flex-shrink:0; margin-top:1px; display:flex; align-items:center; justify-content:center; }
        .azh-card-body { flex:1; min-width:0; }
        .azh-card-titlerow { display:flex; align-items:flex-start; justify-content:space-between; gap:8px; margin-bottom:6px; }
        .azh-card-title { font-size:14px; font-weight:600; color:var(--az-text-1); margin:0; line-height:1.4; flex:1; min-width:0; }
        .azh-card-title--done { text-decoration:line-through; color:var(--az-text-3); }
        .azh-card-time { font-size:10px; color:var(--az-text-3); white-space:nowrap; flex-shrink:0; font-variant-numeric:tabular-nums; margin-top:2px; }
        .azh-card-badges { display:flex; flex-wrap:wrap; gap:5px; }
        .azh-badge { font-size:10px; font-weight:600; padding:2px 7px; border-radius:6px; border:1px solid var(--az-border); color:var(--az-text-3); background:var(--az-surface-2); white-space:nowrap; }
        .azh-chevron { color:var(--az-text-3); flex-shrink:0; margin-top:2px; transition:transform .2s; }
        .azh-chevron--open { transform:rotate(180deg); }

        /* Expanded */
        .azh-expand { border-top:1px solid var(--az-border); margin-top:12px; padding-top:12px; display:flex; flex-direction:column; gap:12px; }
        .azh-expand-desc { font-size:13px; color:var(--az-text-2); line-height:1.6; margin:0; }
        .azh-expand-section { display:flex; flex-direction:column; gap:6px; }
        .azh-expand-label { font-size:10px; font-weight:700; letter-spacing:.07em; text-transform:uppercase; color:var(--az-text-3); margin:0; }
        .azh-expand-notes { font-size:13px; color:var(--az-text-2); line-height:1.6; margin:0; background:var(--az-surface-2); border-radius:8px; padding:10px 12px; border:1px solid var(--az-border); }
        .azh-subtask-bar  { height:3px; background:var(--az-surface-2); border-radius:99px; overflow:hidden; margin-bottom:6px; }
        .azh-subtask-fill { height:100%; border-radius:99px; transition:width .5s; }
        .azh-subtask-row  { display:flex; align-items:center; gap:8px; font-size:13px; }
        .azh-tag { font-size:11px; font-weight:500; padding:2px 8px; border-radius:6px; background:var(--az-accent-bg); color:var(--az-accent); border:1px solid var(--az-accent-border); }
        .azh-date-chip { font-size:11px; padding:2px 8px; border-radius:6px; background:var(--az-success-bg); color:var(--az-success); border:1px solid var(--az-success-border); font-variant-numeric:tabular-nums; }
        .azh-expand-meta { display:flex; flex-wrap:wrap; gap:8px; font-size:11px; color:var(--az-text-3); }
        .azh-expand-actions { display:flex; gap:8px; }
        .azh-action-btn { flex:1; padding:9px 12px; border-radius:10px; font-size:13px; font-weight:600; border:none; cursor:pointer; transition:all .15s; font-family:inherit; }
        .azh-action-btn:active { transform:scale(.97); }
        .azh-action-btn--complete { background:var(--az-success-bg); color:var(--az-success); border:1px solid var(--az-success-border); }
        .azh-action-btn--undo     { background:var(--az-surface-2); color:var(--az-text-2); border:1px solid var(--az-border); }
        .azh-action-btn--delete   { background:var(--az-danger-bg); color:var(--az-danger); border:1px solid var(--az-danger-border); flex:0 0 auto; padding:9px 16px; }

        /* Empty */
        .azh-empty { display:flex; flex-direction:column; align-items:center; padding:48px 20px; gap:12px; color:var(--az-text-3); opacity:.5; text-align:center; }
        .azh-empty p { font-size:14px; font-weight:500; margin:0; }
      `}</style>
    </>
  );
}