import assert from "node:assert/strict";
import { buildDecompositionPrompt, parseDecompositionResult, resetDecompositionIdCounter } from "./taskDecomposition";

// buildDecompositionPrompt
{
  const prompt = buildDecompositionPrompt({ title: "准备期末考试" });
  assert.ok(prompt.includes("准备期末考试"));
  assert.ok(prompt.includes("JSON"));
  assert.ok(prompt.includes("estimatedMinutes"));
}

{
  const prompt = buildDecompositionPrompt({
    title: "写报告",
    notes: "需要参考周报数据",
    dueAt: "2025-08-01T00:00:00Z",
  });
  assert.ok(prompt.includes("写报告"));
  assert.ok(prompt.includes("周报数据"));
  assert.ok(prompt.includes("2025/8/1"));
}

// parseDecompositionResult — valid JSON
{
  resetDecompositionIdCounter();
  const result = parseDecompositionResult(`[
    {"title": "整理笔记", "estimatedMinutes": 60},
    {"title": "做真题", "estimatedMinutes": 90}
  ]`);
  assert.equal(result.subtasks.length, 2);
  assert.equal(result.subtasks[0].title, "整理笔记");
  assert.equal(result.subtasks[0].estimatedMinutes, 60);
  assert.equal(result.subtasks[0].status, "todo");
  assert.equal(result.totalEstimatedMinutes, 150);
}

// parseDecompositionResult — fallback line parsing
{
  resetDecompositionIdCounter();
  const result = parseDecompositionResult("1. 整理笔记\n2. 做真题 (预计 90 分钟)\n3. 复习错题");
  assert.equal(result.subtasks.length, 3);
  assert.equal(result.subtasks[1].estimatedMinutes, 90);
}

// parseDecompositionResult — empty response
{
  resetDecompositionIdCounter();
  const result = parseDecompositionResult("");
  assert.equal(result.subtasks.length, 0);
  assert.equal(result.totalEstimatedMinutes, 0);
}

console.log("taskDecomposition tests passed: 4");
