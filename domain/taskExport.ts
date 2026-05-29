import type { TaskExportPayload } from "@/types/export";
import type { NormalizedTask } from "@/types/task";

export function buildTaskExportPayload(task: NormalizedTask): TaskExportPayload {
  const source = buildSourcePayload(task);

  return {
    title: task.title.trim(),
    ...(task.notes?.trim() && { notes: task.notes.trim() }),
    ...(task.dueAt && { dueAt: task.dueAt }),
    ...(task.dueText?.trim() && { dueText: task.dueText.trim() }),
    priority: task.priority,
    status: task.status,
    tags: task.tags,
    ...(source && { source }),
  };
}

function buildSourcePayload(task: NormalizedTask): TaskExportPayload["source"] {
  const source = {
    ...(task.sourceId?.trim() && { id: task.sourceId.trim() }),
    ...(task.sourceType && { type: task.sourceType }),
    ...(task.sourceText?.trim() && { text: task.sourceText.trim() }),
  };

  return Object.keys(source).length > 0 ? source : undefined;
}

