import type { TaskProvider } from "@/types/task";

export type SyncTargetStatus = "active" | "planned";

export interface SyncTarget {
  provider: TaskProvider;
  label: string;
  status: SyncTargetStatus;
  description: string;
}

export const SYNC_TARGETS: SyncTarget[] = [
  {
    provider: "local",
    label: "本地收件箱",
    status: "active",
    description: "当前闭环默认保存到本机 AsyncStorage。",
  },
  {
    provider: "reminders",
    label: "Apple Reminders",
    status: "planned",
    description: "后续通过用户授权写入，不默认后台读取。",
  },
  {
    provider: "calendar",
    label: "Calendar",
    status: "planned",
    description: "适合有明确日期的任务，需处理冲突和撤回。",
  },
  {
    provider: "todoist",
    label: "Todoist",
    status: "active",
    description: "支持模拟同步，输入 Token 可直接真实写入您的 Todoist 收件箱。",
  },
];
