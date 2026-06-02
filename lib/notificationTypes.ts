export type TaskNotificationSyncResult =
  | { status: "scheduled"; notificationId: string }
  | { status: "updated"; notificationId: string }
  | { status: "cancelled"; reason: "completed" | "deleted" | "missing_dueAt" | "past_due" | "disabled" }
  | { status: "permission_denied" }
  | { status: "unsupported"; reason: "web" | "simulator" }
  | { status: "none"; reason: "no_dueAt" | "not_todo" };

export function notificationMessage(feedback: TaskNotificationSyncResult): string {
  switch (feedback.status) {
    case "scheduled":
      return "提醒已安排";
    case "updated":
      return "提醒已更新";
    case "cancelled":
      return "提醒已取消";
    case "permission_denied":
      return "通知权限未开启";
    case "unsupported":
      return feedback.reason === "web" ? "Web 环境不支持通知" : "模拟器不支持通知";
    default:
      return "";
  }
}
