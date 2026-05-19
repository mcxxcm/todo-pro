import { NormalizedTask } from "@/types/task";
import { loadTasks, saveTasks, generateId } from "@/lib/taskStorage";

export async function getLocalTasks(): Promise<NormalizedTask[]> {
  return loadTasks();
}

export async function createLocalTask(
  title: string,
  extra?: { dueAt?: string; notes?: string; sourceText?: string }
): Promise<NormalizedTask> {
  const tasks = await loadTasks();
  const now = new Date().toISOString();
  const task: NormalizedTask = {
    id: generateId(),
    title: title.trim(),
    status: "todo",
    priority: "none",
    tags: [],
    timeConfidence: "none",
    needsConfirmation: false,
    provider: "local",
    createdAt: now,
    updatedAt: now,
    ...(extra?.dueAt && { dueAt: extra.dueAt }),
    ...(extra?.notes && { notes: extra.notes }),
    ...(extra?.sourceText && { sourceText: extra.sourceText }),
  };
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
  task.updatedAt = new Date().toISOString();
  tasks[index] = task;
  await saveTasks(tasks);
  return task;
}

export async function deleteLocalTask(id: string): Promise<void> {
  const tasks = await loadTasks();
  await saveTasks(tasks.filter((t) => t.id !== id));
}
