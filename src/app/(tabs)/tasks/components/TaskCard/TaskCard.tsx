'use client';

import { useState, useRef, useCallback, memo } from 'react';
import { Task, Subtask } from '../../types';
import { PRIORITIES } from '../../constants/priorities';
import { CATEGORIES } from '../../constants/categories';
import { formatTaskDate, isDateOverdue } from '../../utils/taskDates';
import { useTaskStore } from '@/lib/store/taskStore';

interface Props {
  task: Task;
  index?: number;
  isDragging?: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
  onToggle: (id: string) => void;
  onFocus?: (task: Task) => void;
  onOpenDetails?: (task: Task) => void;
  onContextMenu?: (e: React.MouseEvent, task: Task) => void;
}

const Checkbox = memo(function Checkbox({
  completed,
  onChange,
  disabled,
}: {
  completed: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      disabled={disabled}
      className={`
        relative flex-shrink-0 w-[22px] h-[22px] rounded-full border-2
        flex items-center justify-center transition-all duration-300
        ${completed
          ? 'bg-[var(--az-success)] border-[var(--az-success)] shadow-[0_0_12px_var(--az-success-glow)]'
          : 'border-[var(--az-border-strong)] hover:border-[var(--az-accent)] hover:shadow-[0_0_8px_var(--az-accent-glow)]'
        }
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
      `}
      aria-label={completed ? 'Mark incomplete' : 'Mark complete'}
    >
      {completed && (
        <svg
          className="w-3 h-3 text-white animate-[az-check-bounce_300ms_ease-out]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={3}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      )}
    </button>
  );
});

const PriorityBar = memo(function PriorityBar({ priority }: { priority: string }) {
  const p = PRIORITIES[priority as keyof typeof PRIORITIES];
  if (!p) return null;
  return (
    <div
      className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full transition-all duration-300"
      style={{
        background: p.accentColor,
        boxShadow: `0 0 8px ${p.accentColor}40`,
      }}
    />
  );
});

const SubtaskIndicator = memo(function SubtaskIndicator({ subtasks }: { subtasks?: Subtask[] }) {
  if (!subtasks?.length) return null;
  const completed = subtasks.filter((s) => s.completed).length;
  const pct = Math.round((completed / subtasks.length) * 100);
  return (
    <div className="flex items-center gap-1.5 text-[11px] text-[var(--az-text-3)]">
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
      <span>{completed}/{subtasks.length}</span>
      <div className="w-10 h-1 rounded-full bg-[var(--az-surface-3)] overflow-hidden">
        <div
          className="h-full rounded-full bg-[var(--az-accent)] transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
});

const TimeBadge = memo(function TimeBadge({ estimate, actual }: { estimate?: number; actual?: number }) {
  if (!estimate && !actual) return null;
  const display = actual ? `${actual}m tracked` : `${estimate}m est`;
  const color = actual && estimate && actual > estimate ? 'var(--az-warn)' : 'var(--az-text-3)';
  return (
    <span className="flex items-center gap-1 text-[11px]" style={{ color }}>
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
      {display}
    </span>
  );
});

const TagPill = memo(function TagPill({ tag }: { tag: string }) {
  return (
    <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-[var(--az-surface-3)] text-[var(--az-text-3)] border border-[var(--az-border)]">
      {tag}
    </span>
  );
});

function TaskCardComponent({
  task,
  index = 0,
  isDragging = false,
  dragHandleProps,
  onToggle,
  onFocus,
  onOpenDetails,
  onContextMenu,
}: Props) {
  const [isHovered, setIsHovered] = useState(false);
  const [ripple, setRipple] = useState<{ x: number; y: number } | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const canComplete = useTaskStore((s) => s.canComplete);
  const toggleSelect = useTaskStore((s) => s.toggleSelect);
  const selectedIds = useTaskStore((s) => s.selectedIds);
  const isSelectionMode = useTaskStore((s) => s.isSelectionMode);
  const isSelected = selectedIds.includes(task.id);

  const pri = PRIORITIES[task.priority];
  const cat = CATEGORIES[task.category];
  const dueOverdue = task.dueDate && isDateOverdue(task.dueDate) && !task.completed;
  const blocked = !canComplete(task.id);
  const subtaskProgress = task.subtasks?.length
    ? Math.round((task.subtasks.filter((s) => s.completed).length / task.subtasks.length) * 100)
    : 0;

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (isSelectionMode) {
        e.preventDefault();
        e.stopPropagation();
        toggleSelect(task.id);
        return;
      }
      if (e.target instanceof HTMLElement && e.target.closest('button')) return;
      if (onOpenDetails) onOpenDetails(task);
    },
    [isSelectionMode, task.id, toggleSelect, onOpenDetails, task]
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (onContextMenu) onContextMenu(e, task);
    },
    [onContextMenu, task]
  );

  const createRipple = (e: React.MouseEvent) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    setRipple({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setTimeout(() => setRipple(null), 600);
  };

  return (
    <div
      ref={cardRef}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={createRipple}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick(e as unknown as React.MouseEvent);
        }
      }}
      className={`
        group relative flex items-start gap-3 px-4 py-3.5 rounded-[var(--az-radius-lg)]
        border transition-all duration-300 cursor-pointer select-none
        ${isDragging
          ? 'opacity-60 scale-[0.98] rotate-1 shadow-[var(--az-shadow-lg)]'
          : 'opacity-100 scale-100 rotate-0'
        }
        ${task.completed
          ? 'bg-[var(--az-surface-1)]/60 border-[var(--az-border)]'
          : 'bg-[var(--az-surface-1)] border-[var(--az-border)]'
        }
        ${isHovered && !task.completed
          ? 'border-[var(--az-border-hover)] shadow-[var(--az-shadow-md)] translate-y-[-2px]'
          : ''
        }
        ${isHovered && task.completed
          ? 'border-[var(--az-border-hover)] shadow-[var(--az-shadow-sm)]'
          : ''
        }
        ${isSelected
          ? 'ring-2 ring-[var(--az-accent)] ring-offset-2 ring-offset-[var(--az-bg)]'
          : ''
        }
        ${blocked ? 'opacity-70' : ''}
      `}
      style={{
        animationDelay: `${index * 40}ms`,
        animation: 'az-slide-up 350ms cubic-bezier(0.16, 1, 0.3, 1) both',
      }}
    >
      {/* Ripple effect */}
      {ripple && (
        <span
          className="absolute rounded-full bg-[var(--az-accent)] opacity-20 pointer-events-none animate-[az-ripple_600ms_linear]"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: 4,
            height: 4,
            marginLeft: -2,
            marginTop: -2,
          }}
        />
      )}

      {/* Priority glow on hover */}
      {!task.completed && isHovered && (
        <div
          className="absolute inset-0 rounded-[var(--az-radius-lg)] pointer-events-none transition-opacity duration-500"
          style={{
            background: `radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${pri?.accentColor}08, transparent 40%)`,
          }}
        />
      )}

      {/* Priority bar */}
      <PriorityBar priority={task.priority} />

      {/* Selection checkbox (multi-select mode) */}
      {isSelectionMode && (
        <div className="flex-shrink-0 pt-0.5">
          <div
            className={`
              w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all
              ${isSelected
                ? 'bg-[var(--az-accent)] border-[var(--az-accent)]'
                : 'border-[var(--az-border-strong)] group-hover:border-[var(--az-text-3)]'
              }
            `}
          >
            {isSelected && (
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        </div>
      )}

      {/* Main checkbox */}
      {!isSelectionMode && (
        <div className="flex-shrink-0 pt-0.5">
          <Checkbox
            completed={task.completed}
            onChange={() => onToggle(task.id)}
            disabled={blocked}
          />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Title row */}
        <div className="flex items-start justify-between gap-2">
          <h3
            className={`
              text-[15px] font-semibold leading-snug transition-all duration-300
              ${task.completed
                ? 'text-[var(--az-text-3)] line-through decoration-[var(--az-text-4)]'
                : 'text-[var(--az-text-1)]'
              }
            `}
          >
            {task.title}
          </h3>

          {/* Drag handle */}
          {dragHandleProps && !isSelectionMode && (
            <div
              {...dragHandleProps}
              className="flex-shrink-0 opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-1 -mr-1 -mt-1"
            >
              <svg className="w-4 h-4 text-[var(--az-text-3)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M9 6h.01M9 12h.01M9 18h.01M15 6h.01M15 12h.01M15 18h.01" strokeLinecap="round" />
              </svg>
            </div>
          )}
        </div>

        {/* Description */}
        {task.description && !task.completed && (
          <p className="mt-1 text-[13px] text-[var(--az-text-2)] leading-relaxed line-clamp-2">
            {task.description}
          </p>
        )}

        {/* Metadata row */}
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          {/* Priority badge */}
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border"
            style={{
              color: pri?.textColor,
              background: pri?.bgColor,
              borderColor: pri?.borderColor,
            }}
          >
            {pri?.label}
          </span>

          {/* Category badge */}
          {cat && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] text-[var(--az-text-2)] bg-[var(--az-surface-2)] border border-[var(--az-border)]">
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
            </span>
          )}

          {/* Due date */}
          {task.dueDate && (
            <span
              className={`
                inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border
                ${dueOverdue
                  ? 'text-[var(--az-danger)] bg-[var(--az-danger-bg)] border-[var(--az-danger-border)]'
                  : 'text-[var(--az-text-2)] bg-[var(--az-surface-2)] border-[var(--az-border)]'
                }
              `}
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              {formatTaskDate(task.dueDate)}
            </span>
          )}

          {/* Energy level */}
          {task.energyLevel && (
            <span className="inline-flex items-center gap-1 text-[11px] text-[var(--az-text-3)]">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {task.energyLevel}
            </span>
          )}

          {/* Time tracking */}
          <TimeBadge estimate={task.timeEstimate} actual={task.actualTime} />

          {/* Blocked indicator */}
          {blocked && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] text-[var(--az-warn)] bg-[var(--az-warn-bg)] border border-[var(--az-warn-border)]">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M12 15v.01M12 12a4 4 0 00-4-4h0a4 4 0 00-4 4v2h8z" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              Blocked
            </span>
          )}
        </div>

        {/* Tags */}
        {task.tags && task.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {task.tags.map((tag) => (
              <TagPill key={tag} tag={tag} />
            ))}
          </div>
        )}

        {/* Subtask progress */}
        {task.subtasks && task.subtasks.length > 0 && (
          <div className="mt-2">
            <SubtaskIndicator subtasks={task.subtasks} />
          </div>
        )}

        {/* Bottom progress bar for completed */}
        {task.completed && (
          <div className="mt-2 h-[2px] rounded-full bg-[var(--az-surface-3)] overflow-hidden">
            <div
              className="h-full rounded-full bg-[var(--az-success)] animate-[az-progress-fill_600ms_ease-out]"
              style={{ width: '100%' }}
            />
          </div>
        )}
      </div>

      {/* Focus button (hover) */}
      {!task.completed && onFocus && !isSelectionMode && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onFocus(task);
          }}
          className={`
            flex-shrink-0 p-2 rounded-[var(--az-radius-md)] transition-all duration-300
            ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'}
            text-[var(--az-accent)] hover:bg-[var(--az-accent-bg)]
          `}
          aria-label="Focus on this task"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </button>
      )}
    </div>
  );
}

export default memo(TaskCardComponent);
