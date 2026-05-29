import type { TaskSyncProvider } from "@/types/sync";

export const localSyncProvider: TaskSyncProvider = {
  available: true,
  label: "本地收件箱",
  provider: "local",
  async syncTask(task) {
    return {
      externalId: `local:${task.id}`,
      status: "synced",
    };
  },
};
