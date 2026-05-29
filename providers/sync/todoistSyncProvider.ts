import { buildTodoistTaskPayload } from "@/domain/todoistExport";
import type { TaskSyncProvider } from "@/types/sync";
import { getTodoistToken } from "@/lib/todoistStorage";

export const todoistSyncProvider: TaskSyncProvider = {
  available: true,
  label: "Todoist",
  provider: "todoist",
  async syncTask(_task, payload) {
    const todoistPayload = buildTodoistTaskPayload(payload);
    const token = await getTodoistToken();

    if (token && token.trim()) {
      try {
        const response = await fetch("https://api.todoist.com/rest/v2/tasks", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token.trim()}`,
          },
          body: JSON.stringify(todoistPayload),
        });

        if (!response.ok) {
          const text = await response.text();
          return {
            status: "failed",
            error: `Todoist API error (${response.status}): ${text}`,
          };
        }

        const data = await response.json();
        return {
          status: "synced",
          externalId: data.id,
        };
      } catch (err: any) {
        return {
          status: "failed",
          error: `Network error syncing to Todoist: ${err?.message || err}`,
        };
      }
    } else {
      // Mock / Simulated Sync
      await new Promise((resolve) => setTimeout(resolve, 800));
      return {
        status: "synced",
        externalId: `todoist-mock-${Math.random().toString(36).substring(2, 9)}`,
        error: "已通过模拟通道同步到 Todoist（输入 Token 可启用真实同步）",
      };
    }
  },
};


