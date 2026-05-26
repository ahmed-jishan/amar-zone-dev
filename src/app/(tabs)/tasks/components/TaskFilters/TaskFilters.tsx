'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FilterKey, SortMode, ViewMode } from '../../types';
import { useTaskStore } from '@/lib/store/taskStore';

const FILTER_CONFIG: { key: FilterKey; label: string; icon: React.ReactNode }[] = [
  { key: 'all', label: 'All', icon: <AllIcon /> },
  { key: 'today', label: 'Today', icon: <TodayIcon /> },
  { key: 'high', label: 'Priority', icon: <PriorityIcon /> },
  { key: 'in-progress', label: 'Active', icon: <ActiveIcon /> },
  { key: 'inbox', label: 'Inbox', icon: <InboxIcon /> },
  { key: 'completed', label: 'Done', icon: <DoneIcon /> },
  { key: 'overdue', label: 'Overdue', icon: <OverdueIcon /> },
  { key: 'archived', label: 'Archived', icon: <ArchivedIcon /> },
];

interface Props {
  activeFilter: FilterKey;
  onFilterChange: (f: FilterKey) => void;
}

export default function TaskFilters({ activeFilter, onFilterChange }: Props) {
  const [showSort, setShowSort] = useState(false);
  const [sortPosition, setSortPosition] = useState({ top: 0, left: 0 });
  const sortButtonRef = useRef<HTMLButtonElement>(null);
  const sortMenuRef = useRef<HTMLDivElement>(null);
  const sortMode = useTaskStore((s) => s.sortMode);
  const setSortMode = useTaskStore((s) => s.setSortMode);
  const viewMode = useTaskStore((s) => s.viewMode);
  const setViewMode = useTaskStore((s) => s.setViewMode);
  const searchQuery = useTaskStore((s) => s.searchQuery);
  const setSearchQuery = useTaskStore((s) => s.setSearchQuery);
  const setSelectionMode = useTaskStore((s) => s.setSelectionMode);

  useEffect(() => {
    if (!showSort) return;

    const updatePosition = () => {
      const rect = sortButtonRef.current?.getBoundingClientRect();
      if (!rect) return;
      const width = 168;
      const openUp = window.innerHeight - rect.bottom < 240 && rect.top > 240;
      setSortPosition({
        top: openUp ? rect.top - 238 : rect.bottom + 8,
        left: Math.max(8, Math.min(rect.left, window.innerWidth - width - 8)),
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [showSort]);

  useEffect(() => {
    if (!showSort) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (sortButtonRef.current?.contains(target) || sortMenuRef.current?.contains(target)) return;
      setShowSort(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowSort(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showSort]);

  return (
    <div className="mb-4 space-y-3 animate-[az-slide-up_300ms_ease-out]">
      {/* Search + View controls */}
      <div className="flex items-center gap-2">
        <div className="flex-1 relative az-search">
          <span className="az-search-icon">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks..."
            className="az-search-input"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="az-search-clear"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* View mode toggle */}
        <div className="flex items-center p-1 rounded-[var(--az-radius-lg)] bg-[var(--az-surface-2)] border border-[var(--az-border)]">
          {(['list', 'board', 'timeline'] as ViewMode[]).map((v) => (
            <button
              key={v}
              onClick={() => setViewMode(v)}
              className={`
                az-view-btn
                ${viewMode === v ? 'az-view-btn--active' : ''}
              `}
              title={`${v} view`}
            >
              {v === 'list' ? <ListViewIcon /> : v === 'board' ? <BoardViewIcon /> : <TimelineViewIcon />}
            </button>
          ))}
        </div>

        {/* Multi-select toggle */}
        <button
          onClick={() => setSelectionMode(true)}
          className="p-2 rounded-[var(--az-radius-lg)] bg-[var(--az-surface-2)] border border-[var(--az-border)] text-[var(--az-text-3)] hover:text-[var(--az-accent)] transition-colors"
          title="Multi-select mode"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </button>

        <button
          onClick={() => window.dispatchEvent(new CustomEvent('az:open-command'))}
          className="az-cmd-btn"
          title="Command palette (⌘K)"
          aria-label="Open command palette"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 6h8M8 12h8M8 18h5" />
          </svg>
          <span className="hidden md:inline">Command</span>
          <kbd className="az-kbd az-kbd-inline">⌘K</kbd>
        </button>
      </div>


      {/* Filter pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 az-scrollbar az-scrollbar-x">
        {FILTER_CONFIG.map((f) => (
          <div key={f.key} className="flex items-center gap-1">
            <button
              onClick={() => onFilterChange(f.key)}
              className={`
                flex items-center gap-1.5 px-3 py-2 rounded-[var(--az-radius-md)] text-[12px] font-semibold whitespace-nowrap transition-all duration-200
                ${activeFilter === f.key
                  ? 'bg-[var(--az-accent)] text-white shadow-[0_0_12px_var(--az-accent-glow)]'
                  : 'bg-[var(--az-surface-2)] text-[var(--az-text-2)] border border-[var(--az-border)] hover:border-[var(--az-border-hover)] hover:text-[var(--az-text-1)]'
                }
              `}
            >
              <span className={activeFilter === f.key ? 'text-white' : ''}>{f.icon}</span>
              {f.label}
            </button>
          </div>
        ))}

        <div className="w-px h-5 bg-[var(--az-border)] mx-1" />

        {/* Sort dropdown */}
        <div className="relative">
          <button
            ref={sortButtonRef}
            onClick={() => setShowSort((s) => !s)}
            aria-haspopup="menu"
            aria-expanded={showSort}
            className="flex items-center gap-1.5 px-3 py-2 rounded-[var(--az-radius-md)] text-[12px] font-semibold bg-[var(--az-surface-2)] text-[var(--az-text-2)] border border-[var(--az-border)] hover:border-[var(--az-border-hover)] transition-all"
          >
            <SortIcon />
            <span className="capitalize">{sortMode}</span>
          </button>
          {showSort && createPortal(
            <div
              ref={sortMenuRef}
              role="menu"
              className="fixed z-[1000] w-[168px] az-glass-strong rounded-[var(--az-radius-lg)] shadow-[var(--az-shadow-lg)] border border-[var(--az-glass-border)] overflow-hidden py-1 animate-[az-scale-in_150ms_ease-out]"
              style={{ top: sortPosition.top, left: sortPosition.left }}
            >
              {(['manual', 'priority', 'dueDate', 'created', 'energy', 'title'] as SortMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  role="menuitemradio"
                  aria-checked={sortMode === m}
                  onClick={() => { setSortMode(m); setShowSort(false); }}
                  className={`
                    w-full text-left px-3 py-2 text-[12px] font-medium capitalize transition-colors
                    ${sortMode === m ? 'bg-[var(--az-accent-bg)] text-[var(--az-accent)]' : 'text-[var(--az-text-1)] hover:bg-[var(--az-surface-hover)]'}
                  `}
                >
                  {m === 'dueDate' ? 'Due Date' : m}
                </button>
              ))}
            </div>,
            document.body
          )}
        </div>
      </div>

    </div>
  );
}

/* ── Icons ── */
function AllIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}
function TodayIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}
function PriorityIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}
function ActiveIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
      <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
function InboxIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    </svg>
  );
}
function DoneIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}
function OverdueIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
function ArchivedIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8" />
      <path d="M10 12h4" />
    </svg>
  );
}
function ListViewIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}
function BoardViewIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}
function TimelineViewIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}
function SortIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path d="M3 4h13M3 8h9M3 12h5" />
    </svg>
  );
}
