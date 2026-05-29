import type {
  SyncOperation,
  SyncRecord,
  SyncRecordStatus,
  SyncTaskResult,
} from "@/types/sync";
import type { TaskProvider } from "@/types/task";
import { createLocalId } from "@/lib/localId";
import { toIsoString, type ClockInput } from "@/lib/time";

export function createSyncRecord(
  input: {
    taskId: string;
    provider: TaskProvider;
    operation?: SyncOperation;
  },
  now: ClockInput = new Date(),
): SyncRecord {
  const timestamp = toIsoString(now);
  const taskId = input.taskId.trim();

  if (!taskId) {
    throw new Error("Sync record taskId cannot be empty");
  }

  return {
    id: generateSyncRecordId(),
    taskId,
    provider: input.provider,
    operation: input.operation ?? "export_task",
    status: "pending",
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function applySyncResult(
  record: SyncRecord,
  result: SyncTaskResult,
  now: ClockInput = new Date(),
): SyncRecord {
  return {
    ...record,
    status: result.status,
    ...(result.externalId?.trim() && { externalId: result.externalId.trim() }),
    ...(result.error?.trim() && { error: result.error.trim() }),
    updatedAt: toIsoString(now),
  };
}

export function countSyncRecords(records: SyncRecord[]) {
  return records.reduce(
    (acc, record) => {
      acc.total += 1;
      acc[record.status] += 1;
      return acc;
    },
    {
      failed: 0,
      pending: 0,
      skipped: 0,
      synced: 0,
      total: 0,
    } satisfies Record<SyncRecordStatus | "total", number>,
  );
}

function generateSyncRecordId(): string {
  return createLocalId("sync", 8);
}
