import type { NormalizedTask } from "@/types/task";

export interface TaskGroupCounts {
  all: number;
  completed: number;
  inbox: number;
  needsReview: number;
  overdue: number;
  planned: number;
  today: number;
}

export type TaskGroupFilter =
  | "all"
  | "inbox"
  | "needsReview"
  | "overdue"
  | "today"
  | "planned"
  | "completed";

export interface TaskSection {
  title: string;
  data: NormalizedTask[];
  id: TaskGroupFilter;
}

export function getTaskGroupCounts(
  tasks: NormalizedTask[],
  reference: Date = new Date(),
): TaskGroupCounts {
  return groupTasks(tasks, reference).counts;
}

export function buildTaskSections(
  tasks: NormalizedTask[],
  reference: Date = new Date(),
  filter: TaskGroupFilter = "all",
): TaskSection[] {
  const groups = groupTasks(tasks, reference);

  if (filter === "needsReview") {
    return groups.needsReview.length > 0
      ? [
          {
            id: "needsReview",
            title: "待确认",
            data: groups.needsReview.sort(sortDueFirst),
          },
        ]
      : [];
  }

  const sections = [
    { id: "overdue", title: "已逾期", data: groups.overdue.sort(sortDueFirst) },
    { id: "today", title: "今天", data: groups.today.sort(sortDueFirst) },
    { id: "planned", title: "计划", data: groups.planned.sort(sortDueFirst) },
    { id: "inbox", title: "收件箱", data: groups.inbox.sort(sortNewestFirst) },
    { id: "completed", title: "已完成", data: groups.completed.sort(sortNewestFirst) },
  ] satisfies TaskSection[];

  return sections.filter(
    (section) =>
      section.data.length > 0 && (filter === "all" || section.id === filter),
  );
}

function groupTasks(tasks: NormalizedTask[], reference: Date) {
  const startOfToday = new Date(
    reference.getFullYear(),
    reference.getMonth(),
    reference.getDate(),
  ).getTime();
  const startOfTomorrow = startOfToday + 24 * 60 * 60 * 1000;

  const groups = {
    completed: [] as NormalizedTask[],
    inbox: [] as NormalizedTask[],
    needsReview: [] as NormalizedTask[],
    overdue: [] as NormalizedTask[],
    planned: [] as NormalizedTask[],
    today: [] as NormalizedTask[],
  };

  let visibleTaskCount = 0;

  for (const task of tasks) {
    if (task.status === "archived") {
      continue;
    }

    visibleTaskCount += 1;

    if (task.status === "done") {
      groups.completed.push(task);
      continue;
    }

    if (needsTimeReview(task)) {
      groups.needsReview.push(task);
    }

    if (!task.dueAt) {
      groups.inbox.push(task);
      continue;
    }

    const dueTime = new Date(task.dueAt).getTime();
    if (Number.isNaN(dueTime)) {
      groups.inbox.push(task);
    } else if (dueTime < startOfToday) {
      groups.overdue.push(task);
    } else if (dueTime >= startOfToday && dueTime < startOfTomorrow) {
      groups.today.push(task);
    } else {
      groups.planned.push(task);
    }
  }

  return {
    ...groups,
    counts: {
      all: visibleTaskCount,
      completed: groups.completed.length,
      inbox: groups.inbox.length,
      needsReview: groups.needsReview.length,
      overdue: groups.overdue.length,
      planned: groups.planned.length,
      today: groups.today.length,
    },
  };
}

export function needsTimeReview(task: NormalizedTask) {
  return (
    task.timeStatus === "needs_review" ||
    task.needsConfirmation ||
    (task.dueText && task.timeConfidence === "low")
  );
}

const PRIORITY_ORDER: Record<string, number> = {
  high: 0,
  medium: 1,
  low: 2,
  none: 3,
};

function sortNewestFirst(a: NormalizedTask, b: NormalizedTask) {
  const priDiff = (PRIORITY_ORDER[a.priority] ?? 3) - (PRIORITY_ORDER[b.priority] ?? 3);
  if (priDiff !== 0) return priDiff;
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

function sortDueFirst(a: NormalizedTask, b: NormalizedTask) {
  const priDiff = (PRIORITY_ORDER[a.priority] ?? 3) - (PRIORITY_ORDER[b.priority] ?? 3);
  if (priDiff !== 0) return priDiff;
  const aTime = new Date(a.dueAt ?? a.createdAt).getTime();
  const bTime = new Date(b.dueAt ?? b.createdAt).getTime();
  return aTime - bTime;
}
