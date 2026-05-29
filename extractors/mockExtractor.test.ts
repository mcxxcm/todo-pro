import assert from "node:assert/strict";
import { MockExtractor } from "./mockExtractor";

async function main() {
  const extractor = new MockExtractor();

  const single = await extractor.extract("明天下午三点玩原神");
  assert.equal(single.tasks.length, 1);
  assert.equal(single.tasks[0].title, "玩原神");
  assert.equal(single.tasks[0].dueText, "明天 15:00");
  assert.equal(single.tasks[0].timeStatus, "needs_review");
  assert.equal(single.tasks[0].sourceText, "明天下午三点玩原神");

  const multi = await extractor.extract(
    "明天下午3点前联系老师确认论文题目\n下周五提交报告",
  );
  assert.equal(multi.tasks.length, 2);
  assert.equal(multi.tasks[0].sourceText, "明天下午3点前联系老师确认论文题目");
  assert.equal(multi.tasks[0].dueText, "明天 15:00");
  assert.equal(multi.tasks[1].sourceText, "下周五提交报告");
  assert.equal(multi.tasks[1].dueText, "下周五");

  const email = await extractor.extract(
    "From: teacher@example.com\nSubject: 论文\n下周五提交报告",
  );
  assert.equal(email.tasks.length, 1);
  assert.equal(email.tasks[0].title, "提交报告");
  assert.equal(email.tasks[0].sourceText, "下周五提交报告");
  assert.equal(email.tasks[0].dueText, "下周五");

  const sharedLink = await extractor.extract(
    "课程通知\nhttps://example.com/course.pdf\n下周五提交报告",
  );
  assert.equal(sharedLink.tasks.length, 1);
  assert.equal(sharedLink.tasks[0].title, "提交报告");
  assert.equal(sharedLink.tasks[0].sourceText, "下周五提交报告");

  const actionOnly = await extractor.extract("玩原神");
  assert.equal(actionOnly.tasks.length, 1);
  assert.equal(actionOnly.tasks[0].title, "玩原神");

  console.log(
    `Frontend mock extractor checks passed: ${
      single.tasks.length +
      multi.tasks.length +
      email.tasks.length +
      sharedLink.tasks.length +
      actionOnly.tasks.length
    }`,
  );
}

main();
