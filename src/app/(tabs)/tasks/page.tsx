<<<<<<< HEAD
'use client';

import TaskHeader from './components/TaskList/TaskHeader';
import StatsCard from './components/StatsCard/StatsCard';
import QuickAdd from './components/QuickAdd/QuickAdd';
import TaskFilters from './components/TaskFilters/TaskFilters';
import FocusCard from './components/FocusCard/FocusCard';
import TaskList from './components/TaskList/TaskList';
import { useTaskFocus } from './hooks/useTaskFocus';
import { useTaskFilters } from './hooks/useTaskFilters';
import { useTaskAnalytics } from './hooks/useTaskAnalytics';
import { Task } from './types';
import { useTaskStore } from '@/lib/store/taskStore';

export default function TasksPage() {
  // Use the actual tasks state from the store
  const tasks = useTaskStore((s) => s.tasks);
  const toggleTask = useTaskStore((s) => s.toggleTask);

  const { activeTask, isRunning, seconds, startFocus, pauseFocus, resumeFocus, stopFocus } =
    useTaskFocus();

  const { filter, setFilter, filteredTasks } = useTaskFilters(tasks);
  const stats = useTaskAnalytics(tasks);

  const handleFocus = (task: Task) => startFocus(task);
  const handleToggle = (id: string) => toggleTask(id);

  return (
    <div className="min-h-screen pb-32">
      <TaskHeader stats={stats} />
      <StatsCard tasks={tasks} />
      <QuickAdd />
      <TaskFilters activeFilter={filter} onFilterChange={setFilter} />
      <FocusCard
        activeTask={activeTask}
        isRunning={isRunning}
        seconds={seconds}
        onPause={pauseFocus}
        onResume={resumeFocus}
        onStop={stopFocus}
      />
      <TaskList
        tasks={filteredTasks}
        onToggle={handleToggle}
        onFocus={handleFocus}
      />
    </div>
  );
}
=======
import { TasksPage } from '@/features/tasks';

export default function Page() {
  return <TasksPage />;
}
>>>>>>> 7438bacf3bc40001e83f479e5d548e75e1245574
