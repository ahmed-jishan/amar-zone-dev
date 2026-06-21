'use client';

import { useState, useRef, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task, Subtask } from '../../types';
import { PRIORITIES } from '../../constants/priorities';
import { CATEGORIES } from '../../constants/categories';
import { formatTaskDate, isDateOverdue } from '../../utils/taskDates';
import { useTaskStore } from '@/lib/store/taskStore';
import { useHaptics } from '@/hooks/useHaptics';
import { springs } from '@/hooks/useSpringAnimation';

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

// ─── Sub-components ───

const Checkbox = memo(function Checkbox({
  completed,
  onChange,
  disabled,
}: {
  completed: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  const haptics = useHaptics();

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    if (!completed) {
      haptics.success();
    } else {
      haptics.tap();
    }
    onChange();
  }, [completed, disabled, onChange, haptics]);

  return (
    <motion.button
      onClick={handleClick}
      disabled={disabled}
      whileTap={{ scale: 0.85 }}
      whileHover={{ scale: 1.1 }}
      className={`
        relative flex-shrink-0 w-[26px] h-[26px] rounded-full border-2
        flex items-center justify-center transition-colors duration-300
        ${completed
          ? 'bg-[var(--az-success)] border-[var(--az-success)] shadow-[0_0_16px_var(--az-success-glow)]'
          : 'border-[var(--az-border-strong)] hover:border-[var(--az-accent)] hover:shadow-[0_0_12px_var(--az-accent-glow)]'
        }
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
      `}
      aria-label={completed ? 'Mark incomplete' : 'Mark complete'}
    >
      <AnimatePresence>
        {completed && (
          <motion.svg
            key="check"
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 45 }}
            transition={springs.bouncy}
            className="w-3.5 h-3.5 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </motion.svg>
        )}
      </AnimatePresence>
    </motion.button>
  );
});

const PriorityBar = memo(function PriorityBar({ priority, completed }: { priority: string; completed: boolean }) {
  const p = PRIORITIES[priority as keyof typeof PRIORITIES];
  if (!p) return null;
  return (
    <motion.div
      className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full"
      style={{
        background: completed
          ? `linear-gradient(180deg, ${p.accentColor}40, transparent)`
          : p.accentColor,
        boxShadow: completed ? 'none' : `0 0 10px ${p.accentColor}60`,
      }}
      animate={{
        opacity: completed ? 0.5 : 1,
        scaleY: completed ? 0.8 : 1,
      }}
      transition={{ duration: 0.3 }}
    />
  );
});

const SubtaskRing = memo(function SubtaskRing({ subtasks }: { subtasks?: Subtask[] }) {
  if (!subtasks?.length) return null;
  const completed = subtasks.filter((s) => s.completed).length;
  const pct = completed / subtasks.length;
  const circumference = 2 * Math.PI * 8;
  const strokeDashoffset = circumference * (1 - pct);

  return (
    <div className="flex items-center gap-1.5">
      <svg className="w-5 h-5" viewBox="0 0 22 22">
        <circle
          cx="11" cy="11" r="8"
          fill="none"
          stroke="var(--az-surface-3)"
          strokeWidth="2"
        />
        <motion.circle
          cx="11" cy="11" r="8"
          fill="none"
          stroke="var(--az-accent)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          transform="rotate(-90 11 11)"
        />
      </svg>
      <motion.span
        className="text-[11px] font-semibold text-[var(--az-text-3)]"
        key={completed}
        initial={{ scale: 1.3, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={springs.snappy}
      >
        {completed}/{subtasks.length}
      </motion.span>
    </div>
  );
});

const TimeBadge = memo(function TimeBadge({ estimate, actual }: { estimate?: number; actual?: number }) {
  if (!estimate && !actual) return null;
  const display = actual ? `${actual}m` : `${estimate}m`;
  const color = actual && estimate && actual > estimate ? 'var(--az-warn)' : 'var(--az-text-3)';
  const pct = estimate && actual ? Math.min(actual / estimate, 1.5) : 0;

  return (
    <span className="flex items-center gap-1.5 text-[11px]" style={{ color }}>
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
      <span>{display}</span>
      {actual && estimate && (
        <div className="w-12 h-1.5 rounded-full bg-[var(--az-surface-3)] overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: pct > 1 ? 'var(--az-warn)' : 'var(--az-accent)',
              transformOrigin: 'left',
            }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: Math.min(pct, 1) }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
      )}
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

// ─── Main component ───

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
  const [swipeX, setSwipeX] = useState(0);
  const [showSwipeIndicator, setShowSwipeIndicator] = useState<'complete' | 'archive' | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const haptics = useHaptics();
  const swipeThresholdReached = useRef(false);

  const canComplete = useTaskStore((s) => s.canComplete);
  const toggleSelect = useTaskStore((s) => s.toggleSelect);
  const selectedIds = useTaskStore((s) => s.selectedIds);
  const isSelectionMode = useTaskStore((s) => s.isSelectionMode);
  const archiveTask = useTaskStore((s) => s.archiveTask);
  const isSelected = selectedIds.includes(task.id);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pri = PRIORITIES[task.priority];
  const cat = CATEGORIES[task.category];
  const dueOverdue = task.dueDate && isDateOverdue(task.dueDate) && !task.completed;
  const blocked = !canComplete(task.id);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (isSelectionMode) {
        e.preventDefault();
        e.stopPropagation();
        haptics.tap();
        toggleSelect(task.id);
        return;
      }
      if (e.target instanceof HTMLElement && e.target.closest('button')) return;
      if (onOpenDetails) {
        haptics.impact();
        onOpenDetails(task);
      }
    },
    [isSelectionMode, task.id, toggleSelect, onOpenDetails, task, haptics]
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      haptics.heavy();
      if (onContextMenu) onContextMenu(e, task);
    },
    [onContextMenu, task, haptics]
  );

  const createRipple = useCallback((e: React.MouseEvent) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    setRipple({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setTimeout(() => setRipple(null), 600);
  }, []);

  // ── Premium Touch Gestures ──

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (isSelectionMode || task.status === 'archived') return;
    const touch = e.touches[0];
    if (!touch) return;
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    setSwipeX(0);
    setShowSwipeIndicator(null);
    swipeThresholdReached.current = false;

    longPressTimer.current = setTimeout(() => {
      haptics.longPress();
      if (onContextMenu) {
        onContextMenu(e as unknown as React.MouseEvent, task);
      }
    }, 500);
  }, [isSelectionMode, task, haptics, onContextMenu]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current || isSelectionMode || task.status === 'archived') return;
    const touch = e.touches[0];
    if (!touch) return;

    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;

    if (Math.abs(dy) > Math.abs(dx) * 1.5) {
      setSwipeX(0);
      setShowSwipeIndicator(null);
      return;
    }

    const resistance = Math.abs(dx) > 60 ? 0.3 : 1;
    const clampedDx = dx * resistance;
    setSwipeX(clampedDx);

    if (Math.abs(dx) > 80 && !swipeThresholdReached.current) {
      swipeThresholdReached.current = true;
      haptics.swipeThreshold();
    }

    if (dx > 60) {
      setShowSwipeIndicator('complete');
    } else if (dx < -60) {
      setShowSwipeIndicator('archive');
    } else {
      setShowSwipeIndicator(null);
    }
  }, [isSelectionMode, task, haptics]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    if (!touchStartRef.current || isSelectionMode || task.status === 'archived') return;
    const touch = e.changedTouches[0];
    if (!touch) return;

    const dx = touch.clientX - touchStartRef.current.x;
    touchStartRef.current = null;

    if (dx > 80) {
      haptics.success();
      onToggle(task.id);
    } else if (dx < -80) {
      haptics.heavy();
      archiveTask(task.id);
    }

    setSwipeX(0);
    setShowSwipeIndicator(null);
    swipeThresholdReached.current = false;
  }, [isSelectionMode, task, onToggle, archiveTask, haptics]);

  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => setIsHovered(false), []);

  return (
    <motion.div
      ref={cardRef}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={createRipple}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick(e as unknown as React.MouseEvent);
        }
      }}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{
        opacity: 1,
        y: 0,
        x: swipeX,
        scale: isDragging ? 0.98 : 1,
        rotate: isDragging ? 1 : 0,
      }}
      exit={{ opacity: 0, y: -10, transition: { duration: 0.15 } }}
      transition={{
        ...springs.gentle,
        delay: index * 0.03,
      }}
      whileHover={!task.completed ? { y: -2, transition: { duration: 0.2 } } : undefined}
      whileTap={{ scale: 0.99 }}
      className={`
        group relative flex items-start gap-3 px-4 py-3.5 rounded-[var(--az-radius-lg)]
        border transition-colors duration-300 cursor-pointer select-none overflow-hidden
        ${isDragging
          ? 'opacity-60 shadow-[var(--az-shadow-lg)] z-50'
          : 'opacity-100'
        }
        ${task.completed
          ? 'bg-[var(--az-surface-1)]/60 border-[var(--az-border)]'
          : 'bg-[var(--az-surface-1)] border-[var(--az-border)]'
        }
        ${isHovered && !task.completed
          ? 'border-[var(--az-border-hover)] shadow-[var(--az-shadow-md)]'
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
    >
      {/* Swipe Indicators */}
      <AnimatePresence>
        {showSwipeIndicator === 'complete' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-[var(--az-success)]"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-[13px] font-bold">Complete</span>
          </motion.div>
        )}
        {showSwipeIndicator === 'archive' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-[var(--az-danger)]"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8" />
            </svg>
            <span className="text-[13px] font-bold">Archive</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ripple effect */}
      {ripple && (
        <motion.span
          initial={{ scale: 0, opacity: 0.3 }}
          animate={{ scale: 4, opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="absolute rounded-full bg-[var(--az-accent)] opacity-20 pointer-events-none"
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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 rounded-[var(--az-radius-lg)] pointer-events-none"
          style={{
            background: `radial-gradient(600px circle at 50% 50%, ${pri?.accentColor}08, transparent 40%)`,
          }}
        />
      )}

      {/* Priority bar */}
      <PriorityBar priority={task.priority} completed={task.completed} />

      {/* Selection checkbox (multi-select mode) */}
      {isSelectionMode && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex-shrink-0 pt-0.5"
        >
          <motion.div
            whileTap={{ scale: 0.85 }}
            className={`
              w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors cursor-pointer
              ${isSelected
                ? 'bg-[var(--az-accent)] border-[var(--az-accent)]'
                : 'border-[var(--az-border-strong)] group-hover:border-[var(--az-text-3)]'
              }
            `}
            onClick={(e) => {
              e.stopPropagation();
              haptics.tap();
              toggleSelect(task.id);
            }}
          >
            <AnimatePresence>
              {isSelected && (
                <motion.svg
                  key="sel-check"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={springs.snappy}
                  className="w-3 h-3 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </motion.svg>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
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
          <motion.h3
            layout
            className={`
              text-[15px] font-semibold leading-snug
              ${task.completed
                ? 'text-[var(--az-text-3)] line-through decoration-[var(--az-text-4)]'
                : 'text-[var(--az-text-1)]'
              }
            `}
          >
            {task.title}
          </motion.h3>

          {/* Drag handle */}
          {dragHandleProps && !isSelectionMode && (
            <div
              {...dragHandleProps}
              className="flex-shrink-0 opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-1 -mr-1 -mt-1"
              onMouseDown={() => haptics.dragStart()}
            >
              <svg className="w-4 h-4 text-[var(--az-text-3)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M9 6h.01M9 12h.01M9 18h.01M15 6h.01M15 12h.01M15 18h.01" strokeLinecap="round" />
              </svg>
            </div>
          )}
        </div>

        {/* Description */}
        {task.description && !task.completed && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-1 text-[13px] text-[var(--az-text-2)] leading-relaxed line-clamp-2"
          >
            {task.description}
          </motion.p>
        )}

        {/* Metadata row */}
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          {/* Priority badge */}
          {task.priority !== 'medium' && (
            <motion.span
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border"
              style={{
                color: pri?.textColor,
                background: pri?.bgColor,
                borderColor: pri?.borderColor,
              }}
            >
              {pri?.label}
            </motion.span>
          )}

          {/* Category badge */}
          {cat && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] text-[var(--az-text-2)] bg-[var(--az-surface-2)] border border-[var(--az-border)]">
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
            </span>
          )}

          {/* Due date */}
          {task.dueDate && (
            <motion.span
              whileHover={{ scale: 1.05 }}
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
            </motion.span>
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
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] text-[var(--az-warn)] bg-[var(--az-warn-bg)] border border-[var(--az-warn-border)]"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M12 15v.01M12 12a4 4 0 00-4-4h0a4 4 0 00-4 4v2h8z" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              Blocked
            </motion.span>
          )}
        </div>

        {/* Tags */}
        {task.tags && task.tags.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-2 flex flex-wrap gap-1.5"
          >
            {task.tags.map((tag) => (
              <TagPill key={tag} tag={tag} />
            ))}
          </motion.div>
        )}

        {/* Subtask progress */}
        {task.subtasks && task.subtasks.length > 0 && (
          <div className="mt-2">
            <SubtaskRing subtasks={task.subtasks} />
          </div>
        )}

        {/* Bottom progress bar for completed */}
        {task.completed && (
          <div className="mt-2 h-[2px] rounded-full bg-[var(--az-surface-3)] overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-[var(--az-success)]"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              style={{ transformOrigin: 'left' }}
            />
          </div>
        )}
      </div>

      {/* Action buttons */}
      {!isSelectionMode && (
        <div className="flex items-center gap-1 flex-shrink-0">
          {onOpenDetails && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                haptics.tap();
                onOpenDetails(task);
              }}
              className="p-2 rounded-[var(--az-radius-md)] opacity-0 group-hover:opacity-100 text-[var(--az-text-3)] hover:text-[var(--az-accent)] hover:bg-[var(--az-accent-bg)] transition-all"
              aria-label="Open task details"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </motion.button>
          )}

          {!task.completed && onFocus && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                haptics.impact();
                onFocus(task);
              }}
              className="p-2 rounded-[var(--az-radius-md)] opacity-0 group-hover:opacity-100 text-[var(--az-accent)] hover:bg-[var(--az-accent-bg)] transition-all"
              aria-label="Focus on this task"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </motion.button>
          )}
        </div>
      )}
    </motion.div>
  );
}

export default memo(TaskCardComponent);