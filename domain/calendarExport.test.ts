import assert from "node:assert/strict";
import { buildCalendarIcs } from "./calendarExport";

const exported = buildCalendarIcs(
  {
    dueAt: "2026-05-29T07:00:00.000Z",
    dueText: "明天 15:00",
    notes: "启动前更新客户端",
    priority: "none",
    source: {
      text: "明天下午三点玩原神",
      type: "text",
    },
    status: "todo",
    tags: [],
    title: "玩原神",
  },
  {
    now: "2026-05-28T02:30:00.000Z",
    uid: "task-1@todo-pro",
  },
);

assert.equal(exported.uid, "task-1@todo-pro");
assert.match(exported.ics, /BEGIN:VCALENDAR/);
assert.match(exported.ics, /SUMMARY:玩原神/);
assert.match(exported.ics, /DTSTART:20260529T070000Z/);
assert.match(exported.ics, /DTEND:20260529T073000Z/);
assert.match(
  exported.ics,
  /DESCRIPTION:启动前更新客户端\\nDue: 明天 15:00\\nSource: 明天下午三点玩原神/,
);

assert.throws(
  () =>
    buildCalendarIcs(
      {
        priority: "none",
        status: "todo",
        tags: [],
        title: "无时间任务",
      },
      {
        now: "2026-05-28T02:30:00.000Z",
        uid: "task-2@todo-pro",
      },
    ),
  /requires dueAt/,
);

console.log("Calendar ICS export checks passed: 7");

