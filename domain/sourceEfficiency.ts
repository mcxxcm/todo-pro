import type { NormalizedTask } from "@/types/task";
import type { SourceItemType } from "@/types/source";

export interface SourceEfficiency {
  sourceType: SourceItemType | "manual";
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  avgCompletionHours: number | null;
  overdueCount: number;
  needsReviewCount: number;
}

export interface SourceEfficiencyReport {
  entries: SourceEfficiency[];
  bestSource: SourceEfficiency | null;
  worstSource: SourceEfficiency | null;
  overallCompletionRate: number;
}

export function computeSourceEfficiency(
  tasks: NormalizedTask[],
  reference: Date = new Date(),
): SourceEfficiencyReport {
  const nonArchived = tasks.filter((t) => t.status !== "archived");
  const sourceMap = new Map<string, SourceEfficiency>();

  for (const task of nonArchived) {
    const sourceType = task.sourceType ?? "manual";
    let entry = sourceMap.get(sourceType);
    if (!entry) {
      entry = {
        sourceType: sourceType as SourceItemType | "manual",
        totalTasks: 0,
        completedTasks: 0,
        completionRate: 0,
        avgCompletionHours: null,
        overdueCount: 0,
        needsReviewCount: 0,
      };
      sourceMap.set(sourceType, entry);
    }

    entry.totalTasks += 1;

    if (task.status === "done") {
      entry.completedTasks += 1;
    }

    if (
      task.timeStatus === "needs_review" ||
      task.needsConfirmation ||
      (task.dueText && task.timeConfidence === "low")
    ) {
      entry.needsReviewCount += 1;
    }

    if (task.dueAt && task.status === "todo") {
      const dueTime = new Date(task.dueAt).getTime();
      if (dueTime < reference.getTime()) {
        entry.overdueCount += 1;
      }
    }
  }

  // Compute completion rates and avg hours
  const entries = Array.from(sourceMap.values()).map((entry) => {
    const rate = entry.totalTasks === 0 ? 0 : entry.completedTasks / entry.totalTasks;

    const completionTimes = nonArchived
      .filter(
        (t) =>
          (t.sourceType ?? "manual") === entry.sourceType &&
          t.status === "done" &&
          t.completedAt,
      )
      .map((t) => {
        const created = new Date(t.createdAt).getTime();
        const completed = new Date(t.completedAt!).getTime();
        return (completed - created) / (1000 * 60 * 60);
      })
      .filter((h) => h >= 0 && h < 720);

    const avgCompletionHours =
      completionTimes.length > 0
        ? completionTimes.reduce((sum, h) => sum + h, 0) / completionTimes.length
        : null;

    return { ...entry, completionRate: rate, avgCompletionHours };
  });

  entries.sort((a, b) => b.completionRate - a.completionRate);

  const overallDone = nonArchived.filter((t) => t.status === "done").length;
  const overallTotal = nonArchived.length;
  const overallCompletionRate = overallTotal === 0 ? 0 : overallDone / overallTotal;

  return {
    entries,
    bestSource: entries[0] ?? null,
    worstSource: entries[entries.length - 1] ?? null,
    overallCompletionRate,
  };
}
