import { useState, useCallback, useEffect } from "react";
import { useFocusEffect } from "expo-router";
import { TaskDraft } from "@/types/draft";
import { TimeStatus } from "@/types/task";
import type { SourceItemType } from "@/types/source";
import { activeExtractor } from "@/extractors";
import {
  createLocalDrafts,
  getOpenLocalDrafts,
  markLocalDraftAccepted,
  markLocalDraftRejected,
  rejectLocalDrafts,
  updateLocalDraft,
} from "@/providers/localDraftProvider";

export function useTaskExtraction() {
  const [candidates, setCandidates] = useState<TaskDraft[]>([]);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshDrafts = useCallback(async () => {
    try {
      const drafts = await getOpenLocalDrafts();
      setCandidates(drafts);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to load drafts";
      setError(message);
    }
  }, []);

  useEffect(() => {
    void refreshDrafts();
  }, [refreshDrafts]);

  useFocusEffect(
    useCallback(() => {
      void refreshDrafts();
    }, [refreshDrafts]),
  );

  const extract = useCallback(async (
    text: string,
    source?: { sourceId?: string; sourceType?: SourceItemType },
  ) => {
    if (!text.trim()) return;
    setExtracting(true);
    setError(null);
    try {
      const result = await activeExtractor.extract(text);
      const drafts = await createLocalDrafts(
        result.tasks.map((task) => ({
          ...task,
          ...(source?.sourceId && { sourceId: source.sourceId }),
          ...(source?.sourceType && { sourceType: source.sourceType }),
        })),
      );
      setCandidates(drafts);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown extraction error";
      setError(message);
      console.error("extraction failed", e);
    } finally {
      setExtracting(false);
    }
  }, []);

  const extractFromImage = useCallback(async (
    imageBase64: string,
  ) => {
    setExtracting(true);
    setError(null);
    try {
      if (!activeExtractor.extractFromImage) {
        throw new Error("当前提取器不支持从图片提取");
      }
      const result = await activeExtractor.extractFromImage(imageBase64);
      
      // 我们在此处直接创建一个 localSource
      const { createLocalSource } = await import("@/providers/localSourceProvider");
      const title = `图片识别: ${result.ocrText.slice(0, 28)}`;
      
      const source = await createLocalSource({
        type: "image",
        title,
        rawContent: result.ocrText,
        origin: "image",
        metadata: {
          intake: "image",
          length: result.ocrText.length,
        },
      });

      const drafts = await createLocalDrafts(
        result.tasks.map((task) => ({
          ...task,
          sourceId: source.id,
          sourceType: "image",
        })),
      );
      setCandidates(drafts);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown extraction error";
      setError(message);
      console.error("image extraction failed", e);
    } finally {
      setExtracting(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const confirmTask = useCallback(async (
    taskId: string,
    acceptedTaskId?: string,
    finalPatch?: {
      dueAt?: string;
      dueText?: string;
      notes?: string;
      timeStatus?: TimeStatus;
      title?: string;
    },
  ) => {
    if (finalPatch) {
      await updateLocalDraft(taskId, finalPatch);
    }
    await markLocalDraftAccepted(taskId, acceptedTaskId);
    setCandidates((prev) => prev.filter((t) => t.id !== taskId));
  }, []);

  const dismissTask = useCallback(async (taskId: string) => {
    await markLocalDraftRejected(taskId);
    setCandidates((prev) => prev.filter((t) => t.id !== taskId));
  }, []);

  const clearCandidates = useCallback(() => {
    setCandidates([]);
  }, []);

  const closePanel = useCallback(async () => {
    const ids = candidates.map((candidate) => candidate.id);
    await rejectLocalDrafts(ids);
    setCandidates([]);
    setError(null);
  }, [candidates]);

  const updateCandidate = useCallback(
    (
      id: string,
      field: "title" | "dueText" | "dueAt" | "timeStatus" | "tags",
      value: string | string[] | undefined,
    ) => {
      void updateLocalDraft(id, {
        [field]: field === "timeStatus" ? (value as TimeStatus) : value,
      } as any).catch((err) => {
        console.warn("[updateCandidate] Failed to persist draft update:", err);
      });
      setCandidates((prev) =>
        prev.map((t) => {
          if (t.id !== id) return t;
          if (field === "timeStatus") {
            return { ...t, timeStatus: value as TimeStatus };
          }
          return { ...t, [field]: value };
        }),
      );
    },
    [],
  );

  return {
    candidates,
    extracting,
    error,
    extract,
    extractFromImage,
    confirmTask,
    dismissTask,
    clearCandidates,
    closePanel,
    updateCandidate,
    clearError,
  };
}
