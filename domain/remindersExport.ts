import type { TaskExportPayload } from "@/types/export";

export interface ReminderTaskPayload {
  title: string;
  notes?: string;
  dueDate?: string;
  priority: 0 | 1 | 5 | 9;
}

export function buildReminderTaskPayload(
  payload: TaskExportPayload,
): ReminderTaskPayload {
  return {
    title: payload.title.trim(),
    ...(buildNotes(payload) && { notes: buildNotes(payload) }),
    ...(payload.dueAt && { dueDate: payload.dueAt }),
    priority: mapPriority(payload.priority),
  };
}

function buildNotes(payload: TaskExportPayload): string | undefined {
  const notes = [
    payload.notes,
    payload.dueText ? `Due: ${payload.dueText}` : undefined,
    payload.source?.text ? `Source: ${payload.source.text}` : undefined,
  ]
    .filter(Boolean)
    .join("\n");

  return notes || undefined;
}

function mapPriority(priority: TaskExportPayload["priority"]): 0 | 1 | 5 | 9 {
  switch (priority) {
    case "high":
      return 1;
    case "medium":
      return 5;
    case "low":
      return 9;
    case "none":
    default:
      return 0;
  }
}

