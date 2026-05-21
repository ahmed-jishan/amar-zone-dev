'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Task } from '../../types';
import { useTaskStore } from '@/lib/store/taskStore';

interface Props {
  task: Task | null;
  position: { x: number; y: number } | null;
  onClose: () => void;
  onOpenDetails?: (task: Task) => void;
  onFocus?: (task: Task) => void;
}

export default function ContextMenu({ task, position, onClose, onOpenDetails, onFocus }: Props) {
  const menuRef = useRef<HTMLDivElement>(null);
  const deleteTask = useTaskStore((s) => s.deleteTask);
  const toggleComplete = useTaskStore((s) => s.toggleComplete);
  const archiveTask = useTaskStore((s) => s.archiveTask);
  const updateTask = useTaskStore((s) => s.updateTask);
  const toggleSelect = useTaskStore((s) => s.toggleSelect);
  const setSelectionMode = useTaskStore((s) => s.setSelectionMode);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (position) {
      document.addEventListener('click', handler);
      document.addEventListener('scroll', onClose, { once: true });
    }
    return () => {
      document.removeEventListener('click', handler);
      document.removeEventListener('scroll', onClose);
    };
  }, [position, onClose]);

  if (!task || !position) return null;

  const menuStyle: React.CSSProperties = {
    position: 'fixed',
    left: Math.min(position.x, window.innerWidth - 220),
    top: Math.min(position.y, window.innerHeight - 320),
    zIndex: 100,
  };

  const itemClass = `
    w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-[var(--az-text-1)]
    hover:bg-[var(--az-surface-hover)] transition-colors text-left rounded-md
  `;

  return (
    <div
      ref={menuRef}
      style={menuStyle}
      className="w-[200px] az-glass-strong rounded-[var(--az-radius-xl)] shadow-[var(--az-shadow-lg)] border border-[var(--az-glass-border)] overflow-hidden animate-[az-scale-in_150ms_ease-out]"
    >
      <div className="py-1">
        <button
          onClick={() => {
            toggleComplete(task.id);
            onClose();
          }}
          className={itemClass}
        >
          <svg className="w-4 h-4 text-[var(--az-success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M5 13l4 4L19 7" />
          </svg>
          {task.completed ? 'Mark Incomplete' : 'Mark Complete'}
        </button>

        <button
          onClick={() => {
            onOpenDetails?.(task);
            onClose();
          }}
          className={itemClass}
        >
          <svg className="w-4 h-4 text-[var(--az-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          View Details
        </button>

        {!task.completed && onFocus && (
          <button
            onClick={() => {
              onFocus(task);
              onClose();
            }}
            className={itemClass}
          >
            <svg className="w-4 h-4 text-[var(--az-warn)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Focus Mode
          </button>
        )}

        <div className="mx-3 my-1 h-px bg-[var(--az-border)]" />

        <div className="relative group/menu">
          <button className={itemClass}>
            <svg className="w-4 h-4 text-[var(--az-text-3)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Set Priority
            <svg className="w-3 h-3 ml-auto text-[var(--az-text-3)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <div className="absolute left-full top-0 ml-1 hidden group-hover/menu:block w-[140px] az-glass-strong rounded-[var(--az-radius-lg)] shadow-[var(--az-shadow-lg)] border border-[var(--az-glass-border)] overflow-hidden py-1">
            {(['critical', 'high', 'medium', 'low'] as const).map((p) => (
              <button
                key={p}
                onClick={() => {
                  updateTask(task.id, { priority: p });
                  onClose();
                }}
                className={`${itemClass} ${task.priority === p ? 'bg-[var(--az-accent-bg)] text-[var(--az-accent)]' : ''}`}
              >
                <div className={`w-2 h-2 rounded-full ${
                  p === 'critical' ? 'bg-[var(--az-danger)]' :
                  p === 'high' ? 'bg-[var(--az-warn)]' :
                  p === 'medium' ? 'bg-[#eab308]' :
                  'bg-[var(--az-success)]'
                }`} />
                <span className="capitalize">{p}</span>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => {
            updateTask(task.id, { status: task.status === 'today' ? 'inbox' : 'today' });
            onClose();
          }}
          className={itemClass}
        >
          <svg className="w-4 h-4 text-[var(--az-text-3)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          {task.status === 'today' ? 'Remove from Today' : 'Add to Today'}
        </button>

        <div className="mx-3 my-1 h-px bg-[var(--az-border)]" />

        <button
          onClick={() => {
            toggleSelect(task.id);
            setSelectionMode(true);
            onClose();
          }}
          className={itemClass}
        >
          <svg className="w-4 h-4 text-[var(--az-text-3)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Multi-Select
        </button>

        <button
          onClick={() => {
            archiveTask(task.id);
            onClose();
          }}
          className={itemClass}
        >
          <svg className="w-4 h-4 text-[var(--az-text-3)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8" />
          </svg>
          Archive
        </button>

        <div className="mx-3 my-1 h-px bg-[var(--az-border)]" />

        <button
          onClick={() => {
            deleteTask(task.id);
            onClose();
          }}
          className={`${itemClass} text-[var(--az-danger)] hover:bg-[var(--az-danger-bg)]`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Delete
        </button>
      </div>
    </div>
  );
}
