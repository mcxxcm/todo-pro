import { loadJsonArray, removeJsonValue, saveJsonArray } from "@/lib/jsonStorage";
import type { TaskDraft } from "@/types/draft";

const STORAGE_KEY = "todo_pro_task_drafts";

export async function loadTaskDrafts(): Promise<TaskDraft[]> {
  return loadJsonArray<TaskDraft>(STORAGE_KEY);
}

export async function saveTaskDrafts(drafts: TaskDraft[]): Promise<void> {
  await saveJsonArray(STORAGE_KEY, drafts);
}

export async function clearTaskDrafts(): Promise<void> {
  await removeJsonValue(STORAGE_KEY);
}
