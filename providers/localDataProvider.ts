import { buildLocalDataExportBundle } from "@/domain/localDataExport";
import {
  buildLocalDataQuality,
  type LocalDataQuality,
} from "@/domain/localDataQuality";
import { clearTaskDrafts, loadTaskDrafts } from "@/lib/draftStorage";
import { clearSources, loadSources } from "@/lib/sourceStorage";
import { clearSyncRecords, loadSyncRecords } from "@/lib/syncStorage";
import { clearTasks, loadTasks } from "@/lib/taskStorage";
import { shareLocalDataBundle } from "@/lib/localDataShare";
import type { SourceItemType } from "@/types/source";

export interface LocalDataSummary {
  tasks: number;
  drafts: number;
  sources: number;
  syncRecords: number;
  sourceTypes: Partial<Record<SourceItemType, number>>;
  quality: LocalDataQuality;
}

export async function getLocalDataSummary(): Promise<LocalDataSummary> {
  const [tasks, drafts, sources, syncRecords] = await Promise.all([
    loadTasks(),
    loadTaskDrafts(),
    loadSources(),
    loadSyncRecords(),
  ]);

  return {
    tasks: tasks.length,
    drafts: drafts.length,
    sources: sources.length,
    syncRecords: syncRecords.length,
    sourceTypes: sources.reduce<Partial<Record<SourceItemType, number>>>(
      (acc, source) => {
        acc[source.type] = (acc[source.type] ?? 0) + 1;
        return acc;
      },
      {},
    ),
    quality: buildLocalDataQuality({
      drafts,
      sources,
      tasks,
    }),
  };
}

export async function clearAllLocalData(): Promise<void> {
  await Promise.all([
    clearTasks(),
    clearTaskDrafts(),
    clearSources(),
    clearSyncRecords(),
  ]);
}

export async function exportAllLocalData() {
  const [tasks, drafts, sources, syncRecords] = await Promise.all([
    loadTasks(),
    loadTaskDrafts(),
    loadSources(),
    loadSyncRecords(),
  ]);

  return buildLocalDataExportBundle({
    drafts,
    sources,
    syncRecords,
    tasks,
  });
}

export async function shareAllLocalData() {
  return shareLocalDataBundle(await exportAllLocalData());
}
