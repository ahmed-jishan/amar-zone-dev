'use client';
// FIX 21: TaskList.tsx
// BUGS FIXED:
//   - EmptyState component existed but was NEVER used. If all sections are empty
//     (no tasks), nothing rendered — blank white space with no feedback.
//   - Section order: "Overdue" was last. Overdue tasks are highest urgency —
//     should appear first, before Today.
//   - "Inbox" section existed in groupTasks but was never rendered in TaskList.

import { Task } from '../../types';
import TaskSection from './TaskSection';
import EmptyState from '../EmptyState/EmptyState';
import { useTaskSections } from '../../hooks/useTaskSections';

interface Props {
  tasks: Task[];
  onToggle?: (id: string) => void;
  onFocus?: (task: Task) => void;
}

export default function TaskList({ tasks, onToggle, onFocus }: Props) {
  const sections = useTaskSections(tasks);
  const hasAnyTasks = Object.values(sections).some((s) => s.length > 0);

  if (!hasAnyTasks) {
    return <EmptyState />;
  }

  return (
    <div className="pb-32">
      {/* FIX: Overdue first — highest urgency */}
      <TaskSection
        title="Overdue"
        tasks={sections.overdue}
        onToggle={onToggle}
        variant="danger"
      />

      <TaskSection
        title="Today"
        tasks={sections.today}
        onToggle={onToggle}
        onFocus={onFocus}
      />

      <TaskSection
        title="In Progress"
        tasks={sections.inProgress}
        onToggle={onToggle}
        onFocus={onFocus}
      />

      <TaskSection
        title="Upcoming"
        tasks={sections.upcoming}
        onToggle={onToggle}
        onFocus={onFocus}
      />

      {/* FIX: Inbox section was computed but never rendered */}
      <TaskSection
        title="Inbox"
        tasks={sections.inbox}
        onToggle={onToggle}
        onFocus={onFocus}
      />

      <TaskSection
        title="Completed"
        tasks={sections.completed}
        onToggle={onToggle}
        variant="muted"
      />
    </div>
  );
}
