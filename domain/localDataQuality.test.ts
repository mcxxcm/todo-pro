import assert from "node:assert/strict";
import { buildLocalDataQuality } from "./localDataQuality";
import type { TaskDraft } from "../types/draft";
import type { SourceItem } from "../types/source";
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

const baseSource: SourceItem = {
  createdAt: "2026-05-28T00:00:00.000Z",
  id: "source-1",
  type: "share",
};

const baseDraft: TaskDraft = {
  confidence: 0.8,
  createdAt: "2026-05-28T00:00:00.000Z",
  id: "draft-1",
  priority: "none",
  sourceId: "source-1",
  sourceText: "明天下午三点开会",
  status: "pending",
  tags: [],
  timeConfidence: "medium",
  title: "开会",
  updatedAt: "2026-05-28T00:00:00.000Z",
};

const quality = buildLocalDataQuality({
  drafts: [baseDraft],
  sources: [
    baseSource,
    { ...baseSource, id: "source-orphan", type: "text" },
  ],
  tasks: [
    {
      ...baseTask,
      dueAt: "2026-05-28T07:00:00.000Z",
      id: "task-1",
      sourceId: "source-1",
      title: "开会",
    },
    {
      ...baseTask,
      dueAt: "2026-05-28T08:00:00.000Z",
      id: "task-2",
      title: "开会!",
    },
    {
      ...baseTask,
      dueText: "明天下午",
      id: "task-review",
      needsConfirmation: true,
      timeConfidence: "low",
      timeStatus: "needs_review",
      title: "确认安排",
    },
    {
      ...baseTask,
      id: "archived",
      status: "archived",
      title: "旧任务",
    },
  ],
});

assert.equal(quality.openTasks, 3);
assert.equal(quality.archivedTasks, 1);
assert.equal(quality.sourceBackedTasks, 1);
assert.equal(quality.sourceCoverageRate, 1 / 3);
assert.equal(quality.timeReviewTasks, 1);
assert.equal(quality.duplicateGroups, 1);
assert.equal(quality.orphanSources, 1);
assert.equal(quality.pendingDrafts, 1);
assert.deepEqual(quality.recommendedActions, [
  "审核未处理草稿",
  "确认模糊时间",
  "合并重复任务",
]);
assert.equal(quality.trustScore, 52);

console.log("Local data quality checks passed: 10");
