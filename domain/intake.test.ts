import assert from "node:assert/strict";
import { classifyIntake } from "./intake";

assert.deepEqual(classifyIntake("明天交作业"), {
  sourceType: "text",
  titlePrefix: "文本输入",
});

assert.deepEqual(classifyIntake("https://example.com/todos 明天看", "share"), {
  sourceType: "link",
  titlePrefix: "分享链接",
  url: "https://example.com/todos",
});

assert.deepEqual(classifyIntake("截图识别出的 https://example.com", "image"), {
  sourceType: "image",
  titlePrefix: "图片 OCR",
  url: "https://example.com",
});

assert.deepEqual(classifyIntake("From: teacher@example.com\nSubject: 下周五交报告"), {
  sourceType: "email",
  titlePrefix: "邮件文本",
});

assert.deepEqual(classifyIntake("主题：论文\nhttps://example.com/rubric", "share"), {
  sourceType: "email",
  titlePrefix: "分享邮件",
  url: "https://example.com/rubric",
});

assert.deepEqual(classifyIntake("https://example.com/course.pdf", "share"), {
  sourceType: "pdf",
  titlePrefix: "分享 PDF",
  url: "https://example.com/course.pdf",
});

assert.deepEqual(
  classifyIntake("Subject: 课程资料\nhttps://example.com/course.pdf", "share"),
  {
    sourceType: "email",
    titlePrefix: "分享邮件",
    url: "https://example.com/course.pdf",
  },
);

console.log("Intake classification checks passed: 7");
