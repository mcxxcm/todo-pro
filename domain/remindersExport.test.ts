import assert from "node:assert/strict";
import { buildReminderTaskPayload } from "./remindersExport";

assert.deepEqual(
  buildReminderTaskPayload({
    dueAt: "2026-05-29T07:00:00.000Z",
    dueText: "明天 15:00",
    notes: "启动前更新客户端",
    priority: "medium",
    source: {
      text: "明天下午三点玩原神",
      type: "text",
    },
    status: "todo",
    tags: ["game"],
    title: "玩原神",
  }),
  {
    dueDate: "2026-05-29T07:00:00.000Z",
    notes: "启动前更新客户端\nDue: 明天 15:00\nSource: 明天下午三点玩原神",
    priority: 5,
    title: "玩原神",
  },
);

assert.deepEqual(
  buildReminderTaskPayload({
    priority: "none",
    status: "todo",
    tags: [],
    title: "买牛奶",
  }),
  {
    priority: 0,
    title: "买牛奶",
  },
);

console.log("Reminders export payload checks passed: 2");

