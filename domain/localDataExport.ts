import type { TaskDraft } from "@/types/draft";
import type { SourceItem } from "@/types/source";
import type { SyncRecord } from "@/types/sync";
import type { NormalizedTask } from "@/types/task";
import { toIsoString, type ClockInput } from "@/lib/time";

export interface LocalDataExportBundle {
  exportedAt: string;
  schemaVersion: 1;
  counts: {
    drafts: number;
    sources: number;
    syncRecords: number;
    tasks: number;
  };
  data: {
    drafts: TaskDraft[];
    sources: SourceItem[];
    syncRecords: SyncRecord[];
    tasks: NormalizedTask[];
  };
}

export function buildLocalDataExportBundle(
  input: {
    drafts: TaskDraft[];
    sources: SourceItem[];
    syncRecords: SyncRecord[];
    tasks: NormalizedTask[];
  },
  now: ClockInput = new Date(),
): LocalDataExportBundle {
  const exportedAt = toIsoString(now);

  return {
    exportedAt,
    schemaVersion: 1,
    counts: {
      drafts: input.drafts.length,
      sources: input.sources.length,
      syncRecords: input.syncRecords.length,
      tasks: input.tasks.length,
    },
    data: input,
  };
}
