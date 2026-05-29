import assert from "node:assert/strict";
import { normalizeBackendExtractionResponse } from "./extractionApi";

assert.deepEqual(
  normalizeBackendExtractionResponse({
    tasks: [
      {
        confidence: 2,
        dueAt: " 2026-05-29T07:00:00.000Z ",
        dueText: " 明天 15:00 ",
        notes: " 先更新客户端 ",
        sourceText: " 明天下午三点玩原神 ",
        title: " 玩原神 ",
      },
      {
        confidence: 0.2,
        title: " ",
      },
    ],
  }),
  {
    tasks: [
      {
        confidence: 1,
        dueAt: "2026-05-29T07:00:00.000Z",
        dueText: "明天 15:00",
        notes: "先更新客户端",
        sourceText: "明天下午三点玩原神",
        title: "玩原神",
      },
    ],
  },
);

assert.deepEqual(normalizeBackendExtractionResponse({ tasks: "bad" }), {
  tasks: [],
});

console.log("Backend extraction API normalization checks passed: 2");

