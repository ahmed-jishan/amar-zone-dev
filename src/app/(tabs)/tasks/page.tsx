'use client';

import TaskHeader from './components/TaskList/TaskHeader';
import QuickAdd from './components/QuickAdd/QuickAdd';
import TaskFilters from './components/TaskFilters/TaskFilters';
import FocusCard from './components/FocusCard/FocusCard';
import TaskList from './components/TaskList/TaskList';
import { useTaskFocus } from './hooks/useTaskFocus';
import { useTaskFilters } from './hooks/useTaskFilters';
import { useTaskAnalytics } from './hooks/useTaskAnalytics';
import TaskHistory from './components/TaskHistory/TaskHistory';
import { Task } from './types';
import { useTaskStore } from '@/lib/store/taskStore';

export default function TasksPage() {
  const tasks      = useTaskStore(s => s.tasks);
  const toggleTask = useTaskStore(s => s.toggleTask);

  const { activeTask, isRunning, seconds, startFocus, pauseFocus, resumeFocus, stopFocus } = useTaskFocus();
  const { filter, setFilter, filteredTasks } = useTaskFilters(tasks);
  const stats = useTaskAnalytics(tasks);

  return (
    <div style={{ minHeight:'100vh', background:'var(--az-bg)' }}>
      <div style={{ maxWidth:480, margin:'0 auto', padding:'0 16px 120px' }}>
        <TaskHeader stats={stats} />
        <FocusCard
          activeTask={activeTask} isRunning={isRunning} seconds={seconds}
          onPause={pauseFocus} onResume={resumeFocus} onStop={stopFocus}
        />
        <QuickAdd />
        <TaskFilters activeFilter={filter} onFilterChange={setFilter} />
        <TaskList tasks={filteredTasks} onToggle={id => toggleTask(id)} onFocus={(task: Task) => startFocus(task)} />
        <TaskHistory tasks={tasks} />
      </div>
    </div>
  );
}
