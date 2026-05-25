'use client';

import { Task } from '../../types';
import { useTaskSections } from '../../hooks/useTaskSections';
import EmptyState from '../EmptyState/EmptyState';
import BulkActions from '../BulkActions/BulkActions';
import TaskCard from '../TaskCard/TaskCard';

interface Props {
  tasks: Task[];
  onToggle: (id: string) => void;
  onFocus?: (task: Task) => void;
  onOpenDetails?: (task: Task) => void;
}

const COLUMNS = [
  { key: 'today' as const, title: 'Today' },
  { key: 'inProgress' as const, title: 'In Progress' },
  { key: 'upcoming' as const, title: 'Upcoming' },
  { key: 'inbox' as const, title: 'Inbox' },
  { key: 'completed' as const, title: 'Completed' },
];

export default function TaskBoard({ tasks, onToggle, onFocus, onOpenDetails }: Props) {
  const sections = useTaskSections(tasks);
  const hasAny = Object.values(sections).some((s) => s.length > 0);

  if (!hasAny) return <EmptyState />;

  const overdue = sections.overdue;

  return (
    <div className="space-y-3">
      <BulkActions />
      {overdue.length > 0 && (
        <section className="az-board-alert">
          <div className="az-board-alert-title">Overdue</div>
          <div className="space-y-2">
            {overdue.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                index={index}
                onToggle={onToggle}
                onFocus={onFocus}
                onOpenDetails={onOpenDetails}
              />
            ))}
          </div>
        </section>
      )}
      <div className="az-board az-scrollbar az-scrollbar-x">
        {COLUMNS.map((column) => {
          const columnTasks = sections[column.key];
          return (
            <section key={column.key} className="az-board-column">
              <div className="az-board-column-head">
                <span>{column.title}</span>
                <span className="az-board-count">{columnTasks.length}</span>
              </div>
              <div className="az-board-column-body">
                {columnTasks.length > 0 ? (
                  columnTasks.map((task, index) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      index={index}
                      onToggle={onToggle}
                      onFocus={onFocus}
                      onOpenDetails={onOpenDetails}
                    />
                  ))
                ) : (
                  <div className="az-board-empty">No tasks</div>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
