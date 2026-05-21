import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Task, CreateTaskInput } from '@/app/(tabs)/tasks/types';
import { generateId } from '@/lib/utils/helpers';

export interface TaskState {
  tasks: Task[];
  focusedTask: Task | null;
  setFocusedTask: (task: Task | null) => void;
  addTask: (task: CreateTaskInput) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleComplete: (id: string) => void;
  toggleTask: (id: string) => void;
  getTodaysTasks: () => Task[];
}

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      tasks: [],
      focusedTask: null,
      setFocusedTask: (task) => set({ focusedTask: task }),

      addTask: (task) => set((state) => ({
        tasks: [
          ...state.tasks,
          {
            ...task,
            id: generateId(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            completedDates: [],
            position: task.position ?? Date.now(),
            sessions: [],
            reminders: [],
            dependencies: [],
          },
        ],
      })),

      updateTask: (id, updates) => set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
      })),

      deleteTask: (id) => set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== id),
      })),

      toggleComplete: (id) => set((state) => {
        const today = new Date().toISOString().split('T')[0];
        return {
          tasks: state.tasks.map((t) => {
            if (t.id !== id) return t;
            const completed = !t.completed;
            const completedDates = completed
              ? Array.from(new Set([...t.completedDates, today]))
              : t.completedDates.filter((d) => d !== today);
            return { ...t, completed, completedDates };
          }),
        };
      }),

      // alias used by tasks module
      toggleTask: (id) => set((state) => {
        const today = new Date().toISOString().split('T')[0];
        return {
          tasks: state.tasks.map((t) => {
            if (t.id !== id) return t;
            const completed = !t.completed;
            const completedDates = completed
              ? Array.from(new Set([...t.completedDates, today]))
              : t.completedDates.filter((d) => d !== today);
            return { ...t, completed, completedDates };
          }),
        };
      }),

      getTodaysTasks: () => {
        const today = new Date().toISOString().split('T')[0];
        return get().tasks.filter(
          (t) => t.recurring !== 'none' || t.dueDate === today || t.createdAt.startsWith(today)
        );
      },
    }),
    { name: 'amar-zone-tasks' }
  )
);
