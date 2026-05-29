import type { SourceItemType } from "./source";
import type { TaskPriority, TaskStatus } from "./task";

export interface TaskExportPayload {
  title: string;
  notes?: string;
  dueAt?: string;
  dueText?: string;
  priority: TaskPriority;
  status: TaskStatus;
  tags: string[];
  source?: {
    id?: string;
    type?: SourceItemType;
    text?: string;
  };
}

