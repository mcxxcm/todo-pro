import type { NormalizedTask } from "@/types/task";
import { findDuplicateTaskGroups } from "@/domain/taskDuplicates";

export interface TaskBriefing {
  focusTaskIds: string[];
  metrics: {
    open: number;
    overdue: number;
    today: number;
    needsTimeReview: number;
    sourceBacked: number;
    highPriority: number;
    duplicateRisk: number;
  };
  narrative: string;
  recommendedActions: string[];
}

export function buildTaskBriefing(
  tasks: NormalizedTask[],
  reference: Date = new Date(),
): TaskBriefing {
  const openTasks = tasks.filter((task) => task.status === "todo");
  const startOfToday = new Date(
    reference.getFullYear(),
    reference.getMonth(),
    reference.getDate(),
  ).getTime();
  const startOfTomorrow = startOfToday + 24 * 60 * 60 * 1000;

  let overdue = 0;
  let today = 0;
  let needsTimeReview = 0;
  let sourceBacked = 0;
  let highPriority = 0;

  for (const task of openTasks) {
    const dueTime = task.dueAt ? new Date(task.dueAt).getTime() : Number.NaN;
    if (!Number.isNaN(dueTime) && dueTime < startOfToday) overdue += 1;
    if (
      !Number.isNaN(dueTime) &&
      dueTime >= startOfToday &&
      dueTime < startOfTomorrow
    ) {
      today += 1;
    }
    if (task.sourceId || task.sourceText) sourceBacked += 1;
    if (task.priority === "high") highPriority += 1;
    if (
      task.timeStatus === "needs_review" ||
      task.needsConfirmation ||
      (task.dueText && task.timeConfidence === "low")
    ) {
      needsTimeReview += 1;
    }
  }

  const focusTaskIds = openTasks
    .slice()
    .sort((a, b) => getFocusScore(b, reference) - getFocusScore(a, reference))
    .filter((task) => getFocusScore(task, reference) > 0)
    .slice(0, 4)
    .map((task) => task.id);

  const duplicateRisk = findDuplicateTaskGroups(openTasks).length;
  const recommendedActions = buildRecommendedActions({
    duplicateRisk,
    highPriority,
    needsTimeReview,
    open: openTasks.length,
    overdue,
    sourceBacked,
    today,
  });

  return {
    focusTaskIds,
    metrics: {
      open: openTasks.length,
      overdue,
      today,
      needsTimeReview,
      sourceBacked,
      highPriority,
      duplicateRisk,
    },
    narrative: buildNarrative({
      highPriority,
      needsTimeReview,
      open: openTasks.length,
      overdue,
      sourceBacked,
      today,
      duplicateRisk,
    }),
    recommendedActions,
  };
}

function getFocusScore(task: NormalizedTask, reference: Date) {
  if (task.status !== "todo") return 0;

  let score = 0;
  const dueTime = task.dueAt ? new Date(task.dueAt).getTime() : Number.NaN;
  const startOfToday = new Date(
    reference.getFullYear(),
    reference.getMonth(),
    reference.getDate(),
  ).getTime();
  const startOfTomorrow = startOfToday + 24 * 60 * 60 * 1000;

  if (!Number.isNaN(dueTime) && dueTime < startOfToday) score += 8;
  if (
    !Number.isNaN(dueTime) &&
    dueTime >= startOfToday &&
    dueTime < startOfTomorrow
  ) {
    score += 6;
  }
  if (task.priority === "high") score += 4;
  if (task.timeStatus === "needs_review" || task.needsConfirmation) score += 3;
  if (task.sourceId || task.sourceText) score += 1;

  return score;
}

function buildNarrative(metrics: TaskBriefing["metrics"]) {
  if (metrics.open === 0) {
    return "收件箱已经清空，可以从分享、图片或文本继续捕捉下一批任务。";
  }

  const signals = [
    `当前有 ${metrics.open} 个待处理任务`,
    metrics.today > 0 ? `${metrics.today} 个今天要完成` : undefined,
    metrics.overdue > 0 ? `${metrics.overdue} 个已逾期` : undefined,
    metrics.needsTimeReview > 0
      ? `${metrics.needsTimeReview} 个时间需要确认`
      : undefined,
    metrics.sourceBacked > 0
      ? `${metrics.sourceBacked} 个带来源证据`
      : undefined,
    metrics.duplicateRisk > 0 ? `${metrics.duplicateRisk} 组疑似重复` : undefined,
  ].filter(Boolean);

  return `${signals.join("，")}。`;
}

function buildRecommendedActions(metrics: TaskBriefing["metrics"]) {
  const actions: string[] = [];

  if (metrics.needsTimeReview > 0) actions.push("先确认模糊时间");
  if (metrics.overdue > 0) actions.push("处理逾期任务");
  if (metrics.today > 0) actions.push("推进今天截止的任务");
  if (metrics.highPriority > 0) actions.push("优先看高优先级");
  if (metrics.duplicateRisk > 0) actions.push("合并疑似重复任务");
  if (metrics.sourceBacked > 0) actions.push("必要时回看来源证据");
  if (actions.length === 0 && metrics.open > 0) actions.push("从收件箱挑出下一件事");
  if (actions.length === 0) actions.push("继续捕捉新的来源");

  return actions.slice(0, 3);
}
