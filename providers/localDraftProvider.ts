import {
  applyTaskDraftPatch,
  createTaskDraft,
  markTaskDraftAccepted,
  markTaskDraftRejected,
} from "@/domain/taskDrafts";
import { loadTaskDrafts, saveTaskDrafts } from "@/lib/draftStorage";
import type {
  TaskDraft,
  TaskDraftInput,
  TaskDraftUpdateInput,
} from "@/types/draft";

export async function createLocalDrafts(
  inputs: TaskDraftInput[],
): Promise<TaskDraft[]> {
  const existing = await loadTaskDrafts();
  const drafts = inputs.map((input) => createTaskDraft(input));
  await saveTaskDrafts([...existing, ...drafts]);
  return drafts;
}

export async function getLocalDrafts(): Promise<TaskDraft[]> {
  return loadTaskDrafts();
}

export async function getOpenLocalDrafts(): Promise<TaskDraft[]> {
  const drafts = await loadTaskDrafts();
  return drafts.filter((draft) =>
    draft.status === "pending" || draft.status === "edited"
  );
}

export async function updateLocalDraft(
  id: string,
  patch: TaskDraftUpdateInput,
): Promise<TaskDraft> {
  return updateDraftById(id, (draft) => applyTaskDraftPatch(draft, patch));
}

export async function markLocalDraftAccepted(
  id: string,
  acceptedTaskId?: string,
): Promise<TaskDraft> {
  return updateDraftById(id, (draft) =>
    markTaskDraftAccepted(draft, acceptedTaskId),
  );
}

export async function markLocalDraftRejected(id: string): Promise<TaskDraft> {
  return updateDraftById(id, (draft) => markTaskDraftRejected(draft));
}

export async function rejectLocalDrafts(ids: string[]): Promise<TaskDraft[]> {
  if (ids.length === 0) return [];

  const drafts = await loadTaskDrafts();
  const idSet = new Set(ids);
  const updated: TaskDraft[] = [];
  const nextDrafts = drafts.map((draft) => {
    if (!idSet.has(draft.id)) return draft;
    const nextDraft = markTaskDraftRejected(draft);
    updated.push(nextDraft);
    return nextDraft;
  });

  await saveTaskDrafts(nextDrafts);
  return updated;
}

async function updateDraftById(
  id: string,
  updater: (draft: TaskDraft) => TaskDraft,
): Promise<TaskDraft> {
  const drafts = await loadTaskDrafts();
  const index = drafts.findIndex((draft) => draft.id === id);

  if (index === -1) {
    throw new Error(`Task draft ${id} not found`);
  }

  const nextDraft = updater(drafts[index]);
  drafts[index] = nextDraft;
  await saveTaskDrafts(drafts);
  return nextDraft;
}
