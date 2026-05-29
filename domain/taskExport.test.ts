import assert from "node:assert/strict";
import { buildTaskExportPayload } from "./taskExport";
import type { NormalizedTask } from "../types/task";

const task: NormalizedTask = {
  createdAt: "2026-05-28T02:10:00.000Z",
  dueAt: "2026-05-29T07:00:00.000Z",
  dueText: "明天 15:00",
  id: "task-1",
  needsConfirmation: false,
  notes: "  启动游戏前先更新客户端  ",
  priority: "none",
  provider: "local",
  sourceId: "source-1",
  sourceText: " 明天下午三点玩原神 ",
  sourceType: "text",
  status: "todo",
  tags: ["game"],
  timeConfidence: "medium",
  timeStatus: "needs_review",
  title: "玩原神",
  updatedAt: "2026-05-28T02:10:00.000Z",
};

assert.deepEqual(buildTaskExportPayload(task), {
  dueAt: "2026-05-29T07:00:00.000Z",
  dueText: "明天 15:00",
  notes: "启动游戏前先更新客户端",
  priority: "none",
  source: {
    id: "source-1",
    text: "明天下午三点玩原神",
    type: "text",
  },
  status: "todo",
  tags: ["game"],
  title: "玩原神",
});

const sourceLessTask = {
  ...task,
  dueAt: undefined,
  dueText: undefined,
  notes: undefined,
  sourceId: undefined,
  sourceText: undefined,
  sourceType: undefined,
};

assert.deepEqual(buildTaskExportPayload(sourceLessTask), {
  priority: "none",
  status: "todo",
  tags: ["game"],
  title: "玩原神",
});

console.log("Task export payload checks passed: 2");

