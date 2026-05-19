import AsyncStorage from "@react-native-async-storage/async-storage";
import { NormalizedTask } from "@/types/task";

const STORAGE_KEY = "todo_pro_tasks";

export async function loadTasks(): Promise<NormalizedTask[]> {
  const json = await AsyncStorage.getItem(STORAGE_KEY);
  if (!json) return [];
  return JSON.parse(json);
}

export async function saveTasks(tasks: NormalizedTask[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}
