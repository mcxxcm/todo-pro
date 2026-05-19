export type TaskPriority = "none" | "low" | "medium" | "high";

export type TimeConfidence = "high" | "medium" | "low" | "none";

export type TaskStatus = "todo" | "done" | "archived";

export type TaskProvider = "local" | "todoist" | "reminders" | "calendar";

export interface NormalizedTask {
  id: string;
  title: string;
  notes?: string;
  sourceText?: string;
  dueAt?: string;
  allDay?: boolean;
  timeText?: string;
  timeConfidence: TimeConfidence;
  needsConfirmation: boolean;
  priority: TaskPriority;
  tags: string[];
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
  provider: TaskProvider;
  externalId?: string;
}
