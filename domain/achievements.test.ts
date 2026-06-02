import assert from "node:assert/strict";
import { checkAchievements } from "./achievements";
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

// centurion: 100 completed
{
  const tasks: NormalizedTask[] = Array.from({ length: 100 }, (_, i) =>
    t({ title: `task-${i}`, id: `id-${i}`, status: "done", completedAt: "2025-07-15T10:00:00Z", createdAt: "2025-07-14T10:00:00Z" })
  );
  const result = checkAchievements(tasks, [], ref);
  const ids = result.map((a) => a.id);
  assert.ok(ids.includes("centurion"));
  assert.ok(ids.includes("completionist")); // 100 in one day
}

// streak_7
{
  const tasks: NormalizedTask[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(ref);
    date.setDate(date.getDate() - i);
    tasks.push(
      t({ title: `task-${i}`, id: `id-${i}`, status: "done", completedAt: date.toISOString(), createdAt: date.toISOString() })
    );
  }
  const result = checkAchievements(tasks, [], ref);
  assert.ok(result.map((a) => a.id).includes("streak_7"));
}

// collector: 10 unique tags
{
  const tasks: NormalizedTask[] = Array.from({ length: 10 }, (_, i) =>
    t({ title: `task-${i}`, id: `id-${i}`, tags: [`tag-${i}`], createdAt: "2025-07-14T10:00:00Z" })
  );
  const result = checkAchievements(tasks, [], ref);
  assert.ok(result.map((a) => a.id).includes("collector"));
}

// speed_demon: 10 within 1 hour
{
  const tasks: NormalizedTask[] = Array.from({ length: 10 }, (_, i) =>
    t({
      title: `task-${i}`, id: `id-${i}`, status: "done",
      completedAt: "2025-07-15T10:30:00Z",
      createdAt: "2025-07-15T10:00:00Z",
    })
  );
  const result = checkAchievements(tasks, [], ref);
  assert.ok(result.map((a) => a.id).includes("speed_demon"));
}

// no new achievements when already unlocked
{
  const tasks: NormalizedTask[] = Array.from({ length: 100 }, (_, i) =>
    t({ title: `task-${i}`, id: `id-${i}`, status: "done", completedAt: "2025-07-15T10:00:00Z", createdAt: "2025-07-14T10:00:00Z" })
  );
  const result = checkAchievements(tasks, ["centurion"], ref);
  assert.ok(!result.map((a) => a.id).includes("centurion"));
}

console.log("achievements tests passed: 5");
