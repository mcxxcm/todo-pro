import { useState, useEffect, useCallback, useRef } from "react";
import { useFocusEffect } from "expo-router";
import { NormalizedTask, TaskUpdateInput } from "@/types/task";
import type { TaskPriority, TimeConfidence } from "@/types/task";
import type { SourceItemType } from "@/types/source";
import { runMigrations } from "@/lib/migration";
import {
  getLocalTasks,
  createLocalTask,
  toggleLocalTask,
  updateLocalTask,
  deleteLocalTask,
  mergeDuplicateLocalTasks,
  confirmAllTimeReviewLocalTasks,
} from "@/providers/localProvider";

export function useTasks() {
  const [tasks, setTasks] = useState<NormalizedTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const migrated = useRef(false);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      if (!migrated.current) {
        await runMigrations();
        migrated.current = true;
      }
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

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const addTask = useCallback(
    async (
      title: string,
      extra?: {
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
      },
    ) => {
      if (!title.trim()) return undefined;
      try {
        const created = await createLocalTask(title, extra);
        await refresh();
        return created;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to add task");
        return undefined;
      }
    },
    [refresh]
  );

  const toggleDone = useCallback(
    async (id: string) => {
      // Optimistic update
      const previousTasks = tasks;
      setTasks((prev) =>
        prev.map((t) =>
          t.id === id
            ? { ...t, status: (t.status === "done" ? "todo" : "done") as NormalizedTask["status"] }
            : t
        )
      );
      try {
        await toggleLocalTask(id);
        await refresh();
      } catch (e) {
        setTasks(previousTasks); // Rollback
        setError(e instanceof Error ? e.message : "Failed to toggle task");
      }
    },
    [refresh, tasks]
  );

  const updateTask = useCallback(
    async (id: string, patch: TaskUpdateInput) => {
      try {
        await updateLocalTask(id, patch);
        await refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to update task");
      }
    },
    [refresh]
  );

  const removeTask = useCallback(
    async (id: string) => {
      // Optimistic update
      const previousTasks = tasks;
      setTasks((prev) => prev.filter((t) => t.id !== id));
      try {
        await deleteLocalTask(id);
        await refresh();
      } catch (e) {
        setTasks(previousTasks); // Rollback
        setError(e instanceof Error ? e.message : "Failed to delete task");
      }
    },
    [refresh, tasks]
  );

  const mergeDuplicates = useCallback(async () => {
    try {
      const result = await mergeDuplicateLocalTasks();
      await refresh();
      return result;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to merge duplicates");
      return undefined;
    }
  }, [refresh]);

  const confirmAllTimeReviews = useCallback(async () => {
    try {
      const confirmed = await confirmAllTimeReviewLocalTasks();
      await refresh();
      return confirmed;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to confirm time reviews");
      return undefined;
    }
  }, [refresh]);

  return {
    tasks,
    loading,
    error,
    addTask,
    toggleDone,
    updateTask,
    removeTask,
    mergeDuplicates,
    confirmAllTimeReviews,
    refresh,
  };
}
