'use client';
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TaskHeader from './components/TaskList/TaskHeader';
import QuickAdd from './components/QuickAdd/QuickAdd';
import TaskFilters from './components/TaskFilters/TaskFilters';
import FocusCard from './components/FocusCard/FocusCard';
import SmartPlanSection from './components/SmartPlanSection/SmartPlanSection';
import TaskList from './components/TaskList/TaskList';
import TaskDetailsModal from './components/TaskDetailsModal/TaskDetailsModal';
import { useTaskFocus } from './hooks/useTaskFocus';
import { useTaskFilters } from './hooks/useTaskFilters';
import { useTaskAnalytics } from './hooks/useTaskAnalytics';
import { Task } from './types';
import { useTaskStore } from '@/lib/store/taskStore';
import TabErrorBoundary from '@/components/shared/TabErrorBoundary';
import './tasks.css';
import dynamic from 'next/dynamic'
const CommandPalette = dynamic(() => import('./components/CommandPalette/CommandPalette'), { ssr: false });
const ContextMenu = dynamic(() => import('./components/ContextMenu/ContextMenu'), { ssr: false });
const DashboardSheet = dynamic(() => import('./components/DashboardSheet/DashboardSheet'), { ssr: false });
const Timeline = dynamic(() => import('./components/Timeline/Timeline'), { ssr: false });
const ArchivedTasks = dynamic(() => import('./components/Archived/ArchivedTasks'), { ssr: false });
const TaskBoard = dynamic(() => import('./components/TaskBoard/TaskBoard'), { ssr: false });
const OnboardingOverlay = dynamic(() => import('./components/OnboardingOverlay/OnboardingOverlay'), { ssr: false });




function TasksPageInner() {
  const tasks = useTaskStore((s) => s.tasks);
  const toggleTask = useTaskStore((s) => s.toggleTask);
  const updateTask = useTaskStore((s) => s.updateTask);
  const archiveTask = useTaskStore((s) => s.archiveTask);
  const reorderTasks = useTaskStore((s) => s.reorderTasks);
  const searchQuery = useTaskStore((s) => s.searchQuery);
  const sortMode = useTaskStore((s) => s.sortMode);
  const viewMode = useTaskStore((s) => s.viewMode);

  const [detailsTask, setDetailsTask] = useState<Task | null>(null);
  const [contextMenu, setContextMenu] = useState<{ task: Task | null; x: number; y: number } | null>(null);
  const [showDashboard, setShowDashboard] = useState(false);
  const [filtersSticky, setFiltersSticky] = useState(false);
  const filtersRef = useRef<HTMLDivElement>(null);

  const { activeTask, isRunning, seconds, startFocus, pauseFocus, resumeFocus, stopFocus } = useTaskFocus();
  const { filter, setFilter, filteredTasks } = useTaskFilters(tasks);
  const stats = useTaskAnalytics(tasks);

  const nextTask = useMemo(() => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return tasks
      .filter((task) => !task.completed && task.status !== 'archived')
      .sort((a, b) => {
        const statusWeight = (value: Task) => value.status === 'today' ? 0 : value.dueDate ? 1 : 2;
        const dueA = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
        const dueB = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
        return statusWeight(a) - statusWeight(b)
          || priorityOrder[a.priority] - priorityOrder[b.priority]
          || dueA - dueB;
      })[0] ?? null;
  }, [tasks]);

  // Apply search + sort
  const displayTasks = useMemo(() => {
    let result = [...filteredTasks];

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q) ||
          t.tags?.some((tag) => tag.toLowerCase().includes(q))
      );
    }

    // Sort
    switch (sortMode) {
      case 'priority': {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        result.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
        break;
      }
      case 'dueDate':
        result.sort((a, b) => {
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        });
        break;
      case 'created':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'energy': {
        const energyOrder = { high: 0, medium: 1, low: 2 };
        result.sort((a, b) => (energyOrder[a.energyLevel || 'low'] - energyOrder[b.energyLevel || 'low']));
        break;
      }
      case 'title':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'manual':
      default:
        result.sort((a, b) => (a.position || 0) - (b.position || 0));
        break;
    }

    return result;
  }, [filteredTasks, searchQuery, sortMode]);

  const handleContextMenu = useCallback((e: React.MouseEvent, task: Task) => {
    e.preventDefault();
    setContextMenu({ task, x: e.clientX, y: e.clientY });
  }, []);

  const handleReorder = useCallback(
    (orderedIds: string[]) => {
      reorderTasks(orderedIds);
    },
    [reorderTasks]
  );

  // Intersection observer for sticky filters
  useEffect(() => {
    const el = filtersRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setFiltersSticky(!entry.isIntersecting);
      },
      { threshold: 0, rootMargin: '-60px 0px 0px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const stickyFilterActive = filtersSticky && filter !== 'archived';

  return (
    <div className="az-root min-h-[100dvh] bg-[var(--az-bg)]">
      <div className="max-w-[680px] mx-auto px-4 sm:px-6 pb-32 pt-3">
        {/* Header — compact greeting + stats */}
        <TaskHeader
          stats={stats}
          onToggleDashboard={() => setShowDashboard(true)}
          nextTaskTitle={nextTask?.title}
          onStartNext={() => nextTask && startFocus(nextTask)}
          onPlanToday={() => setFilter('today')}
          onAddTask={() => window.dispatchEvent(new CustomEvent('az:open-quick-add'))}
        />

        {/* Focus Card — only renders when active */}
        {activeTask && (
          <FocusCard
            activeTask={activeTask}
            isRunning={isRunning}
            seconds={seconds}
            onPause={pauseFocus}
            onResume={resumeFocus}
            onStop={stopFocus}
          />
        )}

        {/* Merged Smart Plan */}
        <SmartPlanSection
          tasks={tasks}
          onFocus={startFocus}
          onOpenDetails={setDetailsTask}
          onShowToday={() => setFilter('today')}
          onCarryForward={(task) => updateTask(task.id, { status: 'today', dueDate: new Date().toISOString().split('T')[0] })}
          onArchive={(task) => archiveTask(task.id)}
        />

        {/* Filter bar sentinel for sticky detection */}
        <div ref={filtersRef}>
          <TaskFilters activeFilter={filter} onFilterChange={setFilter} />
        </div>

        {/* Sticky filter bar clone when scrolled past */}
        <AnimatePresence>
          {stickyFilterActive && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="fixed top-0 left-0 right-0 z-[50] bg-[var(--az-bg)]/90 backdrop-blur-xl border-b border-[var(--az-border)] px-3 py-2"
              style={{ paddingTop: 'calc(env(safe-area-inset-top) + 8px)' }}
            >
              <div className="max-w-[680px] mx-auto">
                <div className="flex items-center gap-2">
                  {/* Mini stats pill */}
                  <button
                    onClick={() => setShowDashboard(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[var(--az-radius-lg)] bg-[var(--az-accent-bg)] border border-[var(--az-accent-border)] text-[11px] font-bold text-[var(--az-accent)] whitespace-nowrap hover:shadow-[var(--az-shadow-sm)] transition-all flex-shrink-0"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span className="hidden sm:inline">Stats</span>
                  </button>

                  {/* Condensed filter pills only — no search, no view toggle, no command */}
                  <div className="flex items-center gap-1 overflow-x-auto scrollbar-none flex-1">
                    <StickyFilterPill
                      label="Today"
                      active={filter === 'today'}
                      count={stats.today}
                      onClick={() => setFilter('today')}
                      color="var(--az-accent)"
                    />
                    <StickyFilterPill
                      label="Active"
                      active={filter === 'in-progress'}
                      count={stats.inProgress}
                      onClick={() => setFilter('in-progress')}
                      color="var(--az-warn)"
                    />
                    <StickyFilterPill
                      label="Done"
                      active={filter === 'completed'}
                      count={stats.completed}
                      onClick={() => setFilter('completed')}
                      color="var(--az-success)"
                    />
                    <StickyFilterPill
                      label="All"
                      active={filter === 'all'}
                      onClick={() => setFilter('all')}
                      color="var(--az-text-2)"
                    />
                    <div className="w-px h-4 bg-[var(--az-border)] mx-0.5" />
                    <StickyFilterPill
                      label="Overdue"
                      active={filter === 'overdue'}
                      count={stats.overdue}
                      onClick={() => setFilter('overdue')}
                      color="var(--az-danger)"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Task Views */}
        {filter === 'archived' ? (
          <ArchivedTasks tasks={displayTasks} />
        ) : viewMode === 'timeline' ? (
          <Timeline
            tasks={displayTasks}
            onToggle={toggleTask}
            onOpenDetails={setDetailsTask}
          />
        ) : viewMode === 'board' ? (
          <TaskBoard
            tasks={displayTasks}
            onToggle={toggleTask}
            onFocus={startFocus}
            onOpenDetails={setDetailsTask}
          />
        ) : (
          <TaskList
            tasks={displayTasks}
            onToggle={toggleTask}
            onFocus={startFocus}
            onOpenDetails={setDetailsTask}
            onReorder={handleReorder}
          />
        )}
      </div>

      {/* Modals & Overlays */}
      {detailsTask && (
        <TaskDetailsModal
          task={detailsTask}
          onClose={() => setDetailsTask(null)}
        />
      )}

      <ContextMenu
        task={contextMenu?.task ?? null}
        position={contextMenu ? { x: contextMenu.x, y: contextMenu.y } : null}
        onClose={() => setContextMenu(null)}
        onOpenDetails={setDetailsTask}
        onFocus={startFocus}
      />

      {/* Dashboard Bottom Sheet */}
      <DashboardSheet
        tasks={tasks}
        isOpen={showDashboard}
        onClose={() => setShowDashboard(false)}
      />

      {/* Quick Add modal */}
      <QuickAdd />

      {/* Quick add task FAB */}
      <div style={{ position: 'fixed', right: '1.5rem', left: 'auto', bottom: 'calc(9rem + env(safe-area-inset-bottom))', zIndex: 10030, pointerEvents: 'auto' }}>
        <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.dispatchEvent(new CustomEvent('az:open-quick-add'))}
            className="w-14 h-14 rounded-2xl bg-[var(--az-accent)] text-white shadow-xl shadow-[var(--az-accent-glow)] flex items-center justify-center backdrop-blur-xl border border-[var(--az-accent-border)] pointer-events-auto"
            aria-label="Quick add task"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path d="M12 4v16m8-8H4" />
            </svg>
            <motion.div
              className="absolute inset-0 rounded-2xl bg-[var(--az-accent)]/20 pointer-events-none"
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.button>
        </div>

      <CommandPalette />

      {/* Onboarding overlay for first-time users */}
      <OnboardingOverlay />
    </div>
  );
}

// ─── Sticky Filter Pill Component ───
function StickyFilterPill({
  label,
  active,
  count,
  onClick,
  color,
}: {
  label: string;
  active: boolean;
  count?: number;
  onClick: () => void;
  color: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-1 px-2.5 py-1.5 rounded-[var(--az-radius-md)] text-[11px] font-semibold whitespace-nowrap transition-all duration-200 flex-shrink-0
        ${active
          ? 'bg-[var(--az-accent)] text-white shadow-[0_0_8px_var(--az-accent-glow)]'
          : 'text-[var(--az-text-2)] hover:text-[var(--az-text-1)] hover:bg-[var(--az-surface-2)]'
        }
      `}
    >
      {label}
      {count !== undefined && count > 0 && (
        <span className={`ml-0.5 ${active ? 'text-white/70' : ''}`} style={{ color: active ? undefined : color }}>
          {count}
        </span>
      )}
    </button>
  );
}

export default function TasksPage() {
  return (
    <TabErrorBoundary fallbackTitle="Tasks tab crashed">
      <TasksPageInner />
    </TabErrorBoundary>
  );
}
