import type { TaskProvider } from "@/types/task";
import type { TaskSyncProvider } from "@/types/sync";

export function createPlannedSyncProvider(
  provider: Exclude<TaskProvider, "local">,
  label: string,
): TaskSyncProvider {
  return {
    available: false,
    label,
    provider,
    async syncTask(_task, payload) {
      return {
        error: `${label} requires explicit user authorization before syncing "${payload.title}".`,
        status: "skipped",
      };
    },
  };
}
