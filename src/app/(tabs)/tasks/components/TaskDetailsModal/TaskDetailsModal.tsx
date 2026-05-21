'use client';

import { useState, useCallback } from 'react';
import { Task, Subtask } from '../../types';
import { useTaskStore } from '@/lib/store/taskStore';
import { PRIORITIES } from '../../constants/priorities';
import { CATEGORIES } from '../../constants/categories';
import { formatTaskDate } from '../../utils/taskDates';

interface Props {
  task: Task;
  onClose: () => void;
}

export default function TaskDetailsModal({ task, onClose }: Props) {
  const updateTask = useTaskStore((s) => s.updateTask);
  const deleteTask = useTaskStore((s) => s.deleteTask);
  const archiveTask = useTaskStore((s) => s.archiveTask);
  const toggleComplete = useTaskStore((s) => s.toggleComplete);

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [priority, setPriority] = useState(task.priority);
  const [category, setCategory] = useState(task.category);
  const [status, setStatus] = useState(task.status);
  const [dueDate, setDueDate] = useState(task.dueDate || '');
  const [timeEstimate, setTimeEstimate] = useState(task.timeEstimate?.toString() || '');
  const [energyLevel, setEnergyLevel] = useState(task.energyLevel || '');
  const [notes, setNotes] = useState(task.notes || '');
  const [tags, setTags] = useState(task.tags?.join(', ') || '');
  const [subtasks, setSubtasks] = useState<Subtask[]>(task.subtasks || []);
  const [newSubtask, setNewSubtask] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'subtasks' | 'sessions' | 'notes'>('details');

  const handleSave = useCallback(() => {
    updateTask(task.id, {
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      category,
      status,
      dueDate: dueDate || undefined,
      timeEstimate: timeEstimate ? parseInt(timeEstimate) : undefined,
      energyLevel: energyLevel as Task['energyLevel'] || undefined,
      notes: notes.trim() || undefined,
      tags: tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : undefined,
      subtasks: subtasks.length ? subtasks : undefined,
    });
    onClose();
  }, [task.id, title, description, priority, category, status, dueDate, timeEstimate, energyLevel, notes, tags, subtasks, updateTask, onClose]);

  const addSubtask = () => {
    if (!newSubtask.trim()) return;
    setSubtasks((prev) => [...prev, { id: Date.now().toString(), title: newSubtask.trim(), completed: false }]);
    setNewSubtask('');
  };

  const toggleSubtask = (id: string) => {
    setSubtasks((prev) => prev.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s)));
  };

  const removeSubtask = (id: string) => {
    setSubtasks((prev) => prev.filter((s) => s.id !== id));
  };

  const pri = PRIORITIES[priority];
  const cat = CATEGORIES[category];
  const totalSessionTime = task.sessions.reduce((acc, s) => acc + (s.durationSeconds || 0), 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center animate-[az-fade-in_150ms_ease-out]"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-[520px] max-h-[85vh] mx-4 rounded-[var(--az-radius-2xl)] bg-[var(--az-surface-1)] border border-[var(--az-border)] shadow-[var(--az-shadow-lg)] overflow-hidden animate-[az-scale-in_200ms_ease-out] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--az-border)]">
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ background: pri?.accentColor, boxShadow: `0 0 8px ${pri?.accentColor}60` }}
            />
            <span className="text-[13px] font-semibold text-[var(--az-text-2)] uppercase tracking-wide">
              Task Details
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--az-text-3)] hover:text-[var(--az-text-1)] hover:bg-[var(--az-surface-hover)] transition-all"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-0 px-5 border-b border-[var(--az-border)]">
          {(['details', 'subtasks', 'sessions', 'notes'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`
                px-4 py-3 text-[13px] font-semibold capitalize transition-all relative
                ${activeTab === tab ? 'text-[var(--az-accent)]' : 'text-[var(--az-text-3)] hover:text-[var(--az-text-2)]'}
              `}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--az-accent)] rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto az-scrollbar p-5">
          {activeTab === 'details' && (
            <div className="space-y-4 animate-[az-fade-in_200ms_ease-out]">
              {/* Title */}
              <div>
                <label className="block text-[11px] font-semibold text-[var(--az-text-3)] uppercase tracking-wide mb-1.5">
                  Title
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[var(--az-surface-2)] border border-[var(--az-border)] rounded-[var(--az-radius-lg)] px-3 py-2.5 text-[15px] font-semibold text-[var(--az-text-1)] outline-none focus:border-[var(--az-accent)] transition-all"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] font-semibold text-[var(--az-text-3)] uppercase tracking-wide mb-1.5">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-[var(--az-surface-2)] border border-[var(--az-border)] rounded-[var(--az-radius-lg)] px-3 py-2.5 text-[14px] text-[var(--az-text-1)] placeholder:text-[var(--az-text-3)] outline-none focus:border-[var(--az-accent)] transition-all resize-none"
                  placeholder="Add a description..."
                />
              </div>

              {/* Two column grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--az-text-3)] uppercase tracking-wide mb-1.5">
                    Priority
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {(['critical', 'high', 'medium', 'low'] as const).map((p) => (
                      <button
                        key={p}
                        onClick={() => setPriority(p)}
                        className={`
                          px-2.5 py-1.5 rounded-md text-[11px] font-semibold border transition-all
                          ${priority === p
                            ? 'bg-[var(--az-accent-bg)] border-[var(--az-accent-border)] text-[var(--az-accent)]'
                            : 'bg-[var(--az-surface-2)] border-[var(--az-border)] text-[var(--az-text-2)] hover:border-[var(--az-border-hover)]'
                          }
                        `}
                      >
                        {PRIORITIES[p].label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[var(--az-text-3)] uppercase tracking-wide mb-1.5">
                    Category
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(CATEGORIES).map(([key, catData]) => (
                      <button
                        key={key}
                        onClick={() => setCategory(key as Task['category'])}
                        className={`
                          px-2.5 py-1.5 rounded-md text-[11px] font-semibold border transition-all flex items-center gap-1
                          ${category === key
                            ? 'bg-[var(--az-accent-bg)] border-[var(--az-accent-border)] text-[var(--az-accent)]'
                            : 'bg-[var(--az-surface-2)] border-[var(--az-border)] text-[var(--az-text-2)] hover:border-[var(--az-border-hover)]'
                          }
                        `}
                      >
                        <span>{catData.emoji}</span>
                        <span>{catData.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Status & Due Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--az-text-3)] uppercase tracking-wide mb-1.5">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as Task['status'])}
                    className="w-full bg-[var(--az-surface-2)] border border-[var(--az-border)] rounded-[var(--az-radius-lg)] px-3 py-2 text-[13px] text-[var(--az-text-1)] outline-none focus:border-[var(--az-accent)] transition-all"
                  >
                    <option value="inbox">Inbox</option>
                    <option value="today">Today</option>
                    <option value="in-progress">In Progress</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="completed">Completed</option>
                    <option value="overdue">Overdue</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--az-text-3)] uppercase tracking-wide mb-1.5">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-[var(--az-surface-2)] border border-[var(--az-border)] rounded-[var(--az-radius-lg)] px-3 py-2 text-[13px] text-[var(--az-text-1)] outline-none focus:border-[var(--az-accent)] transition-all"
                  />
                </div>
              </div>

              {/* Time & Energy */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--az-text-3)] uppercase tracking-wide mb-1.5">
                    Time Estimate (minutes)
                  </label>
                  <input
                    type="number"
                    value={timeEstimate}
                    onChange={(e) => setTimeEstimate(e.target.value)}
                    placeholder="e.g. 30"
                    className="w-full bg-[var(--az-surface-2)] border border-[var(--az-border)] rounded-[var(--az-radius-lg)] px-3 py-2 text-[13px] text-[var(--az-text-1)] placeholder:text-[var(--az-text-3)] outline-none focus:border-[var(--az-accent)] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--az-text-3)] uppercase tracking-wide mb-1.5">
                    Energy Level
                  </label>
                  <div className="flex gap-1.5">
                    {(['low', 'medium', 'high'] as const).map((e) => (
                      <button
                        key={e}
                        onClick={() => setEnergyLevel(energyLevel === e ? '' : e)}
                        className={`
                          flex-1 px-2 py-2 rounded-md text-[11px] font-semibold border transition-all capitalize
                          ${energyLevel === e
                            ? 'bg-[var(--az-accent-bg)] border-[var(--az-accent-border)] text-[var(--az-accent)]'
                            : 'bg-[var(--az-surface-2)] border-[var(--az-border)] text-[var(--az-text-2)] hover:border-[var(--az-border-hover)]'
                          }
                        `}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-[11px] font-semibold text-[var(--az-text-3)] uppercase tracking-wide mb-1.5">
                  Tags (comma separated)
                </label>
                <input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="design, urgent, client-a"
                  className="w-full bg-[var(--az-surface-2)] border border-[var(--az-border)] rounded-[var(--az-radius-lg)] px-3 py-2 text-[13px] text-[var(--az-text-1)] placeholder:text-[var(--az-text-3)] outline-none focus:border-[var(--az-accent)] transition-all"
                />
              </div>
            </div>
          )}

          {activeTab === 'subtasks' && (
            <div className="space-y-3 animate-[az-fade-in_200ms_ease-out]">
              <div className="flex items-center gap-2">
                <input
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addSubtask()}
                  placeholder="Add a subtask..."
                  className="flex-1 bg-[var(--az-surface-2)] border border-[var(--az-border)] rounded-[var(--az-radius-lg)] px-3 py-2 text-[14px] text-[var(--az-text-1)] placeholder:text-[var(--az-text-3)] outline-none focus:border-[var(--az-accent)] transition-all"
                />
                <button
                  onClick={addSubtask}
                  disabled={!newSubtask.trim()}
                  className="px-3 py-2 rounded-[var(--az-radius-lg)] bg-[var(--az-accent)] text-white text-[13px] font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--az-accent-2)] transition-colors"
                >
                  Add
                </button>
              </div>

              <div className="space-y-1.5">
                {subtasks.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-[var(--az-radius-lg)] bg-[var(--az-surface-2)] border border-[var(--az-border)] group hover:border-[var(--az-border-hover)] transition-all"
                  >
                    <button
                      onClick={() => toggleSubtask(sub.id)}
                      className={`
                        w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all
                        ${sub.completed
                          ? 'bg-[var(--az-success)] border-[var(--az-success)]'
                          : 'border-[var(--az-border-strong)] hover:border-[var(--az-accent)]'
                        }
                      `}
                    >
                      {sub.completed && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                    <span className={`flex-1 text-[14px] ${sub.completed ? 'text-[var(--az-text-3)] line-through' : 'text-[var(--az-text-1)]'}`}>
                      {sub.title}
                    </span>
                    <button
                      onClick={() => removeSubtask(sub.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-[var(--az-danger)] hover:bg-[var(--az-danger-bg)] transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
                {subtasks.length === 0 && (
                  <div className="text-center py-8 text-[14px] text-[var(--az-text-3)]">
                    No subtasks yet. Add one above.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'sessions' && (
            <div className="space-y-3 animate-[az-fade-in_200ms_ease-out]">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-semibold text-[var(--az-text-2)]">
                  Total Time: {Math.floor(totalSessionTime / 60)}m {totalSessionTime % 60}s
                </span>
                {task.actualTime && (
                  <span className="text-[12px] text-[var(--az-text-3)]">
                    Estimated: {task.timeEstimate}m
                  </span>
                )}
              </div>
              <div className="space-y-2">
                {[...task.sessions].reverse().map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-[var(--az-radius-lg)] bg-[var(--az-surface-2)] border border-[var(--az-border)]"
                  >
                    <div className="w-8 h-8 rounded-full bg-[var(--az-accent-bg)] border border-[var(--az-accent-border)] flex items-center justify-center">
                      <svg className="w-4 h-4 text-[var(--az-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 6v6l4 2" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="text-[13px] font-medium text-[var(--az-text-1)] capitalize">
                        {session.type.replace('_', ' ')}
                      </div>
                      <div className="text-[11px] text-[var(--az-text-3)]">
                        {new Date(session.startedAt).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        {session.endedAt && ` — ${Math.floor(session.durationSeconds / 60)}m ${session.durationSeconds % 60}s`}
                      </div>
                    </div>
                    {!session.endedAt && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--az-accent-bg)] text-[var(--az-accent)] border border-[var(--az-accent-border)] animate-pulse">
                        Active
                      </span>
                    )}
                  </div>
                ))}
                {task.sessions.length === 0 && (
                  <div className="text-center py-8 text-[14px] text-[var(--az-text-3)]">
                    No focus sessions recorded yet.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="animate-[az-fade-in_200ms_ease-out]">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={12}
                placeholder="Add notes, links, ideas..."
                className="w-full bg-[var(--az-surface-2)] border border-[var(--az-border)] rounded-[var(--az-radius-lg)] px-3 py-2.5 text-[14px] text-[var(--az-text-1)] placeholder:text-[var(--az-text-3)] outline-none focus:border-[var(--az-accent)] transition-all resize-none"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-[var(--az-border)] bg-[var(--az-surface-1)]">
          <div className="flex items-center gap-2">
            <button
              onClick={() => { toggleComplete(task.id); onClose(); }}
              className={`
                px-3 py-1.5 rounded-[var(--az-radius-md)] text-[13px] font-semibold border transition-all
                ${task.completed
                  ? 'text-[var(--az-warn)] border-[var(--az-warn-border)] bg-[var(--az-warn-bg)] hover:bg-[var(--az-warn)]/20'
                  : 'text-[var(--az-success)] border-[var(--az-success-border)] bg-[var(--az-success-bg)] hover:bg-[var(--az-success)]/20'
                }
              `}
            >
              {task.completed ? 'Mark Incomplete' : 'Mark Complete'}
            </button>
            <button
              onClick={() => { archiveTask(task.id); onClose(); }}
              className="px-3 py-1.5 rounded-[var(--az-radius-md)] text-[13px] font-semibold text-[var(--az-text-3)] border border-[var(--az-border)] bg-[var(--az-surface-2)] hover:bg-[var(--az-surface-3)] transition-all"
            >
              Archive
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => { deleteTask(task.id); onClose(); }}
              className="px-3 py-1.5 rounded-[var(--az-radius-md)] text-[13px] font-semibold text-[var(--az-danger)] border border-[var(--az-danger-border)] bg-[var(--az-danger-bg)] hover:bg-[var(--az-danger)]/20 transition-all"
            >
              Delete
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 rounded-[var(--az-radius-md)] text-[13px] font-semibold bg-[var(--az-accent)] text-white hover:bg-[var(--az-accent-2)] shadow-[0_0_12px_var(--az-accent-glow)] transition-all"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
