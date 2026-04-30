import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Task } from '@/lib/types'
import { generateId } from '@/lib/utils/helpers'

interface TaskState {
  tasks: Task[]
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'streak' | 'completedDates'>) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
  toggleComplete: (id: string) => void
  getTodaysTasks: () => Task[]
}

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      tasks: [],

      addTask: (task) => set((state) => ({
        tasks: [...state.tasks, {
          ...task,
          id: generateId(),
          createdAt: new Date().toISOString(),
          streak: 0,
          completedDates: [],
        }],
      })),

      updateTask: (id, updates) => set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
      })),

      deleteTask: (id) => set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== id),
      })),

      toggleComplete: (id) => set((state) => {
        const today = new Date().toISOString().split('T')[0]
        return {
          tasks: state.tasks.map((t) => {
            if (t.id !== id) return t
            const completed = !t.completed
            const completedDates = completed
              ? [...new Set([...t.completedDates, today])]
              : t.completedDates.filter((d) => d !== today)
            return { ...t, completed, completedDates }
          }),
        }
      }),

      getTodaysTasks: () => {
        const today = new Date().toISOString().split('T')[0]
        return get().tasks.filter(
          (t) => t.recurring !== 'none' || t.dueDate === today || t.createdAt.startsWith(today)
        )
      },
    }),
    { name: 'amar-zone-tasks' }
  )
)
