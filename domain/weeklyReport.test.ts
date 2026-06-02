import assert from "node:assert/strict";
import { computeWeeklyReport, getWeekLabel } from "./weeklyReport";
import type { NormalizedTask } from "../types/task";

function t(overrides: Partial<NormalizedTask> & { title: string; id: string }): NormalizedTask {
  const now = new Date().toISOString();
  return {
    status: "todo", priority: "none", tags: [], timeConfidence: "none",
    needsConfirmation: false, provider: "local",
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
    sourceType: "manual",
    ...overrides,
  };
}

const ref = new Date("2025-07-16T12:00:00Z"); // Wednesday

// empty report
{
  const report = computeWeeklyReport([], ref);
  assert.equal(report.completedCount, 0);
  assert.equal(report.createdCount, 0);
  assert.equal(report.completionRate, 0);
}

// report with tasks this week
{
  const tasks: NormalizedTask[] = [
    t({ title: "a", id: "a", status: "done", priority: "high", completedAt: "2025-07-15T10:00:00Z", createdAt: "2025-07-14T10:00:00Z" }),
    t({ title: "b", id: "b", status: "done", completedAt: "2025-07-16T10:00:00Z", createdAt: "2025-07-16T09:00:00Z" }),
    t({ title: "c", id: "c", createdAt: "2025-07-16T10:00:00Z" }),
  ];
  const report = computeWeeklyReport(tasks, ref);
  assert.equal(report.completedCount, 2);
  assert.equal(report.createdCount, 3);
  assert.equal(report.highPriorityCompleted, 1);
  assert.ok(report.summary.includes("完成 2 个任务"));
  assert.ok(report.summary.includes("1 个高优先级"));
}

// week label
{
  // July 16 2025 is Wednesday of week starting Monday July 14
  const label = getWeekLabel(ref);
  const weekStart = new Date("2025-07-14T00:00:00Z");
  const oneJan = new Date(2025, 0, 1);
  const expectedWeek = Math.ceil(((weekStart.getTime() - oneJan.getTime()) / 86400000 + oneJan.getDay() + 1) / 7);
  assert.ok(label.includes(String(expectedWeek)));
}

console.log("weeklyReport tests passed: 3");
