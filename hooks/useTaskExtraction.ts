import { useState, useCallback, useRef } from "react";
import { ExtractedTask } from "@/types/extraction";
import { Extractor } from "@/extractors/types";
import { MockExtractor } from "@/extractors/mockExtractor";

export function useTaskExtraction() {
  const [candidates, setCandidates] = useState<ExtractedTask[]>([]);
  const [extracting, setExtracting] = useState(false);
  const extractorRef = useRef<Extractor>(new MockExtractor());

  const extract = useCallback(async (text: string) => {
    if (!text.trim()) return;
    setExtracting(true);
    try {
      const result = await extractorRef.current.extract(text);
      setCandidates(result.tasks);
    } catch (e) {
      console.error("extraction failed", e);
    } finally {
      setExtracting(false);
    }
  }, []);

  const confirmTask = useCallback((taskId: string) => {
    setCandidates((prev) => prev.filter((t) => t.id !== taskId));
  }, []);

  const dismissTask = useCallback((taskId: string) => {
    setCandidates((prev) => prev.filter((t) => t.id !== taskId));
  }, []);

  const confirmAll = useCallback(() => {
    setCandidates([]);
  }, []);

  const closePanel = useCallback(() => {
    setCandidates([]);
  }, []);

  const updateCandidate = useCallback(
    (id: string, field: "title" | "dueText", value: string) => {
      setCandidates((prev) =>
        prev.map((t) => (t.id === id ? { ...t, [field]: value } : t))
      );
    },
    []
  );

  return {
    candidates,
    extracting,
    extract,
    confirmTask,
    dismissTask,
    confirmAll,
    closePanel,
    updateCandidate,
  };
}
