import type { TaskExportPayload } from "./export";
import type { NormalizedTask, TaskProvider } from "./task";

export type SyncOperation = "export_task";

export type SyncRecordStatus = "pending" | "synced" | "failed" | "skipped";

export interface SyncRecord {
  id: string;
  taskId: string;
  provider: TaskProvider;
  operation: SyncOperation;
  status: SyncRecordStatus;
  externalId?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SyncTaskResult {
  status: SyncRecordStatus;
  externalId?: string;
  error?: string;
}

export interface TaskSyncProvider {
  provider: TaskProvider;
  label: string;
  available: boolean;
  syncTask(
    task: NormalizedTask,
    payload: TaskExportPayload,
  ): Promise<SyncTaskResult>;
}
