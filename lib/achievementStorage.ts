import { loadJsonArray, saveJsonArray } from "@/lib/jsonStorage";
import type { AchievementId } from "@/domain/achievements";

const STORAGE_KEY = "todo_pro_achievements";

export async function getUnlockedAchievements(): Promise<AchievementId[]> {
  return loadJsonArray<AchievementId>(STORAGE_KEY);
}

export async function unlockAchievement(id: AchievementId): Promise<void> {
  const current = await getUnlockedAchievements();
  if (current.includes(id)) return;
  current.push(id);
  await saveJsonArray(STORAGE_KEY, current);
}
