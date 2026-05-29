import assert from "node:assert/strict";
import { normalizeDeepSeekExtractionResult } from "./deepseekProvider";

const result = normalizeDeepSeekExtractionResult({
  tasks: [
    {
      confidence: 1.5,
      dueText: "明天下午三点",
      notes: "  需要先更新客户端  ",
      sourceText: "明天下午三点玩原神",
      title: "  玩原神  ",
    },
    {
      confidence: Number.NaN,
      dueText: "",
      notes: "",
      sourceText: "",
      title: "   ",
    },
  ],
});

assert.equal(result.tasks.length, 1);
assert.equal(result.tasks[0].title, "玩原神");
assert.equal(result.tasks[0].sourceText, "明天下午三点玩原神");
assert.equal(result.tasks[0].dueText, "明天下午三点");
assert.equal(result.tasks[0].dueAt !== null, true);
assert.equal(result.tasks[0].notes, "需要先更新客户端");
assert.equal(result.tasks[0].confidence, 1);

const manyTasks = normalizeDeepSeekExtractionResult({
  tasks: Array.from({ length: 25 }, (_, index) => ({
    confidence: 0.5,
    dueText: null,
    notes: null,
    sourceText: `source ${index}`,
    title: `task ${index}`,
  })),
});

assert.equal(manyTasks.tasks.length, 20);
assert.deepEqual(normalizeDeepSeekExtractionResult({ tasks: "bad" }), {
  tasks: [],
});

console.log("DeepSeek normalization checks passed: 9");

