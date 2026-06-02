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
    status: "active",
    description: "iOS 上可授权写入提醒事项，不默认后台读取。",
  },
  {
    provider: "calendar",
    label: "Calendar",
    status: "active",
    description: "可授权写入日历事件，仅同步已确认日期的任务。",
  },
  {
    provider: "todoist",
    label: "Todoist",
    status: "active",
    description: "Personal API Token 同步。OAuth 授权在 Phase 3 计划中，当前需手动填入 Token。",
  },
];
