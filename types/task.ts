import type { SourceItemType } from "./source";

export type TaskPriority = "none" | "low" | "medium" | "high";

export type TimeConfidence = "high" | "medium" | "low" | "none";

export type TaskStatus = "todo" | "done" | "archived";

export type TaskProvider = "local" | "todoist" | "reminders" | "calendar";

export type TimeStatus = "none" | "needs_review" | "confirmed";

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
>;
