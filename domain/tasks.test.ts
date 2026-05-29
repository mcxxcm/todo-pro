import assert from "node:assert/strict";
import { createNormalizedTask } from "./tasks";

const task = createNormalizedTask(
  " 玩原神 ",
  {
    dueAt: "2026-05-29T07:00:00.000Z",
    dueText: " 明天 15:00 ",
    priority: "high",
    sourceId: " source-1 ",
    sourceText: " 明天下午三点玩原神 ",
    sourceType: "text",
    tags: ["game"],
    timeConfidence: "medium",
    timeStatus: "needs_review",
  },
  {
    id: "task-1",
    now: "2026-05-28T02:20:00.000Z",
  },
);

assert.equal(task.id, "task-1");
assert.equal(task.title, "玩原神");
assert.equal(task.sourceId, "source-1");
assert.equal(task.sourceType, "text");
assert.equal(task.sourceText, "明天下午三点玩原神");
assert.equal(task.dueText, "明天 15:00");
assert.equal(task.timeStatus, "needs_review");
assert.equal(task.priority, "high");
assert.deepEqual(task.tags, ["game"]);
assert.equal(task.timeConfidence, "medium");
assert.equal(task.provider, "local");

assert.throws(
  () =>
    createNormalizedTask(" ", undefined, {
      id: "task-empty",
      now: "2026-05-28T02:20:00.000Z",
    }),
  /title cannot be empty/,
);

console.log("Task creation checks passed: 11");
