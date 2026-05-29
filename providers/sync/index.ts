import { applySyncResult, countSyncRecords, createSyncRecord } from "@/domain/syncRecords";
import { buildSyncPreflight } from "@/domain/syncPreflight";
import { buildTaskExportPayload } from "@/domain/taskExport";
import { loadSyncRecords, saveSyncRecords } from "@/lib/syncStorage";
import { loadTasks } from "@/lib/taskStorage";
import type { TaskProvider } from "@/types/task";
import type { SyncRecord, TaskSyncProvider } from "@/types/sync";
import { calendarSyncProvider } from "./calendarSyncProvider";
import { localSyncProvider } from "./localSyncProvider";
import { remindersSyncProvider } from "./remindersSyncProvider";
import { todoistSyncProvider } from "./todoistSyncProvider";

const syncProviders: Record<TaskProvider, TaskSyncProvider> = {
  calendar: calendarSyncProvider,
  local: localSyncProvider,
  reminders: remindersSyncProvider,
  todoist: todoistSyncProvider,
};

export function getSyncProviders(): TaskSyncProvider[] {
  return Object.values(syncProviders);
}

export async function getSyncRecords(): Promise<SyncRecord[]> {
  return loadSyncRecords();
}

export async function getSyncSummary() {
  const records = await loadSyncRecords();
  return countSyncRecords(records);
}

export async function getSyncPreflight(provider: TaskProvider) {
  const [records, tasks] = await Promise.all([loadSyncRecords(), loadTasks()]);
  return buildSyncPreflight({ provider, records, tasks });
}

export async function syncTaskToProvider(
  taskId: string,
  provider: TaskProvider,
): Promise<SyncRecord> {
  const syncProvider = syncProviders[provider];
  if (!syncProvider) {
    throw new Error(`Sync provider ${provider} not found`);
  }

  const records = await loadSyncRecords();
  const tasks = await loadTasks();
  const task = tasks.find((item) => item.id === taskId);

  if (!task) {
    throw new Error(`Task ${taskId} not found`);
  }

  const record = createSyncRecord({ provider, taskId });
  const alreadySynced = records.some(
    (item) =>
      item.taskId === taskId &&
      item.provider === provider &&
      item.status === "synced",
  );

  if (alreadySynced) {
    const skipped = applySyncResult(record, {
      error: `Task ${taskId} is already synced to ${provider}.`,
      status: "skipped",
    });
    await saveSyncRecords([...records, skipped]);
    return skipped;
  }

  records.push(record);
  await saveSyncRecords(records);

  const payload = buildTaskExportPayload(task);
  const result = await syncProvider.syncTask(task, payload);
  const updated = applySyncResult(record, result);
  const nextRecords = records.map((item) =>
    item.id === record.id ? updated : item,
  );
  await saveSyncRecords(nextRecords);
  return updated;
}

export async function syncAllLocalTasks(): Promise<SyncRecord[]> {
  return syncAllTasksToProvider("local");
}

export async function syncAllTasksToProvider(
  provider: TaskProvider,
): Promise<SyncRecord[]> {
  const tasks = await loadTasks();
  const activeTasks = tasks.filter((task) => task.status === "todo");
  const records: SyncRecord[] = [];

  for (const task of activeTasks) {
    records.push(await syncTaskToProvider(task.id, provider));
  }

  return records;
}
