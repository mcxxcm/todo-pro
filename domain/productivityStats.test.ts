import assert from "node:assert/strict";
import { computeProductivityStats } from "./productivityStats";
import type { NormalizedTask } from "../types/task";

function t(overrides: Partial<NormalizedTask> & { title: string; id: string }): NormalizedTask {
  const now = new Date().toISOString();
  return {
    status: "todo",
    priority: "none",
    tags: [],
    timeConfidence: "none",
    needsConfirmation: false,
    provider: "local",
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
    sourceType: "manual",
    ...overrides,
  };
}

const ref = new Date("2025-07-15T12:00:00Z");

// 1. Empty task list
{
  const stats = computeProductivityStats([], ref);
  assert.equal(stats.completionRate, 0);
  assert.equal(stats.totalOpen, 0);
  assert.equal(stats.totalDone, 0);
  assert.equal(stats.streakDays, 0);
  assert.equal(stats.dailyTrend.length, 7);
}

// 2. Completion rate
{
  const tasks: NormalizedTask[] = [
    t({ title: "a", id: "a", status: "done", completedAt: "2025-07-15T10:00:00Z", createdAt: "2025-07-14T10:00:00Z" }),
    t({ title: "b", id: "b", createdAt: "2025-07-14T10:00:00Z" }),
    t({ title: "c", id: "c", createdAt: "2025-07-14T10:00:00Z" }),
  ];
  const stats = computeProductivityStats(tasks, ref);
  assert.ok(Math.abs(stats.completionRate - 1 / 3) < 0.01);
  assert.equal(stats.totalDone, 1);
  assert.equal(stats.totalOpen, 2);
}

// 3. Streak days
{
  const tasks: NormalizedTask[] = [
    t({ title: "a", id: "a", status: "done", completedAt: "2025-07-15T10:00:00Z", createdAt: "2025-07-14T00:00:00Z" }),
    t({ title: "b", id: "b", status: "done", completedAt: "2025-07-14T10:00:00Z", createdAt: "2025-07-13T00:00:00Z" }),
    t({ title: "c", id: "c", status: "done", completedAt: "2025-07-13T10:00:00Z", createdAt: "2025-07-12T00:00:00Z" }),
  ];
  const stats = computeProductivityStats(tasks, ref);
  assert.equal(stats.streakDays, 3);
}

// 4. Streak breaks on missing day
{
  const tasks: NormalizedTask[] = [
    t({ title: "a", id: "a", status: "done", completedAt: "2025-07-15T10:00:00Z", createdAt: "2025-07-14T00:00:00Z" }),
    t({ title: "c", id: "c", status: "done", completedAt: "2025-07-13T10:00:00Z", createdAt: "2025-07-12T00:00:00Z" }),
  ];
  const stats = computeProductivityStats(tasks, ref);
  assert.equal(stats.streakDays, 1);
}

// 5. Source distribution
{
  const tasks: NormalizedTask[] = [
    t({ title: "a", id: "a", status: "done", sourceType: "image", completedAt: "2025-07-15T10:00:00Z", createdAt: "2025-07-14T00:00:00Z" }),
    t({ title: "b", id: "b", sourceType: "image", createdAt: "2025-07-14T00:00:00Z" }),
    t({ title: "c", id: "c", status: "done", sourceType: "share", completedAt: "2025-07-15T10:00:00Z", createdAt: "2025-07-14T00:00:00Z" }),
  ];
  const stats = computeProductivityStats(tasks, ref);
  assert.equal(stats.sourceDistribution.length, 2);
  const imageStats = stats.sourceDistribution.find((s) => s.sourceType === "image");
  assert.ok(imageStats);
  assert.equal(imageStats!.count, 2);
  assert.equal(imageStats!.completed, 1);
  assert.equal(imageStats!.completionRate, 0.5);
}

// 6. Daily trend
{
  const tasks: NormalizedTask[] = [
    t({ title: "a", id: "a", status: "done", completedAt: "2025-07-15T10:00:00Z", createdAt: "2025-07-15T09:00:00Z" }),
  ];
  const stats = computeProductivityStats(tasks, ref, 7);
  const todayPoint = stats.dailyTrend.find((p) => p.date === "2025-07-15");
  assert.ok(todayPoint);
  assert.equal(todayPoint!.completed, 1);
  assert.equal(todayPoint!.created, 1);
}

// 7. Most productive day
{
  const monday = "2025-07-14T10:00:00Z";
  const tuesday = "2025-07-15T10:00:00Z";
  const tasks: NormalizedTask[] = [
    t({ title: "a", id: "a", status: "done", completedAt: monday, createdAt: monday }),
    t({ title: "b", id: "b", status: "done", completedAt: tuesday, createdAt: tuesday }),
    t({ title: "c", id: "c", status: "done", completedAt: tuesday, createdAt: tuesday }),
  ];
  const stats = computeProductivityStats(tasks, ref);
  assert.equal(stats.mostProductiveDay, "周二");
}

// 8. Tasks without sourceType default to "manual"
{
  const tasks: NormalizedTask[] = [
    t({ title: "a", id: "a", sourceType: undefined as any, createdAt: "2025-07-14T00:00:00Z" }),
  ];
  const stats = computeProductivityStats(tasks, ref);
  assert.equal(stats.sourceDistribution[0].sourceType, "manual");
}

console.log("productivityStats tests passed: 8");
