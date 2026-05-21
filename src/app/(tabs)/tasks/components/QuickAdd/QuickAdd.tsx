'use client';

import { useState, useEffect, useCallback } from 'react';
import { TaskPriority, TaskCategory, TaskStatus, CreateTaskInput } from '../../types';
import { useTaskStore } from '@/lib/store/taskStore';
import { PRIORITIES } from '../../constants/priorities';
import { CATEGORIES } from '../../constants/categories';

export default function QuickAdd() {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [category, setCategory] = useState<TaskCategory>('personal');
  const [dueDate, setDueDate] = useState('');
  const [timeEstimate, setTimeEstimate] = useState('');
  const [tags, setTags] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const addTask = useTaskStore((s) => s.addTask);

  useEffect(() => {
    const handler = () => setIsOpen(true);
    window.addEventListener('az:open-quick-add', handler);
    return () => window.removeEventListener('az:open-quick-add', handler);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'n' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const input: CreateTaskInput = {
      title: title.trim(),
      priority,
      category,
      status: dueDate && dueDate <= new Date().toISOString().split('T')[0] ? 'today' : 'inbox',
      completed: false,
      recurring: 'none',
      dueDate: dueDate || undefined,
      timeEstimate: timeEstimate ? parseInt(timeEstimate) : undefined,
      tags: tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : undefined,
    };

    addTask(input);
    setTitle('');
    setDueDate('');
    setTimeEstimate('');
    setTags('');
    setIsExpanded(false);
    setIsOpen(false);
  }, [title, priority, category, dueDate, timeEstimate, tags, addTask]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full mb-4 flex items-center gap-3 px-4 py-3 rounded-[var(--az-radius-xl)] bg-[var(--az-surface-1)] border border-[var(--az-border)] hover:border-[var(--az-accent-border)] hover:shadow-[var(--az-shadow-sm)] transition-all duration-300 group"
      >
        <div className="w-8 h-8 rounded-full bg-[var(--az-accent-bg)] border border-[var(--az-accent-border)] flex items-center justify-center group-hover:scale-110 transition-transform">
          <svg className="w-4 h-4 text-[var(--az-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <span className="text-[14px] text-[var(--az-text-3)] group-hover:text-[var(--az-text-2)] transition-colors">
          Add a new task...
        </span>
        <kbd className="ml-auto hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-mono text-[var(--az-text-4)] bg-[var(--az-surface-2)] border border-[var(--az-border)]">
          ⌘N
        </kbd>
      </button>
    );
  }

  return (
    <div className="mb-4 animate-[az-slide-up_250ms_ease-out]">
      <form
        onSubmit={handleSubmit}
        className="p-4 rounded-[var(--az-radius-2xl)] bg-[var(--az-surface-1)] border border-[var(--az-accent-border)] shadow-[var(--az-shadow-md)]"
      >
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs to be done?"
          className="w-full bg-transparent text-[16px] font-semibold text-[var(--az-text-1)] placeholder:text-[var(--az-text-3)] outline-none mb-3"
        />

        {isExpanded && (
          <div className="space-y-3 mb-3 animate-[az-fade-in_200ms_ease-out]">
            {/* Priority */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[12px] text-[var(--az-text-3)] font-medium">Priority:</span>
              {(['critical', 'high', 'medium', 'low'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`
                    px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-all
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

            {/* Category */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[12px] text-[var(--az-text-3)] font-medium">Category:</span>
              {Object.entries(CATEGORIES).map(([key, cat]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setCategory(key as TaskCategory)}
                  className={`
                    px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-all flex items-center gap-1
                    ${category === key
                      ? 'bg-[var(--az-accent-bg)] border-[var(--az-accent-border)] text-[var(--az-accent)]'
                      : 'bg-[var(--az-surface-2)] border-[var(--az-border)] text-[var(--az-text-2)] hover:border-[var(--az-border-hover)]'
                    }
                  `}
                >
                  <span>{cat.emoji}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>

            {/* Due date & time estimate */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-[var(--az-text-3)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="bg-[var(--az-surface-2)] border border-[var(--az-border)] rounded-md px-2 py-1 text-[12px] text-[var(--az-text-1)] outline-none focus:border-[var(--az-accent)]"
                />
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-[var(--az-text-3)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
                <input
                  type="number"
                  placeholder="Est. minutes"
                  value={timeEstimate}
                  onChange={(e) => setTimeEstimate(e.target.value)}
                  className="w-28 bg-[var(--az-surface-2)] border border-[var(--az-border)] rounded-md px-2 py-1 text-[12px] text-[var(--az-text-1)] placeholder:text-[var(--az-text-3)] outline-none focus:border-[var(--az-accent)]"
                />
              </div>
              <div className="flex items-center gap-2 flex-1 min-w-[120px]">
                <svg className="w-4 h-4 text-[var(--az-text-3)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <input
                  type="text"
                  placeholder="Tags (comma separated)"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="flex-1 bg-[var(--az-surface-2)] border border-[var(--az-border)] rounded-md px-2 py-1 text-[12px] text-[var(--az-text-1)] placeholder:text-[var(--az-text-3)] outline-none focus:border-[var(--az-accent)]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setIsExpanded((e) => !e)}
            className="text-[12px] text-[var(--az-text-3)] hover:text-[var(--az-accent)] transition-colors flex items-center gap-1"
          >
            <svg className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M19 9l-7 7-7-7" />
            </svg>
            {isExpanded ? 'Less options' : 'More options'}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => { setIsOpen(false); setIsExpanded(false); }}
              className="px-3 py-1.5 rounded-[var(--az-radius-md)] text-[13px] font-medium text-[var(--az-text-2)] hover:bg-[var(--az-surface-hover)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className={`
                px-4 py-1.5 rounded-[var(--az-radius-md)] text-[13px] font-semibold transition-all
                ${title.trim()
                  ? 'bg-[var(--az-accent)] text-white hover:bg-[var(--az-accent-2)] shadow-[0_0_12px_var(--az-accent-glow)] hover:shadow-[0_0_20px_var(--az-accent-glow)]'
                  : 'bg-[var(--az-surface-3)] text-[var(--az-text-3)] cursor-not-allowed'
                }
              `}
            >
              Add Task
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
