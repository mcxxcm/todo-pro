import { loadJsonArray, removeJsonValue, saveJsonArray } from "@/lib/jsonStorage";
import { createLocalId } from "@/lib/localId";
import { NormalizedTask } from "@/types/task";

const STORAGE_KEY = "todo_pro_tasks";

export async function loadTasks(): Promise<NormalizedTask[]> {
  return loadJsonArray<NormalizedTask>(STORAGE_KEY);
}

export async function saveTasks(tasks: NormalizedTask[]): Promise<void> {
  await saveJsonArray(STORAGE_KEY, tasks);
}

export async function clearTasks(): Promise<void> {
  await removeJsonValue(STORAGE_KEY);
}

export function generateId(): string {
  return createLocalId();
}
