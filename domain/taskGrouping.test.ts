import assert from "node:assert/strict";
import { buildTaskSections, getTaskGroupCounts } from "./taskGrouping";
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

const tasks: NormalizedTask[] = [
  { ...baseTask, dueAt: "2026-05-27T12:00:00.000Z", id: "overdue", title: "逾期" },
  { ...baseTask, dueAt: "2026-05-28T07:00:00.000Z", id: "today", title: "今天" },
  { ...baseTask, dueAt: "2026-05-29T07:00:00.000Z", id: "planned", title: "计划" },
  {
    ...baseTask,
    dueText: "明天下午",
    id: "needs-review",
    needsConfirmation: true,
    timeConfidence: "low",
    timeStatus: "needs_review",
    title: "待确认",
  },
  { ...baseTask, id: "inbox", title: "收件箱" },
  { ...baseTask, id: "done", status: "done", title: "完成" },
  { ...baseTask, id: "archived", status: "archived", title: "归档" },
];

const reference = new Date("2026-05-28T09:00:00.000Z");

assert.deepEqual(getTaskGroupCounts(tasks, reference), {
  all: 6,
  completed: 1,
  inbox: 2,
  needsReview: 1,
  overdue: 1,
  planned: 1,
  today: 1,
});

assert.deepEqual(
  buildTaskSections(tasks, reference).map((section) => section.title),
  ["已逾期", "今天", "计划", "收件箱", "已完成"],
);

assert.deepEqual(
  buildTaskSections(tasks, reference, "today").map((section) => section.title),
  ["今天"],
);

assert.deepEqual(
  buildTaskSections(tasks, reference, "needsReview").map((section) => section.title),
  ["待确认"],
);

// --- Priority-first sorting test ---
// Tasks with same due date but different priorities: high should come before medium, medium before low, low before none
{
  const today = "2026-05-28T07:00:00.000Z";
  const priorityTasks: NormalizedTask[] = [
    { ...baseTask, id: "p-none", title: "none", dueAt: today, priority: "none" },
    { ...baseTask, id: "p-low", title: "low", dueAt: today, priority: "low" },
    { ...baseTask, id: "p-high", title: "high", dueAt: today, priority: "high" },
    { ...baseTask, id: "p-med", title: "medium", dueAt: today, priority: "medium" },
  ];
  const sections = buildTaskSections(priorityTasks, reference, "today");
  assert.equal(sections.length, 1);
  const ids = sections[0].data.map((t) => t.id);
  assert.deepEqual(ids, ["p-high", "p-med", "p-low", "p-none"]);
}

// Tasks with different priorities and different due dates: priority should dominate
{
  const priorityOverTime: NormalizedTask[] = [
    { ...baseTask, id: "high-later", title: "high later", dueAt: "2026-05-30T00:00:00.000Z", priority: "high" },
    { ...baseTask, id: "none-earlier", title: "none earlier", dueAt: "2026-05-29T00:00:00.000Z", priority: "none" },
    { ...baseTask, id: "med-earliest", title: "med earliest", dueAt: "2026-05-28T06:00:00.000Z", priority: "medium" },
  ];
  const sections = buildTaskSections(priorityOverTime, reference, "all");
  // all open tasks: overdue(0) today(med-earliest) planned(high-later, none-earlier)
  const plannedSection = sections.find((s) => s.id === "planned");
  assert.ok(plannedSection, "planned section should exist");
  const plannedIds = plannedSection!.data.map((t) => t.id);
  // high should come before none, despite none having earlier due date
  assert.deepEqual(plannedIds, ["high-later", "none-earlier"]);
}

// Inbox section: priority-first, then newest-first by createdAt
{
  const now = "2026-05-28T10:00:00.000Z";
  const inboxTasks: NormalizedTask[] = [
    { ...baseTask, id: "i-none-new", title: "none new", createdAt: "2026-05-28T10:00:00.000Z", priority: "none" },
    { ...baseTask, id: "i-high-old", title: "high old", createdAt: "2026-05-27T00:00:00.000Z", priority: "high" },
    { ...baseTask, id: "i-med", title: "medium", createdAt: "2026-05-28T05:00:00.000Z", priority: "medium" },
    { ...baseTask, id: "i-high-new", title: "high new", createdAt: "2026-05-28T12:00:00.000Z", priority: "high" },
  ];
  const sections = buildTaskSections(inboxTasks, reference, "all");
  const inboxSection = sections.find((s) => s.id === "inbox");
  assert.ok(inboxSection, "inbox section should exist");
  const inboxIds = inboxSection!.data.map((t) => t.id);
  // high first (newest-first within high), then medium, then none
  assert.deepEqual(inboxIds, ["i-high-new", "i-high-old", "i-med", "i-none-new"]);
}

console.log("Task grouping checks passed: 7");
