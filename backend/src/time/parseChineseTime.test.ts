import assert from "node:assert/strict";
import {
  parseChineseDateInfo,
  stripChineseTimeExpressions,
} from "./parseChineseTime";

const reference = new Date("2026-05-27T09:00:00+08:00");

interface ParseCase {
  input: string;
  dueText: string;
  dueAt: string;
  stripped: string;
}

const cases: ParseCase[] = [
  {
    input: "明天下午3点前联系老师",
    dueText: "明天 15:00",
    dueAt: "2026-05-28T07:00:00.000Z",
    stripped: "联系老师",
  },
  {
    input: "明早九点半整理项目路线图",
    dueText: "明天 09:30",
    dueAt: "2026-05-28T01:30:00.000Z",
    stripped: "整理项目路线图",
  },
  {
    input: "今晚八点前交作业",
    dueText: "今天 20:00",
    dueAt: "2026-05-27T12:00:00.000Z",
    stripped: "交作业",
  },
  {
    input: "下周五提交报告",
    dueText: "下周五",
    dueAt: "2026-06-05T15:59:00.000Z",
    stripped: "提交报告",
  },
  {
    input: "本周五开会",
    dueText: "周五",
    dueAt: "2026-05-29T15:59:00.000Z",
    stripped: "开会",
  },
  {
    input: "周一提醒我复盘",
    dueText: "周一",
    dueAt: "2026-06-01T15:59:00.000Z",
    stripped: "提醒我复盘",
  },
  {
    input: "下个月3号交材料",
    dueText: "6月3日",
    dueAt: "2026-06-03T15:59:00.000Z",
    stripped: "交材料",
  },
  {
    input: "月底前完成申请",
    dueText: "5月底",
    dueAt: "2026-05-31T15:59:00.000Z",
    stripped: "完成申请",
  },
  {
    input: "2026-06-01 上午九点半面试",
    dueText: "2026年6月1日 09:30",
    dueAt: "2026-06-01T01:30:00.000Z",
    stripped: "面试",
  },
  {
    input: "半小时后回电话",
    dueText: "半小时后",
    dueAt: "2026-05-27T01:30:00.000Z",
    stripped: "回电话",
  },
  {
    input: "两小时后提醒喝水",
    dueText: "两小时后",
    dueAt: "2026-05-27T03:00:00.000Z",
    stripped: "提醒喝水",
  },
  {
    input: "三天后提交",
    dueText: "三天后",
    dueAt: "2026-05-30T01:00:00.000Z",
    stripped: "提交",
  },
];

for (const testCase of cases) {
  const parsed = parseChineseDateInfo(testCase.input, reference);

  assert.ok(parsed, `Expected "${testCase.input}" to parse`);
  assert.equal(parsed.dueText, testCase.dueText, testCase.input);
  assert.equal(parsed.dueAt, testCase.dueAt, testCase.input);
  assert.equal(
    stripChineseTimeExpressions(testCase.input),
    testCase.stripped,
    testCase.input,
  );
}

assert.equal(parseChineseDateInfo("只是普通聊天", reference), null);
assert.equal(stripChineseTimeExpressions("只是普通聊天"), "只是普通聊天");

console.log(`Chinese time parser checks passed: ${cases.length + 2}`);
