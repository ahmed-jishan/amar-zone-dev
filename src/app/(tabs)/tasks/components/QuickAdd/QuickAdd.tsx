'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { TaskPriority, TaskCategory, CreateTaskInput } from '../../types';
import { useTaskStore } from '@/lib/store/taskStore';
import { PRIORITIES } from '../../constants/priorities';
import { CATEGORIES } from '../../constants/categories';
import { useHaptics } from '@/hooks/useHaptics';
import { springs } from '@/hooks/useSpringAnimation';

function addDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

function parseNaturalTaskInput(rawTitle: string) {
  let title = rawTitle;
  const parsed: Partial<Pick<CreateTaskInput, 'priority' | 'category' | 'dueDate' | 'timeEstimate' | 'tags'>> = {};

  const tagMatches = Array.from(title.matchAll(/#([\w-]+)/g)).map((match) => match[1]);
  if (tagMatches.length) {
    parsed.tags = tagMatches;
    title = title.replace(/#([\w-]+)/g, ' ');
  }

  const estimateMatch = title.match(/\b(\d+(?:\.\d+)?)\s*(m|min|mins|minute|minutes|h|hr|hrs|hour|hours)\b/i);
  if (estimateMatch) {
    const amount = Number(estimateMatch[1]);
    const unit = estimateMatch[2].toLowerCase();
    parsed.timeEstimate = unit.startsWith('h') ? Math.round(amount * 60) : Math.round(amount);
    title = title.replace(estimateMatch[0], ' ');
  }

  const lowerTitle = title.toLowerCase();
  if (/\btomorrow\b/.test(lowerTitle)) {
    parsed.dueDate = addDays(1);
    title = title.replace(/\btomorrow\b/ig, ' ');
  } else if (/\btoday\b/.test(lowerTitle)) {
    parsed.dueDate = addDays(0);
    title = title.replace(/\btoday\b/ig, ' ');
  }

  (['critical', 'high', 'medium', 'low'] as const).forEach((item) => {
    const pattern = new RegExp(`\\b${item}\\b`, 'i');
    if (!parsed.priority && pattern.test(title)) {
      parsed.priority = item;
      title = title.replace(pattern, ' ');
    }
  });

  Object.entries(CATEGORIES).forEach(([key, item]) => {
    const pattern = new RegExp(`\\b(${key}|${item.label})\\b`, 'i');
    if (!parsed.category && pattern.test(title)) {
      parsed.category = key as TaskCategory;
      title = title.replace(pattern, ' ');
    }
  });

  return {
    title: title.replace(/\s+/g, ' ').trim() || rawTitle.trim(),
    parsed,
  };
}

export default function QuickAdd() {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [category, setCategory] = useState<TaskCategory>('personal');
  const [dueDate, setDueDate] = useState('');
  const [timeEstimate, setTimeEstimate] = useState('');
  const [tags, setTags] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const addTask = useTaskStore((s) => s.addTask);
  const haptics = useHaptics();
  const parsedPreview = useMemo(() => title.trim() ? parseNaturalTaskInput(title.trim()) : null, [title]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Listen for external trigger (from header button or keyboard shortcut)
  useEffect(() => {
    const handler = () => {
      setIsOpen(true);
    };
    window.addEventListener('az:open-quick-add', handler);
    return () => window.removeEventListener('az:open-quick-add', handler);
  }, []);

  // Keyboard shortcut: ⌘N / Ctrl+N
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'n' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        closeModal();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Auto-focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const natural = parseNaturalTaskInput(title.trim());
    const finalDueDate = dueDate || natural.parsed.dueDate;
    const finalPriority = natural.parsed.priority || priority;
    const finalCategory = natural.parsed.category || category;
    const finalTimeEstimate = timeEstimate ? parseInt(timeEstimate) : natural.parsed.timeEstimate;
    const finalTags = tags
      ? tags.split(',').map((t) => t.trim()).filter(Boolean)
      : natural.parsed.tags;

    const input: CreateTaskInput = {
      title: natural.title,
      priority: finalPriority,
      category: finalCategory,
      status: finalDueDate && finalDueDate <= new Date().toISOString().split('T')[0] ? 'today' : 'inbox',
      completed: false,
      recurring: 'none',
      dueDate: finalDueDate || undefined,
      timeEstimate: finalTimeEstimate,
      tags: finalTags,
    };

    haptics.success();
    addTask(input);
    resetAndClose();
  }, [title, priority, category, dueDate, timeEstimate, tags, addTask, haptics]);

  const applyToken = useCallback((token: string) => {
    haptics.tap();
    setTitle((current) => `${current.trim()} ${token}`.trim());
  }, [haptics]);

  const openModal = useCallback(() => {
    haptics.impact();
    setIsOpen(true);
  }, [haptics]);

  const closeModal = useCallback(() => {
    haptics.tap();
    setIsOpen(false);
    setTitle('');
    setIsExpanded(false);
  }, [haptics]);

  const resetAndClose = useCallback(() => {
    setIsOpen(false);
    setTitle('');
    setDueDate('');
    setTimeEstimate('');
    setTags('');
    setIsExpanded(false);
  }, []);

  const modalContent = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={closeModal}
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />

      {/* Modal Card - centered on screen */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={springs.bouncy}
        className="relative w-full max-w-[440px] p-5 rounded-[var(--az-radius-2xl)] bg-[var(--az-surface-1)] border border-[var(--az-accent-border)] shadow-[var(--az-shadow-lg)]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Create new task"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[17px] font-bold text-[var(--az-text-1)] tracking-tight">
            New Task
          </h2>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={closeModal}
            className="p-1.5 rounded-lg text-[var(--az-text-3)] hover:text-[var(--az-text-1)] hover:bg-[var(--az-surface-hover)] transition-all"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </motion.button>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Add task, e.g. Pay bill tomorrow 15m #urgent"
            className="w-full bg-transparent text-[16px] font-semibold text-[var(--az-text-1)] placeholder:text-[var(--az-text-3)] outline-none mb-3"
          />

          {/* Token chips */}
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {['today', 'tomorrow', 'high', '15m', '#finance'].map((token) => (
              <motion.button
                key={token}
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={() => applyToken(token)}
                className="rounded-[var(--az-radius-md)] border border-[var(--az-border)] bg-[var(--az-surface-2)] px-2.5 py-1 text-[11px] font-semibold text-[var(--az-text-2)] transition-colors hover:border-[var(--az-accent-border)] hover:text-[var(--az-accent)]"
              >
                {token}
              </motion.button>
            ))}
          </div>

          {/* Parsed preview */}
          {parsedPreview && (
            <div className="mb-3 flex flex-wrap items-center gap-1.5 rounded-[var(--az-radius-lg)] bg-[var(--az-accent-bg)] px-3 py-2 text-[12px] text-[var(--az-text-2)]">
              <span className="font-bold text-[var(--az-accent)]">Detected</span>
              <span>{parsedPreview.parsed.dueDate || dueDate ? 'Date' : 'No date'}</span>
              <span>/</span>
              <span>{parsedPreview.parsed.priority || priority}</span>
              {(parsedPreview.parsed.timeEstimate || timeEstimate) && (
                <>
                  <span>/</span>
                  <span>{parsedPreview.parsed.timeEstimate || timeEstimate}m</span>
                </>
              )}
              {(parsedPreview.parsed.tags?.length || tags) && (
                <>
                  <span>/</span>
                  <span>{parsedPreview.parsed.tags?.join(', ') || tags}</span>
                </>
              )}
            </div>
          )}

          {/* Expandable options */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 mb-3 overflow-hidden"
              >
                {/* Priority */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[12px] text-[var(--az-text-3)] font-medium">Priority:</span>
                  {(['critical', 'high', 'medium', 'low'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => { haptics.tap(); setPriority(p); }}
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
                      onClick={() => { haptics.tap(); setCategory(key as TaskCategory); }}
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
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() => { haptics.tap(); setIsExpanded((e) => !e); }}
              className="text-[12px] text-[var(--az-text-3)] hover:text-[var(--az-accent)] transition-colors flex items-center gap-1"
            >
              <motion.svg
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={springs.snappy}
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path d="M19 9l-7 7-7-7" />
              </motion.svg>
              {isExpanded ? 'Less options' : 'More options'}
            </motion.button>

            <div className="flex items-center gap-2">
              <motion.button
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={closeModal}
                className="px-3 py-1.5 rounded-[var(--az-radius-md)] text-[13px] font-medium text-[var(--az-text-2)] hover:bg-[var(--az-surface-hover)] transition-colors"
              >
                Cancel
              </motion.button>
              <motion.button
                type="submit"
                disabled={!title.trim()}
                whileTap={title.trim() ? { scale: 0.95 } : {}}
                className={`
                  px-4 py-1.5 rounded-[var(--az-radius-md)] text-[13px] font-semibold transition-all
                  ${title.trim()
                    ? 'bg-[var(--az-accent)] text-white hover:bg-[var(--az-accent-2)] shadow-[0_0_12px_var(--az-accent-glow)]'
                    : 'bg-[var(--az-surface-3)] text-[var(--az-text-3)] cursor-not-allowed'
                  }
                `}
              >
                Add Task
              </motion.button>
            </div>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );

  return (
    <>
      {/* Portal-based centered modal - renders at document body level */}
      {mounted && isOpen && createPortal(
        <AnimatePresence>
          {modalContent}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}