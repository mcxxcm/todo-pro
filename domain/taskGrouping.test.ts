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

console.log("Task grouping checks passed: 4");
