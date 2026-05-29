import { loadJsonArray, removeJsonValue, saveJsonArray } from "@/lib/jsonStorage";
import type { SyncRecord } from "@/types/sync";

const STORAGE_KEY = "todo_pro_sync_records";

export async function loadSyncRecords(): Promise<SyncRecord[]> {
  return loadJsonArray<SyncRecord>(STORAGE_KEY);
}

export async function saveSyncRecords(records: SyncRecord[]): Promise<void> {
  await saveJsonArray(STORAGE_KEY, records);
}

export async function clearSyncRecords(): Promise<void> {
  await removeJsonValue(STORAGE_KEY);
}
