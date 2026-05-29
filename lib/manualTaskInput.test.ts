import assert from "node:assert/strict";
import { parseManualTaskInput } from "./manualTaskInput";

const reference = new Date("2026-05-28T09:00:00+08:00");

assert.deepEqual(parseManualTaskInput("明天下午三点玩原神", reference), {
  dueAt: "2026-05-29T07:00:00.000Z",
  dueText: "明天 15:00",
  timeStatus: "needs_review",
  title: "玩原神",
});

assert.deepEqual(parseManualTaskInput("下周五提交报告", reference), {
  dueAt: "2026-06-05T15:59:00.000Z",
  dueText: "下周五",
  timeStatus: "needs_review",
  title: "提交报告",
});

assert.deepEqual(parseManualTaskInput("半小时后回电话", reference), {
  dueAt: "2026-05-28T01:30:00.000Z",
  dueText: "半小时后",
  timeStatus: "needs_review",
  title: "回电话",
});

assert.deepEqual(parseManualTaskInput("月底前完成申请", reference), {
  dueAt: "2026-05-31T15:59:00.000Z",
  dueText: "5月底",
  timeStatus: "needs_review",
  title: "完成申请",
});

assert.deepEqual(parseManualTaskInput("下个月3号交材料", reference), {
  dueAt: "2026-06-03T15:59:00.000Z",
  dueText: "6月3日",
  timeStatus: "needs_review",
  title: "交材料",
});

assert.deepEqual(parseManualTaskInput("2026-06-01 上午九点半面试", reference), {
  dueAt: "2026-06-01T01:30:00.000Z",
  dueText: "2026年6月1日 09:30",
  timeStatus: "needs_review",
  title: "面试",
});

assert.deepEqual(parseManualTaskInput("买牛奶", reference), {
  timeStatus: "none",
  title: "买牛奶",
});

assert.equal(parseManualTaskInput("  ", reference), null);

console.log("Manual task input checks passed: 8");
