import * as Calendar from "expo-calendar";
import { Platform } from "react-native";
import type { TaskSyncProvider } from "@/types/sync";

async function getDefaultCalendarSource() {
  const defaultCalendar = await Calendar.getDefaultCalendarAsync();
  return defaultCalendar.source;
}

export const calendarSyncProvider: TaskSyncProvider = {
  available: true,
  label: "Calendar",
  provider: "calendar",
  async syncTask(task, payload) {
    if (Platform.OS === "web") {
      return {
        error: "Calendar sync is not supported on web.",
        status: "skipped",
      };
    }

    if (!payload.dueAt) {
      return {
        error: "Calendar sync requires a confirmed due date.",
        status: "skipped",
      };
    }

    const { status } = await Calendar.requestCalendarPermissionsAsync();
    if (status !== "granted") {
      return {
        error: "Calendar permission not granted.",
        status: "skipped",
      };
    }

    try {
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      let calendarId = calendars.length > 0 ? calendars[0].id : null;

      if (!calendarId) {
        let defaultCalendarSource = undefined;
        if (Platform.OS === "ios") {
          defaultCalendarSource = await getDefaultCalendarSource();
        }
        
        calendarId = await Calendar.createCalendarAsync({
          title: "Todo Pro",
          color: "#007AFF",
          entityType: Calendar.EntityTypes.EVENT,
          sourceId: defaultCalendarSource?.id,
          source: defaultCalendarSource || { isLocalAccount: true, name: "Todo Pro Calendar" } as any,
          name: "todopro_calendar",
          ownerAccount: "personal",
          accessLevel: Calendar.CalendarAccessLevel.OWNER,
        });
      }

      const eventId = await Calendar.createEventAsync(calendarId, {
        title: payload.title,
        startDate: new Date(payload.dueAt),
        endDate: new Date(new Date(payload.dueAt).getTime() + 60 * 60 * 1000), // +1 hour
        notes: payload.notes || undefined,
      });

      return {
        externalId: eventId,
        status: "synced",
      };
    } catch (e: any) {
      return {
        error: e.message || "Unknown calendar error",
        status: "failed",
      };
    }
  },
};

