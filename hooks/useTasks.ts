import { useState, useEffect, useCallback } from "react";
import { NormalizedTask } from "@/types/task";
import {
  getLocalTasks,
  createLocalTask,
  toggleLocalTask,
  deleteLocalTask,
} from "@/providers/localProvider";

export function useTasks() {
  const [tasks, setTasks] = useState<NormalizedTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const loaded = await getLocalTasks();
      setTasks(loaded);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addTask = useCallback(
    async (title: string) => {
      if (!title.trim()) return;
      try {
        await createLocalTask(title);
        await refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to add task");
      }
    },
    [refresh]
  );

  const toggleDone = useCallback(
    async (id: string) => {
      try {
        await toggleLocalTask(id);
        await refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to toggle task");
      }
    },
    [refresh]
  );

  const removeTask = useCallback(
    async (id: string) => {
      try {
        await deleteLocalTask(id);
        await refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to delete task");
      }
    },
    [refresh]
  );

  return { tasks, loading, error, addTask, toggleDone, removeTask, refresh };
}
