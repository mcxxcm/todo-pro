import assert from "node:assert/strict";
import {
  applySyncResult,
  countSyncRecords,
  createSyncRecord,
} from "./syncRecords";

const createdAt = "2026-05-28T02:00:00.000Z";
const syncedAt = "2026-05-28T02:01:00.000Z";
const failedAt = "2026-05-28T02:02:00.000Z";

const pending = createSyncRecord(
  {
    taskId: " task-1 ",
    provider: "local",
  },
  createdAt,
);

assert.equal(pending.taskId, "task-1");
assert.equal(pending.provider, "local");
assert.equal(pending.operation, "export_task");
assert.equal(pending.status, "pending");
assert.equal(pending.createdAt, createdAt);

const synced = applySyncResult(
  pending,
  {
    externalId: " local:task-1 ",
    status: "synced",
  },
  syncedAt,
);

assert.equal(synced.status, "synced");
assert.equal(synced.externalId, "local:task-1");
assert.equal(synced.updatedAt, syncedAt);

const failed = applySyncResult(
  createSyncRecord({ taskId: "task-2", provider: "todoist" }, createdAt),
  {
    error: "Provider is not configured",
    status: "failed",
  },
  failedAt,
);

assert.deepEqual(countSyncRecords([pending, synced, failed]), {
  failed: 1,
  pending: 1,
  skipped: 0,
  synced: 1,
  total: 3,
});

assert.throws(
  () => createSyncRecord({ taskId: " ", provider: "local" }, createdAt),
  /taskId cannot be empty/,
);

console.log("Sync record lifecycle checks passed: 5");

