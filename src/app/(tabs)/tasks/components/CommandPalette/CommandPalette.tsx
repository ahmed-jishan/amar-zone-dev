'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTaskStore } from '@/lib/store/taskStore';

interface Command {
  id: string;
  label: string;
  shortcut?: string;
  icon: React.ReactNode;
  action: () => void;
  category: string;
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const tasks = useTaskStore((s) => s.tasks);
  const setSearchQuery = useTaskStore((s) => s.setSearchQuery);
  const setSortMode = useTaskStore((s) => s.setSortMode);
  const setViewMode = useTaskStore((s) => s.setViewMode);
  const setSelectionMode = useTaskStore((s) => s.setSelectionMode);
  const undo = useTaskStore((s) => s.undo);
  const focusedTask = useTaskStore((s) => s.focusedTask);
  const setFocusedTask = useTaskStore((s) => s.setFocusedTask);

  const commands = useMemo<Command[]>(() => {
    const base: Command[] = [
      {
        id: 'new-task',
        label: 'Create new task',
        shortcut: 'N',
        icon: <PlusIcon />,
        action: () => {
          // Trigger QuickAdd modal via custom event
          window.dispatchEvent(new CustomEvent('az:open-quick-add'));
          setOpen(false);
        },
        category: 'Actions',
      },
      {
        id: 'select-all',
        label: 'Select all visible tasks',
        shortcut: 'A',
        icon: <SelectIcon />,
        action: () => {
          setSelectionMode(true);
          setOpen(false);
        },
        category: 'Actions',
      },
      {
        id: 'undo',
        label: 'Undo last action',
        shortcut: 'Z',
        icon: <UndoIcon />,
        action: () => {
          undo();
          setOpen(false);
        },
        category: 'Actions',
      },
      {
        id: 'focus-mode',
        label: focusedTask ? 'Stop focus mode' : 'Start focus mode',
        shortcut: 'F',
        icon: <FocusIcon />,
        action: () => {
          if (focusedTask) setFocusedTask(null);
          setOpen(false);
        },
        category: 'Actions',
      },
      {
        id: 'view-list',
        label: 'Switch to List view',
        icon: <ListIcon />,
        action: () => { setViewMode('list'); setOpen(false); },
        category: 'View',
      },
      {
        id: 'view-board',
        label: 'Switch to Board view',
        icon: <BoardIcon />,
        action: () => { setViewMode('board'); setOpen(false); },
        category: 'View',
      },
      {
        id: 'view-timeline',
        label: 'Switch to Timeline view',
        icon: <TimelineIcon />,
        action: () => { setViewMode('timeline'); setOpen(false); },
        category: 'View',
      },
      {
        id: 'sort-priority',
        label: 'Sort by Priority',
        icon: <SortIcon />,
        action: () => { setSortMode('priority'); setOpen(false); },
        category: 'Sort',
      },
      {
        id: 'sort-due',
        label: 'Sort by Due Date',
        icon: <SortIcon />,
        action: () => { setSortMode('dueDate'); setOpen(false); },
        category: 'Sort',
      },
      {
        id: 'sort-manual',
        label: 'Sort manually (drag & drop)',
        icon: <SortIcon />,
        action: () => { setSortMode('manual'); setOpen(false); },
        category: 'Sort',
      },
      {
        id: 'clear-search',
        label: 'Clear task search',
        icon: <FilterIcon />,
        action: () => { setSearchQuery(''); setOpen(false); },
        category: 'Search',
      },
    ];

    // Add task search results
    const matchingTasks = tasks
      .filter((t) => t.title.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 6)
      .map((task) => ({
        id: `task-${task.id}`,
        label: task.title,
        icon: <TaskIcon completed={task.completed} />,
        action: () => {
          setSearchQuery(task.title);
          setOpen(false);
        },
        category: 'Tasks',
      }));

    return [...base, ...matchingTasks];
  }, [tasks, query, focusedTask, setSearchQuery, setSortMode, setViewMode, setSelectionMode, undo, setFocusedTask]);

  const filtered = useMemo(() => {
    if (!query) return commands;
    const q = query.toLowerCase();
    return commands.filter((c) => c.label.toLowerCase().includes(q) || c.category.toLowerCase().includes(q));
  }, [commands, query]);

  const grouped = useMemo(() => {
    const g: Record<string, Command[]> = {};
    filtered.forEach((c) => {
      if (!g[c.category]) g[c.category] = [];
      g[c.category].push(c);
    });
    return g;
  }, [filtered]);

  const flatList = useMemo(() => Object.values(grouped).flat(), [grouped]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [open]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % flatList.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 + flatList.length) % flatList.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        flatList[selectedIndex]?.action();
      }
    },
    [flatList, selectedIndex]
  );

  if (!open) return (
    <button
      onClick={() => setOpen(true)}
      className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full az-glass shadow-[var(--az-shadow-lg)] flex items-center justify-center text-[var(--az-text-2)] hover:text-[var(--az-accent)] hover:shadow-[var(--az-shadow-glow)] transition-all duration-300 hover:scale-110"
      aria-label="Open command palette"
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    </button>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] animate-[az-fade-in_150ms_ease-out]"
      onClick={() => setOpen(false)}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-[560px] mx-4 az-glass-strong rounded-[var(--az-radius-2xl)] shadow-[var(--az-shadow-lg)] overflow-hidden animate-[az-scale-in_200ms_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--az-border)]">
          <svg className="w-5 h-5 text-[var(--az-text-3)] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search tasks or run commands..."
            className="flex-1 bg-transparent text-[15px] text-[var(--az-text-1)] placeholder:text-[var(--az-text-3)] outline-none"
          />
          <kbd className="hidden sm:flex items-center px-2 py-1 rounded-md text-[11px] font-mono text-[var(--az-text-3)] bg-[var(--az-surface-2)] border border-[var(--az-border)]">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[50vh] overflow-y-auto az-scrollbar p-2">
          {flatList.length === 0 ? (
            <div className="py-8 text-center text-[14px] text-[var(--az-text-3)]">
              No commands found
            </div>
          ) : (
            Object.entries(grouped).map(([category, items]) => (
              <div key={category} className="mb-1">
                <div className="px-3 py-1.5 text-[11px] font-semibold text-[var(--az-text-3)] uppercase tracking-wider">
                  {category}
                </div>
                {items.map((cmd) => {
                  const globalIdx = flatList.indexOf(cmd);
                  const isSelected = globalIdx === selectedIndex;
                  return (
                    <button
                      key={cmd.id}
                      onClick={() => { cmd.action(); setOpen(false); }}
                      onMouseEnter={() => setSelectedIndex(globalIdx)}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2.5 rounded-[var(--az-radius-md)] text-left transition-all duration-150
                        ${isSelected ? 'bg-[var(--az-accent-bg)] text-[var(--az-accent)]' : 'text-[var(--az-text-1)] hover:bg-[var(--az-surface-hover)]'}
                      `}
                    >
                      <span className={isSelected ? 'text-[var(--az-accent)]' : 'text-[var(--az-text-3)]'}>
                        {cmd.icon}
                      </span>
                      <span className="flex-1 text-[14px] font-medium truncate">{cmd.label}</span>
                      {cmd.shortcut && (
                        <kbd className={`
                          px-1.5 py-0.5 rounded text-[11px] font-mono border
                          ${isSelected ? 'border-[var(--az-accent-border)] text-[var(--az-accent)]' : 'border-[var(--az-border)] text-[var(--az-text-3)]'}
                        `}>
                          {cmd.shortcut}
                        </kbd>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-[var(--az-border)] flex items-center gap-4 text-[11px] text-[var(--az-text-3)]">
          <span className="flex items-center gap-1">
            <kbd className="px-1 rounded border border-[var(--az-border)]">↑↓</kbd> Navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 rounded border border-[var(--az-border)]">↵</kbd> Select
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 rounded border border-[var(--az-border)]">ESC</kbd> Close
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── Icons ── */
function PlusIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M12 4v16m8-8H4" />
    </svg>
  );
}
function SelectIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );
}
function UndoIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
    </svg>
  );
}
function FocusIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}
function ListIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}
function BoardIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}
function TimelineIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}
function SortIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M3 4h13M3 8h9M3 12h5" />
    </svg>
  );
}
function FilterIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
    </svg>
  );
}
function TaskIcon({ completed }: { completed: boolean }) {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      {completed ? (
        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      ) : (
        <circle cx="12" cy="12" r="10" />
      )}
    </svg>
  );
}
