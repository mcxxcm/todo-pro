import assert from "node:assert/strict";
import {
  applyTaskDraftPatch,
  createTaskDraft,
  markTaskDraftAccepted,
  markTaskDraftRejected,
} from "./taskDrafts";

const createdAt = "2026-05-28T01:00:00.000Z";
const editedAt = "2026-05-28T01:02:00.000Z";
const acceptedAt = "2026-05-28T01:05:00.000Z";
const rejectedAt = "2026-05-28T01:06:00.000Z";

const draft = createTaskDraft(
  {
    id: "candidate-1",
    title: " 明天下午三点玩原神 ",
    sourceText: "明天下午三点玩原神",
    dueText: "明天 15:00",
    dueAt: "2026-05-28T07:00:00.000Z",
    priority: "none",
    tags: [],
    timeConfidence: "medium",
    confidence: 0.82,
    sourceId: "source-abc",
    sourceType: "text",
  },
  createdAt,
);

assert.equal(draft.id, "candidate-1");
assert.equal(draft.title, "明天下午三点玩原神");
assert.equal(draft.status, "pending");
assert.equal(draft.timeStatus, "needs_review");
assert.equal(draft.sourceId, "source-abc");
assert.equal(draft.sourceType, "text");
assert.equal(draft.createdAt, createdAt);
assert.equal(draft.updatedAt, createdAt);

const edited = applyTaskDraftPatch(
  draft,
  {
    title: "玩原神",
    timeStatus: "confirmed",
  },
  editedAt,
);

assert.equal(edited.status, "edited");
assert.equal(edited.title, "玩原神");
assert.equal(edited.timeStatus, "confirmed");
assert.equal(edited.updatedAt, editedAt);

const accepted = markTaskDraftAccepted(edited, "task-123", acceptedAt);

assert.equal(accepted.status, "accepted");
assert.equal(accepted.acceptedTaskId, "task-123");
assert.equal(accepted.sourceId, "source-abc");
assert.equal(accepted.updatedAt, acceptedAt);

const rejected = markTaskDraftRejected(draft, rejectedAt);

assert.equal(rejected.status, "rejected");
assert.equal(rejected.acceptedTaskId, undefined);
assert.equal(rejected.updatedAt, rejectedAt);

assert.throws(
  () => createTaskDraft({ ...draft, title: " " }, createdAt),
  /title cannot be empty/,
);

console.log("Task draft lifecycle checks passed: 5");
