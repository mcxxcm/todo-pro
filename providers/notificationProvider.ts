import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import type { NormalizedTask } from "@/types/task";
import { getNotificationsEnabled } from "@/lib/notificationSettings";

import type { TaskNotificationSyncResult } from "@/lib/notificationTypes";
export type { TaskNotificationSyncResult };
export { notificationMessage } from "@/lib/notificationTypes";

/**
 * Configure global notification behavior for when the app is in the foreground.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Requests notification permissions from the user.
 * It's safe to call this multiple times.
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  if (!Device.isDevice) {
    console.log("Must use physical device for Push Notifications");
    return false;
  }

  const existing = (await Notifications.getPermissionsAsync()) as any;
  let finalStatus = existing.granted || existing.status === "granted";

  if (!finalStatus) {
    const requested = (await Notifications.requestPermissionsAsync()) as any;
    finalStatus = requested.granted || requested.status === "granted";
  }

  return finalStatus;
}

/**
 * Helper to generate a deterministic notification ID for a task.
 */
function getTaskNotificationId(taskId: string): string {
  return `task-${taskId}`;
}

/**
 * Syncs the notification for a task.
 * If the task is incomplete and has a valid future dueAt, schedules a notification.
 * If the task is completed, archived, or has no dueAt (or it's in the past), cancels any existing notification.
 *
 * Returns a structured result so UI can show feedback to the user.
 */
export async function syncTaskNotification(task: NormalizedTask): Promise<TaskNotificationSyncResult> {
  if (Platform.OS === "web") {
    return { status: "unsupported", reason: "web" };
  }

  if (!Device.isDevice) {
    return { status: "unsupported", reason: "simulator" };
  }

  const notificationsEnabled = await getNotificationsEnabled();
  if (!notificationsEnabled) {
    await cancelTaskNotification(task.id);
    return { status: "cancelled", reason: "disabled" };
  }

  const notificationId = getTaskNotificationId(task.id);

  if (task.status !== "todo" || !task.dueAt) {
    await cancelTaskNotification(task.id);
    return { status: "cancelled", reason: task.status !== "todo" ? "completed" : "missing_dueAt" };
  }

  const dueTime = new Date(task.dueAt).getTime();
  const now = Date.now();

  if (dueTime <= now) {
    await cancelTaskNotification(task.id);
    return { status: "cancelled", reason: "past_due" };
  }

  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) {
    return { status: "permission_denied" };
  }

  const allScheduled = await Notifications.getAllScheduledNotificationsAsync();
  const existing = allScheduled.find((n) => n.identifier === notificationId);

  await Notifications.scheduleNotificationAsync({
    identifier: notificationId,
    content: {
      title: "任务到期提醒",
      body: task.title,
      sound: true,
      data: { taskId: task.id },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: new Date(dueTime),
    },
  });

  if (existing) {
    return { status: "updated", notificationId };
  }
  return { status: "scheduled", notificationId };
}

/**
 * Cancels a notification for a task if it exists.
 */
export async function cancelTaskNotification(taskId: string) {
  if (Platform.OS === "web") return;
  const notificationId = getTaskNotificationId(taskId);
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}
