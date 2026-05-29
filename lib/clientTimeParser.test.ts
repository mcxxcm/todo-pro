import assert from "node:assert/strict";
import { parseClientDateInfo } from "./clientTimeParser";

const reference = new Date("2026-05-27T09:00:00+08:00");

const tomorrowAfternoon = parseClientDateInfo("明天下午三点", reference);
assert.deepEqual(tomorrowAfternoon, {
  dueText: "明天 15:00",
  dueAt: "2026-05-28T07:00:00.000Z",
});

const nextFriday = parseClientDateInfo("下周五提交报告", reference);
assert.deepEqual(nextFriday, {
  dueText: "下周五",
  dueAt: "2026-06-05T15:59:00.000Z",
});

const timeOnly = parseClientDateInfo("下午三点开会", reference);
assert.deepEqual(timeOnly, {
  dueText: "今天 15:00",
  dueAt: "2026-05-27T07:00:00.000Z",
});

const monthDay = parseClientDateInfo("5月30日晚上八点交材料", reference);
assert.deepEqual(monthDay, {
  dueText: "5月30日 20:00",
  dueAt: "2026-05-30T12:00:00.000Z",
});

assert.deepEqual(parseClientDateInfo("半小时后回电话", reference), {
  dueText: "半小时后",
  dueAt: "2026-05-27T01:30:00.000Z",
});

assert.deepEqual(parseClientDateInfo("两小时后提醒喝水", reference), {
  dueText: "两小时后",
  dueAt: "2026-05-27T03:00:00.000Z",
});

assert.deepEqual(parseClientDateInfo("三天后提交", reference), {
  dueText: "三天后",
  dueAt: "2026-05-30T01:00:00.000Z",
});

assert.deepEqual(parseClientDateInfo("月底前完成申请", reference), {
  dueText: "5月底",
  dueAt: "2026-05-31T15:59:00.000Z",
});

assert.deepEqual(parseClientDateInfo("下个月3号交材料", reference), {
  dueText: "6月3日",
  dueAt: "2026-06-03T15:59:00.000Z",
});

assert.deepEqual(parseClientDateInfo("2026-06-01 上午九点半面试", reference), {
  dueText: "2026年6月1日 09:30",
  dueAt: "2026-06-01T01:30:00.000Z",
});

assert.equal(parseClientDateInfo("只是普通备注", reference), null);

console.log("Client time parser checks passed: 11");
