'use client';

import { useState, useCallback, useMemo } from 'react';
import { Task } from '../../types';
import TaskSection from './TaskSection';
import EmptyState from '../EmptyState/EmptyState';
import BulkActions from '../BulkActions/BulkActions';
import { useTaskSections } from '../../hooks/useTaskSections';

interface Props {
  tasks: Task[];
  onToggle: (id: string) => void;
  onFocus?: (task: Task) => void;
  onOpenDetails?: (task: Task) => void;
  onReorder?: (orderedIds: string[]) => void;
}

export default function TaskList({ tasks, onToggle, onFocus, onOpenDetails, onReorder }: Props) {
  const sections = useTaskSections(tasks);
  const hasAny = Object.values(sections).some((s) => s.length > 0);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const allTaskIds = useMemo(() => tasks.map((t) => t.id), [tasks]);

  const handleDragStart = useCallback((e: React.DragEvent, id: string) => {
    setDraggingId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
    // Custom drag image could be set here
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (id !== draggingId) setDragOverId(id);
  }, [draggingId]);

  const handleDragLeave = useCallback(() => {
    setDragOverId(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, targetId: string) => {
      e.preventDefault();
      const sourceId = e.dataTransfer.getData('text/plain');
      if (!sourceId || sourceId === targetId) {
        setDraggingId(null);
        setDragOverId(null);
        return;
      }

      const newOrder = [...allTaskIds];
      const sourceIdx = newOrder.indexOf(sourceId);
      const targetIdx = newOrder.indexOf(targetId);
      if (sourceIdx === -1 || targetIdx === -1) return;

      newOrder.splice(sourceIdx, 1);
      newOrder.splice(targetIdx, 0, sourceId);

      onReorder?.(newOrder);
      setDraggingId(null);
      setDragOverId(null);
    },
    [allTaskIds, onReorder]
  );

  const handleDragEnd = useCallback(() => {
    setDraggingId(null);
    setDragOverId(null);
  }, []);

  if (!hasAny) return <EmptyState />;

  const sectionConfig = [
    { key: 'overdue' as const, title: 'Overdue', variant: 'danger' as const, defaultCollapsed: false },
    { key: 'today' as const, title: 'Today', variant: 'default' as const, defaultCollapsed: false },
    { key: 'inProgress' as const, title: 'In Progress', variant: 'default' as const, defaultCollapsed: false },
    { key: 'upcoming' as const, title: 'Upcoming', variant: 'default' as const, defaultCollapsed: true },
    { key: 'inbox' as const, title: 'Inbox', variant: 'muted' as const, defaultCollapsed: true },
    { key: 'completed' as const, title: 'Completed', variant: 'muted' as const, defaultCollapsed: true },
  ];

  return (
    <div className="space-y-3">
      <BulkActions />
      {sectionConfig.map((cfg) => (
        <TaskSection
          key={cfg.key}
          title={cfg.title}
          tasks={sections[cfg.key]}
          onToggle={onToggle}
          onFocus={onFocus}
          onOpenDetails={onOpenDetails}
          variant={cfg.variant}
          defaultCollapsed={cfg.defaultCollapsed}
          draggingId={draggingId}
          dragOverId={dragOverId}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onDragEnd={handleDragEnd}
        />
      ))}
    </div>
  );
}
