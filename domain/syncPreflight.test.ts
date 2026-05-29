import assert from "node:assert/strict";
import { buildSyncPreflight } from "./syncPreflight";
import type { SyncRecord } from "../types/sync";
import type { NormalizedTask } from "../types/task";

const baseTask: NormalizedTask = {
  createdAt: "2026-05-28T00:00:00.000Z",
  id: "base",
  needsConfirmation: false,
  priority: "none",
  provider: "local",
  status: "todo",
  tags: [],
  timeConfidence: "none",
  title: "base",
  updatedAt: "2026-05-28T00:00:00.000Z",
};

const records: SyncRecord[] = [
  {
    createdAt: "2026-05-28T01:00:00.000Z",
    id: "sync-1",
    operation: "export_task",
    provider: "todoist",
    status: "synced",
    taskId: "synced",
    updatedAt: "2026-05-28T01:00:00.000Z",
  },
];

const tasks: NormalizedTask[] = [
  {
    ...baseTask,
    id: "ready",
    dueAt: "2026-05-29T07:00:00.000Z",
    sourceId: "source-1",
    title: "准备项",
  },
  {
    ...baseTask,
    id: "synced",
    title: "已同步项",
  },
  {
    ...baseTask,
    dueText: "明天下午",
    id: "review",
    needsConfirmation: true,
    timeConfidence: "low",
    timeStatus: "needs_review",
    title: "待确认时间",
  },
  {
    ...baseTask,
    id: "done",
    status: "done",
    title: "已完成",
  },
];

assert.deepEqual(buildSyncPreflight({ provider: "todoist", records, tasks }), {
  activeTasks: 3,
  alreadySynced: 1,
  completedOrArchived: 1,
  eligibleTasks: 2,
  missingTime: 0,
  needsTimeReview: 1,
  provider: "todoist",
  sourceBacked: 1,
  totalTasks: 4,
  warnings: ["1 个任务已同步", "1 个时间待确认"],
});

assert.deepEqual(buildSyncPreflight({ provider: "calendar", records, tasks }), {
  activeTasks: 3,
  alreadySynced: 0,
  completedOrArchived: 1,
  eligibleTasks: 1,
  missingTime: 2,
  needsTimeReview: 1,
  provider: "calendar",
  sourceBacked: 1,
  totalTasks: 4,
  warnings: ["2 个任务缺少时间", "1 个时间待确认"],
});

console.log("Sync preflight checks passed: 2");
