import assert from "node:assert/strict";
import {
  buildSourceTimeline,
  getOrphanSourceIds,
  getShortSourceTypeLabel,
  getSourceTypeLabel,
} from "./sourceTimeline";
import type { TaskDraft } from "../types/draft";
import type { SourceItem } from "../types/source";
import type { NormalizedTask } from "../types/task";

const source: SourceItem = {
  createdAt: "2026-05-28T08:00:00.000Z",
  id: "source-1",
  metadata: { url: "https://example.com/course.pdf" },
  rawContent: "下周五提交课程报告",
  title: "课程通知",
  type: "pdf",
};

const task: NormalizedTask = {
  createdAt: "2026-05-28T08:10:00.000Z",
  id: "task-1",
  needsConfirmation: false,
  priority: "none",
  provider: "local",
  sourceId: "source-1",
  status: "todo",
  tags: [],
  timeConfidence: "medium",
  title: "提交课程报告",
  updatedAt: "2026-05-28T08:10:00.000Z",
};

const draft: TaskDraft = {
  confidence: 0.8,
  createdAt: "2026-05-28T08:05:00.000Z",
  id: "draft-1",
  priority: "none",
  sourceId: "source-1",
  sourceText: "下周五提交课程报告",
  status: "accepted",
  tags: [],
  timeConfidence: "medium",
  title: "提交课程报告",
  updatedAt: "2026-05-28T08:05:00.000Z",
};

const timeline = buildSourceTimeline({
  drafts: [draft],
  sources: [
    {
      createdAt: "2026-05-27T08:00:00.000Z",
      id: "source-2",
      metadata: { url: "https://example.com" },
      type: "link",
    },
    source,
  ],
  tasks: [task],
});

assert.equal(getSourceTypeLabel("email"), "邮件来源");
assert.equal(getShortSourceTypeLabel("email"), "邮件");
assert.equal(getShortSourceTypeLabel("image"), "OCR");
assert.equal(timeline[0].id, "source-1");
assert.equal(timeline[0].taskCount, 1);
assert.equal(timeline[0].draftCount, 1);
assert.equal(timeline[0].isOrphan, false);
assert.equal(timeline[0].url, "https://example.com/course.pdf");
assert.equal(timeline[1].preview, "https://example.com");
assert.equal(timeline[1].isOrphan, true);
assert.deepEqual(
  getOrphanSourceIds({
    drafts: [draft],
    sources: [
      {
        createdAt: "2026-05-27T08:00:00.000Z",
        id: "source-2",
        metadata: { url: "https://example.com" },
        type: "link",
      },
      source,
    ],
    tasks: [task],
  }),
  ["source-2"],
);

console.log("Source timeline checks passed: 11");
