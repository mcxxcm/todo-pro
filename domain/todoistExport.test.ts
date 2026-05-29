import assert from "node:assert/strict";
import { buildTodoistTaskPayload } from "./todoistExport";

assert.deepEqual(
  buildTodoistTaskPayload({
    dueAt: "2026-05-29T07:00:00.000Z",
    dueText: "明天 15:00",
    notes: "启动前更新客户端",
    priority: "high",
    source: {
      text: "明天下午三点玩原神",
      type: "text",
    },
    status: "todo",
    tags: ["game"],
    title: "玩原神",
  }),
  {
    content: "玩原神",
    description: "启动前更新客户端\nSource: 明天下午三点玩原神",
    due_datetime: "2026-05-29T07:00:00.000Z",
    labels: ["game"],
    priority: 4,
  },
);

assert.deepEqual(
  buildTodoistTaskPayload({
    dueText: "下周五",
    priority: "none",
    status: "todo",
    tags: [],
    title: "提交报告",
  }),
  {
    content: "提交报告",
    due_string: "下周五",
    priority: 1,
  },
);

console.log("Todoist export payload checks passed: 2");

