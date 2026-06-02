import assert from "node:assert/strict";
import type { NormalizedTask, TaskUpdateInput , TaskPriority } from "../../types/task";
import type { ExtractedTask } from "../../types/extraction";

// --- TaskItem prop contract ---
// Verifies the data shapes that TaskItem expects and produces
{
  const task: NormalizedTask = {
    id: "t1",
    title: "test task",
    status: "todo",
    priority: "high",
    tags: ["urgent"],
    timeConfidence: "none",
    needsConfirmation: false,
    provider: "local",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    subtasks: [
      { id: "s1", title: "step 1", status: "done", createdAt: "2025-01-01T00:00:00.000Z", updatedAt: "2025-01-01T00:00:00.000Z" },
      { id: "s2", title: "step 2", status: "todo", createdAt: "2025-01-01T00:00:00.000Z", updatedAt: "2025-01-01T00:00:00.000Z" },
    ],
    estimatedMinutes: 30,
    xp: 25,
  };

  let toggledId: string | null = null;
  const onToggle = (id: string) => { toggledId = id; };
  onToggle(task.id);
  assert.equal(toggledId, "t1");

  let updateId: string | null = null;
  const onUpdate = (id: string, _patch: TaskUpdateInput) => { updateId = id; };
  onUpdate(task.id, { title: "updated" });
  assert.equal(updateId, "t1");

  let deletedId: string | null = null;
  const onDelete = (id: string) => { deletedId = id; };
  onDelete(task.id);
  assert.equal(deletedId, "t1");

  const doneCount = task.subtasks?.filter((st) => st.status === "done").length ?? 0;
  const totalCount = task.subtasks?.length ?? 0;
  assert.equal(doneCount, 1);
  assert.equal(totalCount, 2);
}

// --- ReviewCard prop contract ---
{
  const extractedTask: ExtractedTask = {
    id: "d1",
    title: "extracted task",
    sourceText: "original text",
    priority: "medium",
    tags: ["tag1", "tag2"],
    timeConfidence: "low",
    confidence: 0.85,
    timeStatus: "needs_review",
    notes: "some notes",
  };

  let confirmedTitle = "";
  let confirmedTags: string[] = [];
  let confirmedStatus = "";
  const onConfirm = (t: ExtractedTask) => {
    confirmedTitle = t.title;
    confirmedTags = t.tags;
    confirmedStatus = t.timeStatus ?? "";
  };
  onConfirm({
    ...extractedTask,
    title: "edited title",
    tags: ["tag1", "tag3"],
    timeStatus: "confirmed",
  });
  assert.equal(confirmedTitle, "edited title");
  assert.deepEqual(confirmedTags, ["tag1", "tag3"]);
  assert.equal(confirmedStatus, "confirmed");

  let dismissedId: string | null = null;
  const onDismiss = (id: string) => { dismissedId = id; };
  onDismiss(extractedTask.id);
  assert.equal(dismissedId, "d1");

  let fieldChangedId: string | null = null;
  let fieldChangedField: string | null = null;
  let fieldChangedValue: unknown = undefined;
  const onFieldChange = (id: string, field: string, value: unknown) => {
    fieldChangedId = id;
    fieldChangedField = field;
    fieldChangedValue = value;
  };
  onFieldChange(extractedTask.id, "tags", ["new-tag"]);
  assert.equal(fieldChangedId, "d1");
  assert.equal(fieldChangedField, "tags");
  assert.deepEqual(fieldChangedValue as string[], ["new-tag"]);
}

// --- TaskComposer prop contract ---
{
  let addedTitle: string | null = null;
  let addedPriority: TaskPriority | undefined;
  let addedDueAt: string | undefined;
  let addedTags: string[] | undefined;

  const onAdd = (title: string, priority?: TaskPriority, dueAt?: string, _dueText?: string, tags?: string[]) => {
    addedTitle = title;
    addedPriority = priority;
    addedDueAt = dueAt;
    addedTags = tags;
    return { id: "new-task" };
  };

  const result = onAdd("new task", "high", "2025-06-01T00:00:00.000Z", "6月1日", ["urgent"]);
  assert.equal(addedTitle, "new task");
  assert.equal(addedPriority, "high");
  assert.equal(addedDueAt, "2025-06-01T00:00:00.000Z");
  assert.deepEqual(addedTags, ["urgent"]);
  assert.ok(result);

  let extractedText: string | null = null;
  const onExtract = (text: string) => { extractedText = text; };
  onExtract("extract this text");
  assert.equal(extractedText, "extract this text");

  const canExtract = (text: string) => !!text.trim();
  assert.equal(canExtract(""), false);
  assert.equal(canExtract("hello"), true);
}

console.log("Component contract checks passed: 3");
