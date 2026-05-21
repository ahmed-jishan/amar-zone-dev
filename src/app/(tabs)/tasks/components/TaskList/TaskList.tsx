'use client';
import { Task } from '../../types';
import TaskSection from './TaskSection';
import EmptyState from '../EmptyState/EmptyState';
import { useTaskSections } from '../../hooks/useTaskSections';

interface Props { tasks: Task[]; onToggle?: (id: string) => void; onFocus?: (task: Task) => void; }

export default function TaskList({ tasks, onToggle, onFocus }: Props) {
  const sections = useTaskSections(tasks);
  const hasAny = Object.values(sections).some(s => s.length > 0);
  if (!hasAny) return <EmptyState />;
  return (
    <div style={{ paddingBottom: 40 }}>
      <TaskSection title="Overdue"     tasks={sections.overdue}    onToggle={onToggle} variant="danger" />
      <TaskSection title="Today"       tasks={sections.today}      onToggle={onToggle} onFocus={onFocus} />
      <TaskSection title="In Progress" tasks={sections.inProgress} onToggle={onToggle} onFocus={onFocus} />
      <TaskSection title="Upcoming"    tasks={sections.upcoming}   onToggle={onToggle} onFocus={onFocus} />
      <TaskSection title="Inbox"       tasks={sections.inbox}      onToggle={onToggle} onFocus={onFocus} />
      <TaskSection title="Completed"   tasks={sections.completed}  onToggle={onToggle} variant="muted" defaultCollapsed />
    </div>
  );
}
