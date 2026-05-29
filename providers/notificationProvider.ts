import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import type { NormalizedTask } from "@/types/task";

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
 */
export async function syncTaskNotification(task: NormalizedTask) {
  if (Platform.OS === "web") return;

  const notificationId = getTaskNotificationId(task.id);

  // If task is not 'todo' or doesn't have a dueAt, cancel any scheduled notification
  if (task.status !== "todo" || !task.dueAt) {
    await cancelTaskNotification(task.id);
    return;
  }

  const dueTime = new Date(task.dueAt).getTime();
  const now = Date.now();

  // If due time is in the past, no need to schedule (and cancel any existing one just in case)
  if (dueTime <= now) {
    await cancelTaskNotification(task.id);
    return;
  }

  // Check if we have permission
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  // Schedule or reschedule the notification.
  // Using the same identifier overwrites any previously scheduled notification with this ID.
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
}

/**
 * Cancels a notification for a task if it exists.
 */
export async function cancelTaskNotification(taskId: string) {
  if (Platform.OS === "web") return;
  const notificationId = getTaskNotificationId(taskId);
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}
