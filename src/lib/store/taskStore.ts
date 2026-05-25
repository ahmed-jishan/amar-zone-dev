import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Task, CreateTaskInput, SortMode, ViewMode, TimeSession, TaskReminder } from '@/app/(tabs)/tasks/types';
import { generateId } from '@/lib/utils/helpers';

// ─── Undo Action Types ───
type UndoAction =
  | { type: 'delete'; task: Task }
  | { type: 'update'; id: string; previous: Partial<Task> }
  | { type: 'bulkDelete'; tasks: Task[] }
  | { type: 'bulkUpdate'; ids: string[]; previous: Partial<Task>[] };

export interface TaskState {
  tasks: Task[];
  focusedTask: Task | null;
  setFocusedTask: (task: Task | null) => void;

  // ── Existing Core ──
  addTask: (task: CreateTaskInput) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleComplete: (id: string) => void;
  toggleTask: (id: string) => void;
  getTodaysTasks: () => Task[];

  // ── Premium: Undo ──
  undoStack: UndoAction[];
  canUndo: boolean;
  undo: () => void;

  // ── Premium: Multi-Select ──
  selectedIds: string[];
  toggleSelect: (id: string) => void;
  selectAll: (ids: string[]) => void;
  clearSelection: () => void;
  isSelectionMode: boolean;
  setSelectionMode: (v: boolean) => void;

  // ── Premium: Search & Sort ──
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  sortMode: SortMode;
  setSortMode: (m: SortMode) => void;
  viewMode: ViewMode;
  setViewMode: (m: ViewMode) => void;

  // ── Premium: Reorder ──
  reorderTasks: (orderedIds: string[]) => void;

  // ── Premium: Bulk ──
  bulkDelete: () => void;
  bulkComplete: (completed: boolean) => void;
  bulkArchive: () => void;
  bulkSetPriority: (priority: Task['priority']) => void;
  bulkSetStatus: (status: Task['status']) => void;
  bulkSetDueDate: (dueDate: string | undefined) => void;
  archiveCompletedOlderThan: (days: number) => void;

  // ── Premium: Archive ──
  archiveTask: (id: string) => void;
  unarchiveTask: (id: string) => void;

  // ── Premium: Time Tracking ──
  startSession: (taskId: string, type: TimeSession['type']) => string; // returns sessionId
  endSession: (taskId: string, sessionId: string) => void;

  // ── Premium: Reminders ──
  addReminder: (taskId: string, reminder: Omit<TaskReminder, 'id' | 'triggered'>) => void;
  removeReminder: (taskId: string, reminderId: string) => void;
  markReminderTriggered: (taskId: string, reminderId: string) => void;

  // ── Premium: Dependencies ──
  canComplete: (taskId: string) => boolean;
  getBlockedTasks: (taskId: string) => Task[];
}

const initialTaskState = (task: CreateTaskInput): Omit<Task, 'id' | 'createdAt' | 'updatedAt'> => ({
  completedDates: [],
  position: task.position ?? Date.now(),
  sessions: [],
  reminders: [],
  dependencies: [],
  ...task,
});

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      tasks: [],
      focusedTask: null,
      undoStack: [],
      canUndo: false,
      selectedIds: [],
      isSelectionMode: false,
      searchQuery: '',
      sortMode: 'manual',
      viewMode: 'list',

      setFocusedTask: (task) => set({ focusedTask: task }),

      addTask: (task) =>
        set((state) => ({
          tasks: [
            ...state.tasks,
            {
              ...initialTaskState(task),
              id: generateId(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            } as Task,
          ],
        })),

      updateTask: (id, updates) =>
        set((state) => {
          const previous = state.tasks.find((t) => t.id === id);
          if (!previous) return state;
          const action: UndoAction = { type: 'update', id, previous: {} };
          // Store only changed fields for undo
          (Object.keys(updates) as Array<keyof Task>).forEach((key) => {
            if (key in previous) {
              (action.previous as Record<string, unknown>)[key] = previous[key];
            }
          });
          return {
            tasks: state.tasks.map((t) =>
              t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
            ),
            undoStack: [action, ...state.undoStack].slice(0, 50),
            canUndo: true,
          };
        }),

      deleteTask: (id) =>
        set((state) => {
          const task = state.tasks.find((t) => t.id === id);
          if (!task) return state;
          const action: UndoAction = { type: 'delete', task };
          return {
            tasks: state.tasks.filter((t) => t.id !== id),
            undoStack: [action, ...state.undoStack].slice(0, 50),
            canUndo: true,
            selectedIds: state.selectedIds.filter((sid) => sid !== id),
          };
        }),

      toggleComplete: (id) =>
        set((state) => {
          const today = new Date().toISOString().split('T')[0];
          return {
            tasks: state.tasks.map((t) => {
              if (t.id !== id) return t;
              const completed = !t.completed;
              const completedDates = completed
                ? Array.from(new Set([...t.completedDates, today]))
                : t.completedDates.filter((d) => d !== today);
              return { ...t, completed, completedDates, updatedAt: new Date().toISOString() };
            }),
          };
        }),

      toggleTask: (id) =>
        set((state) => {
          const today = new Date().toISOString().split('T')[0];
          return {
            tasks: state.tasks.map((t) => {
              if (t.id !== id) return t;
              const completed = !t.completed;
              const completedDates = completed
                ? Array.from(new Set([...t.completedDates, today]))
                : t.completedDates.filter((d) => d !== today);
              return { ...t, completed, completedDates, updatedAt: new Date().toISOString() };
            }),
          };
        }),

      getTodaysTasks: () => {
        const today = new Date().toISOString().split('T')[0];
        return get().tasks.filter(
          (t) =>
            t.recurring !== 'none' || t.dueDate === today || t.createdAt.startsWith(today)
        );
      },

      // ── Undo ──
      undo: () =>
        set((state) => {
          const [action, ...rest] = state.undoStack;
          if (!action) return { canUndo: false };

          let newTasks = state.tasks;
          if (action.type === 'delete') {
            newTasks = [...state.tasks, action.task];
          } else if (action.type === 'update') {
            newTasks = state.tasks.map((t) =>
              t.id === action.id ? { ...t, ...action.previous, updatedAt: new Date().toISOString() } : t
            );
          } else if (action.type === 'bulkDelete') {
            newTasks = [...state.tasks, ...action.tasks];
          } else if (action.type === 'bulkUpdate') {
            newTasks = state.tasks.map((t) => {
              const idx = action.ids.indexOf(t.id);
              if (idx === -1) return t;
              return { ...t, ...action.previous[idx], updatedAt: new Date().toISOString() };
            });
          }

          return {
            tasks: newTasks,
            undoStack: rest,
            canUndo: rest.length > 0,
          };
        }),

      // ── Multi-Select ──
      toggleSelect: (id) =>
        set((state) => ({
          selectedIds: state.selectedIds.includes(id)
            ? state.selectedIds.filter((sid) => sid !== id)
            : [...state.selectedIds, id],
        })),

      selectAll: (ids) => set({ selectedIds: ids, isSelectionMode: true }),

      clearSelection: () => set({ selectedIds: [], isSelectionMode: false }),

      setSelectionMode: (v) => set({ isSelectionMode: v, selectedIds: v ? [] : [] }),

      // ── Search & Sort ──
      setSearchQuery: (q) => set({ searchQuery: q }),
      setSortMode: (m) => set({ sortMode: m }),
      setViewMode: (m) => set({ viewMode: m }),

      // ── Reorder ──
      reorderTasks: (orderedIds) =>
        set((state) => {
          const taskMap = new Map(state.tasks.map((t) => [t.id, t]));
          const reordered = orderedIds
            .map((id) => taskMap.get(id))
            .filter(Boolean) as Task[];
          const newTasks = reordered.map((t, i) => ({ ...t, position: i }));
          const remaining = state.tasks.filter((t) => !orderedIds.includes(t.id));
          return { tasks: [...newTasks, ...remaining] };
        }),

      // ── Bulk ──
      bulkDelete: () =>
        set((state) => {
          const toDelete = state.tasks.filter((t) => state.selectedIds.includes(t.id));
          const action: UndoAction = { type: 'bulkDelete', tasks: toDelete };
          return {
            tasks: state.tasks.filter((t) => !state.selectedIds.includes(t.id)),
            undoStack: [action, ...state.undoStack].slice(0, 50),
            canUndo: true,
            selectedIds: [],
            isSelectionMode: false,
          };
        }),

      bulkComplete: (completed) =>
        set((state) => {
          const today = new Date().toISOString().split('T')[0];
          const previous = state.tasks
            .filter((t) => state.selectedIds.includes(t.id))
            .map((t) => ({ completed: t.completed, completedDates: t.completedDates }));
          const action: UndoAction = { type: 'bulkUpdate', ids: [...state.selectedIds], previous };
          return {
            tasks: state.tasks.map((t) => {
              if (!state.selectedIds.includes(t.id)) return t;
              const completedDates = completed
                ? Array.from(new Set([...t.completedDates, today]))
                : t.completedDates.filter((d) => d !== today);
              return { ...t, completed, completedDates, updatedAt: new Date().toISOString() };
            }),
            undoStack: [action, ...state.undoStack].slice(0, 50),
            canUndo: true,
            selectedIds: [],
            isSelectionMode: false,
          };
        }),

      bulkArchive: () =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            state.selectedIds.includes(t.id)
              ? { ...t, status: 'archived' as const, archivedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
              : t
          ),
          selectedIds: [],
          isSelectionMode: false,
        })),

      bulkSetPriority: (priority) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            state.selectedIds.includes(t.id) ? { ...t, priority, updatedAt: new Date().toISOString() } : t
          ),
          selectedIds: [],
          isSelectionMode: false,
        })),

      bulkSetStatus: (status) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            state.selectedIds.includes(t.id) ? { ...t, status, updatedAt: new Date().toISOString() } : t
          ),
          selectedIds: [],
          isSelectionMode: false,
        })),

      bulkSetDueDate: (dueDate) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            state.selectedIds.includes(t.id) ? { ...t, dueDate, updatedAt: new Date().toISOString() } : t
          ),
          selectedIds: [],
          isSelectionMode: false,
        })),

      archiveCompletedOlderThan: (days) =>
        set((state) => {
          const now = Date.now()
          const cutoff = now - days * 24 * 60 * 60 * 1000
          return {
            tasks: state.tasks.map((t) => {
              if (t.status === 'archived' || !t.completed) return t
              const completedAt = t.completedAt || t.updatedAt || t.createdAt
              const completedTime = Date.parse(completedAt)
              if (!Number.isFinite(completedTime) || completedTime > cutoff) return t
              return { ...t, status: 'archived' as const, archivedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
            }),
          }
        }),

      // ── Archive ──
      archiveTask: (id) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id
              ? { ...t, status: 'archived' as const, archivedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
              : t
          ),
        })),

      unarchiveTask: (id) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id
              ? { ...t, status: 'inbox' as const, archivedAt: undefined, updatedAt: new Date().toISOString() }
              : t
          ),
        })),

      // ── Time Tracking ──
      startSession: (taskId, type) => {
        const sessionId = generateId();
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  sessions: [
                    ...t.sessions,
                    { id: sessionId, startedAt: new Date().toISOString(), durationSeconds: 0, type },
                  ],
                  updatedAt: new Date().toISOString(),
                }
              : t
          ),
        }));
        return sessionId;
      },

      endSession: (taskId, sessionId) =>
        set((state) => ({
          tasks: state.tasks.map((t) => {
            if (t.id !== taskId) return t;
            const now = new Date().toISOString();
            const sessions = t.sessions.map((s) =>
              s.id === sessionId
                ? { ...s, endedAt: now, durationSeconds: Math.floor((new Date(now).getTime() - new Date(s.startedAt).getTime()) / 1000) }
                : s
            );
            const actualTime = Math.floor(sessions.reduce((acc, s) => acc + (s.durationSeconds || 0), 0) / 60);
            return { ...t, sessions, actualTime, updatedAt: now };
          }),
        })),

      // ── Reminders ──
      addReminder: (taskId, reminder) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  reminders: [...t.reminders, { ...reminder, id: generateId(), triggered: false }],
                  updatedAt: new Date().toISOString(),
                }
              : t
          ),
        })),

      removeReminder: (taskId, reminderId) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId
              ? { ...t, reminders: t.reminders.filter((r) => r.id !== reminderId), updatedAt: new Date().toISOString() }
              : t
          ),
        })),

      markReminderTriggered: (taskId, reminderId) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  reminders: t.reminders.map((r) =>
                    r.id === reminderId ? { ...r, triggered: true } : r
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : t
          ),
        })),

      // ── Dependencies ──
      canComplete: (taskId) => {
        const task = get().tasks.find((t) => t.id === taskId);
        if (!task) return true;
        const required = Array.isArray(task.dependencies) ? task.dependencies.filter((d) => d.type === 'requires') : [];
        return required.every((d) => {
          const dep = get().tasks.find((t) => t.id === d.taskId);
          return dep?.completed ?? true;
        });
      },

      getBlockedTasks: (taskId) => {
        return get().tasks.filter((t) =>
          t.dependencies.some((d) => d.taskId === taskId && d.type === 'requires' && !t.completed)
        );
      },
    }),
    {
      name: 'selfsync-tasks',
      partialize: (state) => ({
        tasks: state.tasks,
        focusedTask: state.focusedTask,
        sortMode: state.sortMode,
        viewMode: state.viewMode,
        // Don't persist transient UI state
      }),
    }
  )
);
