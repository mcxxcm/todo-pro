import type { TaskExportPayload } from "@/types/export";

export interface TodoistTaskPayload {
  content: string;
  description?: string;
  due_datetime?: string;
  due_string?: string;
  labels?: string[];
  priority?: 1 | 2 | 3 | 4;
}

export function buildTodoistTaskPayload(
  payload: TaskExportPayload,
): TodoistTaskPayload {
  return {
    content: payload.title.trim(),
    ...(buildDescription(payload) && {
      description: buildDescription(payload),
    }),
    ...(payload.dueAt && { due_datetime: payload.dueAt }),
    ...(!payload.dueAt && payload.dueText && { due_string: payload.dueText }),
    ...(payload.tags.length > 0 && { labels: payload.tags }),
    priority: mapPriority(payload.priority),
  };
}

function buildDescription(payload: TaskExportPayload): string | undefined {
  const description = [
    payload.notes,
    payload.source?.text ? `Source: ${payload.source.text}` : undefined,
  ]
    .filter(Boolean)
    .join("\n");

  return description || undefined;
}

function mapPriority(priority: TaskExportPayload["priority"]): 1 | 2 | 3 | 4 {
  switch (priority) {
    case "high":
      return 4;
    case "medium":
      return 3;
    case "low":
      return 2;
    case "none":
    default:
      return 1;
  }
}

