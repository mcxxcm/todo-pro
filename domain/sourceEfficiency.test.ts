import assert from "node:assert/strict";
import { computeSourceEfficiency } from "./sourceEfficiency";
import type { NormalizedTask } from "../types/task";

function t(overrides: Partial<NormalizedTask> & { title: string; id: string }): NormalizedTask {
  const now = new Date().toISOString();
  return {
    status: "todo",
    priority: "none", tags: [], timeConfidence: "none",
    needsConfirmation: false, provider: "local",
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
    sourceType: "manual", ...overrides,
  };
}

const ref = new Date("2025-07-15T12:00:00Z");

{
  const tasks: NormalizedTask[] = [
    t({ title: "a", id: "a", sourceType: "image", status: "done", completedAt: "2025-07-15T10:00:00Z", createdAt: "2025-07-14T10:00:00Z" }),
    t({ title: "b", id: "b", sourceType: "image", createdAt: "2025-07-14T10:00:00Z" }),
    t({ title: "c", id: "c", sourceType: "share", status: "done", completedAt: "2025-07-15T10:00:00Z", createdAt: "2025-07-14T10:00:00Z" }),
  ];
  const report = computeSourceEfficiency(tasks, ref);
  assert.equal(report.entries.length, 2);
  assert.equal(report.bestSource?.sourceType, "share");
  assert.equal(report.bestSource?.completionRate, 1);
}

{
  const tasks: NormalizedTask[] = [
    t({ title: "a", id: "a", sourceType: "image", status: "todo", dueAt: "2025-07-01T00:00:00Z", createdAt: "2025-06-01T00:00:00Z" }),
  ];
  const report = computeSourceEfficiency(tasks, ref);
  assert.equal(report.entries[0].overdueCount, 1);
}

{
  const report = computeSourceEfficiency([], ref);
  assert.equal(report.overallCompletionRate, 0);
  assert.equal(report.bestSource, null);
}

console.log("sourceEfficiency tests passed: 3");
