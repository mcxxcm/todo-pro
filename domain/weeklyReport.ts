import type { NormalizedTask } from "@/types/task";
import { computeProductivityStats } from "./productivityStats";

export interface WeeklyReport {
  weekLabel: string;
  startDate: string;
  endDate: string;
  completedCount: number;
  createdCount: number;
  completionRate: number;
  bestDay: { date: string; completed: number } | null;
  streakDays: number;
  topSourceType: string | null;
  avgCompletionHours: number | null;
  highPriorityCompleted: number;
  overdueCount: number;
  summary: string;
}

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getWeekLabel(date: Date): string {
  const start = getWeekStart(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const year = start.getFullYear();
  // ISO week number approximation
  const oneJan = new Date(year, 0, 1);
  const weekNum = Math.ceil(((start.getTime() - oneJan.getTime()) / 86400000 + oneJan.getDay() + 1) / 7);
  return `第 ${weekNum} 周`;
}

export function computeWeeklyReport(
  tasks: NormalizedTask[],
  reference: Date = new Date(),
): WeeklyReport {
  const weekStart = getWeekStart(reference);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const weekTasks = tasks.filter((t) => {
    const created = new Date(t.createdAt).getTime();
    const completed = t.completedAt ? new Date(t.completedAt).getTime() : null;
    return (
      (created >= weekStart.getTime() && created < weekEnd.getTime()) ||
      (completed !== null && completed >= weekStart.getTime() && completed < weekEnd.getTime())
    );
  });

  const stats = computeProductivityStats(weekTasks, reference, 7);

  const completedCount = weekTasks.filter((t) => t.status === "done").length;
  const createdCount = weekTasks.length;

  // Best day in week
  let bestDay: { date: string; completed: number } | null = null;
  for (const point of stats.dailyTrend) {
    if (!bestDay || point.completed > bestDay.completed) {
      bestDay = { date: point.date, completed: point.completed };
    }
  }

  // Top source type
  const topSource = stats.sourceDistribution[0]?.sourceType ?? null;

  // High priority completed
  const highPriorityCompleted = weekTasks.filter(
    (t) => t.status === "done" && t.priority === "high",
  ).length;

  // Overdue in week
  const overdueCount = weekTasks.filter((t) => {
    if (t.status !== "todo" || !t.dueAt) return false;
    const dueTime = new Date(t.dueAt).getTime();
    const now = reference.getTime();
    return dueTime < now && dueTime >= weekStart.getTime();
  }).length;

  // Completion rate (tasks created or completed this week)
  const totalClosed = weekTasks.filter((t) => t.status === "done" || t.status === "archived").length;
  const completionRate = weekTasks.length === 0 ? 0 : completedCount / weekTasks.length;

  const dayNames = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  const bestDayLabel = bestDay
    ? `${bestDay.date} (${dayNames[new Date(bestDay.date).getDay()]})`
    : "";

  const summaryParts: string[] = [];
  summaryParts.push(`完成 ${completedCount} 个任务`);
  if (createdCount > completedCount) {
    summaryParts.push(`新增 ${createdCount} 个`);
  }
  if (highPriorityCompleted > 0) {
    summaryParts.push(`${highPriorityCompleted} 个高优先级`);
  }
  if (bestDay) {
    summaryParts.push(`最高产: ${bestDayLabel} (${bestDay.completed}个)`);
  }
  if (topSource) {
    summaryParts.push(`主要来源: ${topSource}`);
  }
  if (stats.streakDays >= 7) {
    summaryParts.push("连续 7 天打卡");
  }

  return {
    weekLabel: getWeekLabel(reference),
    startDate: weekStart.toISOString(),
    endDate: weekEnd.toISOString(),
    completedCount,
    createdCount,
    completionRate,
    bestDay,
    streakDays: stats.streakDays,
    topSourceType: topSource,
    avgCompletionHours: stats.avgCompletionHours,
    highPriorityCompleted,
    overdueCount,
    summary: summaryParts.join(" · "),
  };
}
