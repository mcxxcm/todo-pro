import assert from "node:assert/strict";
import { computeTaskXp, computeTotalXp, xpToLevel, computeXpStatus } from "./xpLevel";
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

// base XP (no bonuses)
{
  const task = t({ title: "a", id: "a", status: "done", completedAt: "2025-07-15T10:00:00Z", sourceType: undefined as any, sourceText: undefined, sourceId: undefined });
  assert.equal(computeTaskXp(task), 10); // base only, no source
}

// high priority bonus
{
  const task = t({ title: "a", id: "a", status: "done", priority: "high", completedAt: "2025-07-15T10:00:00Z", sourceId: undefined, sourceText: undefined });
  assert.equal(computeTaskXp(task), 10 + 10); // base + high
}

// on-time bonus
{
  const task = t({
    title: "a", id: "a", status: "done",
    dueAt: "2025-07-16T00:00:00Z",
    completedAt: "2025-07-15T10:00:00Z",
    sourceId: undefined,
    sourceText: undefined,
  });
  assert.equal(computeTaskXp(task), 10 + 15); // base + overdue prevention
}

// total XP and level
{
  const tasks: NormalizedTask[] = Array.from({ length: 25 }, (_, i) =>
    t({ title: `t-${i}`, id: `id-${i}`, status: "done", completedAt: "2025-07-15T10:00:00Z", sourceText: undefined, sourceId: undefined })
  );
  const xp = computeTotalXp(tasks);
  assert.equal(xp, 25 * 10); // 25 * base
  const level = xpToLevel(xp);
  assert.equal(level, Math.floor(Math.sqrt(250 / 100)) + 1); // sqrt(2.5) = 1, +1 = 2
}

// xpStatus
{
  const tasks: NormalizedTask[] = Array.from({ length: 50 }, (_, i) =>
    t({ title: `t-${i}`, id: `id-${i}`, status: "done", completedAt: "2025-07-15T10:00:00Z", sourceText: undefined, sourceId: undefined })
  );
  const status = computeXpStatus(tasks);
  assert.equal(status.xp, 500);
  assert.equal(status.level, 3); // sqrt(5) = 2, +1 = 3
  assert.ok(status.levelProgress > 0 && status.levelProgress < 1);
}

// level boundaries
{
  assert.equal(xpToLevel(0), 1);
  assert.equal(xpToLevel(99), 1);
  assert.equal(xpToLevel(100), 2);
  assert.equal(xpToLevel(399), 2);
  assert.equal(xpToLevel(400), 3);
}

console.log("xpLevel tests passed: 6");
