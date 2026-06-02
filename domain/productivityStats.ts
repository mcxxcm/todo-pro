import type { NormalizedTask } from "@/types/task";
import type { SourceItemType } from "@/types/source";

export interface ProductivityStats {
  completionRate: number;
  totalOpen: number;
  totalDone: number;
  totalArchived: number;
  streakDays: number;
  dailyTrend: DailyTrendPoint[];
  sourceDistribution: SourceDistribution[];
  avgCompletionHours: number | null;
  mostProductiveDay: string | null;
  totalEstimatedMinutes: number;
  totalActualMinutes: number;
}

export interface DailyTrendPoint {
  date: string;
  completed: number;
  created: number;
}

export interface SourceDistribution {
  sourceType: SourceItemType | "manual" | "unknown";
  count: number;
  completed: number;
  completionRate: number;
}

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function computeProductivityStats(
  tasks: NormalizedTask[],
  reference: Date = new Date(),
  trendDays: number = 7,
): ProductivityStats {
  const open = tasks.filter((t) => t.status === "todo");
  const done = tasks.filter((t) => t.status === "done");
  const archived = tasks.filter((t) => t.status === "archived");

  const totalVisible = open.length + done.length;
  const completionRate = totalVisible === 0 ? 0 : done.length / totalVisible;

  // Streak: consecutive days (ending today) with at least 1 completed task
  const completionDates = new Set(
    done
      .map((t) => t.completedAt ?? t.updatedAt)
      .filter(Boolean)
      .map((d) => toDateKey(new Date(d!))),
  );

  let streakDays = 0;
  const today = startOfDay(reference);
  for (let i = 0; i < 365; i++) {
    const date = addDays(today, -i);
    if (completionDates.has(toDateKey(date))) {
      streakDays += 1;
    } else if (i > 0) {
      break;
    }
  }

  // Daily trend
  const dailyMap = new Map<string, { completed: number; created: number }>();
  for (let i = trendDays - 1; i >= 0; i--) {
    const dateKey = toDateKey(addDays(today, -i));
    dailyMap.set(dateKey, { completed: 0, created: 0 });
  }

  for (const task of tasks) {
    const createdKey = toDateKey(new Date(task.createdAt));
    if (dailyMap.has(createdKey)) {
      dailyMap.get(createdKey)!.created += 1;
    }
    if (task.status === "done") {
      const doneKey = toDateKey(new Date(task.completedAt ?? task.updatedAt));
      if (dailyMap.has(doneKey)) {
        dailyMap.get(doneKey)!.completed += 1;
      }
    }
  }

  const dailyTrend: DailyTrendPoint[] = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, counts]) => ({ date, ...counts }));

  // Source distribution
  const sourceMap = new Map<string, { count: number; completed: number }>();
  for (const task of [...open, ...done]) {
    const sourceType = task.sourceType ?? "manual";
    const entry = sourceMap.get(sourceType) ?? { count: 0, completed: 0 };
    entry.count += 1;
    if (task.status === "done") entry.completed += 1;
    sourceMap.set(sourceType, entry);
  }

  const sourceDistribution: SourceDistribution[] = Array.from(sourceMap.entries())
    .map(([sourceType, { count, completed }]) => ({
      sourceType: sourceType as SourceItemType | "manual",
      count,
      completed,
      completionRate: count === 0 ? 0 : completed / count,
    }))
    .sort((a, b) => b.count - a.count);

  // Average completion time
  const completionTimes = done
    .map((t) => {
      const created = new Date(t.createdAt).getTime();
      const completed = new Date(t.completedAt ?? t.updatedAt).getTime();
      return (completed - created) / (1000 * 60 * 60);
    })
    .filter((h) => h >= 0 && h < 720); // exclude outliers > 30 days

  const avgCompletionHours =
    completionTimes.length > 0
      ? completionTimes.reduce((sum, h) => sum + h, 0) / completionTimes.length
      : null;

  // Most productive day of week
  const dayCounts = [0, 0, 0, 0, 0, 0, 0];
  for (const task of done) {
    const d = new Date(task.completedAt ?? task.updatedAt);
    dayCounts[d.getDay()] += 1;
  }
  const maxDay = dayCounts.indexOf(Math.max(...dayCounts));
  const dayNames = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  const mostProductiveDay = done.length > 0 ? dayNames[maxDay] : null;

  // Estimate vs actual deviation
  const totalEstimatedMinutes = done.reduce((sum, t) => sum + (t.estimatedMinutes ?? 0), 0);
  const totalActualMinutes = done.reduce((sum, t) => sum + (t.actualMinutes ?? 0), 0);

  return {
    completionRate,
    totalOpen: open.length,
    totalDone: done.length,
    totalArchived: archived.length,
    streakDays,
    dailyTrend,
    sourceDistribution,
    avgCompletionHours,
    mostProductiveDay,
    totalEstimatedMinutes,
    totalActualMinutes,
  };
}
