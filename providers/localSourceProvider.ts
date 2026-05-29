import { loadSources, saveSources, generateSourceId } from "@/lib/sourceStorage";
import { loadTaskDrafts } from "@/lib/draftStorage";
import { loadTasks } from "@/lib/taskStorage";
import { getOrphanSourceIds } from "@/domain/sourceTimeline";
import { getCurrentIsoString } from "@/lib/time";
import { SourceItem, SourceItemType } from "@/types/source";

export interface CreateSourceInput {
  type: SourceItemType;
  title?: string;
  rawContent?: string;
  origin?: string;
  metadata?: SourceItem["metadata"];
}

export async function createLocalSource(
  input: CreateSourceInput,
): Promise<SourceItem> {
  const sources = await loadSources();
  const now = getCurrentIsoString();
  const source: SourceItem = {
    id: generateSourceId(),
    type: input.type,
    createdAt: now,
    ...(input.title?.trim() && { title: input.title.trim() }),
    ...(input.rawContent?.trim() && { rawContent: input.rawContent.trim() }),
    ...(input.origin?.trim() && { origin: input.origin.trim() }),
    ...(input.metadata && { metadata: input.metadata }),
  };

  sources.push(source);
  await saveSources(sources);
  return source;
}

export async function getLocalSources(): Promise<SourceItem[]> {
  return loadSources();
}

export async function deleteLocalSource(id: string): Promise<void> {
  const sources = await loadSources();
  await saveSources(sources.filter((source) => source.id !== id));
}

export async function deleteOrphanLocalSources(): Promise<number> {
  const [drafts, sources, tasks] = await Promise.all([
    loadTaskDrafts(),
    loadSources(),
    loadTasks(),
  ]);
  const orphanIds = new Set(getOrphanSourceIds({ drafts, sources, tasks }));

  if (orphanIds.size === 0) return 0;

  await saveSources(sources.filter((source) => !orphanIds.has(source.id)));
  return orphanIds.size;
}
