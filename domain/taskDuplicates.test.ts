import assert from "node:assert/strict";
import { findDuplicateTaskGroups, getDuplicateTaskKey } from "./taskDuplicates";
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

assert.equal(
  getDuplicateTaskKey({
    ...baseTask,
    dueAt: "2026-05-28T07:00:00.000Z",
    title: "开会!",
  }),
  "开会:2026-05-28",
);

const groups = findDuplicateTaskGroups([
  {
    ...baseTask,
    createdAt: "2026-05-28T00:00:00.000Z",
    dueAt: "2026-05-28T07:00:00.000Z",
    id: "older",
    title: "开会",
  },
  {
    ...baseTask,
    createdAt: "2026-05-28T01:00:00.000Z",
    dueAt: "2026-05-28T08:00:00.000Z",
    id: "source-backed",
    sourceId: "source-1",
    title: "开会!",
  },
  {
    ...baseTask,
    dueAt: "2026-05-29T07:00:00.000Z",
    id: "different-date",
    title: "开会",
  },
  {
    ...baseTask,
    id: "done-copy",
    status: "done",
    title: "开会",
  },
]);

assert.equal(groups.length, 1);
assert.equal(groups[0].primaryId, "source-backed");
assert.deepEqual(groups[0].duplicateIds, ["older"]);

console.log("Task duplicate checks passed: 4");
