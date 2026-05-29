import type {
  TaskDraft,
  TaskDraftInput,
  TaskDraftStatus,
  TaskDraftUpdateInput,
} from "@/types/draft";
import { createLocalId } from "@/lib/localId";
import { toIsoString, type ClockInput } from "@/lib/time";

export function createTaskDraft(
  input: TaskDraftInput,
  now: ClockInput = new Date(),
): TaskDraft {
  const timestamp = toIsoString(now);
  const title = input.title.trim();

  if (!title) {
    throw new Error("Task draft title cannot be empty");
  }

  return {
    ...input,
    id: input.id?.trim() || generateDraftId(),
    title,
    sourceText: input.sourceText.trim(),
    tags: input.tags ?? [],
    priority: input.priority ?? "none",
    timeConfidence: input.timeConfidence ?? "none",
    timeStatus: input.timeStatus ?? (input.dueText ? "needs_review" : "none"),
    status: input.status ?? "pending",
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function applyTaskDraftPatch(
  draft: TaskDraft,
  patch: TaskDraftUpdateInput,
  now: ClockInput = new Date(),
): TaskDraft {
  const normalized = normalizeTaskDraftPatch(patch);
  const nextStatus = resolveEditedStatus(draft.status, normalized.status);

  return {
    ...draft,
    ...normalized,
    status: nextStatus,
    updatedAt: toIsoString(now),
  };
}

export function markTaskDraftAccepted(
  draft: TaskDraft,
  acceptedTaskId?: string,
  now: ClockInput = new Date(),
): TaskDraft {
  return {
    ...draft,
    status: "accepted",
    ...(acceptedTaskId?.trim() && { acceptedTaskId: acceptedTaskId.trim() }),
    updatedAt: toIsoString(now),
  };
}

export function markTaskDraftRejected(
  draft: TaskDraft,
  now: ClockInput = new Date(),
): TaskDraft {
  return {
    ...draft,
    status: "rejected",
    updatedAt: toIsoString(now),
  };
}

function normalizeTaskDraftPatch(
  patch: TaskDraftUpdateInput,
): TaskDraftUpdateInput {
  const normalized = { ...patch };

  if (typeof normalized.title === "string") {
    normalized.title = normalized.title.trim();
    if (!normalized.title) {
      throw new Error("Task draft title cannot be empty");
    }
  }

  if (typeof normalized.dueText === "string") {
    normalized.dueText = normalized.dueText.trim() || undefined;
  }

  if (typeof normalized.notes === "string") {
    normalized.notes = normalized.notes.trim() || undefined;
  }

  if (typeof normalized.acceptedTaskId === "string") {
    normalized.acceptedTaskId = normalized.acceptedTaskId.trim() || undefined;
  }

  return normalized;
}

function resolveEditedStatus(
  current: TaskDraftStatus,
  explicit?: TaskDraftStatus,
): TaskDraftStatus {
  if (explicit) return explicit;
  if (current === "accepted" || current === "rejected") return current;
  return "edited";
}

function generateDraftId(): string {
  return createLocalId("draft", 8);
}
