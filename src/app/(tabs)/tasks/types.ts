export type TaskPriority = "critical" | "high" | "medium" | "low";

export type TaskStatus =
  | "inbox"
  | "today"
  | "in-progress"
  | "upcoming"
  | "completed"
  | "overdue"
  | "archived";

export type TaskCategory =
  | "work"
  | "study"
  | "health"
  | "personal"
  | "finance"
  | "prayer";

export type EnergyLevel = "low" | "medium" | "high";

export type Subtask = {
  id: string;
  title: string;
  completed: boolean;
};

export type Task = {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  category: TaskCategory;
  completed: boolean;
  dueDate?: string;
  energyLevel?: EnergyLevel;
  tags?: string[];
  subtasks?: Subtask[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
  completedDates: string[];
  recurring: "none" | "daily" | "weekly" | "monthly";
};

// FIX: Added missing CreateTaskInput type used by addTask() in store
// Previously addTask() called with partial object had no type safety — silent runtime field gaps
export type CreateTaskInput = Omit<Task, "id" | "createdAt" | "updatedAt">;
