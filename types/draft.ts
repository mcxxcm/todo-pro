import type { ExtractedTask } from "./extraction";
import type { SourceItemType } from "./source";

export type TaskDraftStatus = "pending" | "accepted" | "rejected" | "edited";

export interface TaskDraft extends ExtractedTask {
  sourceId?: string;
  sourceType?: SourceItemType;
  status: TaskDraftStatus;
  createdAt: string;
  updatedAt: string;
  acceptedTaskId?: string;
}

export type TaskDraftInput = Omit<
  TaskDraft,
  "id" | "status" | "createdAt" | "updatedAt" | "acceptedTaskId"
> & {
  id?: string;
  status?: TaskDraftStatus;
};

export type TaskDraftUpdateInput = Partial<
  Pick<
    TaskDraft,
    | "title"
    | "dueText"
    | "dueAt"
    | "timeStatus"
    | "notes"
    | "confidence"
    | "status"
    | "acceptedTaskId"
  >
>;
