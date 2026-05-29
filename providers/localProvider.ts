import { createNormalizedTask, CreateTaskExtra } from "@/domain/tasks";
import { findDuplicateTaskGroups } from "@/domain/taskDuplicates";
import { needsTimeReview } from "@/domain/taskGrouping";
import { NormalizedTask, TaskUpdateInput } from "@/types/task";
import { loadTasks, saveTasks, generateId } from "@/lib/taskStorage";
import { getCurrentIsoString } from "@/lib/time";
import type { SourceItemType } from "@/types/source";

export async function getLocalTasks(): Promise<NormalizedTask[]> {
  return loadTasks();
}

export async function createLocalTask(
  title: string,
  extra?: CreateTaskExtra,
): Promise<NormalizedTask> {
  const tasks = await loadTasks();
  const task = createNormalizedTask(title, extra, {
    id: generateId(),
    now: new Date(),
  });
  tasks.push(task);
  await saveTasks(tasks);
  return task;
}

export async function toggleLocalTask(id: string): Promise<NormalizedTask> {
  const tasks = await loadTasks();
  const index = tasks.findIndex((t) => t.id === id);
  if (index === -1) throw new Error(`Task ${id} not found`);
  const task = { ...tasks[index] };
  task.status = task.status === "done" ? "todo" : "done";
  task.updatedAt = getCurrentIsoString();
  tasks[index] = task;
  await saveTasks(tasks);
  return task;
}

export async function updateLocalTask(
  id: string,
  patch: TaskUpdateInput,
): Promise<NormalizedTask> {
  const tasks = await loadTasks();
  const index = tasks.findIndex((t) => t.id === id);
  if (index === -1) throw new Error(`Task ${id} not found`);

  const task: NormalizedTask = {
    ...tasks[index],
    ...normalizeTaskPatch(patch),
    updatedAt: getCurrentIsoString(),
  };

  tasks[index] = task;
  await saveTasks(tasks);
  return task;
}

export async function deleteLocalTask(id: string): Promise<void> {
  const tasks = await loadTasks();
  await saveTasks(tasks.filter((t) => t.id !== id));
}

export async function mergeDuplicateLocalTasks(): Promise<{
  archived: number;
  groups: number;
}> {
  const tasks = await loadTasks();
  const duplicateGroups = findDuplicateTaskGroups(tasks);

  if (duplicateGroups.length === 0) {
    return { archived: 0, groups: 0 };
  }

  const now = getCurrentIsoString();
  const taskById = new Map(tasks.map((task) => [task.id, task]));
  const archivedIds = new Set<string>();

  for (const group of duplicateGroups) {
    const primary = taskById.get(group.primaryId);
    if (!primary) continue;

    const duplicates = group.duplicateIds
      .map((id) => taskById.get(id))
      .filter(Boolean) as NormalizedTask[];

    const duplicateSourceTexts = duplicates
      .map((task) => task.sourceText)
      .filter(Boolean) as string[];
    const mergedNotes = buildMergedNotes(primary.notes, duplicates);

    taskById.set(primary.id, {
      ...primary,
      notes: mergedNotes,
      sourceText: primary.sourceText ?? duplicateSourceTexts[0],
      tags: Array.from(new Set([...primary.tags, "merged"])),
      updatedAt: now,
    });

    for (const duplicate of duplicates) {
      archivedIds.add(duplicate.id);
      taskById.set(duplicate.id, {
        ...duplicate,
        status: "archived",
        updatedAt: now,
      });
    }
  }

  await saveTasks(tasks.map((task) => taskById.get(task.id) ?? task));

  return {
    archived: archivedIds.size,
    groups: duplicateGroups.length,
  };
}

export async function confirmAllTimeReviewLocalTasks(): Promise<number> {
  const tasks = await loadTasks();
  const now = getCurrentIsoString();
  let updatedCount = 0;

  const nextTasks = tasks.map((task) => {
    if (task.status !== "todo" || !needsTimeReview(task)) return task;

    updatedCount += 1;
    return {
      ...task,
      needsConfirmation: false,
      timeStatus: task.dueText ? "confirmed" : "none",
      updatedAt: now,
    } satisfies NormalizedTask;
  });

  if (updatedCount > 0) {
    await saveTasks(nextTasks);
  }

  return updatedCount;
}

function normalizeTaskPatch(patch: TaskUpdateInput): TaskUpdateInput {
  const normalized = { ...patch };

  if (typeof normalized.title === "string") {
    normalized.title = normalized.title.trim();
    if (!normalized.title) {
      throw new Error("Task title cannot be empty");
    }
  }

  if (typeof normalized.dueText === "string") {
    normalized.dueText = normalized.dueText.trim() || undefined;
  }

  if (typeof normalized.notes === "string") {
    normalized.notes = normalized.notes.trim() || undefined;
  }

  if (typeof normalized.sourceText === "string") {
    normalized.sourceText = normalized.sourceText.trim() || undefined;
  }

  if (typeof normalized.sourceId === "string") {
    normalized.sourceId = normalized.sourceId.trim() || undefined;
  }

  if (typeof normalized.sourceType === "string") {
    normalized.sourceType = normalized.sourceType.trim() as SourceItemType;
  }

  return normalized;
}

function buildMergedNotes(
  primaryNotes: string | undefined,
  duplicates: NormalizedTask[],
) {
  const titles = duplicates.map((task) => `- ${task.title}`).join("\n");
  const mergeNote = `已合并疑似重复任务：\n${titles}`;

  return [primaryNotes?.trim(), mergeNote].filter(Boolean).join("\n\n");
}
