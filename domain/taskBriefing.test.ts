import assert from "node:assert/strict";
import { buildTaskBriefing } from "./taskBriefing";
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

const briefing = buildTaskBriefing(
  [
    {
      ...baseTask,
      dueAt: "2026-05-27T12:00:00.000Z",
      id: "overdue",
      priority: "high",
      sourceId: "source-1",
      title: "补交报告",
    },
    {
      ...baseTask,
      dueAt: "2026-05-28T07:00:00.000Z",
      id: "today",
      sourceText: "群消息：今天下午开会",
      title: "开会",
    },
    {
      ...baseTask,
      dueText: "明天下午",
      id: "review",
      needsConfirmation: true,
      timeConfidence: "low",
      timeStatus: "needs_review",
      title: "确认时间",
    },
    {
      ...baseTask,
      dueAt: "2026-05-28T10:00:00.000Z",
      id: "duplicate-1",
      title: "开会!",
    },
    {
      ...baseTask,
      id: "done",
      status: "done",
      title: "完成项",
    },
  ],
  new Date("2026-05-28T09:00:00.000Z"),
);

assert.deepEqual(briefing.metrics, {
  highPriority: 1,
  needsTimeReview: 1,
  open: 4,
  overdue: 1,
  sourceBacked: 2,
  today: 2,
  duplicateRisk: 1,
});

assert.deepEqual(briefing.focusTaskIds, ["overdue", "today", "duplicate-1", "review"]);
assert.equal(
  briefing.narrative,
  "当前有 4 个待处理任务，2 个今天要完成，1 个已逾期，1 个时间需要确认，2 个带来源证据，1 组疑似重复。",
);
assert.deepEqual(briefing.recommendedActions, [
  "先确认模糊时间",
  "处理逾期任务",
  "推进今天截止的任务",
]);

console.log("Task briefing checks passed: 4");
