export type TaskPriority = "critical" | "high" | "medium" | "low";

export type TaskStatus =
  | "inbox" | "today" | "in-progress" | "upcoming"
  | "completed" | "overdue" | "archived";

export type TaskCategory =
  | "work" | "study" | "health" | "personal" | "finance" | "prayer";

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

export type CreateTaskInput = Omit<Task, "id" | "createdAt" | "updatedAt">;
