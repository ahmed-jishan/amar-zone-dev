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

export type TaskReminder = {
  id: string;
  remindAt: string; // ISO
  message?: string;
  triggered: boolean;
};

export type TaskDependency = {
  taskId: string;
  type: "blocks" | "requires";
};

export type TimeSession = {
  id: string;
  startedAt: string;
  endedAt?: string;
  durationSeconds: number;
  type: "focus" | "pomodoro" | "deep_work";
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
  // ── Premium additions ──
  position: number; // for drag-and-drop ordering
  timeEstimate?: number; // minutes
  actualTime?: number; // minutes (accumulated from sessions)
  sessions: TimeSession[];
  reminders: TaskReminder[];
  dependencies: TaskDependency[];
  goalId?: string; // link to a goal
  archivedAt?: string;
  selected?: boolean; // transient, not persisted
};

export type CreateTaskInput = Omit<
  Task,
  | "id"
  | "createdAt"
  | "updatedAt"
  | "completedDates"
  | "streak"
  | "position"
  | "sessions"
  | "reminders"
  | "dependencies"
  | "archivedAt"
  | "selected"
> & {
  position?: number;
};

export type SortMode =
  | "manual"
  | "priority"
  | "dueDate"
  | "created"
  | "energy"
  | "title";

export type ViewMode = "list" | "board" | "timeline";

export type FilterKey = "all" | "today" | "high" | "completed" | "overdue" | "inbox" | "in-progress";
