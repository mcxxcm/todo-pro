import type { NormalizedTask, TaskPriority } from "@/types/task";

export interface DuplicateTaskGroup {
  key: string;
  primaryId: string;
  duplicateIds: string[];
  taskIds: string[];
}

export function findDuplicateTaskGroups(
  tasks: NormalizedTask[],
): DuplicateTaskGroup[] {
  const groups = new Map<string, NormalizedTask[]>();

  for (const task of tasks) {
    if (task.status !== "todo") continue;
    const key = getDuplicateTaskKey(task);
    if (!key) continue;
    const group = groups.get(key) ?? [];
    group.push(task);
    groups.set(key, group);
  }

  return Array.from(groups.entries())
    .filter(([, group]) => group.length > 1)
    .map(([key, group]) => {
      const sorted = group.slice().sort(sortDuplicateCandidates);
      const [primary, ...duplicates] = sorted;

      return {
        key,
        primaryId: primary.id,
        duplicateIds: duplicates.map((task) => task.id),
        taskIds: sorted.map((task) => task.id),
      };
    });
}

export function getDuplicateTaskKey(task: NormalizedTask) {
  const titleKey = task.title
    .toLocaleLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, "");

  if (titleKey.length < 2) return "";

  const dateKey = task.dueAt ? task.dueAt.slice(0, 10) : task.dueText ?? "";
  return `${titleKey}:${dateKey}`;
}

function sortDuplicateCandidates(a: NormalizedTask, b: NormalizedTask) {
  return (
    getCandidateScore(b) - getCandidateScore(a) ||
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

function getCandidateScore(task: NormalizedTask) {
  let score = 0;
  if (task.sourceId || task.sourceText) score += 4;
  if (task.dueAt) score += 3;
  if (task.timeStatus === "confirmed") score += 2;
  score += getPriorityScore(task.priority);
  return score;
}

function getPriorityScore(priority: TaskPriority) {
  switch (priority) {
    case "high":
      return 3;
    case "medium":
      return 2;
    case "low":
      return 1;
    case "none":
    default:
      return 0;
  }
}
