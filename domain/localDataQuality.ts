import { findDuplicateTaskGroups } from "@/domain/taskDuplicates";
import type { TaskDraft } from "@/types/draft";
import type { SourceItem } from "@/types/source";
import type { NormalizedTask } from "@/types/task";

export interface LocalDataQuality {
  archivedTasks: number;
  duplicateGroups: number;
  openTasks: number;
  orphanSources: number;
  pendingDrafts: number;
  sourceBackedTasks: number;
  sourceCoverageRate: number;
  timeReviewTasks: number;
  trustScore: number;
  recommendedActions: string[];
}

export function buildLocalDataQuality(input: {
  drafts: TaskDraft[];
  sources: SourceItem[];
  tasks: NormalizedTask[];
}): LocalDataQuality {
  const openTasks = input.tasks.filter((task) => task.status === "todo");
  const archivedTasks = input.tasks.filter((task) => task.status === "archived").length;
  const sourceBackedTasks = openTasks.filter(
    (task) => task.sourceId || task.sourceText,
  ).length;
  const sourceCoverageRate = openTasks.length === 0
    ? 1
    : sourceBackedTasks / openTasks.length;
  const timeReviewTasks = openTasks.filter(
    (task) =>
      task.timeStatus === "needs_review" ||
      task.needsConfirmation ||
      (task.dueText && task.timeConfidence === "low"),
  ).length;
  const duplicateGroups = findDuplicateTaskGroups(openTasks).length;
  const sourceIdsInUse = new Set(
    input.tasks.map((task) => task.sourceId).filter(Boolean),
  );
  const orphanSources = input.sources.filter(
    (source) => !sourceIdsInUse.has(source.id),
  ).length;
  const pendingDrafts = input.drafts.filter(
    (draft) => draft.status === "pending" || draft.status === "edited",
  ).length;

  const trustScore = clampScore(
    100 -
      Math.round((1 - sourceCoverageRate) * 24) -
      timeReviewTasks * 12 -
      duplicateGroups * 10 -
      pendingDrafts * 8 -
      Math.min(orphanSources * 2, 10),
  );

  return {
    archivedTasks,
    duplicateGroups,
    openTasks: openTasks.length,
    orphanSources,
    pendingDrafts,
    sourceBackedTasks,
    sourceCoverageRate,
    timeReviewTasks,
    trustScore,
    recommendedActions: buildRecommendedActions({
      duplicateGroups,
      orphanSources,
      pendingDrafts,
      sourceCoverageRate,
      timeReviewTasks,
    }),
  };
}

function buildRecommendedActions(input: {
  duplicateGroups: number;
  orphanSources: number;
  pendingDrafts: number;
  sourceCoverageRate: number;
  timeReviewTasks: number;
}) {
  const actions: string[] = [];

  if (input.pendingDrafts > 0) actions.push("审核未处理草稿");
  if (input.timeReviewTasks > 0) actions.push("确认模糊时间");
  if (input.duplicateGroups > 0) actions.push("合并重复任务");
  if (input.sourceCoverageRate < 0.7) actions.push("补充任务来源");
  if (input.orphanSources > 0) actions.push("清理孤立来源");
  if (actions.length === 0) actions.push("当前收件箱质量良好");

  return actions.slice(0, 3);
}

function clampScore(score: number) {
  return Math.max(0, Math.min(100, score));
}
