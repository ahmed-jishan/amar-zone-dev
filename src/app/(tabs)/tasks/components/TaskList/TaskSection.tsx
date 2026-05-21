'use client';

import { useState, memo } from 'react';
import { Task } from '../../types';
import TaskCard from '../TaskCard/TaskCard';

interface Props {
  title: string;
  tasks: Task[];
  onToggle?: (id: string) => void;
  onFocus?: (task: Task) => void;
  onOpenDetails?: (task: Task) => void;
  variant?: 'default' | 'danger' | 'muted';
  defaultCollapsed?: boolean;
  draggingId?: string | null;
  dragOverId?: string | null;
  onDragStart?: (e: React.DragEvent, id: string) => void;
  onDragOver?: (e: React.DragEvent, id: string) => void;
  onDragLeave?: () => void;
  onDrop?: (e: React.DragEvent, id: string) => void;
  onDragEnd?: () => void;
}

const TC = {
  default: 'var(--az-text-2)',
  danger: 'var(--az-danger)',
  muted: 'var(--az-text-3)',
};

const CC = {
  default: 'var(--az-accent)',
  danger: 'var(--az-danger)',
  muted: 'var(--az-text-3)',
};

function TaskSectionComponent({
  title,
  tasks,
  onToggle,
  onFocus,
  onOpenDetails,
  variant = 'default',
  defaultCollapsed = false,
  draggingId,
  dragOverId,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
}: Props) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  if (!tasks.length) return null;

  const tc = TC[variant];
  const cc = CC[variant];

  return (
    <div className="animate-[az-slide-up_400ms_ease-out]">
      {/* Section Header */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="group flex items-center gap-2 w-full py-2 px-1 mb-1 text-left transition-colors hover:bg-[var(--az-surface-hover)]/50 rounded-[var(--az-radius-md)]"
      >
        <svg
          className={`w-4 h-4 transition-transform duration-300 ${collapsed ? '-rotate-90' : 'rotate-0'}`}
          style={{ color: cc }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
        <span className="text-[13px] font-semibold tracking-wide uppercase" style={{ color: tc }}>
          {title}
        </span>
        <span
          className="ml-1.5 px-1.5 py-0.5 rounded-md text-[11px] font-bold min-w-[20px] text-center"
          style={{
            color: cc,
            background: `${cc}15`,
          }}
        >
          {tasks.length}
        </span>
        <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
          <svg className="w-4 h-4 text-[var(--az-text-3)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d={collapsed ? 'M12 4v16m8-8H4' : 'M20 12H4'} />
          </svg>
        </div>
      </button>

      {/* Tasks */}
      <div
        className={`space-y-2 transition-all duration-400 overflow-hidden ${collapsed ? 'max-h-0 opacity-0' : 'max-h-[9999px] opacity-100'}`}
      >
        {tasks.map((task, idx) => (
          <div
            key={task.id}
            draggable={!!onDragStart}
            onDragStart={(e) => onDragStart?.(e, task.id)}
            onDragOver={(e) => onDragOver?.(e, task.id)}
            onDragLeave={onDragLeave}
            onDrop={(e) => onDrop?.(e, task.id)}
            onDragEnd={onDragEnd}
            className={`
              transition-all duration-200
              ${dragOverId === task.id && draggingId !== task.id ? 'scale-[1.02] translate-y-1' : ''}
              ${dragOverId === task.id && draggingId !== task.id ? 'after:content-[""] after:block after:h-1 after:w-full after:bg-[var(--az-accent)] after:rounded-full after:mb-2' : ''}
            `}
          >
            <TaskCard
              task={task}
              index={idx}
              isDragging={draggingId === task.id}
              dragHandleProps={onDragStart ? {} : undefined}
              onToggle={onToggle ?? (() => {})}
              onFocus={onFocus}
              onOpenDetails={onOpenDetails}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default memo(TaskSectionComponent);
