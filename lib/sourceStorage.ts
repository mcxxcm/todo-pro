import { loadJsonArray, removeJsonValue, saveJsonArray } from "@/lib/jsonStorage";
import { createLocalId } from "@/lib/localId";
import { SourceItem } from "@/types/source";

const STORAGE_KEY = "todo_pro_sources";

export async function loadSources(): Promise<SourceItem[]> {
  return loadJsonArray<SourceItem>(STORAGE_KEY);
}

export async function saveSources(sources: SourceItem[]): Promise<void> {
  await saveJsonArray(STORAGE_KEY, sources);
}

export async function clearSources(): Promise<void> {
  await removeJsonValue(STORAGE_KEY);
}

export function generateSourceId(): string {
  return createLocalId("source");
}
