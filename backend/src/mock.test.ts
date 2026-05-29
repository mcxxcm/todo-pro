import assert from "node:assert/strict";
import { mockExtract } from "./mock";

const input = "明天下午3点前联系老师确认论文题目\n下周五提交报告";
const result = mockExtract(input);

assert.equal(result.tasks.length, 2);

assert.equal(result.tasks[0].title, "联系老师确认论文题目");
assert.equal(result.tasks[0].sourceText, "明天下午3点前联系老师确认论文题目");
assert.equal(result.tasks[0].dueText, "明天 15:00");

assert.equal(result.tasks[1].title, "提交报告");
assert.equal(result.tasks[1].sourceText, "下周五提交报告");
assert.equal(result.tasks[1].dueText, "下周五");

const email = mockExtract(
  "From: teacher@example.com\nSubject: 论文\n下周五提交报告",
);

assert.equal(email.tasks.length, 1);
assert.equal(email.tasks[0].title, "提交报告");
assert.equal(email.tasks[0].sourceText, "下周五提交报告");
assert.equal(email.tasks[0].dueText, "下周五");

const sharedLink = mockExtract(
  "课程通知\nhttps://example.com/course.pdf\n下周五提交报告",
);

assert.equal(sharedLink.tasks.length, 1);
assert.equal(sharedLink.tasks[0].title, "提交报告");
assert.equal(sharedLink.tasks[0].sourceText, "下周五提交报告");

const actionOnly = mockExtract("玩原神");
assert.equal(actionOnly.tasks.length, 1);
assert.equal(actionOnly.tasks[0].title, "玩原神");

console.log(
  `Mock extraction checks passed: ${
    result.tasks.length +
    email.tasks.length +
    sharedLink.tasks.length +
    actionOnly.tasks.length
  }`,
);
