import type { NormalizedTask } from "@/types/task";

export interface XpResult {
  xp: number;
  level: number;
  levelProgress: number;
  nextLevelXp: number;
}

const BASE_XP_PER_TASK = 10;
const HIGH_PRIORITY_BONUS = 10;
const OVERDUE_PREVENTION_BONUS = 15;
const SOURCE_BACKED_BONUS = 5;

/**
 * Compute XP earned for completing a single task.
 */
export function computeTaskXp(task: NormalizedTask, reference?: Date): number {
  let xp = BASE_XP_PER_TASK;

  if (task.priority === "high") xp += HIGH_PRIORITY_BONUS;
  if (task.priority === "medium") xp += 5;

  // Bonus for completing before due date
  if (task.dueAt && task.completedAt) {
    const dueTime = new Date(task.dueAt).getTime();
    const completedTime = new Date(task.completedAt).getTime();
    if (completedTime <= dueTime) {
      xp += OVERDUE_PREVENTION_BONUS;
    }
  }

  // Bonus for source-backed tasks
  if (task.sourceId || task.sourceText) {
    xp += SOURCE_BACKED_BONUS;
  }

  return xp;
}

/**
 * Compute total XP from all completed tasks.
 */
export function computeTotalXp(tasks: NormalizedTask[]): number {
  return tasks
    .filter((t) => t.status === "done")
    .reduce((sum, task) => sum + computeTaskXp(task), 0);
}

/**
 * Level formula: level = floor(sqrt(xp / 100))
 * Level 1: 0-99 XP, Level 2: 100-399, Level 3: 400-899, ...
 */
export function xpToLevel(totalXp: number): number {
  return Math.floor(Math.sqrt(totalXp / 100)) + 1;
}

/**
 * XP required to reach a given level.
 */
export function xpForLevel(level: number): number {
  return (level - 1) * (level - 1) * 100;
}

/**
 * Compute full XP status from all completed tasks.
 */
export function computeXpStatus(tasks: NormalizedTask[]): XpResult {
  const xp = computeTotalXp(tasks);
  const level = xpToLevel(xp);
  const currentLevelXp = xpForLevel(level);
  const nextLevelXp = xpForLevel(level + 1);
  const levelProgress =
    nextLevelXp === currentLevelXp
      ? 1
      : (xp - currentLevelXp) / (nextLevelXp - currentLevelXp);

  return { xp, level, levelProgress, nextLevelXp };
}
