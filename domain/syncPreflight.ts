import type { SyncRecord } from "@/types/sync";
import type { NormalizedTask, TaskProvider } from "@/types/task";

export interface SyncPreflight {
  provider: TaskProvider;
  totalTasks: number;
  activeTasks: number;
  eligibleTasks: number;
  alreadySynced: number;
  missingTime: number;
  needsTimeReview: number;
  completedOrArchived: number;
  sourceBacked: number;
  warnings: string[];
}

export function buildSyncPreflight(input: {
  provider: TaskProvider;
  records: SyncRecord[];
  tasks: NormalizedTask[];
}): SyncPreflight {
  const totalTasks = input.tasks.length;
  const activeTasks = input.tasks.filter((task) => task.status === "todo");
  const completedOrArchived = totalTasks - activeTasks.length;
  const alreadySyncedIds = new Set(
    input.records
      .filter(
        (record) =>
          record.provider === input.provider && record.status === "synced",
      )
      .map((record) => record.taskId),
  );
  const alreadySynced = activeTasks.filter((task) =>
    alreadySyncedIds.has(task.id),
  ).length;
  const missingTime = requiresDueAt(input.provider)
    ? activeTasks.filter((task) => !task.dueAt).length
    : 0;
  const needsTimeReview = activeTasks.filter(
    (task) =>
      task.timeStatus === "needs_review" ||
      task.needsConfirmation ||
      (task.dueText && task.timeConfidence === "low"),
  ).length;
  const sourceBacked = activeTasks.filter(
    (task) => task.sourceId || task.sourceText,
  ).length;
  const eligibleTasks = activeTasks.filter(
    (task) =>
      !alreadySyncedIds.has(task.id) &&
      (!requiresDueAt(input.provider) || !!task.dueAt),
  ).length;

  return {
    provider: input.provider,
    totalTasks,
    activeTasks: activeTasks.length,
    eligibleTasks,
    alreadySynced,
    missingTime,
    needsTimeReview,
    completedOrArchived,
    sourceBacked,
    warnings: buildWarnings({
      alreadySynced,
      eligibleTasks,
      missingTime,
      needsTimeReview,
    }),
  };
}

function requiresDueAt(provider: TaskProvider) {
  return provider === "calendar" || provider === "reminders";
}

function buildWarnings(input: {
  alreadySynced: number;
  eligibleTasks: number;
  missingTime: number;
  needsTimeReview: number;
}) {
  const warnings: string[] = [];

  if (input.eligibleTasks === 0) warnings.push("没有可同步任务");
  if (input.alreadySynced > 0) warnings.push(`${input.alreadySynced} 个任务已同步`);
  if (input.missingTime > 0) warnings.push(`${input.missingTime} 个任务缺少时间`);
  if (input.needsTimeReview > 0) warnings.push(`${input.needsTimeReview} 个时间待确认`);

  return warnings;
}
