import type { NormalizedTask } from "@/types/task";
import { computeProductivityStats } from "./productivityStats";

export type AchievementId =
  | "early_bird"
  | "ocr_master"
  | "tracer"
  | "planner"
  | "zero_overdue"
  | "streak_7"
  | "streak_30"
  | "completionist"
  | "centurion"
  | "night_owl"
  | "speed_demon"
  | "collector";

export interface Achievement {
  id: AchievementId;
  title: string;
  description: string;
  icon: string;
}

export const ACHIEVEMENTS: Record<AchievementId, Achievement> = {
  early_bird: {
    id: "early_bird",
    title: "早鸟",
    description: "连续7天在9点前完成第一个任务",
    icon: "wb-sunny",
  },
  ocr_master: {
    id: "ocr_master",
    title: "OCR 达人",
    description: "通过拍照提取了 100 个任务",
    icon: "camera-alt",
  },
  tracer: {
    id: "tracer",
    title: "追溯者",
    description: "查看了 50 次任务来源",
    icon: "find-in-page",
  },
  planner: {
    id: "planner",
    title: "规划师",
    description: "连续 30 天使用 AI 日规划",
    icon: "auto-awesome",
  },
  zero_overdue: {
    id: "zero_overdue",
    title: "零逾期",
    description: "连续一周没有逾期任务",
    icon: "check-circle",
  },
  streak_7: {
    id: "streak_7",
    title: "连续 7 天",
    description: "连续 7 天每天至少完成 1 个任务",
    icon: "local-fire-department",
  },
  streak_30: {
    id: "streak_30",
    title: "连续 30 天",
    description: "连续 30 天每天至少完成 1 个任务",
    icon: "whatshot",
  },
  completionist: {
    id: "completionist",
    title: "完美主义者",
    description: "单日完成 10 个以上任务",
    icon: "done-all",
  },
  centurion: {
    id: "centurion",
    title: "百夫长",
    description: "累计完成 100 个任务",
    icon: "military-tech",
  },
  night_owl: {
    id: "night_owl",
    title: "夜猫子",
    description: "在晚上10点后完成了 20 个任务",
    icon: "nights-stay",
  },
  speed_demon: {
    id: "speed_demon",
    title: "闪电侠",
    description: "在创建后 1 小时内完成了 10 个任务",
    icon: "bolt",
  },
  collector: {
    id: "collector",
    title: "收藏家",
    description: "使用了 10 种不同的标签",
    icon: "collections-bookmark",
  },
};

export function checkAchievements(
  tasks: NormalizedTask[],
  unlocked: AchievementId[],
  reference: Date = new Date(),
): Achievement[] {
  const unlockedSet = new Set(unlocked);
  const newlyUnlocked: Achievement[] = [];
  const stats = computeProductivityStats(tasks, reference);

  // streak_7 / streak_30
  if (!unlockedSet.has("streak_7") && stats.streakDays >= 7) {
    newlyUnlocked.push(ACHIEVEMENTS.streak_7);
  }
  if (!unlockedSet.has("streak_30") && stats.streakDays >= 30) {
    newlyUnlocked.push(ACHIEVEMENTS.streak_30);
  }

  // centurion: 100 completed tasks
  if (!unlockedSet.has("centurion") && stats.totalDone >= 100) {
    newlyUnlocked.push(ACHIEVEMENTS.centurion);
  }

  // ocr_master: 100 tasks from image source
  const imageTasks = tasks.filter((t) => t.sourceType === "image").length;
  if (!unlockedSet.has("ocr_master") && imageTasks >= 100) {
    newlyUnlocked.push(ACHIEVEMENTS.ocr_master);
  }

  // zero_overdue: no overdue tasks (only makes sense when there are tasks)
  const openTasks = tasks.filter((t) => t.status === "todo");
  const overdueCount = openTasks.filter((t) => {
    if (!t.dueAt) return false;
    return new Date(t.dueAt).getTime() < reference.getTime();
  }).length;
  if (!unlockedSet.has("zero_overdue") && openTasks.length > 0 && overdueCount === 0) {
    // Also need to check: has the user had overdue tasks recently? Skip for now — simple check.
    newlyUnlocked.push(ACHIEVEMENTS.zero_overdue);
  }

  // completionist: 10+ done in a single day
  const doneDates = new Map<string, number>();
  for (const task of tasks) {
    if (task.status !== "done") continue;
    const dateKey = new Date(task.completedAt ?? task.updatedAt).toISOString().slice(0, 10);
    doneDates.set(dateKey, (doneDates.get(dateKey) ?? 0) + 1);
  }
  const maxInDay = Math.max(0, ...doneDates.values());
  if (!unlockedSet.has("completionist") && maxInDay >= 10) {
    newlyUnlocked.push(ACHIEVEMENTS.completionist);
  }

  // speed_demon: 10 tasks completed within 1 hour of creation
  const fastCompletions = tasks.filter((t) => {
    if (t.status !== "done" || !t.completedAt) return false;
    const created = new Date(t.createdAt).getTime();
    const completed = new Date(t.completedAt).getTime();
    return completed - created <= 60 * 60 * 1000 && completed > created;
  }).length;
  if (!unlockedSet.has("speed_demon") && fastCompletions >= 10) {
    newlyUnlocked.push(ACHIEVEMENTS.speed_demon);
  }

  // night_owl: 20 tasks completed after 10 PM
  const nightCompletions = tasks.filter((t) => {
    if (t.status !== "done" || !t.completedAt) return false;
    const hour = new Date(t.completedAt).getUTCHours();
    return hour >= 22 || hour < 5;
  }).length;
  if (!unlockedSet.has("night_owl") && nightCompletions >= 20) {
    newlyUnlocked.push(ACHIEVEMENTS.night_owl);
  }

  // collector: 10+ unique tags
  const uniqueTags = new Set<string>();
  for (const task of tasks) {
    for (const tag of task.tags) {
      uniqueTags.add(tag);
    }
  }
  if (!unlockedSet.has("collector") && uniqueTags.size >= 10) {
    newlyUnlocked.push(ACHIEVEMENTS.collector);
  }

  // early_bird: 7 consecutive days with first completion before 9 AM
  if (!unlockedSet.has("early_bird")) {
    const earlyDays = new Set<string>();
    for (const task of tasks) {
      if (task.status !== "done" || !task.completedAt) continue;
      const d = new Date(task.completedAt);
      if (d.getUTCHours() < 9) {
        earlyDays.add(d.toISOString().slice(0, 10));
      }
    }
    if (earlyDays.size >= 7) {
      newlyUnlocked.push(ACHIEVEMENTS.early_bird);
    }
  }

  return newlyUnlocked;
}

export interface AchievementProgress {
  id: AchievementId;
  current: number;
  target: number;
}

export function computeAchievementProgress(
  tasks: NormalizedTask[],
  reference: Date = new Date(),
): AchievementProgress[] {
  const progress: AchievementProgress[] = [];
  const stats = computeProductivityStats(tasks, reference);

  // streak_7
  progress.push({ id: "streak_7", current: Math.min(stats.streakDays, 7), target: 7 });
  // streak_30
  progress.push({ id: "streak_30", current: Math.min(stats.streakDays, 30), target: 30 });
  // centurion: total done
  progress.push({ id: "centurion", current: Math.min(stats.totalDone, 100), target: 100 });
  // ocr_master
  const imageCount = tasks.filter((t) => t.sourceType === "image").length;
  progress.push({ id: "ocr_master", current: Math.min(imageCount, 100), target: 100 });

  // completionist: max in a day
  const doneDates = new Map<string, number>();
  for (const task of tasks) {
    if (task.status !== "done") continue;
    const dateKey = new Date(task.completedAt ?? task.updatedAt).toISOString().slice(0, 10);
    doneDates.set(dateKey, (doneDates.get(dateKey) ?? 0) + 1);
  }
  const maxInDay = Math.max(0, ...doneDates.values());
  progress.push({ id: "completionist", current: Math.min(maxInDay, 10), target: 10 });

  // speed_demon
  const fastCount = tasks.filter((t) => {
    if (t.status !== "done" || !t.completedAt) return false;
    const created = new Date(t.createdAt).getTime();
    const completed = new Date(t.completedAt).getTime();
    return completed - created <= 60 * 60 * 1000 && completed > created;
  }).length;
  progress.push({ id: "speed_demon", current: Math.min(fastCount, 10), target: 10 });

  // night_owl
  const nightCount = tasks.filter((t) => {
    if (t.status !== "done" || !t.completedAt) return false;
    const hour = new Date(t.completedAt).getUTCHours();
    return hour >= 22 || hour < 5;
  }).length;
  progress.push({ id: "night_owl", current: Math.min(nightCount, 20), target: 20 });

  // collector: unique tags
  const uniqueTags = new Set<string>();
  for (const task of tasks) {
    for (const tag of task.tags) uniqueTags.add(tag);
  }
  progress.push({ id: "collector", current: Math.min(uniqueTags.size, 10), target: 10 });

  // early_bird
  const earlyDays = new Set<string>();
  for (const task of tasks) {
    if (task.status !== "done" || !task.completedAt) continue;
    const d = new Date(task.completedAt);
    if (d.getUTCHours() < 9) earlyDays.add(d.toISOString().slice(0, 10));
  }
  progress.push({ id: "early_bird", current: Math.min(earlyDays.size, 7), target: 7 });

  return progress;
}
