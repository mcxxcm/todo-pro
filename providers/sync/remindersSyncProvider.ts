import * as Calendar from "expo-calendar";
import { Platform } from "react-native";
import type { TaskSyncProvider } from "@/types/sync";

async function getDefaultRemindersSource() {
  const defaultCalendar = await Calendar.getDefaultCalendarAsync();
  return defaultCalendar.source;
}

export const remindersSyncProvider: TaskSyncProvider = {
  available: true,
  label: "Apple Reminders",
  provider: "reminders",
  async syncTask(task, payload) {
    if (Platform.OS !== "ios") {
      return {
        error: "Apple Reminders sync is only supported on iOS.",
        status: "skipped",
      };
    }

    const { status } = await Calendar.requestRemindersPermissionsAsync();
    if (status !== "granted") {
      return {
        error: "Reminders permission not granted.",
        status: "skipped",
      };
    }

    try {
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.REMINDER);
      let calendarId = calendars.length > 0 ? calendars[0].id : null;

      if (!calendarId) {
        let defaultSource = undefined;
        if (Platform.OS === "ios") {
          defaultSource = await getDefaultRemindersSource();
        }
        
        calendarId = await Calendar.createCalendarAsync({
          title: "Todo Pro",
          color: "#007AFF",
          entityType: Calendar.EntityTypes.REMINDER,
          sourceId: defaultSource?.id,
          source: defaultSource || { isLocalAccount: true, name: "Todo Pro Calendar" } as any,
          name: "todopro_reminders",
          ownerAccount: "personal",
          accessLevel: Calendar.CalendarAccessLevel.OWNER,
        });
      }

      const eventId = await Calendar.createReminderAsync(calendarId, {
        title: payload.title,
        startDate: payload.dueAt ? new Date(payload.dueAt) : undefined,
        dueDate: payload.dueAt ? new Date(payload.dueAt) : undefined,
        notes: payload.notes || undefined,
      });

      return {
        externalId: eventId,
        status: "synced",
      };
    } catch (e: any) {
      return {
        error: e.message || "Unknown reminders error",
        status: "failed",
      };
    }
  },
};
