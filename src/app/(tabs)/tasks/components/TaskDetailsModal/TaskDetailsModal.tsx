'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { Task, Subtask, TaskReminder } from '../../types';
import { useTaskStore } from '@/lib/store/taskStore';
import { PRIORITIES } from '../../constants/priorities';
import { CATEGORIES } from '../../constants/categories';
import { formatTaskDate } from '../../utils/taskDates';
import { generateId } from '@/lib/utils/helpers';
import { useHaptics } from '@/hooks/useHaptics';
import { springs } from '@/hooks/useSpringAnimation';

interface Props {
  task: Task;
  onClose: () => void;
}

export default function TaskDetailsModal({ task, onClose }: Props) {
  const updateTask = useTaskStore((s) => s.updateTask);
  const deleteTask = useTaskStore((s) => s.deleteTask);
  const archiveTask = useTaskStore((s) => s.archiveTask);
  const toggleComplete = useTaskStore((s) => s.toggleComplete);
  const haptics = useHaptics();

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
  const [reminders, setReminders] = useState<TaskReminder[]>(task.reminders || []);
  const [newSubtask, setNewSubtask] = useState('');
  const [reminderDate, setReminderDate] = useState(task.dueDate || '');
  const [reminderTime, setReminderTime] = useState('09:00');
  const [reminderMessage, setReminderMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'subtasks' | 'reminders' | 'sessions' | 'notes'>('details');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const syncSubtasks = useCallback((nextSubtasks: Subtask[]) => {
    setSubtasks(nextSubtasks);
    updateTask(task.id, { subtasks: nextSubtasks.length ? nextSubtasks : undefined });
  }, [task.id, updateTask]);

  const handleSave = useCallback(() => {
    haptics.success();
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
  }, [task.id, title, description, priority, category, status, dueDate, timeEstimate, energyLevel, notes, tags, subtasks, updateTask, onClose, haptics]);

  const addSubtask = () => {
    if (!newSubtask.trim()) return;
    haptics.tap();
    const now = new Date().toISOString();
    const nextSubtasks = [
      ...subtasks,
      {
        id: generateId(),
        title: newSubtask.trim(),
        completed: false,
        createdAt: now,
        updatedAt: now,
      },
    ];
    syncSubtasks(nextSubtasks);
    setNewSubtask('');
  };

  const toggleSubtask = (id: string) => {
    haptics.tap();
    syncSubtasks(subtasks.map((s) => (
      s.id === id ? { ...s, completed: !s.completed, updatedAt: new Date().toISOString() } : s
    )));
  };

  const updateSubtaskNotes = (id: string, value: string) => {
    syncSubtasks(subtasks.map((s) => (
      s.id === id ? { ...s, notes: value.trim() ? value : undefined, updatedAt: new Date().toISOString() } : s
    )));
  };

  const removeSubtask = (id: string) => {
    haptics.heavy();
    syncSubtasks(subtasks.filter((s) => s.id !== id));
  };

  const syncReminders = useCallback((nextReminders: TaskReminder[]) => {
    setReminders(nextReminders);
    updateTask(task.id, { reminders: nextReminders });
  }, [task.id, updateTask]);

  const addTaskReminder = () => {
    if (!reminderDate || !reminderTime) return;
    haptics.tap();
    const nextReminders = [
      ...reminders,
      {
        id: generateId(),
        remindAt: new Date(`${reminderDate}T${reminderTime}:00`).toISOString(),
        message: reminderMessage.trim() || undefined,
        triggered: false,
      },
    ];
    syncReminders(nextReminders);
    setReminderMessage('');
  };

  const removeTaskReminder = (id: string) => {
    haptics.heavy();
    syncReminders(reminders.filter((reminder) => reminder.id !== id));
  };

  const pri = PRIORITIES[priority];
  const cat = CATEGORIES[category];
  const totalSessionTime = task.sessions.reduce((acc, s) => acc + (s.durationSeconds || 0), 0);

  const tabs = [
    { key: 'details' as const, label: 'Details', emoji: '📋' },
    { key: 'subtasks' as const, label: 'Subtasks', emoji: '📝' },
    { key: 'reminders' as const, label: 'Reminders', emoji: '🔔' },
    { key: 'sessions' as const, label: 'Sessions', emoji: '⏱️' },
    { key: 'notes' as const, label: 'Notes', emoji: '📌' },
  ];

  const modalContent = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-[10vh] sm:pt-[12vh]"
      onClick={onClose}
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />

      {/* Modal Card - centered premium popup */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 30 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="relative w-full max-w-[520px] max-h-[80dvh] flex flex-col rounded-[var(--az-radius-2xl)] bg-[var(--az-surface-1)] border border-[var(--az-accent-border)] shadow-[var(--az-shadow-xl)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Task details"
      >
        {/* Top gradient bar */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[var(--az-accent)] via-[var(--az-accent-2)] to-[var(--az-accent)] bg-[length:200%_100%] animate-[az-shimmer_2s_linear_infinite]" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-[var(--az-border)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--az-accent-bg)] border border-[var(--az-accent-border)] flex items-center justify-center">
              <svg className="w-4 h-4 text-[var(--az-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h2 className="text-[17px] font-bold text-[var(--az-text-1)] tracking-tight">
              Task Details
            </h2>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--az-text-3)] hover:text-[var(--az-text-1)] hover:bg-[var(--az-surface-hover)] transition-all"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </motion.button>
        </div>

        {/* Segmented Tab Control - no scrollbar */}
        <div className="px-5 pt-3 pb-0" style={{ overflow: 'visible' }}>
          <div className="flex items-center gap-1 p-1 rounded-[var(--az-radius-xl)] bg-[var(--az-surface-2)] border border-[var(--az-border)] overflow-x-auto scrollbar-none" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  haptics.tap();
                  setActiveTab(tab.key);
                }}
                className={`
                  relative px-3 py-2 rounded-[var(--az-radius-lg)] text-[11px] font-semibold transition-all duration-200 whitespace-nowrap flex items-center gap-1.5 flex-1 justify-center
                  ${activeTab === tab.key
                    ? 'bg-[var(--az-surface-1)] text-[var(--az-accent)] shadow-[var(--az-shadow-sm)]'
                    : 'text-[var(--az-text-3)] hover:text-[var(--az-text-2)]'
                  }
                `}
              >
                <span className="text-[13px]">{tab.emoji}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Content - hidden scrollbar for cleaner look */}
        <div className="flex-1 overflow-y-auto px-5 py-4 scrollbar-none" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              {activeTab === 'details' && (
                <div className="space-y-4">
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
                      rows={2}
                      className="w-full bg-[var(--az-surface-2)] border border-[var(--az-border)] rounded-[var(--az-radius-lg)] px-3 py-2.5 text-[14px] text-[var(--az-text-1)] placeholder:text-[var(--az-text-3)] outline-none focus:border-[var(--az-accent)] transition-all resize-none"
                      placeholder="Add a description..."
                    />
                  </div>

                  {/* Priority */}
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--az-text-3)] uppercase tracking-wide mb-1.5">
                      Priority
                    </label>
                    <div className="flex gap-1.5">
                      {(['critical', 'high', 'medium', 'low'] as const).map((p) => (
                        <motion.button
                          key={p}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => { haptics.tap(); setPriority(p); }}
                          className={`
                            flex-1 px-2.5 py-2 rounded-md text-[11px] font-semibold border transition-all
                            ${priority === p
                              ? 'bg-[var(--az-accent-bg)] border-[var(--az-accent-border)] text-[var(--az-accent)]'
                              : 'bg-[var(--az-surface-2)] border-[var(--az-border)] text-[var(--az-text-2)] hover:border-[var(--az-border-hover)]'
                            }
                          `}
                        >
                          {PRIORITIES[p].label}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Category + Status */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--az-text-3)] uppercase tracking-wide mb-1.5">
                        Category
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(CATEGORIES).map(([key, catData]) => (
                          <button
                            key={key}
                            onClick={() => { haptics.tap(); setCategory(key as Task['category']); }}
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
                  </div>

                  {/* Due Date & Time Estimate */}
                  <div className="grid grid-cols-2 gap-3">
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
                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--az-text-3)] uppercase tracking-wide mb-1.5">
                        Time (min)
                      </label>
                      <input
                        type="number"
                        value={timeEstimate}
                        onChange={(e) => setTimeEstimate(e.target.value)}
                        placeholder="e.g. 30"
                        className="w-full bg-[var(--az-surface-2)] border border-[var(--az-border)] rounded-[var(--az-radius-lg)] px-3 py-2 text-[13px] text-[var(--az-text-1)] placeholder:text-[var(--az-text-3)] outline-none focus:border-[var(--az-accent)] transition-all"
                      />
                    </div>
                  </div>

                  {/* Energy Level */}
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--az-text-3)] uppercase tracking-wide mb-1.5">
                      Energy Level
                    </label>
                    <div className="flex gap-1.5">
                      {(['low', 'medium', 'high'] as const).map((e) => (
                        <button
                          key={e}
                          onClick={() => { haptics.tap(); setEnergyLevel(energyLevel === e ? '' : e); }}
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
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      value={newSubtask}
                      onChange={(e) => setNewSubtask(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addSubtask();
                        }
                      }}
                      placeholder="Add a subtask..."
                      className="flex-1 bg-[var(--az-surface-2)] border border-[var(--az-border)] rounded-[var(--az-radius-lg)] px-3 py-2.5 text-[14px] text-[var(--az-text-1)] placeholder:text-[var(--az-text-3)] outline-none focus:border-[var(--az-accent)] transition-all"
                    />
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={addSubtask}
                      disabled={!newSubtask.trim()}
                      className="px-4 py-2.5 rounded-[var(--az-radius-lg)] bg-[var(--az-accent)] text-white text-[13px] font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--az-accent-2)] transition-colors"
                    >
                      Add
                    </motion.button>
                  </div>

                  <div className="space-y-1.5">
                    {subtasks.map((sub) => (
                      <motion.div
                        key={sub.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-[var(--az-radius-lg)] bg-[var(--az-surface-2)] border border-[var(--az-border)] group hover:border-[var(--az-border-hover)] transition-all"
                      >
                        <div className="flex items-center gap-3 px-3 py-2.5">
                          <motion.button
                            whileTap={{ scale: 0.85 }}
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
                          </motion.button>
                          <span className={`flex-1 text-[14px] ${sub.completed ? 'text-[var(--az-text-3)] line-through' : 'text-[var(--az-text-1)]'}`}>
                            {sub.title}
                          </span>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => removeSubtask(sub.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-[var(--az-danger)] hover:bg-[var(--az-danger-bg)] transition-all"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </motion.button>
                        </div>
                        <div className="px-3 pb-3">
                          <textarea
                            value={sub.notes || ''}
                            onChange={(e) => updateSubtaskNotes(sub.id, e.target.value)}
                            rows={2}
                            placeholder="Notes for this subtask..."
                            className="w-full resize-none rounded-[var(--az-radius-md)] border border-[var(--az-border)] bg-[var(--az-surface-1)] px-3 py-2 text-[12px] text-[var(--az-text-1)] placeholder:text-[var(--az-text-3)] outline-none transition-all focus:border-[var(--az-accent)]"
                          />
                        </div>
                      </motion.div>
                    ))}
                    {subtasks.length === 0 && (
                      <div className="text-center py-8 text-[14px] text-[var(--az-text-3)]">
                        No subtasks yet. Add one above.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'reminders' && (
                <div className="space-y-4">
                  <div className="rounded-[var(--az-radius-lg)] border border-[var(--az-border)] bg-[var(--az-surface-2)] p-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[var(--az-text-3)]">
                          Date
                        </label>
                        <input
                          type="date"
                          value={reminderDate}
                          onChange={(e) => setReminderDate(e.target.value)}
                          className="w-full rounded-[var(--az-radius-md)] border border-[var(--az-border)] bg-[var(--az-surface-1)] px-3 py-2 text-[13px] text-[var(--az-text-1)] outline-none transition-all focus:border-[var(--az-accent)]"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[var(--az-text-3)]">
                          Time
                        </label>
                        <input
                          type="time"
                          value={reminderTime}
                          onChange={(e) => setReminderTime(e.target.value)}
                          className="w-full rounded-[var(--az-radius-md)] border border-[var(--az-border)] bg-[var(--az-surface-1)] px-3 py-2 text-[13px] text-[var(--az-text-1)] outline-none transition-all focus:border-[var(--az-accent)]"
                        />
                      </div>
                    </div>
                    <div className="mt-2">
                      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[var(--az-text-3)]">
                        Message
                      </label>
                      <input
                        value={reminderMessage}
                        onChange={(e) => setReminderMessage(e.target.value)}
                        placeholder="Optional reminder note..."
                        className="w-full rounded-[var(--az-radius-md)] border border-[var(--az-border)] bg-[var(--az-surface-1)] px-3 py-2 text-[13px] text-[var(--az-text-1)] placeholder:text-[var(--az-text-3)] outline-none transition-all focus:border-[var(--az-accent)]"
                      />
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={addTaskReminder}
                      disabled={!reminderDate || !reminderTime}
                      className="mt-3 w-full rounded-[var(--az-radius-md)] bg-[var(--az-accent)] px-3 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-[var(--az-accent-2)] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Add Reminder
                    </motion.button>
                  </div>

                  <div className="space-y-2">
                    {reminders
                      .slice()
                      .sort((a, b) => new Date(a.remindAt).getTime() - new Date(b.remindAt).getTime())
                      .map((reminder) => (
                        <motion.div
                          key={reminder.id}
                          layout
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-start gap-3 rounded-[var(--az-radius-lg)] border border-[var(--az-border)] bg-[var(--az-surface-2)] px-3 py-2.5"
                        >
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-[var(--az-accent-border)] bg-[var(--az-accent-bg)]">
                            <svg className="h-4 w-4 text-[var(--az-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5" />
                              <path d="M9 17a3 3 0 006 0" />
                            </svg>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[13px] font-semibold text-[var(--az-text-1)]">
                              {new Date(reminder.remindAt).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                            <p className="mt-0.5 text-[12px] text-[var(--az-text-3)]">
                              {reminder.message || 'Task reminder'}
                            </p>
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => removeTaskReminder(reminder.id)}
                            className="rounded-md p-1 text-[var(--az-text-3)] transition-colors hover:bg-[var(--az-danger-bg)] hover:text-[var(--az-danger)]"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </motion.button>
                        </motion.div>
                      ))}
                    {reminders.length === 0 && (
                      <div className="py-8 text-center text-[14px] text-[var(--az-text-3)]">
                        No reminders yet. Add one above.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'sessions' && (
                <div className="space-y-3">
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
                      <motion.div
                        key={session.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
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
                      </motion.div>
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
                <div className="w-full max-w-full" style={{ boxSizing: 'border-box' }}>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={10}
                    placeholder="Add notes, links, ideas..."
                    className="w-full max-w-full bg-[var(--az-surface-2)] border border-[var(--az-border)] rounded-[var(--az-radius-lg)] px-3 py-2.5 text-[14px] text-[var(--az-text-1)] placeholder:text-[var(--az-text-3)] outline-none focus:border-[var(--az-accent)] transition-all resize-none"
                    style={{ boxSizing: 'border-box' }}
                  />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-[var(--az-border)] bg-[var(--az-surface-2)]/50">
          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => { haptics.tap(); toggleComplete(task.id); onClose(); }}
              className={`
                px-3 py-1.5 rounded-[var(--az-radius-md)] text-[12px] font-semibold border transition-all
                ${task.completed
                  ? 'text-[var(--az-warn)] border-[var(--az-warn-border)] bg-[var(--az-warn-bg)]'
                  : 'text-[var(--az-success)] border-[var(--az-success-border)] bg-[var(--az-success-bg)]'
                }
              `}
            >
              {task.completed ? '↩ Undo' : '✓ Done'}
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => { haptics.heavy(); archiveTask(task.id); onClose(); }}
              className="px-3 py-1.5 rounded-[var(--az-radius-md)] text-[12px] font-semibold text-[var(--az-text-3)] border border-[var(--az-border)] bg-[var(--az-surface-2)] hover:bg-[var(--az-surface-3)] transition-all"
            >
              Archive
            </motion.button>
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => { haptics.error(); deleteTask(task.id); onClose(); }}
              className="px-3 py-1.5 rounded-[var(--az-radius-md)] text-[12px] font-semibold text-[var(--az-danger)] border border-[var(--az-danger-border)] bg-[var(--az-danger-bg)]"
            >
              Delete
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleSave}
              className="px-4 py-1.5 rounded-[var(--az-radius-md)] text-[12px] font-semibold bg-[var(--az-accent)] text-white shadow-[0_0_12px_var(--az-accent-glow)]"
            >
              Save
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );

  return mounted ? createPortal(modalContent, document.body) : null;
}