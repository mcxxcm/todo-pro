import { useState, useEffect, useCallback } from "react";
import { collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc, query, writeBatch, getDocs, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/providers/AuthContext";
import { createNormalizedTask, CreateTaskExtra } from "@/domain/tasks";
import { NormalizedTask, TaskUpdateInput } from "@/types/task";
import { generateId } from "@/lib/taskStorage";
import { getCurrentIsoString } from "@/lib/time";
import { syncTaskNotification, cancelTaskNotification } from "./notificationProvider";
import { findDuplicateTaskGroups } from "@/domain/taskDuplicates";
import { needsTimeReview } from "@/domain/taskGrouping";
import type { SourceItemType } from "@/types/source";

export function useFirebaseTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<NormalizedTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setTasks([]);
      setLoading(false);
      return;
    }

    const tasksRef = collection(db, "users", user.uid, "tasks");
    const q = query(tasksRef);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loadedTasks: NormalizedTask[] = [];
        snapshot.forEach((doc) => {
          loadedTasks.push(doc.data() as NormalizedTask);
        });
        setTasks(loadedTasks);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Firestore error:", err);
        setError(err.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user]);

  const addTask = useCallback(
    async (title: string, extra?: CreateTaskExtra) => {
      if (!user || !title.trim()) return undefined;
      try {
        const task = createNormalizedTask(title, extra, {
          id: generateId(),
          now: new Date(),
        });
        const taskRef = doc(db, "users", user.uid, "tasks", task.id);
        await setDoc(taskRef, task);
        await syncTaskNotification(task);
        return task;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to add task");
        return undefined;
      }
    },
    [user]
  );

  const toggleDone = useCallback(
    async (id: string) => {
      if (!user) return;
      try {
        const task = tasks.find((t) => t.id === id);
        if (!task) return;
        
        const newStatus = task.status === "done" ? "todo" : "done";
        const taskRef = doc(db, "users", user.uid, "tasks", id);
        
        await updateDoc(taskRef, {
          status: newStatus,
          updatedAt: getCurrentIsoString(),
        });
        
        const updatedTask = { ...task, status: newStatus as NormalizedTask["status"], updatedAt: getCurrentIsoString() };
        await syncTaskNotification(updatedTask);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to toggle task");
      }
    },
    [user, tasks]
  );

  const updateTask = useCallback(
    async (id: string, patch: TaskUpdateInput) => {
      if (!user) return;
      try {
        const taskRef = doc(db, "users", user.uid, "tasks", id);
        const normalized = normalizeTaskPatch(patch);
        await updateDoc(taskRef, {
          ...normalized,
          updatedAt: getCurrentIsoString(),
        });
        
        // Re-sync notification using updated state
        const task = tasks.find((t) => t.id === id);
        if (task) {
          await syncTaskNotification({ ...task, ...normalized, updatedAt: getCurrentIsoString() } as NormalizedTask);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to update task");
      }
    },
    [user, tasks]
  );

  const removeTask = useCallback(
    async (id: string) => {
      if (!user) return;
      try {
        const taskRef = doc(db, "users", user.uid, "tasks", id);
        await deleteDoc(taskRef);
        await cancelTaskNotification(id);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to delete task");
      }
    },
    [user]
  );

  const mergeDuplicates = useCallback(async () => {
    if (!user) return { archived: 0, groups: 0 };
    try {
      const duplicateGroups = findDuplicateTaskGroups(tasks);
      if (duplicateGroups.length === 0) return { archived: 0, groups: 0 };

      const now = getCurrentIsoString();
      const batch = writeBatch(db);
      const archivedIds = new Set<string>();

      for (const group of duplicateGroups) {
        const primary = tasks.find((t) => t.id === group.primaryId);
        if (!primary) continue;

        const duplicates = group.duplicateIds
          .map((id) => tasks.find((t) => t.id === id))
          .filter(Boolean) as NormalizedTask[];

        const duplicateSourceTexts = duplicates
          .map((task) => task.sourceText)
          .filter(Boolean) as string[];
        const mergedNotes = buildMergedNotes(primary.notes, duplicates);

        const primaryRef = doc(db, "users", user.uid, "tasks", primary.id);
        batch.update(primaryRef, {
          notes: mergedNotes,
          sourceText: primary.sourceText ?? duplicateSourceTexts[0],
          tags: Array.from(new Set([...primary.tags, "merged"])),
          updatedAt: now,
        });

        for (const duplicate of duplicates) {
          archivedIds.add(duplicate.id);
          const duplicateRef = doc(db, "users", user.uid, "tasks", duplicate.id);
          batch.update(duplicateRef, {
            status: "archived",
            updatedAt: now,
          });
        }
      }

      await batch.commit();

      for (const id of archivedIds) {
        await cancelTaskNotification(id);
      }

      return { archived: archivedIds.size, groups: duplicateGroups.length };
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to merge duplicates");
      return undefined;
    }
  }, [user, tasks]);

  const confirmAllTimeReviews = useCallback(async () => {
    if (!user) return undefined;
    try {
      const now = getCurrentIsoString();
      const batch = writeBatch(db);
      let updatedCount = 0;

      tasks.forEach((task) => {
        if (task.status === "todo" && needsTimeReview(task)) {
          updatedCount++;
          const taskRef = doc(db, "users", user.uid, "tasks", task.id);
          batch.update(taskRef, {
            needsConfirmation: false,
            timeStatus: task.dueText ? "confirmed" : "none",
            updatedAt: now,
          });
        }
      });

      if (updatedCount > 0) {
        await batch.commit();
      }

      return updatedCount;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to confirm time reviews");
      return undefined;
    }
  }, [user, tasks]);

  const refresh = useCallback(async () => {
    // onSnapshot handles real-time sync, refresh is a no-op but kept for API compatibility
  }, []);

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

function normalizeTaskPatch(patch: TaskUpdateInput): TaskUpdateInput {
  const normalized = { ...patch };
  if (typeof normalized.title === "string") {
    normalized.title = normalized.title.trim();
    if (!normalized.title) throw new Error("Task title cannot be empty");
  }
  if (typeof normalized.dueText === "string") normalized.dueText = normalized.dueText.trim() || undefined;
  if (typeof normalized.notes === "string") normalized.notes = normalized.notes.trim() || undefined;
  if (typeof normalized.sourceText === "string") normalized.sourceText = normalized.sourceText.trim() || undefined;
  if (typeof normalized.sourceId === "string") normalized.sourceId = normalized.sourceId.trim() || undefined;
  if (typeof normalized.sourceType === "string") normalized.sourceType = normalized.sourceType.trim() as SourceItemType;
  return normalized;
}

function buildMergedNotes(primaryNotes: string | undefined, duplicates: NormalizedTask[]) {
  const titles = duplicates.map((task) => `- ${task.title}`).join("\n");
  const mergeNote = `已合并疑似重复任务：\n${titles}`;
  return [primaryNotes?.trim(), mergeNote].filter(Boolean).join("\n\n");
}
