'use client';

import { useMemo, useState } from 'react';
import { Task } from '../../types';
import { useTaskStore } from '@/lib/store/taskStore';

interface Props {
  tasks: Task[];
}

type ConfirmState = {
  ids: string[];
} | null;

export default function ArchivedTasks({ tasks }: Props) {
  const unarchiveTask = useTaskStore((s) => s.unarchiveTask);
  const deleteTask = useTaskStore((s) => s.deleteTask);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirm, setConfirm] = useState<ConfirmState>(null);

  const grouped = useMemo(() => {
    const map = new Map<string, Task[]>();
    tasks.forEach((task) => {
      const dateStr = task.archivedAt || task.updatedAt || task.createdAt;
      const date = new Date(dateStr);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const list = map.get(key) || [];
      list.push(task);
      map.set(key, list);
    });

    const entries = Array.from(map.entries())
      .map(([key, list]) => ({
        key,
        label: new Date(`${key}-01T00:00:00`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        tasks: list.sort((a, b) => {
          const ad = Date.parse(a.archivedAt || a.updatedAt || a.createdAt);
          const bd = Date.parse(b.archivedAt || b.updatedAt || b.createdAt);
          return bd - ad;
        }),
      }))
      .sort((a, b) => b.key.localeCompare(a.key));

    return entries;
  }, [tasks]);

  const allIds = useMemo(() => tasks.map((t) => t.id), [tasks]);
  const hasSelection = selectedIds.length > 0;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const selectAll = () => setSelectedIds(allIds);
  const clearSelection = () => setSelectedIds([]);

  const handleRestore = (ids: string[]) => {
    ids.forEach((id) => unarchiveTask(id));
    clearSelection();
  };

  const handleDelete = (ids: string[]) => {
    ids.forEach((id) => deleteTask(id));
    setConfirm(null);
    clearSelection();
  };

  const exportArchived = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      count: tasks.length,
      tasks,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `archived-tasks-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (tasks.length === 0) {
    return (
      <div className="az-archived-empty">
        <div className="az-archived-empty-title">No archived tasks</div>
        <div className="az-archived-empty-sub">Archive tasks to keep your main list clean.</div>
      </div>
    );
  }

  return (
    <div className="az-archived">
      <div className="az-archived-info-block az-glass">
        <div className="az-archived-info-title">Archived keeps finished work out of your active flow.</div>
        <div className="az-archived-info-text">
          Restore anything you need again, export a record, or permanently delete tasks when you are sure.
        </div>
      </div>

      <div className="az-archived-toolbar az-glass">
        <div className="az-archived-title">
          <span className="az-archived-label">Archived</span>
          <span className="az-archived-badge">{tasks.length}</span>
        </div>
        <div className="az-archived-actions">
          <button className="az-restore-btn az-restore-btn--compact" onClick={() => handleRestore(allIds)} aria-label="Restore all archived tasks">
            <RestoreAllIcon />
            Restore all
          </button>
          <button className="az-ghost-btn" onClick={exportArchived}>Export</button>
          <button className="az-ghost-btn" onClick={selectAll}>Select all</button>
          {hasSelection && (
            <button className="az-ghost-btn" onClick={clearSelection}>Clear</button>
          )}
          {hasSelection && (
            <button className="az-restore-btn" onClick={() => handleRestore(selectedIds)}>Restore selected</button>
          )}
          {hasSelection && (
            <button className="az-delete-btn" onClick={() => setConfirm({ ids: selectedIds })}>Delete forever</button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {grouped.map((group) => (
          <div key={group.key} className="az-archived-group">
            <div className="az-archived-group-title">{group.label}</div>
            <div className="space-y-2">
              {group.tasks.map((task) => {
                const isSelected = selectedIds.includes(task.id);
                return (
                  <div key={task.id} className="az-archived-item">
                    <label className="az-archived-check">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(task.id)}
                      />
                      <span />
                    </label>
                    <div className="az-archived-info">
                      <div className="az-archived-name">{task.title}</div>
                      <div className="az-archived-meta">
                        {task.category} • {task.priority}
                      </div>
                    </div>
                    <div className="az-archived-row-actions">
                      <button className="az-restore-btn" onClick={() => handleRestore([task.id])}>Restore</button>
                      <button className="az-delete-btn" onClick={() => setConfirm({ ids: [task.id] })}>Delete</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {confirm && (
        <div className="az-confirm-backdrop" onClick={() => setConfirm(null)}>
          <div className="az-confirm-card" onClick={(e) => e.stopPropagation()}>
            <div className="az-confirm-title">Delete forever? This cannot be undone.</div>
            <div className="az-confirm-actions">
              <button className="az-ghost-btn" onClick={() => setConfirm(null)}>Cancel</button>
              <button className="az-delete-btn" onClick={() => handleDelete(confirm.ids)}>Delete Forever</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RestoreAllIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4}>
      <path d="M3 10a9 9 0 102.64-6.36" strokeLinecap="round" />
      <path d="M3 4v6h6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 8v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
