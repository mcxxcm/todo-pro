import { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "expo-router";

import type { CreateTaskExtra } from "@/domain/tasks";
import { computeNextOccurrence } from "@/domain/recurrence";
import {
  confirmAllTimeReviewLocalTasks,
  createLocalTask,
  deleteLocalTask,
  getLocalTasks,
  mergeDuplicateLocalTasks,
  toggleLocalTask,
  updateLocalTask,
} from "@/providers/localProvider";
import type { TaskNotificationSyncResult } from "@/providers/notificationProvider";
import { loadTasks } from "@/lib/taskStorage";
import type { NormalizedTask, TaskUpdateInput } from "@/types/task";

export function useLocalTasks() {
  const [tasks, setTasks] = useState<NormalizedTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notificationFeedback, setNotificationFeedback] = useState<TaskNotificationSyncResult | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      setTasks(await getLocalTasks());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load local tasks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const addTask = useCallback(
    async (title: string, extra?: CreateTaskExtra) => {
      if (!title.trim()) return undefined;
      try {
        const result = await createLocalTask(title, extra);
        setNotificationFeedback(result.notification);
        await refresh();
        return result.task;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to add local task");
        return undefined;
      }
    },
    [refresh],
  );

  const toggleDone = useCallback(
    async (id: string) => {
      try {
        const allTasks = await loadTasks();
        const task = allTasks.find((t) => t.id === id);
        const result = await toggleLocalTask(id);
        setNotificationFeedback(result.notification);

        if (task?.recurrence && task.dueAt && task.status === "todo") {
          const next = computeNextOccurrence(task.recurrence, task.dueAt);
          if (next) {
            await createLocalTask(task.title, {
              priority: task.priority,
              tags: task.tags,
              dueAt: next.dueAt,
              dueText: next.dueText,
              notes: task.notes,
              recurrence: task.recurrence,
              sourceId: task.sourceId,
              sourceType: task.sourceType,
              sourceText: task.sourceText,
              estimatedMinutes: task.estimatedMinutes,
            });
          }
        }

        await refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to toggle local task");
      }
    },
    [refresh],
  );

  const updateTask = useCallback(
    async (id: string, patch: TaskUpdateInput) => {
      try {
        const result = await updateLocalTask(id, patch);
        setNotificationFeedback(result.notification);
        await refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to update local task");
      }
    },
    [refresh],
  );

  const removeTask = useCallback(
    async (id: string) => {
      try {
        const result = await deleteLocalTask(id);
        setNotificationFeedback(result.notification);
        await refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to delete local task");
      }
    },
    [refresh],
  );

  const mergeDuplicates = useCallback(async () => {
    try {
      const result = await mergeDuplicateLocalTasks();
      await refresh();
      return result;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to merge local tasks");
      return undefined;
    }
  }, [refresh]);

  const clearNotificationFeedback = useCallback(() => {
    setNotificationFeedback(null);
  }, []);

  const confirmAllTimeReviews = useCallback(async () => {
    try {
      const result = await confirmAllTimeReviewLocalTasks();
      await refresh();
      return result;
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
    notificationFeedback,
    clearNotificationFeedback,
  };
}
