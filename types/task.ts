import type { SourceItemType } from "./source";

export type TaskPriority = "none" | "low" | "medium" | "high";

export type TimeConfidence = "high" | "medium" | "low" | "none";

export type TaskStatus = "todo" | "done" | "archived";

export type TaskProvider = "local" | "todoist" | "reminders" | "calendar";

export type TimeStatus = "none" | "needs_review" | "confirmed";

export type RecurrenceFrequency = "daily" | "weekly" | "monthly" | "yearly";

export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  interval: number;
  endDate?: string;
  count?: number;
  daysOfWeek?: number[];
}

export interface SubTask {
  id: string;
  title: string;
  status: TaskStatus;
  estimatedMinutes?: number;
  createdAt: string;
  updatedAt: string;
}

export interface FocusSession {
  startedAt: string;
  endedAt?: string;
  durationMinutes: number;
}

export interface NormalizedTask {
  id: string;
  title: string;
  notes?: string;
  sourceId?: string;
  sourceType?: SourceItemType;
  sourceText?: string;
  dueAt?: string;
  dueText?: string;
  allDay?: boolean;
  timeText?: string;
  timeConfidence: TimeConfidence;
  timeStatus?: TimeStatus;
  needsConfirmation: boolean;
  priority: TaskPriority;
  tags: string[];
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
  provider: TaskProvider;
  externalId?: string;
  // v2新增字段
  subtasks?: SubTask[];
  recurrence?: RecurrenceRule;
  estimatedMinutes?: number;
  actualMinutes?: number;
  completedAt?: string;
  xp?: number;
  focusSessions?: FocusSession[];
}

export type TaskUpdateInput = Partial<
  Pick<
    NormalizedTask,
    | "title"
    | "notes"
    | "sourceId"
    | "sourceType"
    | "sourceText"
    | "dueAt"
    | "dueText"
    | "timeStatus"
    | "timeConfidence"
    | "needsConfirmation"
    | "priority"
    | "tags"
    | "status"
  >
> & {
  subtasks?: SubTask[];
  recurrence?: RecurrenceRule;
  estimatedMinutes?: number;
  actualMinutes?: number;
  completedAt?: string;
  xp?: number;
  focusSessions?: FocusSession[];
};
