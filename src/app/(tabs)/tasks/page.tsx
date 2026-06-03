'use client';

import { useState, useCallback, useMemo } from 'react';
import TaskHeader from './components/TaskList/TaskHeader';
import QuickAdd from './components/QuickAdd/QuickAdd';
import TaskFilters from './components/TaskFilters/TaskFilters';
import FocusCard from './components/FocusCard/FocusCard';
import TodayPlan from './components/TodayPlan/TodayPlan';
import WeeklyReview from './components/WeeklyReview/WeeklyReview';
import TaskList from './components/TaskList/TaskList';
import TaskDetailsModal from './components/TaskDetailsModal/TaskDetailsModal';
import CommandPalette from './components/CommandPalette/CommandPalette';
import ContextMenu from './components/ContextMenu/ContextMenu';
import Dashboard from './components/Dashboard/Dashboard';
import ProductivityHeatmap from './components/ProductivityHeatmap/ProductivityHeatmap';
import Timeline from './components/Timeline/Timeline';
import ArchivedTasks from './components/Archived/ArchivedTasks';
import TaskBoard from './components/TaskBoard/TaskBoard';
import { useTaskFocus } from './hooks/useTaskFocus';
import { useTaskFilters } from './hooks/useTaskFilters';
import { useTaskAnalytics } from './hooks/useTaskAnalytics';
import { Task, ViewMode, SortMode } from './types';
import { useTaskStore } from '@/lib/store/taskStore';
import './tasks.css';

export default function TasksPage() {
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
      case 'priority':
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        result.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
        break;
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
      case 'energy':
        const energyOrder = { high: 0, medium: 1, low: 2 };
        result.sort((a, b) => (energyOrder[a.energyLevel || 'low'] - energyOrder[b.energyLevel || 'low']));
        break;
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

  return (
    <div className="az-root min-h-[100dvh] bg-[var(--az-bg)]">
      <div className="max-w-[680px] mx-auto px-4 sm:px-6 pb-32 pt-4">
        {/* Header */}
        <TaskHeader
          stats={stats}
          onToggleDashboard={() => setShowDashboard((s) => !s)}
          showDashboard={showDashboard}
          nextTaskTitle={nextTask?.title}
          onStartNext={() => nextTask && startFocus(nextTask)}
          onPlanToday={() => setFilter('today')}
          onAddTask={() => window.dispatchEvent(new CustomEvent('az:open-quick-add'))}
        />

        {/* Focus Card */}
        <FocusCard
          activeTask={activeTask}
          isRunning={isRunning}
          seconds={seconds}
          onPause={pauseFocus}
          onResume={resumeFocus}
          onStop={stopFocus}
        />

        <TodayPlan
          tasks={tasks}
          onFocus={startFocus}
          onOpenDetails={setDetailsTask}
          onShowToday={() => setFilter('today')}
        />

        <WeeklyReview
          tasks={tasks}
          onCarryForward={(task) => updateTask(task.id, { status: 'today', dueDate: new Date().toISOString().split('T')[0] })}
          onArchive={(task) => archiveTask(task.id)}
        />

        {/* Quick Add */}
        <QuickAdd />

        {/* Filters */}
        <TaskFilters activeFilter={filter} onFilterChange={setFilter} />

        {/* Dashboard (toggleable) */}
        {showDashboard && (
          <div className="mb-4 animate-[az-slide-up_400ms_ease-out]">
            <Dashboard tasks={tasks} />
            <div className="mt-4">
              <ProductivityHeatmap tasks={tasks} />
            </div>
          </div>
        )}

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

      <CommandPalette />

    </div>
  );
}
