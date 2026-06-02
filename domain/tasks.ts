import type { SourceItemType } from "@/types/source";
import type {
  NormalizedTask,
  TaskPriority,
  TimeConfidence,
  TimeStatus,
  SubTask,
  RecurrenceRule,
  FocusSession,
} from "@/types/task";
import { toIsoString, type ClockInput } from "@/lib/time";

export interface CreateTaskExtra {
  dueAt?: string;
  dueText?: string;
  timeStatus?: string;
  notes?: string;
  priority?: TaskPriority;
  sourceId?: string;
  sourceType?: SourceItemType;
  sourceText?: string;
  tags?: string[];
  timeConfidence?: TimeConfidence;
  subtasks?: SubTask[];
  recurrence?: RecurrenceRule;
  estimatedMinutes?: number;
  actualMinutes?: number;
  completedAt?: string;
  xp?: number;
  focusSessions?: FocusSession[];
}

export function createNormalizedTask(
  title: string,
  extra: CreateTaskExtra | undefined,
  options: { id: string; now: ClockInput },
): NormalizedTask {
  const trimmedTitle = title.trim();

  if (!trimmedTitle) {
    throw new Error("Task title cannot be empty");
  }

  const timestamp = toIsoString(options.now);

  return {
    id: options.id,
    title: trimmedTitle,
    status: "todo",
    priority: extra?.priority ?? "none",
    tags: extra?.tags ?? [],
    timeConfidence: extra?.timeConfidence ?? "none",
    needsConfirmation: false,
    provider: "local",
    createdAt: timestamp,
    updatedAt: timestamp,
    ...(extra?.dueAt && { dueAt: extra.dueAt }),
    ...(extra?.dueText?.trim() && { dueText: extra.dueText.trim() }),
    ...(extra?.timeStatus && { timeStatus: extra.timeStatus as TimeStatus }),
    ...(extra?.notes?.trim() && { notes: extra.notes.trim() }),
    ...(extra?.sourceId?.trim() && { sourceId: extra.sourceId.trim() }),
    ...(extra?.sourceType && { sourceType: extra.sourceType }),
    ...(extra?.sourceText?.trim() && { sourceText: extra.sourceText.trim() }),
    ...(extra?.subtasks && { subtasks: extra.subtasks }),
    ...(extra?.recurrence && { recurrence: extra.recurrence }),
    ...(extra?.estimatedMinutes && { estimatedMinutes: extra.estimatedMinutes }),
    ...(extra?.actualMinutes && { actualMinutes: extra.actualMinutes }),
    ...(extra?.completedAt && { completedAt: extra.completedAt }),
    ...(extra?.xp && { xp: extra.xp }),
    ...(extra?.focusSessions && { focusSessions: extra.focusSessions }),
  };
}
